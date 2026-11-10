import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessonAction} from './lessons.js';
const [lesson]=JSON.parse(readFileSync(new URL('./lesson-catalog.json',import.meta.url)));
const classId=lesson.classIds[0];
function fixture(selectedClassId=classId){
 const classId=selectedClassId;
 const rows=new Map();const db={createTransaction:async()=>({$id:'tx'}),updateTransaction:async()=>{},getDocument:async(_,c,id)=>{const row=rows.get(c+id);if(!row)throw Object.assign(Error(),{code:404});return structuredClone(row);},createDocument:async(_,c,id,row)=>rows.set(c+id,{$id:id,...row}),updateDocument:async(_,c,id,row)=>rows.set(c+id,{$id:id,...rows.get(c+id),...row}),listDocuments:async()=>({documents:[{userId:'learner'}]})};
 rows.set('classes'+classId,{$id:classId,status:'active',teacherId:'teacher',name:'World Lit'});let revision=0;
 async function invoke(action,extra={},identity={}){const r=await lessonAction({db,databaseId:'main',profile:{role:'student'},userId:'learner',memberClassIds:new Set([classId]),body:{action,classId,lessonId:lesson.id,revision,...extra},...identity});if(r.revision!==undefined)revision=r.revision;return r;}
 return invoke;
}
test('class access and answer gate cannot be bypassed',async()=>{const act=fixture();assert.equal((await act('lessonLibrary',{}, {memberClassIds:new Set()})).items.length,0);await assert.rejects(act('lessonRead',{}, {memberClassIds:new Set()}),/unavailable/);await assert.rejects(act('lessonRoster'),/teacher/);await assert.rejects(act('lessonSubmit',{draft:'skip practice'}),/Finish practice/);});
test('practice help, independent and revised outcomes, outage, and teacher override',async t=>{
 const act=fixture();const q=lesson.stages.flatMap(s=>s.questions);
 let r=await act('lessonAnswer',{answer:'wrong'});assert.equal(r.state.step,0);r=await act('lessonAnswer',{answer:'wrong'});assert.equal(r.lesson.stages[0].questions[0].prompt,q[0].alternate.prompt);
 r=await act('lessonAnswer',{answer:q[0].alternate.answers[0]});assert.equal(r.state.step,1);
 for(const item of q.slice(1))await act('lessonAnswer',{answer:item.answers[0]});
 const key=process.env.OPENROUTER_API_KEY;process.env.OPENROUTER_API_KEY='fixture';t.after(()=>{if(key===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=key;});
 let pass=true,online=false;
 t.mock.method(globalThis,'fetch',async()=>({ok:online,json:async()=>({usage:{cost:0},choices:[{message:{content:JSON.stringify({criteria:lesson.final.rubric.map(()=>pass),feedback:'Specific next step.'})}}]})}));
 r=await act('lessonSubmit',{draft:'Original entry'});assert.equal(r.state.outcome,'Completed');assert.equal(r.state.draft,'Original entry');
 online=true;r=await act('lessonSubmit',{draft:'Original entry'});assert.equal(r.state.outcome,'Demonstrated independently');
 pass=false;r=await act('lessonSubmit',{draft:'Another entry'});assert.equal(r.state.outcome,'Needs another attempt');
 pass=true;r=await act('lessonSubmit',{draft:'Revised entry'});assert.equal(r.state.outcome,'Demonstrated with support');
 const teacher={userId:'teacher',profile:{role:'teacher'}};const {rows}=await act('lessonRoster',{},teacher);assert.equal(rows[0].state.submissions.length,3);
 await act('lessonReview',{studentId:'learner',outcome:'Completed',revision:rows[0].revision},teacher);
 assert.equal((await act('lessonRead')).state.outcome,'Completed');
});
test('both differently ordered source types must be assembled before independent work',async()=>{
 const act=fixture();for(const q of lesson.stages[0].questions)await act('lessonAnswer',{answer:q.answers[0]});
 for(const q of lesson.stages[1].questions){
 const before=await act('lessonRead');assert.ok(before.lesson.stages[1].questions.every(x=>x.pieces?.length===5&&!x.answers));
 const wrong=await act('lessonAnswer',{answer:q.pieces.join(' ')});assert.equal(wrong.state.step,before.state.step);assert.equal(wrong.state.notice,q.hint);
 const good=await act('lessonAnswer',{answer:q.answers[0]});assert.equal(good.state.step,before.state.step+1);}
 await assert.rejects(act('lessonSubmit',{draft:'unfinished'}),/Finish practice/);
});
test('nested quotes can be previewed by the teacher, then open at Shanghai midnight',async t=>{
 const act=fixture(),lessonId='nested-quotes-evidence-v3',release=Date.parse('2026-11-09T00:00:00+08:00');
 const now=t.mock.method(Date,'now',()=>release-1);
 assert.ok(!(await act('lessonLibrary')).items.some(l=>l.id===lessonId));
 await assert.rejects(act('lessonRead',{lessonId}),/unavailable/);
 assert.equal((await act('lessonRead',{lessonId},{profile:{role:'teacher'},userId:'teacher'})).lesson.id,lessonId);
 now.mock.mockImplementation(()=>release);
 assert.ok((await act('lessonLibrary')).items.some(l=>l.id===lessonId));
 const read=await act('lessonRead',{lessonId});assert.equal(read.lesson.final.rubric.length,4);
 await assert.rejects(act('lessonRead',{lessonId},{memberClassIds:new Set()}),/unavailable/);
});
test('the argument assignment names only AP Lang and its due date follows release',()=>{
 const catalog=JSON.parse(readFileSync(new URL('./lesson-catalog.json',import.meta.url)));
 const task=catalog.find(l=>l.id==='ap-lang-making-an-argument-v2');
 assert.deepEqual(task.classIds,['88421c66-9cda-4002-8e15-086312b7805e']);
 assert.equal(task.dueOn,'2026-11-10');
 assert.ok(Date.parse(task.dueOn+'T23:59:59+08:00')>Date.parse(task.releaseAt));
 for(const s of task.stages)for(const q of s.questions)for(const item of [q,q.alternate])assert.ok(item.answers.every(a=>item.options.includes(a)));
});

test('previous catalog versions remain accessible with separate progress and library views',async()=>{
 const act=fixture(),oldId='world-lit-bibliography-v3';
 const current=await act('lessonLibrary');assert.ok(current.items.some(x=>x.id===lesson.id));assert.ok(!current.items.some(x=>x.id===oldId));
 const previous=await act('lessonLibrary',{previousVersions:true});assert.ok(previous.items.some(x=>x.id===oldId));assert.ok(!previous.items.some(x=>x.id===lesson.id));
 const old=await act('lessonRead',{lessonId:oldId});assert.equal(old.state.step,0);
 const oldCatalog=JSON.parse(readFileSync(new URL('./lesson-catalog-previous.json',import.meta.url)));
 await act('lessonAnswer',{lessonId:oldId,revision:0,answer:oldCatalog[0].stages[0].questions[0].answers[0]});
 assert.equal((await act('lessonRead')).state.step,0);
 assert.equal((await act('lessonRead',{lessonId:oldId})).state.step,1);
 await assert.rejects(act('lessonRead',{lessonId:oldId},{memberClassIds:new Set()}),/unavailable/);
});

test('every revised catalog lesson keeps valid gates, instructional assets and a short practice sequence',async()=>{
 const {validateLesson}=await import('./lesson-authoring.js');
 const catalog=JSON.parse(readFileSync(new URL('./lesson-catalog.json',import.meta.url)));
 const previous=JSON.parse(readFileSync(new URL('./lesson-catalog-previous.json',import.meta.url)));
 assert.ok(catalog.length>=previous.length);
 for(const l of catalog){
  assert.ok(!previous.some(old=>old.id===l.id));assert.ok(l.minutes>=10&&l.minutes<=(l.id.startsWith('ap-lang-phone-argument-')?50:15));
  const copy=structuredClone(l);for(const s of copy.stages)delete s.image;
  assert.deepEqual(validateLesson(copy),[],l.id);
  assert.ok(l.stages.flatMap(s=>s.questions).filter(q=>q.rehearsal).length>=2,l.id);
  for(const s of l.stages)if(s.image){assert.ok(s.image.alt&&s.image.caption);assert.ok(readFileSync(new URL('../../../public/'+s.image.path,import.meta.url)).length>0);}
 }
});

test('current bibliography can be submitted after practice without a final or AI call',async t=>{
 const act=fixture();t.mock.method(globalThis,'fetch',async()=>{throw Error('Must not call AI');});
 await assert.rejects(act('lessonComplete'),/Finish practice/);
 await assert.rejects(act('lessonComplete',{}, {profile:{role:'teacher'},userId:'teacher'}),/preview/);
 await assert.rejects(act('lessonComplete',{lessonId:'world-lit-bibliography-v3'}),/required/);
 for(const q of lesson.stages.flatMap(s=>s.questions))await act('lessonAnswer',{answer:q.answers[0]});
 await act('lessonDraft',{draft:'Optional draft to keep'});
 const r=await act('lessonComplete');assert.equal(r.state.outcome,'Completed');assert.ok(r.state.practiceSubmittedAt);assert.equal(r.state.draft,'Optional draft to keep');assert.deepEqual(r.state.submissions,[]);
 const again=await act('lessonComplete');assert.equal(again.state.practiceSubmittedAt,r.state.practiceSubmittedAt);
 assert.equal((await act('lessonRead')).state.outcome,'Completed');assert.equal(r.lesson.finalOptional,true);assert.equal(globalThis.fetch.mock.callCount(),0);
});

test('AP argument sequence supports full periods and all fresh retry gates without AI',async t=>{
 const {validateLesson}=await import('./lesson-authoring.js');
 const catalog=JSON.parse(readFileSync(new URL('./lesson-catalog.json',import.meta.url)));
 const sequence=catalog.filter(l=>l.id.startsWith('ap-lang-phone-argument-'));
 assert.equal(sequence.length,2);
 t.mock.method(globalThis,'fetch',async()=>{throw Error('No live AI in content verification');});
 for(const lesson of sequence){
  assert.equal(lesson.minutes,50);assert.deepEqual(lesson.classIds,['88421c66-9cda-4002-8e15-086312b7805e']);
  assert.deepEqual(validateLesson(lesson),[]);
  assert.ok(validateLesson({...lesson,minutes:61}).length);
  const act=fixture(lesson.classIds[0]),identity={memberClassIds:new Set(lesson.classIds)},base={lessonId:lesson.id,classId:lesson.classIds[0]};
  await assert.rejects(act('lessonSubmit',{...base,draft:'No practice yet'},identity),/Finish practice/);
  let step=0;
  for(const stage of lesson.stages)for(const question of stage.questions){
   await act('lessonAnswer',{...base,answer:'deliberately incorrect'},identity);
   const retry=await act('lessonAnswer',{...base,answer:'deliberately incorrect'},identity);
   assert.equal(retry.state.step,step);
   const response=await act('lessonAnswer',{...base,answer:question.alternate.answers[0]},identity);
   assert.equal(response.state.step,++step);
  }
  const read=await act('lessonRead',base,identity);assert.equal(read.state.step,6);
 }
 assert.equal(globalThis.fetch.mock.callCount(),0);
});
