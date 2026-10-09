import {Query} from 'node-appwrite';
import {createHash} from 'node:crypto';
import egypt from './ethics-egypt-context.json' with {type:'json'};
import {assess,EPISODE,VERSION,STONE_CLASS_ID} from './stone-engine.js';
export const PORTFOLIO_COLLECTION='ethics_portfolio';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,32);
const fail=(message,code=400)=>{throw Object.assign(new Error(message),{code});};
const short=(s,max=6000)=>typeof s==='string'?s.trim().slice(0,max):'';
const idOK=s=>typeof s==='string'&&/^[\w-]{1,64}$/.test(s);
export function choiceContext(choices,index){
 if(!assess(choices).complete||!Number.isInteger(index)||index<0||index>=10)fail('Choose a decision from a completed life.');
 const scene=egypt.scenes[index],choice=choices[index];
 return {episode:EPISODE,version:VERSION,index,title:scene.title,passage:scene.text.join('\n\n'),aside:scene.aside,options:scene.choices,choice,label:scene.choices.find(c=>c[0]===choice)[1],outcome:scene.responses[choice]};
}
export function cleanEntry(input,previous,settings){
 if(!input||!idOK(input.id))fail('Invalid entry.');
 const source=input.source;
 let cleanSource;
 if(source?.kind==='episode'){
  if(source.episode!==EPISODE||source.version!==VERSION||!idOK(source.attemptId))fail('Unknown episode version.');
  cleanSource={kind:'episode',attemptId:source.attemptId,choices:source.choices,index:source.index,...choiceContext(source.choices,source.index)};
 }else if(source?.kind==='reading'){
  const title=short(source.title,255),passage=short(source.passage),url=short(source.url,2048);
  if(!title||!passage)fail('Name the reading and quote or identify a passage.');
  if(url){try{if(!['http:','https:'].includes(new URL(url).protocol))throw Error();}catch{fail('Use an http or https reading link.');}}
  cleanSource={kind:'reading',title,passage,url};
 }else fail('Choose an episode or reading.');
 const answers=Array.from({length:3},(_,i)=>short(input.answers?.[i]));
 const submitted=previous?.submitted||!!input.submitted;
 if(submitted&&answers.some(a=>!a))fail('Answer each of the three prompts.');
 if(previous?.submitted&&(JSON.stringify(cleanSource)!==JSON.stringify(previous.source)||JSON.stringify(answers)!==JSON.stringify(previous.answers)))fail('The submitted original is preserved. Add a reconsideration instead.',409);
 const reconsideration=short(input.reconsideration);
 if(reconsideration!==(previous?.reconsideration||'')){
  if(!previous?.submitted)fail('Save your original response first.');
  if(!settings.open||(settings.deadline&&Date.parse(settings.deadline)<Date.now()))fail('Your teacher has not opened reconsideration, or its deadline has passed.',403);
 }
 return {id:input.id,source:cleanSource,answers,submitted,submittedAt:previous?.submittedAt||(submitted?new Date().toISOString():null),reconsideration,reconsideredAt:reconsideration!==(previous?.reconsideration||'')?new Date().toISOString():previous?.reconsideredAt||null};
}
async function get(db,databaseId,id){try{return await db.getDocument(databaseId,PORTFOLIO_COLLECTION,id);}catch(e){if(e.code===404)return null;throw e;}}
async function list(db,databaseId,queries){const out=[];let cursor;do{const p=await db.listDocuments(databaseId,PORTFOLIO_COLLECTION,[...queries,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);out.push(...p.documents);cursor=p.documents.length===100?p.documents.at(-1).$id:null;}while(cursor);return out;}
export async function ethicsPortfolioAction({body,userId,profile,memberClassIds,db,databaseId}){
 if(body.classId!==STONE_CLASS_ID)fail('This portfolio belongs to Ethics and Leadership.',403);
 const cls=await db.getDocument(databaseId,'classes',body.classId);
 const teacher=cls.teacherId===userId&&['teacher','admin'].includes(profile.role);
 if(!teacher&&!(profile.role==='student'&&memberClassIds.has(body.classId)))fail('Class membership required.',403);
 const settingsId=hash(body.classId+':settings');
 let settingsRow;
 try{settingsRow=await get(db,databaseId,settingsId);}catch(e){throw e;}
 const settings=settingsRow?JSON.parse(settingsRow.dataJson):{open:false,deadline:null};
 if(body.action==='setEthicsPortfolioStage'){
  if(!teacher)fail('Only the class teacher can open reconsideration.',403);
  if(body.deadline&&(!Number.isFinite(Date.parse(body.deadline))))fail('Invalid deadline.');
  const next={open:body.open===true,deadline:body.deadline?new Date(body.deadline).toISOString():null};
  const data={classId:body.classId,userId,entryId:'settings',revision:0,kind:'settings',dataJson:JSON.stringify(next)};
  if(settingsRow)await db.updateDocument(databaseId,PORTFOLIO_COLLECTION,settingsId,data);
  else try{await db.createDocument(databaseId,PORTFOLIO_COLLECTION,settingsId,data,[]);}catch(e){if(e.code!==409)throw e;await db.updateDocument(databaseId,PORTFOLIO_COLLECTION,settingsId,data);}
  return {settings:next};
 }
 if(body.action==='readEthicsPortfolio'){
  const queries=[Query.equal('classId',body.classId),Query.equal('kind','entry'),...(!teacher?[Query.equal('userId',userId)]:[])];
  let rows;try{rows=await list(db,databaseId,queries);}catch(e){if(e.code!==404||!teacher)throw e;await provisionPortfolio(db,databaseId);rows=[];}
  const latest=new Map();
  for(const row of rows){const key=row.userId+':'+row.entryId;if(!latest.has(key)||latest.get(key).revision<row.revision)latest.set(key,{...JSON.parse(row.dataJson),userId:row.userId,revision:row.revision,updatedAt:row.$createdAt});}
  const entries=[...latest.values()];
  if(teacher){const names=new Map();for(const id of new Set(entries.map(e=>e.userId))){try{names.set(id,(await db.getDocument(databaseId,'users',id)).name);}catch{names.set(id,'Student');}}for(const e of entries)e.studentName=names.get(e.userId);}
  return {teacher,settings,entries};
 }
 if(body.action!=='saveEthicsPortfolio'||teacher)fail('Student portfolio saving required. Teacher previews stay on this device.',403);
 const input=body.entry,revision=input?.revision;
 if(JSON.stringify(input||{}).length>50000)fail('Entry is too large.');
 if(!idOK(input?.id)||!Number.isInteger(revision)||revision<1||revision>10000)fail('Invalid entry revision.');
 const recordId=r=>hash(body.classId+':'+userId+':'+input.id+':'+r);
 const existing=await get(db,databaseId,recordId(revision));
 // Identical retries succeed even if the teacher has since closed the stage.
 if(existing){const old=JSON.parse(existing.dataJson);if(old.requestHash===hash(JSON.stringify(input)))return {saved:true,entry:old};fail('This entry changed on another device. Your local draft is preserved; export it before resolving the conflict.',409);}
 const parent=revision>1?await get(db,databaseId,recordId(revision-1)):null;
 if(revision>1&&!parent)fail('Save the earlier revision first.',409);
 const previous=parent?JSON.parse(parent.dataJson):null;
 const entry={...cleanEntry(input,previous,settings),revision,requestHash:hash(JSON.stringify(input))};
 try{await db.createDocument(databaseId,PORTFOLIO_COLLECTION,recordId(revision),{classId:body.classId,userId,entryId:input.id,revision,kind:'entry',dataJson:JSON.stringify(entry)},[]);}
 catch(e){if(e.code!==409)throw e;const winner=JSON.parse((await get(db,databaseId,recordId(revision))).dataJson);if(winner.requestHash!==hash(JSON.stringify(input)))fail('This entry changed on another device. Your local draft is preserved; export it before resolving the conflict.',409);}
 return {saved:true,entry};
}

// Teacher-owned first use provisions private function-only storage.
async function provisionPortfolio(db,databaseId){
 try{await db.createCollection(databaseId,PORTFOLIO_COLLECTION,'Ethics Principles Portfolio',[],false);}catch(e){if(e.code!==409)throw e;}
 for(const key of ['classId','userId','entryId','kind','dataJson']){try{await db.createStringAttribute(databaseId,PORTFOLIO_COLLECTION,key,key==='dataJson'?65000:255,true);}catch(e){if(e.code!==409)throw e;}}
 try{await db.createIntegerAttribute(databaseId,PORTFOLIO_COLLECTION,'revision',true,0,10000);}catch(e){if(e.code!==409)throw e;}
 for(let i=0;i<40;i++){
  const a=await db.listAttributes(databaseId,PORTFOLIO_COLLECTION);
  if(a.attributes.length>=6&&a.attributes.every(x=>x.status==='available')){
   for(const key of ['classId','userId','kind']){try{await db.createIndex(databaseId,PORTFOLIO_COLLECTION,'idx_'+key,'key',[key]);}catch(e){if(e.code!==409)throw e;}}
   return;
  }
  await new Promise(r=>setTimeout(r,250));
 }
 throw Error('Portfolio storage is preparing. Please refresh in a moment.');
}
