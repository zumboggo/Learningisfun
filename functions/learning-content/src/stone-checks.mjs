import test from 'node:test';
import assert from 'node:assert/strict';
import {RULES,STONE_CLASS_ID,replay,assess,available} from './stone-engine.js';
import {stoneAction,latestAttempts} from './stone.js';
const cooperative=['listen','needs','paid','bargain','investigate','balance','preserve','delegate','publish','council'];
const proportionate=['ledger','equal','shared','levy','investigate','balance','ration','delegate','credit','successor'];
const elite=['command','reserve','forced','debt','punish','obedience','consume','elite','monument','secrecy'];
const generous=['listen','feast','shared','refuse','mercy','kindness','consume','alone','credit','successor'];
test('different sustainable paths outrank favoritism and exhausted generosity',()=>{
 const results=[cooperative,proportionate,elite,generous].map(assess);
 assert.ok(results[0].total>results[2].total&&results[1].total>results[2].total);
 assert.ok(results[0].total>results[3].total&&results[1].total>results[3].total);
 assert.equal(results[0].scores.understanding,25);assert.equal(results[0].complete,true);
 assert.ok(results[2].state.influential>results[0].state.influential);
 assert.ok(results[3].state.seed<10);assert.ok(results[3].state.self<45);
});
test('resources cannot become negative and illegal sequences are rejected',()=>{
 assert.throws(()=>replay(['__proto__']));assert.throws(()=>replay(['listen','council']));
 assert.throws(()=>replay(Array(11).fill('listen')));assert.equal(available(['listen','feast','paid','refuse','mercy','balance','preserve','delegate'],'monument'),true);
 const poor=['listen','feast','paid','refuse','mercy','balance','preserve','delegate','monument'];
 assert.equal(available(poor,'empty'),false);
});
test('every legal branch reaches an ending with bounded scores',()=>{
 let count=0;const endings=new Set();
 function walk(choices){if(choices.length===10){const a=assess(choices);assert.ok(a.total>=0&&a.total<=100);for(const n of Object.values(a.scores))assert.ok(n>=0&&n<=25);assert.ok(a.state.grain>=0);endings.add(a.ending);count++;return;}
 for(const choice of Object.keys(RULES[choices.length]))if(available(choices,choice))walk([...choices,choice]);}
 walk([]);assert.ok(count>10000);assert.equal(endings.size,4);
});
function fixture(){
 const docs=new Map();const db={
  async getDocument(database,collection,id){if(collection==='classes')return {teacherId:'teacher'};if(collection==='users')return {role:'student',name:'Approved learner',nicknameModerationStatus:'visible'};if(!docs.has(id))throw {code:404};return docs.get(id);},
  async createDocument(database,collection,id,data){if(docs.has(id))throw {code:409};const row={$id:id,$createdAt:new Date().toISOString(),...data};docs.set(id,row);return row;},
  async listDocuments(database,collection){return {documents:collection==='class_members'?[{userId:'student'}]:[...docs.values()]};}
 };
 const ctx={db,databaseId:'main',userId:'student',profile:{role:'student'},memberClassIds:new Set([STONE_CLASS_ID])};
 const save=(choices,extra={})=>stoneAction({...ctx,...extra,body:{action:'saveStone',classId:STONE_CLASS_ID,attempt:{attemptId:'00000000-0000-4000-8000-000000000001',episode:'grain-we-keep',version:1,revision:choices.length,choices,total:9999}}});
 return {docs,ctx,save};
}
test('server ignores forged scores and retries cannot duplicate or erase an attempt',async()=>{
 const {docs,ctx,save}=fixture();await save(cooperative);await save(cooperative);await save(cooperative.slice(0,2));assert.equal(docs.size,11);
 const result=await stoneAction({...ctx,body:{action:'readStone',classId:STONE_CLASS_ID}});assert.equal(result.attempts.length,1);assert.equal(result.leaderboard[0].score,assess(cooperative).total);assert.notEqual(result.leaderboard[0].score,9999);
 assert.equal(latestAttempts([...docs.values()])[0].choices.length,10);
});
test('divergent saves conflict even when their revisions differ',async()=>{
 const {save}=fixture();await save(['listen','needs']);await assert.rejects(()=>save(['ledger','equal','shared']),/another device/);
});
test('teacher preview creates no ranked records; other roles/classes are denied',async()=>{
 const {docs,ctx,save}=fixture();await save(cooperative,{userId:'teacher',profile:{role:'teacher'}});assert.equal(docs.size,0);
 await assert.rejects(()=>stoneAction({...ctx,body:{action:'readStone',classId:'different'}}),/only in Ethics/);
 await assert.rejects(()=>stoneAction({...ctx,memberClassIds:new Set(),body:{action:'readStone',classId:STONE_CLASS_ID}}),/membership/);
 await assert.rejects(()=>stoneAction({...ctx,profile:{role:'parent'},body:{action:'readStone',classId:STONE_CLASS_ID}}),/membership/);
});
