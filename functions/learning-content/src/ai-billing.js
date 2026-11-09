import {createCipheriv,createDecipheriv,randomBytes,randomUUID} from 'node:crypto';
import {atomic,readRecord,writeRecord,fail} from './teacher-workspace.js';
export const monthKey=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit'}).format(now);
export const BILLING_ACTIONS=['readAIConnections','connectAIProvider','validateAIProvider','disconnectAIProvider','saveAIImageSettings'];
const providers=['openrouter','replicate'];
const credentialKey=(provider,id)=>`ai-secret:${provider}:${id}`;
function encryptionKey(){const raw=process.env.AI_CREDENTIAL_ENCRYPTION_KEY;if(!raw||!/^[a-f0-9]{64}$/i.test(raw))fail('Personal AI connections are not configured yet.',503);return Buffer.from(raw,'hex');}
export function encryptCredential(token,owner,provider,id){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);cipher.setAAD(Buffer.from([owner,provider,id].join(':')));return {iv:iv.toString('base64'),data:Buffer.concat([cipher.update(token,'utf8'),cipher.final()]).toString('base64'),tag:cipher.getAuthTag().toString('base64')};}
export function decryptCredential(envelope,owner,provider,id){try{const decipher=createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(envelope.iv,'base64'));decipher.setAAD(Buffer.from([owner,provider,id].join(':')));decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));return Buffer.concat([decipher.update(Buffer.from(envelope.data,'base64')),decipher.final()]).toString('utf8');}catch{fail('The saved AI connection could not be opened. Ask the administrator to check encryption configuration.',503);}}
const envKey=provider=>provider==='replicate'?'REPLICATE_API_TOKEN':'OPENROUTER_API_KEY';
export async function resolveBilling(args,owner,provider,pinned){
 const connection=await readRecord(args.db,args.databaseId,owner,'ai-connection:'+provider);
 if(pinned?.source==='shared'){const token=process.env[envKey(provider)];if(!token)fail('The original shared provider connection is unavailable.',503);return {...pinned,token};}
 const id=pinned?.credentialId||connection.value?.credentialId;
 if(id){
  if(!connection.value?.credentialId||pinned&&pinned.epoch!==connection.value.epoch)fail('The original personal connection was disconnected. Reconnect it and start a new request only if needed; no shared funds were used.',409);
  const secret=await readRecord(args.db,args.databaseId,owner,credentialKey(provider,id));
  if(!secret.value?.envelope||secret.value.epoch!==connection.value.epoch)fail('The original personal connection is unavailable. No shared funds were used.',409);
  return {source:'personal',provider,credentialId:id,epoch:secret.value.epoch,account:secret.value.account,token:decryptCredential(secret.value.envelope,owner,provider,id)};
 }
 const token=process.env[envKey(provider)];if(!token)fail('This AI provider is not configured. Connect your own account in Settings.',503);
 return {source:'shared',provider,token};
}
export const billingReference=({token,...reference})=>reference;
export const ledgerKey=(billing,month)=>billing.source==='personal'?`ai-personal:${billing.provider}:${month}`:'ai-month:'+month;
export async function reserveUsage(args,{ownerId,key,reservation,billing,category,learnerId,details={}}){
 const month=monthKey();return atomic({...args,transactionOwner:ownerId},async({db})=>{
  if((await readRecord(db,args.databaseId,ownerId,key)).revision)fail('This request was already submitted. No automatic paid retry was made.',409);
  const connection=await readRecord(db,args.databaseId,ownerId,'ai-connection:'+billing.provider);
  if(billing.source==='personal'&&(connection.value?.credentialId!==billing.credentialId||connection.value?.epoch!==billing.epoch)||billing.source==='shared'&&connection.value?.credentialId)fail('Your billing connection changed. Review the request before submitting again.',409);
  const ledger=await readRecord(db,args.databaseId,ownerId,ledgerKey(billing,month)),used=ledger.value?.used||0;
  const rateKey='ai-rate:'+(learnerId||ownerId),rate=await readRecord(db,args.databaseId,ownerId,rateKey),recent=(rate.value?.recent||[]).filter(t=>Date.now()-t<60000);
  if(recent.length>=5)fail('Please wait a minute before generating again.',429);
  if(billing.source==='shared'){const allowance=await readRecord(db,args.databaseId,ownerId,'ai-allowance');if(used+reservation>(allowance.value?.usd??1))fail('The teacher’s monthly AI allowance cannot cover this request. Your work is saved.',429);}
  await writeRecord(db,args.databaseId,ownerId,rateKey,{recent:[...recent,Date.now()]},rate.revision);
  await writeRecord(db,args.databaseId,ownerId,ledgerKey(billing,month),{...ledger.value,used:used+reservation,pending:(ledger.value?.pending||0)+reservation},ledger.revision);
  const value={...details,month,reservation,status:'reserved',category,billing:billingReference(billing),createdAt:new Date().toISOString()};await writeRecord(db,args.databaseId,ownerId,key,value,0);return value;
 });
}
export async function settleUsage(args,owner,key,actual,patch={}){return atomic({...args,transactionOwner:owner},async({db})=>{
 const r=await readRecord(db,args.databaseId,owner,key);if(!r.value)return;
 const already=r.value.settled===true||r.value.status==='settled';const valid=Number.isFinite(actual)&&actual>=0;
 if(!already&&valid){const billing=r.value.billing||{source:'shared'},ledger=await readRecord(db,args.databaseId,owner,ledgerKey(billing,r.value.month)),reservation=r.value.reservation??r.value.cost??0;await writeRecord(db,args.databaseId,owner,ledgerKey(billing,r.value.month),{...ledger.value,used:Math.max(0,(ledger.value?.used||0)-reservation+actual),pending:Math.max(0,(ledger.value?.pending||0)-reservation),confirmed:(ledger.value?.confirmed||0)+actual},ledger.revision);}
 await writeRecord(db,args.databaseId,owner,key,{...r.value,...patch,...(!already&&valid?{settled:true,actual}: {})},r.revision);
 });}
