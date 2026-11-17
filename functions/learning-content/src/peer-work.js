import {ID,Query} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
import {createHash} from 'node:crypto';
export const PEER_WORK_BUCKET='peer-review-work';
export const PEER_WORK_COLLECTION='peer_review_work';
export const PEER_WORK_ACTIONS=['submitPeerReviewWork','readPeerReviewWork','downloadPeerReviewWork'];
export const peerWorkId=(activityId,studentId)=>'pw_'+createHash('sha256').update(JSON.stringify([activityId,studentId])).digest('hex').slice(0,32);
const fail=(message,code=400)=>{throw Object.assign(new Error(message),{code})};
const summary=row=>({$id:row.$id,studentId:row.studentId,title:row.title,fileName:row.fileName,createdAt:row.createdAt});
export async function listPeerWork(db,databaseId,activity){
 if(activity.workMode!=='submitted')return [];
 const result=await db.listDocuments(databaseId,PEER_WORK_COLLECTION,[Query.equal('activityId',activity.$id),Query.select(['$id','studentId','title','fileName','createdAt']),Query.limit(500)]);
 return result.documents.map(summary);
}
export async function requirePeerWork(db,databaseId,activity,studentId){
 try{const work=await db.getDocument(databaseId,PEER_WORK_COLLECTION,peerWorkId(activity.$id,studentId));if(work.activityId!==activity.$id||work.studentId!==studentId)fail('Work is not available.',404);return work}
 catch(e){if(e.code===404)fail('This classmate has not submitted work yet.',400);throw e}
}
export function validatePeerWork(body){
 const title=String(body.title||'').trim(),text=String(body.text||'').trim(),url=String(body.url||'').trim();
 if(!title||title.length>200||text.length>20000||url.length>2000)fail('Add a title (up to 200 characters), text up to 20,000 characters, and a link up to 2,000 characters.');
 if(url){let parsed;try{parsed=new URL(url)}catch{fail('Use a complete https:// or http:// link.')}if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)fail('Use a complete https:// or http:// link without embedded credentials.');}
 let file=null;
 if(body.file){
  const {name,data}=body.file;
  if(typeof name!=='string'||name.length>180||/[\r\n\\/]/.test(name)||typeof data!=='string'||data.length>Math.ceil(5*1024*1024/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))fail('Choose a supported file of 5 MB or smaller.');
  const bytes=Buffer.from(data,'base64'),ext=name.split('.').pop().toLowerCase();
  const starts=hex=>bytes.subarray(0,hex.length/2).equals(Buffer.from(hex,'hex'));
  const valid={pdf:starts('25504446'),docx:starts('504b0304'),pptx:starts('504b0304'),png:starts('89504e470d0a1a0a'),jpg:starts('ffd8ff'),jpeg:starts('ffd8ff'),webp:starts('52494646')&&bytes.subarray(8,12).toString()==='WEBP',txt:!bytes.includes(0)&&!bytes.toString('utf8').includes('\uFFFD')};
  if(!Object.hasOwn(valid,ext)||!valid[ext]||!bytes.length||bytes.length>5*1024*1024)fail('Use PDF, DOCX, PPTX, TXT, PNG, JPG, or WebP files of 5 MB or smaller.');
  file={name,bytes};
 }
 if(!text&&!url&&!file)fail('Add your work as text, a link, or a file.');
 return {title,text,url,file};
}
export async function peerWorkAction({body,profile,userId,memberClassIds,db,databaseId,storage,tokens,endpoint,projectId}){
 const activity=await db.getDocument(databaseId,'peer_review_activities',body.activityId);
 const cls=await db.getDocument(databaseId,'classes',activity.classId);
 const teacher=profile.role==='teacher'&&cls.teacherId===userId;
 const student=profile.role==='student'&&memberClassIds.has(activity.classId);
 if(!teacher&&!student)fail('This work is only available to students in this class and their teacher.',403);
 if(activity.workMode!=='submitted')fail('This is a live presentation activity.');
 if(body.action==='submitPeerReviewWork'){
  if(!student||activity.status!=='active')fail('This activity is not accepting student work.',403);
  const work=validatePeerWork(body),id=peerWorkId(activity.$id,userId);
  try{await db.getDocument(databaseId,PEER_WORK_COLLECTION,id);fail('You have already submitted work for this activity.',409)}catch(e){if(e.code!==404)throw e}
  let fileId='';
  try{
   if(work.file){fileId=ID.unique();await storage.createFile({bucketId:PEER_WORK_BUCKET,fileId,file:InputFile.fromBuffer(work.file.bytes,work.file.name),permissions:[]});}
   const saved=await db.createDocument(databaseId,PEER_WORK_COLLECTION,id,{activityId:activity.$id,classId:activity.classId,studentId:userId,title:work.title,text:work.text,url:work.url,fileId,fileName:work.file?.name||'',createdAt:new Date().toISOString()},[]);
   return {work:summary(saved)};
  }catch(e){if(fileId)await storage.deleteFile({bucketId:PEER_WORK_BUCKET,fileId}).catch(()=>{});if(e.code===409)fail('You have already submitted work for this activity.',409);throw e}
 }
 const work=await requirePeerWork(db,databaseId,activity,body.studentId);
 if(body.action==='readPeerReviewWork')return {work:{...summary(work),text:work.text,url:work.url}};
 if(body.action==='downloadPeerReviewWork'){
  if(!work.fileId)fail('There is no attached file.');
  const token=await tokens.createFileToken({bucketId:PEER_WORK_BUCKET,fileId:work.fileId,expire:new Date(Date.now()+5*60*1000).toISOString()});
  const url=new URL(`${endpoint.replace(/\/$/,'')}/storage/buckets/${PEER_WORK_BUCKET}/files/${work.fileId}/download`);url.searchParams.set('project',projectId);url.searchParams.set('token',token.secret);
  return {url:url.toString()};
 }
 fail('Unknown peer-work action.');
}
