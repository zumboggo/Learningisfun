import {atomic,readRecord,writeRecord,fail} from './teacher-workspace.js';
import {monthKey} from './teacher-ai.js';
// Replicate official pricing verified 2026-10-28: $3 / 1,000 output images.
// https://replicate.com/black-forest-labs/flux-schnell/api/schema
export const BACKGROUND_PRICE=.003;
export const BACKGROUND_MODEL='black-forest-labs/flux-schnell';
const headers=()=>({Authorization:`Bearer ${process.env.REPLICATE_API_TOKEN}`,'Content-Type':'application/json'});
export async function backgroundAction(args){
 const {body,db,databaseId,userId}=args;
 if(!process.env.REPLICATE_API_TOKEN)fail('Background generation is not configured yet. You can upload an image or choose a library background.',503);
 if(typeof body.requestId!=='string'||!/^[\w-]{10,80}$/.test(body.requestId))fail('A valid background request is required.');
 const key='background:'+body.requestId;
 if(body.action==='generateEpisodeBackground'){
  const prompt=String(body.prompt||'').trim();if(!prompt||prompt.length>2000)fail('Describe the background in 1–2,000 characters.');
  const prior=await readRecord(db,databaseId,userId,key);if(prior.value)return {requestId:body.requestId,status:prior.value.status};
  await atomic(args,async({db})=>{
   const current=await readRecord(db,databaseId,userId,key);if(current.revision)fail('This background was already requested. Check its progress.',409);
   const month=monthKey(),allowance=await readRecord(db,databaseId,userId,'ai-allowance'),ledger=await readRecord(db,databaseId,userId,'ai-month:'+month);
   const used=ledger.value?.used||0,recent=(ledger.value?.recent||[]).filter(t=>Date.now()-t<60000);
   if(recent.length>=5)fail('Please wait a minute before generating again.',429);
   if(used+BACKGROUND_PRICE>(allowance.value?.usd??1))fail('Your monthly AI allowance cannot cover this background.',429);
   await writeRecord(db,databaseId,userId,'ai-month:'+month,{...ledger.value,used:used+BACKGROUND_PRICE,recent:[...recent,Date.now()]},ledger.revision);
   await writeRecord(db,databaseId,userId,key,{status:'starting',month,cost:BACKGROUND_PRICE},0);
  });
  // Never automatically retry a paid submission, including uncertain network outcomes.
  try{
   const response=await fetch('https://api.replicate.com/v1/models/'+BACKGROUND_MODEL+'/predictions',{method:'POST',headers:headers(),body:JSON.stringify({input:{prompt:`An illustrated background for an educational animated story. Wide environmental establishing view, clear foreground space for characters, no people, no text or watermarks. ${prompt}`,aspect_ratio:'16:9',num_outputs:1,megapixels:'1',num_inference_steps:4,output_format:'webp',output_quality:80,go_fast:true,disable_safety_checker:false}}),signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error('Background provider could not accept the request.');
   const prediction=await response.json();if(typeof prediction.id!=='string'||!/^[\w-]+$/.test(prediction.id))throw Error('Background provider returned an invalid request.');
   await atomic(args,async({db})=>{const current=await readRecord(db,databaseId,userId,key);await writeRecord(db,databaseId,userId,key,{...current.value,predictionId:prediction.id,status:'processing'},current.revision)});
   return {requestId:body.requestId,status:'processing'};
  }catch{fail('The background request could not be confirmed. No automatic paid retry was made. Check its progress before starting another.',503);}
 }
 const current=await readRecord(db,databaseId,userId,key);if(!current.value)fail('Background request not found.',404);
 if(!current.value.predictionId)return {status:'uncertain',message:'The provider submission could not be confirmed. No automatic paid retry was made.'};
 const response=await fetch('https://api.replicate.com/v1/predictions/'+encodeURIComponent(current.value.predictionId),{headers:headers(),signal:AbortSignal.timeout(15000)});
 if(!response.ok)fail('Could not check the background yet. Try checking again.',503);
 const prediction=await response.json();
 if(['failed','canceled'].includes(prediction.status))return {status:'failed',message:'The background could not be generated. No automatic paid retry was made.'};
 if(prediction.status!=='succeeded')return {status:'processing'};
 const output=prediction.output?.[0];let url;try{url=new URL(output)}catch{fail('Provider returned no background.',502)}
 if(url.protocol!=='https:'||!(url.hostname==='replicate.delivery'||url.hostname.endsWith('.replicate.delivery')))fail('Provider returned an unsupported image address.',502);
 const image=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!image.ok)fail('Could not retrieve the completed background. Try checking again.',503);
 const reader=image.body.getReader(),chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000){await reader.cancel();fail('Generated background is too large.',422)}chunks.push(value);}
 const bytes=Buffer.concat(chunks);if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')fail('Provider returned an invalid WebP image.',502);
 return {status:'succeeded',src:'data:image/webp;base64,'+bytes.toString('base64'),cost:BACKGROUND_PRICE};
}
