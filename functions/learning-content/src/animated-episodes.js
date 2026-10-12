import {createHash,randomInt} from 'node:crypto';
import {Query} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
import {validatePackage,replayStory,quizScore} from './story-engine.js';
import {textReleaseAt} from './text-schedule.js';
const collection='episode_records',bucketId='animated-episodes';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,32);
const fail=(s,code=400)=>{throw Object.assign(Error(s),{code});};
const safeId=s=>typeof s==='string'&&/^[\w-]{1,64}$/.test(s);
export function packageBytes(pack){let bytes=Buffer.byteLength(JSON.stringify({...pack,assets:{}}));for(const a of [...Object.values(pack.assets?.backgrounds||{}),...Object.values(pack.assets?.characters||{}).flatMap(c=>Object.values(c.expressions||{})),...(pack.assets?.music?[pack.assets.music]:[])]){if(typeof a.src!=='string'||!/^data:(image\/webp|audio\/mpeg|audio\/ogg);base64,[A-Za-z0-9+/]+=*$/.test(a.src))fail('Package assets must be embedded WebP images or MP3/Ogg audio');const b=Buffer.from(a.src.split(',')[1],'base64');if(a.src.startsWith('data:image/webp')&&(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP'))fail('Invalid WebP image');bytes+=b.length;}return bytes;}
export async function animatedEpisodeAction({body,profile,userId,memberClassIds,db,databaseId,storage}){
 const teacher=['teacher','admin'].includes(profile.role),scope='studio-'+userId;
 const list=async(queries)=>{const all=[];let cursor;do{const page=await db.listDocuments(databaseId,collection,[...queries,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);all.push(...page.documents);cursor=page.documents.length===100?page.documents.at(-1).$id:null;}while(cursor);return all;};
 const read=async id=>JSON.parse((await db.getDocument(databaseId,collection,id)).dataJson);
 const write=async(id,classId,kind,data)=>{const dataJson=JSON.stringify(data);if(dataJson.length>28000)fail('Record exceeds supported size');return db.createDocument(databaseId,collection,id,{classId,userId,kind,dataJson},[]);};
 const getPack=async fileId=>{const raw=await storage.getFileDownload({bucketId,fileId});return raw&&raw.format===1?raw:JSON.parse(Buffer.from(raw).toString());};
 const storePack=async pack=>{const raw=JSON.stringify(pack);if(raw.length>7500000)fail('Package is too large');const fileId=hash(userId+raw);try{await storage.createFile({bucketId,fileId,file:InputFile.fromBuffer(Buffer.from(raw),'episode.json'),permissions:[]});}catch(e){if(e.code!==409)throw e;}return fileId;};
 const latest=async(id)=>{const rows=await list([Query.equal('classId',scope),Query.equal('kind','animated-draft-'+id)]);return rows.map(r=>JSON.parse(r.dataJson)).sort((a,b)=>b.revision-a.revision)[0];};
 const owned=async classId=>{const c=await db.getDocument(databaseId,'classes',classId);if(!teacher||c.teacherId!==userId)fail('Only the class teacher can assign episodes',403);};
 const assignment=async()=>{const a=await read(body.assignmentId);if(a.type!=='animated-assignment')fail('Invalid assignment');const c=await db.getDocument(databaseId,'classes',a.classId);const preview=teacher&&c.teacherId===userId;if(!preview&&(profile.role!=='student'||!memberClassIds.has(a.classId)||Date.parse(a.releaseAt)>Date.now()))fail('This episode is not available to your class',403);return {a,preview};};
 if(body.action==='animatedLibrary'){
  let classIds=[...memberClassIds];if(teacher)classIds=(await db.listDocuments(databaseId,'classes',[Query.equal('teacherId',userId),Query.limit(100)])).documents.map(c=>c.$id);
  const rows=classIds.length?await list([Query.equal('classId',classIds),Query.equal('kind','animated-assignment')]):[];
  const assignments=rows.map(r=>({...JSON.parse(r.dataJson),assignmentId:r.$id})).filter(a=>teacher||profile.role==='student'&&Date.parse(a.releaseAt)<=Date.now());
  const drafts=teacher?await list([Query.equal('classId',scope)]):[];const byId={};for(const r of drafts){const d=JSON.parse(r.dataJson);if(d.type==='animated-draft'&&(!byId[d.id]||byId[d.id].revision<d.revision))byId[d.id]=d;}
  const results=classIds.length?(await list([Query.equal('classId',classIds),Query.equal('userId',userId),Query.equal('kind','animated-result')])).map(r=>JSON.parse(r.dataJson)):[];const best={};for(const r of results)best[r.assignmentId]=Math.max(best[r.assignmentId]||0,r.score);return {assignments:assignments.map(a=>({...a,best:best[a.assignmentId]??null})),drafts:Object.values(byId)};
 }
 if(['animatedSaveDraft','animatedReadDraft','animatedPublish'].includes(body.action)){
  if(!teacher)fail('Teacher account required',403);if(!safeId(body.id))fail('Invalid episode ID');const prior=await latest(body.id);
  if(body.action==='animatedReadDraft'){if(!prior)fail('Draft not found',404);return {...prior,pack:await getPack(prior.fileId)};}
  if(body.action==='animatedSaveDraft'){
   if(body.revision!==(prior?.revision||0))fail('Draft changed elsewhere. Export your work and reload before saving.',409);
   // Drafts may have script errors; binary formats and total size are still checked.
   const bytes=packageBytes(body.pack);if(bytes>5000000)fail('Episode exceeds 5 MB');const fileId=await storePack(body.pack);const d={type:'animated-draft',id:body.id,teacherId:userId,title:String(body.pack.title).slice(0,180),revision:(prior?.revision||0)+1,fileId,bytes};await write(hash(scope+body.id+':'+d.revision),scope,'animated-draft-'+body.id,d);return d;
  }
  if(!prior||prior.revision!==body.revision)fail('Save the latest draft before publishing',409);const pack=await getPack(prior.fileId),validation=validatePackage(pack);if(validation.errors.length)fail(validation.errors.map(e=>`Line ${e.line}: ${e.message}`).join('\n'));const versionId=hash(scope+body.id+':published:'+prior.revision),published={...prior,type:'animated-version',version:prior.revision,versionId};try{await write(versionId,scope,'animated-version',published);}catch(e){if(e.code!==409)throw e;}return published;
 }
 if(body.action==='animatedAssign'){
  await owned(body.classId);const v=await read(body.versionId);if(v.type!=='animated-version'||v.teacherId!==userId)fail('Episode ownership required',403);const releaseAt=body.releaseAt||textReleaseAt(body.date);if(!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||!Number.isFinite(Date.parse(releaseAt)))fail('Choose a valid teaching date');
  const a={type:'animated-assignment',classId:body.classId,id:v.id,version:v.version,versionId:v.versionId,fileId:v.fileId,title:v.title,date:body.date,releaseAt};const assignmentId=hash(body.classId+v.versionId+body.date);try{await write(assignmentId,body.classId,'animated-assignment',a);}catch(e){if(e.code!==409)throw e;}return {...a,assignmentId};
 }
 if(['animatedRead','animatedSaveAttempt'].includes(body.action)){
  const {a,preview}=await assignment(),pack=await getPack(a.fileId);const kind='aa-'+hash(body.assignmentId+':'+body.attemptId).slice(0,24);
  if(body.action==='animatedRead'){const attempts=(await list([Query.equal('classId',a.classId),Query.equal('userId',userId),])).map(r=>JSON.parse(r.dataJson)).filter(t=>t.type==='animated-attempt'&&t.assignmentId===body.assignmentId);const newest={};for(const t of attempts)if(!newest[t.id]||newest[t.id].revision<t.revision)newest[t.id]=t;return {pack,assignment:a,preview,attempts:Object.values(newest)};}
  if(preview)fail('Previews are local only');if(!safeId(body.attemptId))fail('Invalid attempt ID');const prefix=hash(userId+body.assignmentId+body.attemptId),revision=body.steps?.length+body.quizzes?.length;if(!Number.isSafeInteger(revision)||revision>5100)fail('Invalid attempt');
  const rows=(await db.listDocuments(databaseId,collection,[Query.equal('classId',a.classId),Query.equal('userId',userId),Query.equal('kind',kind),Query.orderDesc('$id'),Query.limit(1)])).documents;const prior=rows.length?JSON.parse(rows[0].dataJson):undefined;
  if(prior&&(!prior.steps.every((s,i)=>s===body.steps[i])||!prior.quizzes.every((s,i)=>JSON.stringify(s)===JSON.stringify(body.quizzes[i]))||revision<prior.revision))fail('This attempt changed on another device. Start a separate replay.',409);
  const seed=prior?.seed??randomInt(1,2147483647);if(!prior&&revision!==0)fail('Connect to start this attempt before playing');const {story,errors}=validatePackage(pack);if(errors.length)fail('Published episode invalid');const state=replayStory(story,body.steps,seed);if(body.quizzes.length&&!state.ended)fail('Finish the story first');const scores=body.quizzes.map(q=>quizScore(pack.quiz,q));const passed=scores.findIndex(s=>s>=75);if(passed>=0&&passed!==scores.length-1)fail('Start a replay after completion');const attempt={type:'animated-attempt',assignmentId:body.assignmentId,id:body.attemptId,revision,seed,steps:body.steps,quizzes:body.quizzes,score:scores.at(-1)||0,complete:passed>=0};
  if(prior?.revision===revision)return prior;try{await write(prefix.slice(0,26)+'_'+String(revision).padStart(5,'0'),a.classId,kind,attempt);}catch(e){if(e.code===409)fail('This attempt changed on another device. Start a separate replay.',409);throw e;}if(attempt.complete){try{await write(hash(prefix+':result'),a.classId,'animated-result',attempt);}catch(e){if(e.code!==409)throw e;}}return attempt;
 }
 fail('Unknown animated episode operation');
}