async function validateToken(provider,token){
 if(typeof token!=='string'||token.length<12||token.length>512||/\s/.test(token))fail('Enter a valid provider key.');
 try{const r=await fetch(provider==='replicate'?'https://api.replicate.com/v1/account':'https://openrouter.ai/api/v1/key',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const data=await r.json();return provider==='replicate'?String(data.username||'Replicate account'):String(data.data?.label||'OpenRouter key').slice(0,80);}catch{fail('Could not validate this provider key. Check the key and try again. Your existing connection was not changed.',422);}
}
export async function connectionStatus(args){const result={configured:/^[a-f0-9]{64}$/i.test(process.env.AI_CREDENTIAL_ENCRYPTION_KEY||''),providers:{}};for(const provider of providers){const {value,revision}=await readRecord(args.db,args.databaseId,args.userId,'ai-connection:'+provider),usage=await readRecord(args.db,args.databaseId,args.userId,`ai-personal:${provider}:${monthKey()}`);result.providers[provider]={connected:!!value?.credentialId,masked:value?.masked||'',validatedAt:value?.validatedAt||null,revision,usage:{used:usage.value?.used||0,confirmed:usage.value?.confirmed||0,pending:usage.value?.pending||0}};}result.imageSettings=(await readRecord(args.db,args.databaseId,args.userId,'ai-image-settings')).value||{ceiling:.01};return result;}
export async function aiBillingAction(args){const {body,profile,userId,db,databaseId}=args;if(!['teacher','admin'].includes(profile.role))fail('Teacher account required',403);
 if(body.action==='readAIConnections')return connectionStatus(args);
 if(body.action==='saveAIImageSettings'){if(typeof body.ceiling!=='number'||!Number.isFinite(body.ceiling)||body.ceiling<.003||body.ceiling>1)fail('Choose a per-image ceiling between $0.003 and $1.');await atomic(args,async({db})=>{const r=await readRecord(db,databaseId,userId,'ai-image-settings');await writeRecord(db,databaseId,userId,'ai-image-settings',{ceiling:body.ceiling},r.revision)});return connectionStatus(args);}
 const provider=body.provider;if(!providers.includes(provider))fail('Choose OpenRouter or Replicate.');
 const key='ai-connection:'+provider,current=await readRecord(db,databaseId,userId,key);if(body.revision!==current.revision)fail('Connections changed elsewhere. Reload settings.',409);
 if(body.action==='disconnectAIProvider'){
  await atomic(args,async({db})=>{const r=await readRecord(db,databaseId,userId,key);if(r.revision!==body.revision)fail('Connections changed elsewhere. Reload settings.',409);
   for(const id of r.value?.versions||[]){const s=await readRecord(db,databaseId,userId,credentialKey(provider,id));if(s.revision)await writeRecord(db,databaseId,userId,credentialKey(provider,id),{revoked:true},s.revision);}
   await writeRecord(db,databaseId,userId,key,{credentialId:null,epoch:randomUUID()},r.revision);
  });return connectionStatus(args);
 }
 if(body.action==='validateAIProvider'){const billing=await resolveBilling(args,userId,provider);if(billing.source!=='personal')fail('Connect a personal key first.');await validateToken(provider,billing.token);return connectionStatus(args);}
 encryptionKey();const account=await validateToken(provider,body.token),id=randomUUID(),epoch=current.value?.epoch||randomUUID(),envelope=encryptCredential(body.token,userId,provider,id);
 await atomic(args,async({db})=>{const r=await readRecord(db,databaseId,userId,key);if(r.revision!==body.revision)fail('Connections changed elsewhere. Reload settings.',409);const versions=r.value?.versions||[];if(versions.length>=30)fail('Disconnect this provider before replacing its key again.');await writeRecord(db,databaseId,userId,credentialKey(provider,id),{envelope,epoch,account},0);await writeRecord(db,databaseId,userId,key,{credentialId:id,versions:[...versions,id],epoch,masked:'••••'+body.token.slice(-4),validatedAt:new Date().toISOString()},r.revision);});return connectionStatus(args);
}
