import {journalReflectionAction} from './journal-reflection.js';
import {writingRubric} from './young-scoring.js';
import {createHash} from 'node:crypto';
import {Query} from 'node-appwrite';
import {availableEpisodeVersions,requireEpisode} from './episode-catalog.js';
import {contentForEpisode} from './episode-content.js';
import {journalProgress,validateJournal} from './journal-engine.js';
const collection='episode_records';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,32);
const fail=(message,code=400)=>{throw Object.assign(new Error(message),{code});};
export async function episodeAction({body,profile,userId,memberClassIds,db,databaseId}){
 if(typeof body.classId!=='string')fail('Class required');
 const cls=await db.getDocument(databaseId,'classes',body.classId);
 const preview=cls.teacherId===userId&&['teacher','admin'].includes(profile.role);
 if(!preview&&(profile.role!=='student'||!memberClassIds.has(body.classId)))fail('Class membership required',403);
 if(body.action==='readEpisodes'){
  const catalog=availableEpisodeVersions(body.classId,preview);
  if(!catalog.length)return {episodes:[],attempts:[],preview};
  let rows;try{rows=await readAll(db,databaseId,[Query.equal('classId',body.classId),Query.equal('userId',userId),Query.equal('kind','attempt')]);}catch(err){if(err.code!==404||!preview)throw err;await provisionEpisodes(db,databaseId);rows=[];}
  const latest=new Map();for(const row of rows){const a=JSON.parse(row.dataJson),old=latest.get(a.attemptId);if(!old||old.revision<a.revision)latest.set(a.attemptId,a);}
  const writing=await readAll(db,databaseId,[Query.equal('classId',body.classId),Query.equal('userId',userId),Query.equal('kind','ai')]);
  return {writing:writing.map(row=>({...JSON.parse(row.dataJson),id:row.$id})),episodes:catalog,attempts:[...latest.values()].filter(a=>catalog.some(e=>e.id===a.episode&&e.version===a.version)),preview};
 }
 const e=requireEpisode(body.classId,body.episode,body.version,preview);
 if(['readJournalReflection','saveJournalReflection'].includes(body.action))return journalReflectionAction({body,userId,db,databaseId,episode:e});
 const {assessYoung,assessDriver,sourceNotes,sourceUrl,assignmentPrompt,rubric,scenes}=contentForEpisode(e.id,e.version);
 if(body.action==='episodeBoard'){
  const rows=await readAll(db,databaseId,[Query.equal('classId',body.classId),Query.equal('kind',e.profile==='ap-language'&&e.version>=2?'ai':'result')]),best=new Map();
  for(const row of rows){const a=JSON.parse(row.dataJson);if(a.episode!==e.id||a.version!==e.version||a.preview)continue;if(e.profile==='ap-language'&&e.version>=2){if(a.mode==='feedback'&&a.state==='complete'&&a.assessment?.rubricVersion===2&&(!best.has(row.userId)||best.get(row.userId)<a.assessment.total))best.set(row.userId,a.assessment.total);}else{const result=assessYoung(a.choices);if(result.complete&&assessDriver(a.driverAttempts).passed&&(!best.has(row.userId)||best.get(row.userId)<result.total))best.set(row.userId,result.total);}}
  const board=[];for(const [id,score] of best){const membership=await db.listDocuments(databaseId,'class_members',[Query.equal('classId',body.classId),Query.equal('userId',id),Query.limit(1)]);if(!membership.documents.some(m=>m.role==='student'&&(!m.expiresAt||Date.parse(m.expiresAt)>Date.now())))continue;try{const p=await db.getDocument(databaseId,'users',id);if(p.role!=='student')continue;board.push({nickname:['visible','reset'].includes(p.nicknameModerationStatus)?p.name:'Learner '+hash(id).slice(0,5),score,mine:id===userId});}catch{}}
  board.sort((a,b)=>b.score-a.score);return {leaderboard:board.map(r=>({...r,rank:board.findIndex(b=>b.score===r.score)+1}))};
 }
 const a=body.attempt;
 if(!a||typeof a.attemptId!=='string'||!/^[a-zA-Z0-9-]{20,36}$/.test(a.attemptId))fail('Invalid attempt');
 const assessed=assessYoung(a.choices,a.attemptId),driverAttempts=a.driverAttempts||[],fare=assessDriver(driverAttempts);
 if(driverAttempts.length&&!assessed.complete)fail('Finish the journey before the driver check.');
 const journal=e.profile==='world-literature'?validateJournal(a.journal,a.choices,scenes.length):undefined;
 const progress=journal?journalProgress({...a,driverAttempts,journal},scenes.length):[...a.choices,...driverAttempts.map(v=>JSON.stringify(v))],completed=assessed.complete&&fare.passed;
 const key=hash([userId,body.classId,e.assignmentId,a.attemptId].join(':'));
 if(body.action==='saveEpisode'){
  const data={attemptId:a.attemptId,episode:e.id,version:e.version,assignmentId:e.assignmentId,choices:a.choices,driverAttempts,...(journal?{journal}:{}),revision:progress.length,status:completed?'complete':'active',preview,updatedAt:new Date().toISOString()};
  // A trusted acknowledgement avoids rereading every old prefix on each choice.
  const ackKey=hash(key+':ack');let ack;try{ack=JSON.parse((await db.getDocument(databaseId,collection,ackKey)).dataJson);}catch(err){if(err.code!==404)throw err;}
  const prior=ack?(ack.progress||ack.choices):[];
  if(ack&&!prior.slice(0,Math.min(prior.length,progress.length)).every((id,i)=>id===progress[i]))fail('This attempt changed on another device. Keep both attempts.',409);
  if(ack&&prior.length>=progress.length)return {saved:true,assessment:assessed};
  // Immutable prefixes still arbitrate concurrent divergent saves atomically.
  for(let revision=ack?prior.length+1:0;revision<=progress.length;revision++){
   const id=hash(key+':prefix:'+revision),choices=progress.slice(0,revision);
   try{await db.createDocument(databaseId,collection,id,{classId:body.classId,userId,kind:'prefix',dataJson:JSON.stringify({choices})},[]);}
   catch(err){if(err.code!==409)throw err;const row=await db.getDocument(databaseId,collection,id);if(JSON.stringify(JSON.parse(row.dataJson).choices)!==JSON.stringify(choices))fail('This attempt changed on another device. Keep both attempts.',409);}
  }
  const snapshotKey=hash(key+':snapshot:'+data.revision);
  try{await db.createDocument(databaseId,collection,snapshotKey,{classId:body.classId,userId,kind:'attempt',dataJson:JSON.stringify({...data,createdAt:data.updatedAt})},[]);}catch(err){if(err.code!==409)throw err;}
  if(completed&&!preview&&(e.profile==='world-literature'||e.version===1)){try{await db.createDocument(databaseId,collection,hash(key+':result'),{classId:body.classId,userId,kind:'result',dataJson:JSON.stringify(data)},[]);}catch(err){if(err.code!==409)throw err;}}
  const ackFields={classId:body.classId,userId,kind:'ack',dataJson:JSON.stringify({choices:a.choices,progress})};try{await db.createDocument(databaseId,collection,ackKey,ackFields,[]);}catch(err){if(err.code!==409)throw err;await db.updateDocument(databaseId,collection,ackKey,ackFields);}
  return {saved:true,assessment:assessed};
 }
 if(e.profile==='world-literature')fail('Journal episodes use authored conversations and their notebook rubric, not AI writing.');
 if(body.action==='episodeWriting'){const rows=await readAll(db,databaseId,[Query.equal('classId',body.classId),Query.equal('userId',userId),Query.equal('kind','ai')]);return {writing:rows.map(row=>({...JSON.parse(row.dataJson),id:row.$id})).filter(r=>r.attemptId===a.attemptId&&r.episode===e.id&&r.version===e.version)};}
 if(body.action!=='episodeAI')fail('Unknown episode action');
 const mode=body.mode;
 if(!['question','feedback'].includes(mode)||typeof body.text!=='string'||!body.text.trim()||body.text.length>(mode==='question'?1000:12000))fail('Enter a question or response within the length limit.');
 if(mode==='feedback'&&!completed)fail('Finish the story before submitting the closing analysis.');
 const scored=e.version>=2&&mode==='feedback';
 if(scored)await episodeAction({body:{...body,action:'saveEpisode'},profile,userId,memberClassIds,db,databaseId});
 const text=body.text.trim(),cache=hash([key,mode,'teacher-review',text].join(':'));
 const record={id:cache,attemptId:a.attemptId,episode:e.id,version:e.version,state:'complete',text,mode,createdAt:new Date().toISOString(),preview,answer:'Your response is saved for your teacher to review. AI feedback is no longer used.'};
 try{await db.createDocument(databaseId,collection,cache,{classId:body.classId,userId,kind:'ai',dataJson:JSON.stringify(record)},[])}catch(err){if(err.code!==409)throw err;}
 return record;
}

async function readAll(db,databaseId,queries){const rows=[];let cursor;do{const page=await db.listDocuments(databaseId,collection,[...queries,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);rows.push(...page.documents);cursor=page.documents.length===100?page.documents.at(-1).$id:null;}while(cursor);return rows;}
async function provisionEpisodes(db,databaseId){
 try{await db.createCollection(databaseId,collection,'Episode progress and private writing',[],false);}catch(e){if(e.code!==409)throw e;}
 for(const key of ['classId','userId','kind','dataJson']){try{await db.createStringAttribute(databaseId,collection,key,key==='dataJson'?30000:255,true);}catch(e){if(e.code!==409)throw e;}}
 for(let i=0;i<40;i++){const r=await db.listAttributes(databaseId,collection);if(r.attributes.length>=4&&r.attributes.every(a=>a.status==='available')){for(const key of ['classId','userId','kind']){try{await db.createIndex(databaseId,collection,'idx_'+key,'key',[key]);}catch(e){if(e.code!==409)throw e;}}return;}await new Promise(r=>setTimeout(r,250));}
 throw new Error('Episode storage is preparing. Reopen the episode shortly.');
}
