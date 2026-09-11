import { test } from 'vitest';
import assert from 'node:assert/strict';
import { handleTqe, tqeComplete } from './tqe.js';

test('scheduled readings block student TQE access but remain available to their teacher',async()=>{
  for(const role of ['student','teacher']){
    const {call,storage}=harness({role,userId:role==='teacher'?'t':'s'});
    storage.text_assignments[0].dueDate='2099-09-14';
    assert.equal((await call({action:'readTqe'})).status,role==='teacher'?200:403);
  }
});

const annotation = (id,type,authorId='s') => ({$id:id,textId:'text',classId:'class',authorId,tqeType:type,kind:'annotation',visibility:'class',moderationStatus:'visible',content:'A reading observation'});
test('Thought-only stage unlocks with one Thought and preserves full-stage requirements',()=>{
  const thought=annotation('a','thought');
  assert.equal(tqeComplete([thought],'thought'),true);
  assert.equal(tqeComplete([thought],'full'),false);
  assert.equal(tqeComplete([annotation('q','question')],'thought'),false);
  assert.equal(tqeComplete([{...thought,visibility:'private'}],'thought'),false);
});
test('unlock needs all three types and excludes private, hidden, replies and untyped legacy notes',()=>{
  const rows=['thought','question','epiphany'].map((type,i)=>annotation(String(i),type));
  assert.equal(tqeComplete(rows),true);
  assert.equal(tqeComplete([rows[0],rows[0],rows[0]]),false);
  for(const patch of [{visibility:'private'},{moderationStatus:'hidden'},{kind:'reply'},{tqeType:undefined},{content:' '}])assert.equal(tqeComplete([rows[0],rows[1],{...rows[2],...patch}]),false);
});
function harness({role='student',userId='s',rows=[],records=[]}={}) {
  const storage={texts:[{$id:'text',teacherId:'t',status:'published'}],classes:[{$id:'class',teacherId:'t'}],class_members:[{userId:'s',classId:'class',role:'student'},{userId:'p',classId:'class',role:'student'}],text_assignments:[{textId:'text',classId:'class'}],text_annotations:rows,tqe_records:records,users:[{$id:'s',name:'Student'},{$id:'p',name:'Peer'}]};
  const Query={equal:(key,value)=>({key,value}),limit:()=>null,cursorAfter:()=>null};
  const db={getDocument:async(_,collection,id)=>{const row=storage[collection]?.find(r=>r.$id===id);if(!row)throw Error('Missing document');return row;},listDocuments:async(_,collection,queries)=>{const documents=(storage[collection]||[]).filter(row=>queries.filter(Boolean).every(q=>row[q.key]===q.value));return {documents,total:documents.length};},createDocument:async(_,collection,id,data)=>{if(storage[collection].some(r=>r.$id===id))throw Object.assign(Error('Conflict'),{code:409});storage[collection].push({$id:id,...data});},updateDocument:async(_,collection,id,data)=>Object.assign(storage[collection].find(r=>r.$id===id),data),deleteDocument:async(_,collection,id)=>{storage[collection]=storage[collection].filter(r=>r.$id!==id);}};
  const call=body=>handleTqe({body:{textId:'text',classId:'class',...body},db,databaseId:'db',Query,userId,profile:{role},res:{json:(body,status=200)=>({body,status})}});
  return {call,storage};
}
test('students cannot table, nudge, or log participation',async()=>{const {call}=harness();for(const kind of ['table','nudge','participation'])assert.equal((await call({action:'saveTqe',kind})).status,403);});
test('one Bring it document is replaced rather than duplicated',async()=>{const {call,storage}=harness({rows:[annotation('a','thought'),annotation('b','question')]});for(const annotationId of ['a','b'])assert.equal((await call({action:'saveTqe',kind:'bring',annotationId})).status,200);assert.equal(storage.tqe_records.length,1);assert.equal(JSON.parse(storage.tqe_records[0].payloadJson).annotationId,'b');});
test('cannot nominate a peer’s note or enter an unrelated class',async()=>{assert.equal((await harness({rows:[annotation('a','thought','p')]}).call({action:'saveTqe',kind:'bring',annotationId:'a'})).status,403);assert.equal((await harness({userId:'outsider'}).call({action:'readTqe'})).status,403);});
test('private nudges never reach classmates and board stays gated',async()=>{const records=[{$id:'n',textId:'text',classId:'class',kind:'nudge',ownerId:'t',payloadJson:JSON.stringify({studentId:'p',content:'Private'})},{$id:'b',textId:'text',classId:'class',kind:'table',ownerId:'t',payloadJson:JSON.stringify({annotationId:'a',content:'Board'})}];const {call}=harness({rows:[annotation('a','thought','p')],records});assert.deepEqual((await call({action:'readTqe'})).body.records,[]);});
test('group submissions require membership, completed preparation, and unique ranked choices',async()=>{
  const rows=['thought','question','epiphany'].map((type,i)=>annotation(String(i),type));
  const records=[{$id:'g',textId:'text',classId:'class',kind:'group',ownerId:'t',payloadJson:JSON.stringify({groupId:'one',label:'One',memberIds:['s'],selections:[]})}];
  const {call}=harness({rows,records});
  assert.equal((await call({action:'saveTqe',kind:'group',groupId:'one',selections:['0','1']})).status,200);
  assert.equal((await call({action:'saveTqe',kind:'group',groupId:'one',selections:['0','0']})).status,400);
  assert.equal((await harness({userId:'p',rows,records}).call({action:'saveTqe',kind:'group',groupId:'one',selections:['0']})).status,403);
  assert.equal((await harness({rows:rows.slice(0,2),records}).call({action:'saveTqe',kind:'group',groupId:'one',selections:['0']})).status,403);
});
