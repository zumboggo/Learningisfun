// Run with the existing setup environment. Defaults to read-only inventory.
import { Client,Databases,Query } from 'node-appwrite';
import { readFile,writeFile } from 'node:fs/promises';
import { listAll,consolidateDecks,planningAction } from '../functions/learning-content/src/planning.js';
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const apply=process.argv.includes('--apply');
const sources=await listAll(db,databaseId,'planner_sources');
const active=sources.filter(source=>source.active);
if(active.length!==1)throw new Error('Expected one active teacher planning source; select the source explicitly before migrating.');
const teacherId=active[0].teacherId,mapping=JSON.parse(active[0].mappingJson);
const classes=await listAll(db,databaseId,'classes',[Query.equal('teacherId',teacherId)]);
const assignments=await listAll(db,databaseId,'deck_assignments',[Query.equal('classId',classes.map(cls=>cls.$id))]);
const ids=[...new Set(assignments.map(row=>row.deckId))];
const decks=ids.length?await listAll(db,databaseId,'flashcard_decks',[Query.equal('$id',ids)]):[];
const cards=ids.length?await listAll(db,databaseId,'flashcard_cards',[Query.equal('deckId',ids)]):[];
console.log(JSON.stringify({classes:classes.map(cls=>({id:cls.$id,title:`${cls.courseName} · ${cls.name}`,status:cls.status,deckCount:assignments.filter(row=>row.classId===cls.$id).length})),mapping,decks:decks.length,cards:cards.length}));
if(!apply)process.exit(0);
const resumePath=process.argv.find(arg=>arg.startsWith('--resume='))?.slice('--resume='.length);
const backup=resumePath?JSON.parse(await readFile(resumePath,'utf8')):{createdAt:new Date().toISOString(),classes,decks,cards,assignments,history:{}};
if(!resumePath)for(const collection of ['student_card_state','card_reviews','flashcard_review_events','flashcard_study_sessions']) {
  backup.history[collection]=ids.length?await listAll(db,databaseId,collection,[Query.equal('deckId',ids)]):[];
}
const backupPath=resumePath||`deck-consolidation-${Date.now()}.local`;
if(!resumePath)await writeFile(backupPath,JSON.stringify(backup),{mode:0o600});
console.log(`Backup saved: ${backupPath}`);
const bundle=JSON.parse(await readFile('planning-import.local','utf8'));
const previous=await listAll(db,databaseId,'planning_units',[Query.equal('teacherId',teacherId)]);
const units=bundle.units.map(unit=>{
  const prior=previous.find(row=>{const data=JSON.parse(row.dataJson);return data.course===unit.course&&data.number===unit.number;});
  return {...unit,...(prior?JSON.parse(prior.dataJson):{}),id:prior?.$id||unit.id,classIds:[...new Set(Object.entries(mapping).filter(([code,value])=>value&&(code===unit.course||(unit.course==='WL'&&code.startsWith('WL-')))).map(([,value])=>value))]};
});
for(const unit of units) {
  // Prepare schedules without inventing approval for unfinished copywork briefs.
  unit.vocabularyApproved=true;
  await planningAction({body:{action:'savePlanningUnit',unit},profile:{role:'teacher'},userId:teacherId,memberClassIds:new Set(),db,databaseId});
}
for(const course of ['WL','AP','ETH']) {
  const unit=units.find(unit=>unit.course===course&&unit.classIds.length);
  if(!unit)throw new Error(`Missing ${course} mapping`);
  const preview=await consolidateDecks(db,databaseId,teacherId,unit,false);
  console.log(JSON.stringify({course,...preview}));
  const result=await consolidateDecks(db,databaseId,teacherId,unit,true);
  console.log(JSON.stringify({course,...result}));
}
const updated=[];
for(let start=0;start<backup.cards.length;start+=100)updated.push(...await listAll(db,databaseId,'flashcard_cards',[Query.equal('$id',backup.cards.slice(start,start+100).map(card=>card.$id))]));
if(updated.length!==backup.cards.length)throw new Error('Card ID preservation verification failed');
for(const [collection,history] of Object.entries(backup.history)) {
  for(let start=0;start<history.length;start+=100) {
    const batch=history.slice(start,start+100);
    const current=await listAll(db,databaseId,collection,[Query.equal('$id',batch.map(row=>row.$id))]);
    if(current.length!==batch.length)throw new Error(`${collection}: missing history records`);
    for(const row of current) {
      const before=batch.find(item=>item.$id===row.$id);
      for(const key of Object.keys(before).filter(key=>!key.startsWith('$')&&key!=='deckId'))if(JSON.stringify(before[key])!==JSON.stringify(row[key]))throw new Error(`${collection}: ${key} changed unexpectedly`);
    }
  }
}
console.log(JSON.stringify({verifiedCards:updated.length,verifiedHistory:Object.fromEntries(Object.entries(backup.history).map(([key,rows])=>[key,rows.length])),backupPath}));
