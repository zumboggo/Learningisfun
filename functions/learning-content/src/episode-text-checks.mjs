import {test,beforeEach,afterEach,mock} from 'node:test';
import assert from 'node:assert/strict';
import {episodeTextAction} from './episode-text.js';
import {AP_CLASS_ID} from './episode-catalog.js';
beforeEach(()=>mock.method(Date,'now',()=>Date.parse('2026-10-14T00:00:00Z')));
afterEach(()=>mock.restoreAll());
function fixture(){
 const records=[];
 const db={getDocument:async()=>({teacherId:'teacher'}),listDocuments:async()=>({documents:records.slice(-1)}),createDocument:async(database,collection,id,data,permissions)=>{assert.deepEqual(permissions,[]);if(records.some(r=>r.$id===id))throw Object.assign(new Error('Conflict'),{code:409});records.push({$id:id,...data});}};
 const base={db,databaseId:'main',userId:'teacher',profile:{role:'teacher'},memberClassIds:new Set(),body:{action:'readEpisodeText',classId:AP_CLASS_ID,episode:'own-english',version:4}};
 const call=(body={},identity={})=>episodeTextAction({...base,...identity,body:{...base.body,...body}});
 const edit={action:'saveEpisodeText',revision:0,key:'abcdef0123456789',original:'Hello',text:'Welcome'};
 return {call,edit,records};
}
test('teacher saves shared text and can restore originals, while revisions preserve history',async()=>{
 const {call,edit,records}=fixture();assert.deepEqual(await call(),{revision:0,patches:{}});
 const first=await call(edit);assert.equal(first.revision,1);assert.equal(first.patches[edit.key].text,'Welcome');
 const read=await call({}, {userId:'student',profile:{role:'student'},memberClassIds:new Set([AP_CLASS_ID])});assert.deepEqual(read,first);
 const restored=await call({...edit,revision:1,text:'Hello'});assert.deepEqual(restored,{revision:2,patches:{}});assert.equal(records.length,2);
});
test('students, nonowners, parents and expired nonmembers cannot save',async()=>{
 for(const role of ['student','teacher','parent','admin']){const {call,edit,records}=fixture();await assert.rejects(call(edit,{userId:'other',profile:{role},memberClassIds:new Set([AP_CLASS_ID])}),{code:403});assert.equal(records.length,0);}
 const {call}=fixture();await assert.rejects(call({}, {userId:'student',profile:{role:'student'}}),{code:403});
});
test('rejects unknown episodes, stale saves, oversized text and concurrent writes',async()=>{
 const {call,edit}=fixture();await assert.rejects(call({...edit,episode:'unknown'}),{code:403});
 await assert.rejects(call({...edit,text:'x'.repeat(8001)}),{code:400});
 const results=await Promise.allSettled([call(edit),call({...edit,text:'Another edit'})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,409);
 await assert.rejects(call({...edit,text:'Stale'}),{code:409});
});
