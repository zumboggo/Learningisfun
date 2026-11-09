import {atomic,readRecord,writeRecord,fail} from './teacher-workspace.js';
import {resolveBilling,reserveUsage,settleUsage} from './ai-billing.js';
import {imageQuote} from './image-models.js';
export const BACKGROUND_PRICE=.003;
export const BACKGROUND_MODEL='black-forest-labs/flux-schnell';
const headers=token=>({Authorization:`Bearer ${token}`,'Content-Type':'application/json'});
export async function backgroundAction(args, options={}){
 const {body,db,databaseId,userId}=args;
 if(typeof body.requestId!=='string'||!/^[\w-]{10,80}$/.test(body.requestId))fail('A valid background request is required.');
 const key=(options.reading?'text-image-job:':'background:')+body.requestId;
 if(options.price!==undefined&&(!Number.isFinite(options.price)||options.price<0||options.price>.01))fail('Image pricing exceeds the one-cent limit.',503);
 if(body.action==='generateEpisodeBackground'){
  const prompt=String(body.prompt||'').trim();if(!prompt||prompt.length>2000)fail('Describe the background in 1–2,000 characters.');
  const prior=await readRecord(db,databaseId,userId,key);if(prior.value)return {requestId:body.requestId,status:prior.value.status};
  const {model,billing,input}=await imageQuote(args);
  input.prompt=options.reading?`An original illustration for a high-school reading. Coherent editorial illustration, historically appropriate objects and clothing, clear composition, no lettering, no watermarks, no fake archival evidence. ${prompt}`:`An illustrated background for an educational animated story. Wide environmental establishing view, clear foreground space for characters, no people, no text or watermarks. ${prompt}`;
  await reserveUsage(args,{ownerId:userId,key,reservation:model.price,billing,category:'images',details:{status:'starting',cost:model.price,model:model.model,input}});
  // Never automatically retry a paid submission, including uncertain network outcomes.
  try{
   const response=await fetch('https://api.replicate.com/v1/models/'+model.model+'/predictions',{method:'POST',headers:headers(billing.token),body:JSON.stringify({input}),signal:AbortSignal.timeout(20000)});
   if(!response.ok){if([400,401,402,403,404,422,429].includes(response.status))await settleUsage(args,userId,key,0,{status:'rejected'});throw Error('Provider rejected the request.');}
   const prediction=await response.json();if(typeof prediction.id!=='string'||!/^[\w-]+$/.test(prediction.id))throw Error('Background provider returned an invalid request.');
   await atomic(args,async({db})=>{const current=await readRecord(db,databaseId,userId,key);await writeRecord(db,databaseId,userId,key,{...current.value,predictionId:prediction.id,status:'processing'},current.revision)});
   return {requestId:body.requestId,status:'processing'};
  }catch{fail('The background request could not be confirmed. No automatic paid retry was made. Check its progress before starting another.',503);}
 }
 const current=await readRecord(db,databaseId,userId,key);if(!current.value)fail('Background request not found.',404);
 if(current.value.status==='rejected')return {status:'failed',message:'The provider rejected this request. Check your connection and credits. No shared fallback was made.'};
 if(!current.value.predictionId)return {status:'uncertain',message:'The provider submission could not be confirmed. No automatic paid retry was made.'};
 const billing=await resolveBilling(args,userId,'replicate',current.value.billing||{source:'shared',provider:'replicate'});
 const response=await fetch('https://api.replicate.com/v1/predictions/'+encodeURIComponent(current.value.predictionId),{headers:headers(billing.token),signal:AbortSignal.timeout(15000)});
 if(!response.ok)fail('Could not check the background yet. Try checking again.',503);
 const prediction=await response.json();
 if(['failed','canceled'].includes(prediction.status))return {status:'failed',message:'The background could not be generated. No automatic paid retry was made.'};
 if(prediction.status!=='succeeded')return {status:'processing'};
 await settleUsage(args,userId,key,current.value.cost,{status:'succeeded'});
 const output=Array.isArray(prediction.output)?prediction.output[0]:prediction.output;let url;try{url=new URL(output)}catch{fail('Provider returned no background.',502)}
 if(url.protocol!=='https:'||!(url.hostname==='replicate.delivery'||url.hostname.endsWith('.replicate.delivery')))fail('Provider returned an unsupported image address.',502);
 const image=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!image.ok)fail('Could not retrieve the completed background. Try checking again.',503);
 const reader=image.body.getReader(),chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000){await reader.cancel();fail('Generated background is too large.',422)}chunks.push(value);}
 const bytes=Buffer.concat(chunks);if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')fail('Provider returned an invalid WebP image.',502);
 return {status:'succeeded',src:'data:image/webp;base64,'+bytes.toString('base64'),cost:current.value.cost,model:current.value.model};
}
