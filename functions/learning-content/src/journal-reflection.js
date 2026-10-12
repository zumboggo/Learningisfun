import {createHash} from 'node:crypto';
import {Query} from 'node-appwrite';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,32);
const fail=(m,code=400)=>{throw Object.assign(new Error(m),{code});};
// Separate versioned snapshots: optional writing cannot change the completed game history.
export async function journalReflectionAction({body,userId,db,databaseId,episode}){
 if(episode.profile!=='world-literature')fail('This writing space belongs to World Literature.');
 const attemptId=body.attemptId;if(typeof attemptId!=='string'||!/^[a-zA-Z0-9-]{20,36}$/.test(attemptId))fail('Invalid writing attempt');
 const key=hash([userId,body.classId,episode.assignmentId,attemptId].join(':')),kind='reflection:'+key,collection='episode_records';
 if(body.action==='readJournalReflection'){
  const result=await db.listDocuments(databaseId,collection,[Query.equal('classId',body.classId),Query.equal('userId',userId),Query.equal('kind',kind),Query.orderDesc('$createdAt'),Query.limit(1)]);
  return {reflection:result.documents[0]?JSON.parse(result.documents[0].dataJson):null};
 }
 const {text,baseRevision}=body;if(typeof text!=='string'||text.length>4000||!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>10000)fail('Keep the response within 4000 characters and use a valid revision.');
 if(baseRevision){try{await db.getDocument(databaseId,collection,hash(key+':'+baseRevision));}catch(err){if(err.code===404)fail('Reload the writing before saving this revision.',409);throw err;}}
 const revision=baseRevision+1,id=hash(key+':'+revision),record={attemptId,episode:episode.id,version:episode.version,assignmentId:episode.assignmentId,text,revision,updatedAt:new Date().toISOString()};
 try{await db.createDocument(databaseId,collection,id,{classId:body.classId,userId,kind,dataJson:JSON.stringify(record)},[]);}catch(err){if(err.code!==409)throw err;const old=JSON.parse((await db.getDocument(databaseId,collection,id)).dataJson);if(old.text!==text)fail('Writing changed on another device. Your local response is preserved; copy it before loading the account version.',409);return {reflection:old};}
 return {reflection:record};
}
