import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rhetoricalSituationAction} from './rhetorical-situation.js';
import {rhetoricalFields,isApLanguageCourse} from './rhetorical-fields.js';
function fixture(){
 const docs=new Map();const cls={$id:'c',teacherId:'teacher',courseName:'AP Language',status:'active'},text={$id:'t',status:'published'};
 const assignment={isAssignedReading:true,dueDate:'2020-01-01'};
 const db={getDocument:async(d,c,id)=>{if(c==='classes')return cls;if(c==='texts')return text;if(!docs.has(id))throw {code:404};return docs.get(id);},listDocuments:async()=>({documents:[assignment]}),createDocument:async(d,c,id,data,permissions)=>{assert.deepEqual(permissions,[]);docs.set(id,data);},updateDocument:async(d,c,id,data)=>docs.set(id,data)};
 const args={body:{action:'readRhetoricalSituation',textId:'t',classId:'c'},profile:{role:'student'},userId:'s',memberClassIds:new Set(['c']),db,databaseId:'main'};
 return {args,docs,cls,text,assignment};
}
const responses=Object.fromEntries(rhetoricalFields.map(k=>[k,`My ${k} evidence`]));
test('persists partial practice, reuses a record, and isolates users despite spoofed owner',async()=>{
 const {args,docs}=fixture();assert.equal((await rhetoricalSituationAction(args)).responses.writer,'');
 await rhetoricalSituationAction({...args,body:{...args.body,action:'saveRhetoricalSituation',responses,userId:'victim'}});
 assert.deepEqual((await rhetoricalSituationAction(args)).responses,responses);
 assert.equal((await rhetoricalSituationAction({...args,userId:'other'})).responses.writer,'');
 await rhetoricalSituationAction({...args,body:{...args.body,action:'saveRhetoricalSituation',responses:{...responses,writer:''}}});assert.equal(docs.size,1);
});
test('requires AP membership, active assignment, release, and publication for both read and write',async()=>{
 for(const action of ['readRhetoricalSituation','saveRhetoricalSituation'])for(const change of [f=>f.args.memberClassIds.clear(),f=>f.cls.courseName='World Literature',f=>f.cls.status='archived',f=>f.assignment.isAssignedReading=false,f=>f.assignment.dueDate='2099-01-01',f=>f.text.status='draft',f=>f.args.profile.role='parent']){
  const f=fixture();change(f);await assert.rejects(()=>rhetoricalSituationAction({...f.args,body:{...f.args.body,action,responses}}),e=>e.code===403);assert.equal(f.docs.size,0);
 }
});
test('validates each response without silently truncating student work',async()=>{
 const {args}=fixture();for(const bad of [{}, {...responses,writer:42},{...responses,context:'x'.repeat(3001)}])await assert.rejects(()=>rhetoricalSituationAction({...args,body:{...args.body,action:'saveRhetoricalSituation',responses:bad}}),e=>e.code===400);
});
test('recognises AP Language names without enabling AP Literature',()=>{
 for(const name of ['AP Language','AP Lang','AP English Language and Composition'])assert.ok(isApLanguageCourse(name));
 assert.ok(isApLanguageCourse('AP English','88421c66-9cda-4002-8e15-086312b7805e'));
 for(const name of ['AP English','World Literature','AP English Literature','Ethics'])assert.equal(isApLanguageCourse(name),false);
});
