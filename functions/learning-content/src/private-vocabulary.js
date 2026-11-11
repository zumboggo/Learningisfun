import {createHash} from 'node:crypto';
import {Query} from 'node-appwrite';
import {atomic,readRecord,writeRecord,allRows,fail,isOwnerAdmin,WORKSPACE} from './teacher-workspace.js';
import {batches} from './vocabulary-model.js';
import {COURSES,courseVocabulary} from './text-guidance.js';
const id=(...parts)=>'vc_'+createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0,30);
const key=value=>'vocabulary:'+value;
export async function privateVocabulary(args){
 if(isOwnerAdmin(args.userId)&&!(await readRecord(args.db,args.databaseId,args.userId,key('legacy-2'))).value)await atomic(args,async({db})=>{for(const [index,name] of COURSES.entries()){const k=key('legacy-'+index),prior=await readRecord(db,args.databaseId,args.userId,k);if(!prior.value){const weeks=Array.from({length:53},(_,i)=>({week:String(i+1),text:courseVocabulary(name,String(i+1))})).filter(w=>w.text);await writeRecord(db,args.databaseId,args.userId,k,{name,legacy:true,weeks},0);}}});
 const rows=await allRows(args.db,args.databaseId,WORKSPACE,[Query.equal('ownerId',args.userId),Query.startsWith('kind','vocabulary:')]);return rows.map(r=>({id:r.kind.slice(11),revision:r.revision,...JSON.parse(r.dataJson)}));
}
export async function selectedVocabulary(args,brief){if(!brief.course)return '';const lists=await privateVocabulary(args),list=lists.find(l=>l.id===brief.course||l.legacy&&l.name===brief.course);if(!list)fail('Choose a vocabulary list from your account.',403);const weeks=list.legacy?list.weeks:batches(list).map(b=>({week:b.week,text:b.cards.map(c=>c.front+': '+c.back).join('\n')}));const selectedWeek=list.legacy&&brief.week?String(Number(String(brief.week).replace(/[^0-9]/g,''))):brief.week;return weeks.filter(w=>!selectedWeek||w.week===selectedWeek).map(w=>w.text).join('\n').slice(0,14000);}
export async function vocabularyAction(args){
 const {body,userId,profile,db,databaseId}=args;if(!['teacher','admin'].includes(profile.role))fail('Teacher account required.',403);
 if(body.action==='listPrivateVocabulary')return {lists:await privateVocabulary(args)};
 if(!/^[\w-]{1,60}$/.test(body.id||''))fail('Choose a valid list.');
 return atomic(args,async({db})=>{
 const prior=await readRecord(db,databaseId,userId,key(body.id));if(prior.revision!==body.revision)fail('Vocabulary changed elsewhere. Reload first.',409);if(prior.value?.legacy)fail('This imported curriculum is read-only.');
 const raw=body.value;const v=raw&&Object.fromEntries(['name','classId','firstWeek','wordsPerWeek','skipWeeks','cards','active'].map(k=>[k,structuredClone(raw[k])]));if(!v||typeof v.name!=='string'||!v.name.trim()||v.name.length>150||typeof v.classId!=='string'||typeof v.active!=='boolean'||!Array.isArray(v.skipWeeks)||v.skipWeeks.length>300||!Array.isArray(v.cards)||!v.cards.length||v.cards.length>2000||JSON.stringify(v).length>700000)fail('Enter a name, class and up to 2,000 vocabulary rows.');
 const cls=await db.getDocument(databaseId,'classes',v.classId);if(cls.teacherId!==userId||cls.status!=='active')fail('Choose your own active class.',403);if(prior.value&&prior.value.classId!==v.classId)fail('A saved schedule cannot move to another class.');
 if(v.cards.some(c=>!c||typeof c.id!=='string'||!/^row-\d+$/.test(c.id)||typeof c.front!=='string'||!c.front.trim()||c.front.length>5000||typeof c.back!=='string'||!c.back.trim()||c.back.length>5000)||new Set(v.cards.map(c=>c.id)).size!==v.cards.length)fail('Vocabulary rows need unique IDs, terms and definitions.');
 const next=batches(v);v.released=prior.value?.released||[];
 for(const old of prior.value?batches(prior.value):[]){if(v.released.includes(old.week)&&JSON.stringify(next.find(b=>b.week===old.week))!==JSON.stringify(old))fail('Released weeks cannot change. Edit only unreleased rows or dates.');}
 return writeRecord(db,databaseId,userId,key(body.id),v,prior.revision);
 });
}
async function put(db,databaseId,collection,document,data){try{await db.getDocument(databaseId,collection,document);return db.updateDocument(databaseId,collection,document,data);}catch(e){if(e.code!==404)throw e;return db.createDocument(databaseId,collection,document,data,[]);}}
export async function releasePrivateVocabulary(db,databaseId,now){
 const rows=await allRows(db,databaseId,WORKSPACE,[Query.startsWith('kind','vocabulary:')]);let completed=0;
 for(const row of rows){const value=JSON.parse(row.dataJson);if(!value.active||value.legacy)continue;
 try{for(const expected of batches(value).filter(b=>b.releaseAt<=now&&!(value.released||[]).includes(b.week))){
 const released=await atomic({db,databaseId,userId:row.ownerId,body:{}},async({db})=>{
 const saved=await readRecord(db,databaseId,row.ownerId,row.kind),v=saved.value;if(!v?.active)return false;
 const cls=await db.getDocument(databaseId,'classes',v.classId);if(cls.teacherId!==row.ownerId||cls.status!=='active')throw Error('Class is no longer active or owned by this teacher.');
 const b=batches(v).find(b=>b.week===expected.week&&b.releaseAt<=now&&!(v.released||[]).includes(b.week));if(!b)return false;
 const deckId=id(row.ownerId,row.kind,v.classId),priorDeck=await db.getDocument(databaseId,'flashcard_decks',deckId).catch(e=>{if(e.code!==404)throw e;return null;});await put(db,databaseId,'flashcard_decks',deckId,{creatorId:row.ownerId,title:v.name,description:'Weekly class vocabulary',type:'teacher',status:'published',createdAt:priorDeck?.createdAt||b.releaseAt,updatedAt:now});
 for(let offset=0;offset<b.cards.length;offset+=10){const results=await Promise.allSettled(b.cards.slice(offset,offset+10).map(card=>put(db,databaseId,'flashcard_cards',id(deckId,card.id),{deckId,front:card.front,back:card.back,frontMarkdown:card.front,backMarkdown:card.back,hint:'',tags:['CORE','week:'+b.week,'source:'+id(row.kind,card.id)],sortOrder:Number(b.week.replaceAll('-','')),createdAt:b.releaseAt})));const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;}
 await put(db,databaseId,'deck_assignments',id(deckId,v.classId),{deckId,classId:v.classId,isRequired:true,dailyTarget:6,assignedAt:b.releaseAt});
 await put(db,databaseId,'planning_materials',id(deckId,v.classId,'material'),{teacherId:row.ownerId,classId:v.classId,kind:'deck',releaseAt:b.releaseAt,dataJson:JSON.stringify({deckId})});
 v.released=[...(v.released||[]),b.week];v.releaseError='';await writeRecord(db,databaseId,row.ownerId,row.kind,v,saved.revision);return true;
 });if(released)completed++;
 }}catch(error){await atomic({db,databaseId,userId:row.ownerId,body:{}},async({db})=>{const current=await readRecord(db,databaseId,row.ownerId,row.kind);await writeRecord(db,databaseId,row.ownerId,row.kind,{...current.value,releaseError:String(error.message).slice(0,500)},current.revision);});}
 }return completed;
}
