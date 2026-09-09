import { Query } from 'node-appwrite';
import { createHash } from 'node:crypto';

const id = (...parts) => `pl_${createHash('sha256').update(parts.join(':')).digest('hex').slice(0,30)}`;
export const slotAgenda = lesson => `### ${lesson.date}\n${lesson.slots.filter(slot=>!slot.optional && slot.publish !== false).map(slot=>`- **${slot.title}:** ${slot.content||''}${/^https?:\/\//.test(slot.url||'')?` [Open](${slot.url})`:''}`).join('\n')}${lesson.reminders?.length?`\n- **Remember:** ${lesson.reminders.join(' · ')}`:''}`;
export function fridayRelease(week) {
  const date = new Date(`${week}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay()+6)%7) - 3);
  return `${date.toISOString().slice(0,10)}T09:00:00.000Z`;
}
export async function listAll(db, databaseId, collection, filters=[]) {
  const rows=[]; let cursor;
  do {
    const page=await db.listDocuments(databaseId,collection,[...filters,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);
    rows.push(...page.documents); if(page.documents.length<100) break; cursor=page.documents.at(-1).$id;
  } while(cursor);
  return rows;
}
async function put(db,databaseId,collection,key,data) {
  const update={...data};delete update.createdAt;
  try { return await db.updateDocument(databaseId,collection,key,update); }
  catch(error) { if(error.code!==404)throw error; }
  try { return await db.createDocument(databaseId,collection,key,data,[]); }
  catch(error) { if(error.code!==409)throw error; return db.updateDocument(databaseId,collection,key,update); }
}
export function validateUnit(unit) {
  if(!unit || !['WL','AP','ETH'].includes(unit.course) || typeof unit.id!=='string' || !/^[a-zA-Z0-9_-]{1,36}$/.test(unit.id))throw new Error('Invalid unit');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(unit.startDate)||!Array.isArray(unit.classIds)||!Array.isArray(unit.cards)||!Array.isArray(unit.resources))throw new Error('Unit requires a start date, class mapping and resource lists');
  if(unit.cards.length>2000||unit.resources.length>1000||JSON.stringify(unit).length>900000)throw new Error('Unit is too large');
  for(const card of unit.cards) {
    if(!card.id||!card.front?.trim()||!card.back?.trim()||!['CORE','REFERENCE','SUPPORTING'].includes(card.tier))throw new Error('Invalid vocabulary card');
    if(card.tier!=='REFERENCE' && (!/^\d{4}-\d{2}-\d{2}$/.test(card.week)||!Number.isFinite(Date.parse(card.week))))throw new Error('Vocabulary requires a valid week');
  }
  for(const resource of unit.resources) {
    if(!resource.id||!resource.title?.trim()||!['text','presentation','activity','copywork','quiz','assignment'].includes(resource.kind))throw new Error('Resource needs a title and type');
    if(resource.url && !/^https?:\/\//i.test(resource.url))throw new Error('Links must start with https:// or http://');
    if(resource.kind==='copywork'&&resource.approved&&(!resource.week||!resource.date||(!resource.url&&!resource.content?.trim())))throw new Error('Approved copywork needs a week, due date and passage or link');
  }
}
export async function planningAction({body, profile, userId, memberClassIds, db, databaseId}) {
  if(body.action==='readPlanningUnits') {
    if(profile.role!=='teacher')throw new Error('Teacher role required');
    return {units:await listAll(db,databaseId,'planning_units',[Query.equal('teacherId',userId)]),releases:await listAll(db,databaseId,'planning_releases',[Query.equal('teacherId',userId)])};
  }
  if(body.action==='savePlanningUnit') {
    if(profile.role!=='teacher')throw new Error('Teacher role required');
    validateUnit(body.unit);
    const unit=body.unit;
    for(const classId of unit.classIds) { const cls=await db.getDocument(databaseId,'classes',classId); if(cls.teacherId!==userId)throw new Error('Not your class'); }
    try { const prior=await db.getDocument(databaseId,'planning_units',unit.id); if(prior.teacherId!==userId)throw new Error('Not your unit'); }
    catch(error) { if(error.code!==404)throw error; }
    const saved=await put(db,databaseId,'planning_units',unit.id,{teacherId:userId,dataJson:JSON.stringify(unit),updatedAt:new Date().toISOString()});
    // Jobs are independent of weekly-plan readiness and retry safely after partial failure.
    await scheduleUnit(db,databaseId,userId,unit);
    return {unit:saved};
  }
  if(body.action==='consolidatePlanningDecks') {
    if(profile.role!=='teacher')throw new Error('Teacher role required');
    const record=await db.getDocument(databaseId,'planning_units',body.unitId);
    if(record.teacherId!==userId)throw new Error('Not your unit');
    return consolidateDecks(db,databaseId,userId,JSON.parse(record.dataJson),body.apply===true);
  }
  if(body.action==='readPlanningMaterials') {
    const classes=profile.role==='teacher'?(await listAll(db,databaseId,'classes',[Query.equal('teacherId',userId)])).map(row=>row.$id):[...memberClassIds];
    if(body.classId&&!classes.includes(body.classId))throw new Error('Not your class');
    const allowed=body.classId?[body.classId]:classes;
    if(!allowed.length)return {copywork:[],decks:[],cards:[],assignments:[]};
    const now=new Date().toISOString();
    const materials=await listAll(db,databaseId,'planning_materials',[Query.equal('classId',allowed),Query.lessThanEqual('releaseAt',now)]);
    const deckIds=[...new Set(materials.filter(row=>row.kind==='deck').map(row=>JSON.parse(row.dataJson).deckId))];
    const decks=deckIds.length?await listAll(db,databaseId,'flashcard_decks',[Query.equal('$id',deckIds)]):[];
    const cards=deckIds.length?await listAll(db,databaseId,'flashcard_cards',[Query.equal('deckId',deckIds)]):[];
    const assignments=deckIds.length?await listAll(db,databaseId,'deck_assignments',[Query.equal('deckId',deckIds),Query.equal('classId',allowed)]):[];
    return {copywork:materials.filter(row=>row.kind==='copywork').map(row=>({id:row.$id,classId:row.classId,...JSON.parse(row.dataJson)})),decks,cards,assignments};
  }
  return null;
}
async function scheduleUnit(db,databaseId,teacherId,unit) {
  const wanted=new Set();
  const previous=await listAll(db,databaseId,'planning_releases',[Query.equal('unitId',unit.id)]);
  const priorById=new Map(previous.map(job=>[job.$id,job]));
  const groups=new Map();
  if(unit.vocabularyApproved) for(const card of unit.cards) {
    const releaseAt=card.tier==='REFERENCE'?`${unit.startDate}T00:00:00+08:00`:fridayRelease(card.week);
    const key=`${card.tier==='REFERENCE'?'reference':'core'}:${new Date(releaseAt).toISOString()}`;
    if(!groups.has(key))groups.set(key,{kind:card.tier==='REFERENCE'?'reference':'core',releaseAt:new Date(releaseAt).toISOString(),cards:[]});
    groups.get(key).cards.push(card);
  }
  for(const group of groups.values()) {
    const key=id(unit.id,group.kind,group.releaseAt); wanted.add(key);
    const payloadJson=JSON.stringify({course:unit.course,classIds:unit.classIds,...group});
    if(priorById.get(key)?.payloadJson!==payloadJson)await put(db,databaseId,'planning_releases',key,{teacherId,unitId:unit.id,releaseAt:group.releaseAt,status:'pending',payloadJson,lastError:''});
  }
  for(const resource of unit.resources.filter(row=>row.kind==='copywork'&&row.approved)) {
    const key=id(unit.id,resource.id);wanted.add(key);
    const previousPayload=priorById.get(key)?.payloadJson;
    if(previousPayload===JSON.stringify({kind:'copywork',classIds:unit.classIds,resource})&&priorById.get(key)?.status!=='failed')continue;
    await put(db,databaseId,'planning_releases',key,{teacherId,unitId:unit.id,releaseAt:fridayRelease(resource.week),status:'pending',payloadJson:JSON.stringify({kind:'copywork',classIds:unit.classIds,resource}),lastError:''});
    // A teacher approving an overdue passage should see the link immediately.
    if(fridayRelease(resource.week)<=new Date().toISOString()&&unit.classIds.length) {
      for(const classId of unit.classIds) {
        const cls=await db.getDocument(databaseId,'classes',classId);
        await put(db,databaseId,'planning_materials',id(key,classId),{teacherId,classId,kind:'copywork',releaseAt:fridayRelease(resource.week),dataJson:JSON.stringify({...resource,className:`${cls.courseName} · ${cls.name}`,releaseAt:fridayRelease(resource.week)})});
      }
      await db.updateDocument(databaseId,'planning_releases',key,{status:'done',lastError:''});
    }
  }
  for(const job of previous)if(!wanted.has(job.$id)&&job.status!=='done')await db.deleteDocument(databaseId,'planning_releases',job.$id);
}
export async function releaseDue(db,databaseId,now=new Date().toISOString()) {
  const jobs=await listAll(db,databaseId,'planning_releases',[Query.equal('status',['pending','failed']),Query.lessThanEqual('releaseAt',now)]);
  let completed=0;
  for(const job of jobs) {
    try {
      const payload=JSON.parse(job.payloadJson);
      const classes=[];
      for(const classId of payload.classIds) { const cls=await db.getDocument(databaseId,'classes',classId);if(cls.teacherId!==job.teacherId)throw new Error('Class ownership changed'); classes.push(cls); }
      if(!classes.length)throw new Error('Map this unit to a class before releasing');
      if(payload.kind==='copywork') {
        for(const cls of classes)await put(db,databaseId,'planning_materials',id(job.$id,cls.$id),{teacherId:job.teacherId,classId:cls.$id,kind:'copywork',releaseAt:job.releaseAt,dataJson:JSON.stringify({...payload.resource,className:`${cls.courseName} · ${cls.name}`,releaseAt:job.releaseAt})});
      } else {
        const year=classes[0].schoolYear;
        const deckId=id(job.teacherId,payload.course,year,payload.kind);
        await put(db,databaseId,'flashcard_decks',deckId,{creatorId:job.teacherId,title:`${payload.course} · ${payload.kind==='core'?'Core':'Reference'} Vocabulary`,description:'Cumulative vocabulary released from Planning',type:'teacher',status:'published',createdAt:now,updatedAt:now});
        for(const cls of classes) {
          await put(db,databaseId,'deck_assignments',id(deckId,cls.$id),{deckId,classId:cls.$id,isRequired:payload.kind==='core',dailyTarget:6,assignedAt:job.releaseAt});
          await put(db,databaseId,'planning_materials',id(deckId,cls.$id,'material'),{teacherId:job.teacherId,classId:cls.$id,kind:'deck',releaseAt:job.releaseAt,dataJson:JSON.stringify({deckId})});
        }
        const existing=await listAll(db,databaseId,'flashcard_cards',[Query.equal('deckId',deckId)]);
        for(const card of payload.cards) {
          // Stable source IDs make retries and re-imports preserve FSRS history.
          const sourceTag=`source:${id(card.id)}`;
          const prior=existing.find(item=>(item.tags||[]).includes(sourceTag));
          const exact=existing.filter(item=>item.front===card.front&&item.back===card.back);
          const key=prior?.$id||(exact.length===1?exact[0].$id:id(deckId,card.id));
          await put(db,databaseId,'flashcard_cards',key,{deckId,front:card.front,back:card.back,frontMarkdown:card.front,backMarkdown:card.back,hint:'',tags:[...card.tags,`week:${card.week||'reference'}`,sourceTag],sortOrder:card.week?Number(card.week.replace(/-/g,'')):0,createdAt:now});
        }
      }
      await db.updateDocument(databaseId,'planning_releases',job.$id,{status:'done',lastError:''});completed++;
    } catch(error) { await db.updateDocument(databaseId,'planning_releases',job.$id,{status:'failed',lastError:String(error.message).slice(0,2000)}); }
  }
  return {completed,total:jobs.length};
}

/** Preview first; preserve card and review IDs when combining eligible legacy decks. */
export async function consolidateDecks(db,databaseId,teacherId,unit,apply) {
  if(!unit.classIds.length)throw new Error('Map classes and save the unit first');
  const classes=[];
  for(const classId of unit.classIds){const cls=await db.getDocument(databaseId,'classes',classId);if(cls.teacherId!==teacherId)throw new Error('Not your class');classes.push(cls);}
  const targetIds={core:id(teacherId,unit.course,classes[0].schoolYear,'core'),reference:id(teacherId,unit.course,classes[0].schoolYear,'reference')};
  const units=(await listAll(db,databaseId,'planning_units',[Query.equal('teacherId',teacherId)])).map(row=>JSON.parse(row.dataJson)).filter(row=>row.course===unit.course&&row.classIds.some(classId=>unit.classIds.includes(classId)));
  const core=units.flatMap(row=>row.cards).filter(card=>card.tier!=='REFERENCE');
  const reference=units.flatMap(row=>row.cards).filter(card=>card.tier==='REFERENCE');
  const assignments=await listAll(db,databaseId,'deck_assignments',[Query.equal('classId',unit.classIds)]);
  const decks=[],skipped=[],moves=[];
  for(const deckId of [...new Set(assignments.map(row=>row.deckId))]) {
    if(Object.values(targetIds).includes(deckId))continue;
    const deck=await db.getDocument(databaseId,'flashcard_decks',deckId);
    const sharing=await listAll(db,databaseId,'deck_assignments',[Query.equal('deckId',deckId)]);
    if(deck.creatorId!==teacherId||sharing.some(row=>!unit.classIds.includes(row.classId))){skipped.push(deck.title);continue;}
    decks.push(deck);
    for(const card of await listAll(db,databaseId,'flashcard_cards',[Query.equal('deckId',deckId)])) {
      const matches=core.filter(item=>item.front.trim().toLowerCase()===card.front.trim().toLowerCase());
      const referenceMatches=reference.filter(item=>item.front.trim().toLowerCase()===card.front.trim().toLowerCase());
      const isReference=!matches.length&&(referenceMatches.length>0||(card.tags||[]).some(tag=>['NAME','REFERENCE'].includes(tag.toUpperCase())));
      const source=isReference?referenceMatches:matches;
      moves.push({card,target:isReference?'reference':'core',source:source.length===1?source[0]:null});
    }
  }
  const summary={decks:decks.map(deck=>deck.title),core:moves.filter(move=>move.target==='core').length,reference:moves.filter(move=>move.target==='reference').length,skipped,applied:apply};
  if(!apply)return summary;
  const now=new Date().toISOString();
  for(const [kind,deckId] of Object.entries(targetIds)) {
    await put(db,databaseId,'flashcard_decks',deckId,{creatorId:teacherId,title:`${unit.course} · ${kind==='core'?'Core':'Reference'} Vocabulary`,description:'Cumulative vocabulary released from Planning',type:'teacher',status:'published',createdAt:now,updatedAt:now});
    for(const cls of classes) {
      await put(db,databaseId,'deck_assignments',id(deckId,cls.$id),{deckId,classId:cls.$id,isRequired:kind==='core',dailyTarget:6,assignedAt:now});
      await put(db,databaseId,'planning_materials',id(deckId,cls.$id,'material'),{teacherId,classId:cls.$id,kind:'deck',releaseAt:now,dataJson:JSON.stringify({deckId})});
    }
  }
  // Limit concurrency while avoiding a network round trip for every historical
  // review in sequence. A card is moved only after its history updates finish.
  const pendingMoves=[...moves];
  await Promise.all(Array.from({length:Math.min(8,moves.length)},async()=>{
  while(pendingMoves.length) {
    const move=pendingMoves.shift();
    const deckId=targetIds[move.target];
    // Update progress before the card so an interrupted run can retry the same legacy card.
    for(const collection of ['student_card_state','card_reviews','flashcard_review_events']) {
      const records=await listAll(db,databaseId,collection,[Query.equal('cardId',move.card.$id)]);
      for(let start=0;start<records.length;start+=4)await Promise.all(records.slice(start,start+4).filter(record=>record.deckId!==deckId).map(record=>db.updateDocument(databaseId,collection,record.$id,{deckId})));
    }
    const tags=[...(move.card.tags||[])];
    if(move.source)tags.push(`source:${id(move.source.id)}`,`week:${move.source.week}`);
    await db.updateDocument(databaseId,'flashcard_cards',move.card.$id,{deckId,tags:[...new Set(tags)]});
  }
  }));
  for(const deck of decks) {
    for(const assignment of assignments.filter(row=>row.deckId===deck.$id))await db.deleteDocument(databaseId,'deck_assignments',assignment.$id);
    await db.updateDocument(databaseId,'flashcard_decks',deck.$id,{status:'archived',updatedAt:now});
  }
  return summary;
}
