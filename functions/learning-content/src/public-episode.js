import {createHash} from 'node:crypto';
const collection='episode_records';
const unavailable=()=>{throw Object.assign(Error('This episode is not publicly shared.'),{code:404});};
const shareId=versionId=>createHash('sha256').update('public-episode:'+versionId).digest('hex').slice(0,32);
export async function episodeSharingAction({body,profile,userId,db,databaseId}) {
 if(!['teacher','admin'].includes(profile.role))throw Object.assign(Error('Only the episode owner can manage sharing'),{code:403});
 const version=JSON.parse((await db.getDocument(databaseId,collection,body.versionId)).dataJson);
 if(version.type!=='animated-version'||version.teacherId!==userId)throw Object.assign(Error('Only the episode owner can manage sharing'),{code:403});
 const id=shareId(body.versionId);
 let existing;
 try{existing=await db.getDocument(databaseId,collection,id);}catch(e){if(e.code!==404)throw e;}
 if(body.action==='setEpisodePublicSharing'){
  if(typeof body.enabled!=='boolean')throw Object.assign(Error('Choose whether public sharing is enabled'),{code:400});
  const dataJson=JSON.stringify({type:'public-episode',enabled:body.enabled,fileId:version.fileId});
  if(existing)await db.updateDocument(databaseId,collection,id,{dataJson});
  else {try{await db.createDocument(databaseId,collection,id,{classId:'studio-'+userId,userId,kind:'public-episode',dataJson},[]);}catch(e){if(e.code!==409)throw e;await db.updateDocument(databaseId,collection,id,{dataJson});}}
  return {enabled:body.enabled,shareId:id};
 }
 return {enabled:existing?JSON.parse(existing.dataJson).enabled===true:false,shareId:id};
}
export async function readPublicEpisode({body,db,databaseId,storage}) {
 if(body.action!=='readEpisode'||typeof body.shareId!=='string'||! /^[a-f0-9]{32}$/.test(body.shareId))return unavailable();
 const sharing=JSON.parse((await db.getDocument(databaseId,collection,body.shareId)).dataJson);
 if(sharing.type!=='public-episode'||sharing.enabled!==true)return unavailable();
 const raw=await storage.getFileDownload({bucketId:'animated-episodes',fileId:sharing.fileId});
 const pack=raw&&[1,2].includes(raw.format)?raw:JSON.parse(Buffer.from(raw).toString());
 // The share contains only the published story, never assignments or attempts.
 return {pack};
}
