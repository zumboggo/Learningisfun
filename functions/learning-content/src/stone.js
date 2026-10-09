import { Query } from 'node-appwrite';
import { createHash } from 'node:crypto';
import { STONE_CLASS_ID, EPISODE, VERSION, assess } from './stone-engine.js';
const collection='stone_attempts';
const fail=(message,code=403)=>{throw Object.assign(new Error(message),{code});};
const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,32);
async function all(db,databaseId,queries){
 const rows=[]; let cursor;
 do{const page=await db.listDocuments(databaseId,collection,[...queries,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);rows.push(...page.documents);cursor=page.documents.length===100?page.documents.at(-1).$id:null;}while(cursor);
 return rows;
}
export function latestAttempts(rows){
 const map=new Map();
 for(const row of rows){const attempt=JSON.parse(row.dataJson); const key=row.userId+':'+attempt.attemptId; const old=map.get(key);const createdAt=old?.createdAt&&old.createdAt<row.$createdAt?old.createdAt:row.$createdAt; if(!old||attempt.choices.length>old.choices.length)map.set(key,{...attempt,userId:row.userId,createdAt,updatedAt:row.$createdAt}); else old.createdAt=createdAt;}
 return [...map.values()];
}
export async function stoneAction({body,profile,userId,memberClassIds,db,databaseId}){
 if(body.classId!==STONE_CLASS_ID)fail('This episode is available only in Ethics and Leadership');
 const cls=await db.getDocument(databaseId,'classes',STONE_CLASS_ID);
 const preview=cls.teacherId===userId && ['teacher','admin'].includes(profile.role);
 if(!preview && (profile.role!=='student'||!memberClassIds.has(STONE_CLASS_ID)))fail('Class membership required');
 if(body.action==='saveStone'){
  if(preview)return {preview:true};
  const a=body.attempt;
  if(!a||a.episode!==EPISODE||a.version!==VERSION||typeof a.attemptId!=='string'||!/^[a-zA-Z0-9-]{20,36}$/.test(a.attemptId)||a.revision!==a.choices?.length)fail('Invalid episode save',400);
  const assessment=assess(a.choices);
  const clean={attemptId:a.attemptId,episode:EPISODE,version:VERSION,revision:a.choices.length,choices:a.choices,status:assessment.complete?'complete':'active',assessment:assessment.complete?assessment:null};
  // Save every prefix under a deterministic immutable key. Divergent devices
  // collide at their first different decision, even when revisions differ.
  for(let revision=0;revision<=a.revision;revision++){
   const choices=a.choices.slice(0,revision),result=assess(choices);
   const snapshot={...clean,choices,revision,status:result.complete?'complete':'active',assessment:result.complete?result:null};
   const id=hash(userId+':'+a.attemptId+':'+revision);
   try { await db.createDocument(databaseId,collection,id,{classId:STONE_CLASS_ID,userId,attemptId:a.attemptId,revision,dataJson:JSON.stringify(snapshot)},[]); }
   catch(error){if(error.code!==409)throw error;const existing=await db.getDocument(databaseId,collection,id);if(JSON.stringify(JSON.parse(existing.dataJson).choices)!==JSON.stringify(choices))fail('This attempt changed on another device. Keep both attempts.',409);}
  }
  return {saved:true,assessment:clean.assessment};
 }
 if(body.action!=='readStone')fail('Unknown stone action',400);
 let rows,completed;
 try {
  [rows,completed]=await Promise.all([all(db,databaseId,[Query.equal('classId',STONE_CLASS_ID),Query.equal('userId',userId)]),all(db,databaseId,[Query.equal('classId',STONE_CLASS_ID),Query.equal('revision',10)])]);
 } catch(error){if(error.code!==404||!preview)throw error;await provisionStone(db,databaseId);rows=[];completed=[];}
 const attempts=latestAttempts(rows);
 const best=new Map();
 for(const a of latestAttempts(completed).filter(a=>a.status==='complete')){
  // Recalculate from authoritative rules; never trust a client score.
  const score=assess(a.choices).total;if(!best.has(a.userId)||score>best.get(a.userId))best.set(a.userId,score);
 }
 const board=[];
 for(const [id,score] of best){
  const members=await db.listDocuments(databaseId,'class_members',[Query.equal('classId',STONE_CLASS_ID),Query.equal('userId',id),Query.limit(1)]);
  if(!members.documents.length)continue;
  let nickname='Learner '+hash(id).slice(0,5).toUpperCase();
  try{const p=await db.getDocument(databaseId,'users',id);if(p.role!=='student')continue;if(['visible','reset'].includes(p.nicknameModerationStatus))nickname=p.name;}catch{continue;}
  board.push({nickname,score,mine:id===userId});
 }
 board.sort((a,b)=>b.score-a.score||a.nickname.localeCompare(b.nickname));
 const leaderboard=board.map((entry,index)=>({...entry,rank:board.findIndex(other=>other.score===entry.score)+1}));
 return {preview,attempts:attempts.filter(a=>a.userId===userId),leaderboard};
}

// Owner-only first-use provisioning supports deployment through the existing
// authenticated Appwrite console, without creating or exposing new API keys.
async function provisionStone(db,databaseId){
 try{await db.createCollection(databaseId,collection,'Teaching Stone Attempts',[],false);}catch(e){if(e.code!==409)throw e;}
 for(const key of ['classId','userId','attemptId','dataJson']){
  try{await db.createStringAttribute(databaseId,collection,key,key==='dataJson'?30000:255,true);}catch(e){if(e.code!==409)throw e;}
 }
 try{await db.createIntegerAttribute(databaseId,collection,'revision',true,0,10);}catch(e){if(e.code!==409)throw e;}
 for(let i=0;i<60;i++){
  const attributes=await db.listAttributes(databaseId,collection);
  if(attributes.attributes.length>=5&&attributes.attributes.every(a=>a.status==='available')){
   for(const key of ['classId','userId']){try{await db.createIndex(databaseId,collection,'idx_'+key,'key',[key]);}catch(e){if(e.code!==409)throw e;}}
   return;
  }
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error('Teaching Stone storage is preparing. Please reopen the episode in a moment.');
}
