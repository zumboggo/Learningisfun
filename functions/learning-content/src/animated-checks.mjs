import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {animatedEpisodeAction} from './animated-episodes.js';
const pack=JSON.parse(readFileSync(new URL('../../../public/stories/animated/demo.json',import.meta.url)));
function harness(options={}){const records=new Map(),files=new Map();const db={getDocument:async(_,c,id)=>{if(c==='classes')return {teacherId:id===options.foreignClass?'someone-else':'teacher'};if(!records.has(id))throw Object.assign(Error('Missing'),{code:404});return records.get(id);},listDocuments:async(_,c,queries)=>{if(c==='classes')return {documents:[{$id:'class'}]};let rows=[...records.values()];for(const raw of queries){const q=JSON.parse(raw);if(q.method==='equal')rows=rows.filter(r=>q.values.includes(r[q.attribute]));if(q.method==='orderDesc')rows.sort((a,b)=>b.$id.localeCompare(a.$id));if(q.method==='cursorAfter'){const i=rows.findIndex(r=>r.$id===q.values[0]);rows=rows.slice(i+1);}if(q.method==='limit')rows=rows.slice(0,q.values[0]);}return {documents:rows};},updateDocument:async(_,c,id,data)=>{const row={...records.get(id),...data};records.set(id,row);return row;},createDocument:async(_,c,id,data)=>{if(records.has(id))throw Object.assign(Error('Conflict'),{code:409});const row={$id:id,...data};records.set(id,row);return row;}};const storage={createFile:async({fileId,file})=>{files.set(fileId,file.source.data);},getFileDownload:async({fileId})=>JSON.parse(Buffer.from(files.get(fileId)).toString())};const call=(body,role='teacher',userId=role)=>animatedEpisodeAction({body,profile:{role},userId,memberClassIds:new Set(userId==='student'?['class',...(options.memberClasses||[])]:[]),db,databaseId:'db',storage});return {call,records};}
test('teacher drafts, publication, access, idempotent assignment and attempt scoring',async()=>{const {call}=harness();const d=await call({action:'animatedSaveDraft',id:'demo',revision:0,pack});assert.equal(d.revision,1);await assert.rejects(call({action:'animatedSaveDraft',id:'demo',revision:0,pack}),/changed elsewhere/);await assert.rejects(call({action:'animatedReadDraft',id:'demo'},'student'),/Teacher/);const v=await call({action:'animatedPublish',id:'demo',revision:1});const a=await call({action:'animatedAssign',classId:'class',versionId:v.versionId,date:'2026-01-01'});assert.equal((await call({action:'animatedAssign',classId:'class',versionId:v.versionId,date:'2026-01-01'})).assignmentId,a.assignmentId);await assert.rejects(call({action:'animatedRead',assignmentId:a.assignmentId},'student','outsider'),/not available/);const r=await call({action:'animatedRead',assignmentId:a.assignmentId},'student');assert.equal(r.pack.title,pack.title);const t=await call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'a',steps:[],quizzes:[]},'student');assert.ok(t.seed>0);await assert.rejects(call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'a',steps:[],quizzes:[[0,1,2,3]]},'student'),/Finish the story/);const t1=await call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'a',steps:[null],quizzes:[]},'student');assert.equal(t1.seed,t.seed);await assert.rejects(call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'a',steps:[],quizzes:[]},'student'),/another device/);});

test('quiz retries preserve progress, completion is immutable, future release stays private',async()=>{const {call}=harness();await call({action:'animatedSaveDraft',id:'demo',revision:0,pack});const v=await call({action:'animatedPublish',id:'demo',revision:1});const future=await call({action:'animatedAssign',classId:'class',versionId:v.versionId,date:'2099-01-01'});await assert.rejects(call({action:'animatedRead',assignmentId:future.assignmentId},'student'),/not available/);const a=await call({action:'animatedAssign',classId:'class',versionId:v.versionId,date:'2026-01-01'});const t=await call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'b',steps:[],quizzes:[]},'student');const {validatePackage,initialStoryState,settleStory,advanceStory}=await import('./story-engine.js');const {story}=validatePackage(pack);let state=settleStory(story,initialStoryState(story,t.seed)),steps=[];while(!state.ended){const n=story.nodes[state.cursor],option=n.type==='choice'?n.options[0].id:null;steps.push(option);state=advanceStory(story,state,option);}const body={action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'b',steps,quizzes:[[0,0,0,0]]};const failed=await call(body,'student');assert.equal(failed.complete,false);const passed=await call({...body,quizzes:[...body.quizzes,[0,1,2,3]]},'student');assert.equal(passed.score,100);assert.equal(passed.complete,true);await assert.rejects(call({...body,quizzes:[...body.quizzes,[0,1,2,3],[0,1,2,3]]},'student'),/replay/);const library=await call({action:'animatedLibrary'},'student');assert.equal(library.assignments.find(x=>x.assignmentId===a.assignmentId).best,100);});

 test('update an unstarted assignment in place, preserve old versions and block started assignments',async()=>{
 const {call}=harness();await call({action:'animatedSaveDraft',id:'demo',revision:0,pack});const v1=await call({action:'animatedPublish',id:'demo',revision:1});const a=await call({action:'animatedAssign',classId:'class',versionId:v1.versionId,date:'2026-01-01'});
 await call({action:'animatedSaveDraft',id:'demo',revision:1,pack:{...pack,title:'Updated'}});const v2=await call({action:'animatedPublish',id:'demo',revision:2});
 const update={action:'animatedAssign',assignmentId:a.assignmentId,classId:'class',versionId:v2.versionId,date:'2026-01-01'};
 await assert.rejects(call(update,'student'),/teacher/);
 await assert.rejects(call({...update,date:'2026-01-02'}),/same episode/);
 assert.equal((await call(update)).assignmentId,a.assignmentId);assert.equal((await call(update)).version,2);
 assert.equal((await call({action:'animatedLibrary'})).assignments.length,1);
 assert.equal((await call({action:'animatedRead',assignmentId:a.assignmentId},'student')).pack.title,'Updated');
 await call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'started',steps:[],quizzes:[]},'student');
 await assert.rejects(call({...update,versionId:v1.versionId}),/Students have started/);
 assert.equal((await call({action:'animatedRead',assignmentId:a.assignmentId},'student')).pack.title,'Updated');
 });

test('assignment retirement is owner-only, reversible, and preserves saved attempts',async()=>{
 const {call,records}=harness();await call({action:'animatedSaveDraft',id:'demo',revision:0,pack});
 const v=await call({action:'animatedPublish',id:'demo',revision:1});
 const a=await call({action:'animatedAssign',classId:'class',versionId:v.versionId,date:'2026-01-01'});
 const attempt=await call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'keep',steps:[],quizzes:[]},'student');
 const archive={action:'animatedArchiveAssignment',assignmentId:a.assignmentId,archived:true};
 await assert.rejects(call(archive,'student'),/teacher/);
 await assert.rejects(call(archive,'teacher','other-teacher'),/teacher/);
 const count=records.size;await call(archive);await call(archive);
 assert.equal(records.size,count);assert.equal((await call({action:'animatedLibrary'})).assignments.length,0);
 assert.equal((await call({action:'animatedLibrary'},'student')).assignments.length,0);
 const restored=await call({action:'animatedRead',assignmentId:a.assignmentId},'student');
 assert.equal(restored.attempts[0].seed,attempt.seed);assert.equal(restored.pack.title,pack.title);
 await call({...archive,archived:false});assert.equal((await call({action:'animatedLibrary'})).assignments.length,1);
});

test('server accepts action beats, pins their outcomes and recomputes quiz scores',async()=>{
 const actionPack=JSON.parse(readFileSync(new URL('../../../public/stories/animated/action-rehearsal/episode.json',import.meta.url)));
 const {call}=harness();await call({action:'animatedSaveDraft',id:'action-demo',revision:0,pack:actionPack});
 const v=await call({action:'animatedPublish',id:'action-demo',revision:1});const a=await call({action:'animatedAssign',classId:'class',versionId:v.versionId,date:'2026-01-01'});
 const initial=await call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'action',steps:[],quizzes:[]},'student');
 const {validatePackage,initialStoryState,settleStory,advanceStory,replayStory}=await import('./story-engine.js');const {story}=validatePackage(actionPack);
 let state=settleStory(story,initialStoryState(story,initial.seed));const steps=[];
 while(!state.ended){const node=story.nodes[state.cursor];if(node.type==='act'){const saved=await call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'action',steps:[...steps],quizzes:[]},'student');assert.deepEqual(replayStory(story,saved.steps,saved.seed),state);}
 const option=node.type==='choice'?node.options[0].id:null;steps.push(option);state=advanceStory(story,state,option);}
 const result=await call({action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'action',steps,quizzes:[actionPack.quiz.map(q=>q.answer)],score:999},'student');assert.equal(result.score,100);assert.equal(result.complete,true);
});

test('World Lit assigns both sections, retries without duplicates, and keeps access class-scoped',async()=>{
 const red='09d7f0a7-4c29-462c-820f-e11ea914d375',blue='b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c';const {call,records}=harness({memberClasses:[red]});
 await call({action:'animatedSaveDraft',id:'quixote-test',revision:0,pack});const v=await call({action:'animatedPublish',id:'quixote-test',revision:1});
 const a=await call({action:'animatedAssign',classId:red,versionId:v.versionId,date:'2026-01-01'});
 await call({action:'animatedAssign',classId:blue,versionId:v.versionId,date:'2026-01-02'});
 const assignments=[...records.values()].filter(r=>r.kind==='animated-assignment').map(r=>({...JSON.parse(r.dataJson),assignmentId:r.$id}));
 assert.equal(assignments.length,2);assert.deepEqual(new Set(assignments.map(a=>a.classId)),new Set([red,blue]));
 assert.equal(new Set(assignments.map(a=>a.fileId)).size,1);
 assert.equal((await call({action:'animatedRead',assignmentId:a.assignmentId},'student')).preview,false);
 await assert.rejects(call({action:'animatedRead',assignmentId:assignments.find(a=>a.classId===blue).assignmentId},'student'),/not available/);
 await call({action:'animatedArchiveAssignment',assignmentId:a.assignmentId,archived:true});
 assert.equal([...records.values()].filter(r=>r.kind==='animated-assignment').every(r=>JSON.parse(r.dataJson).archived),true);
 await call({action:'animatedArchiveAssignment',assignmentId:a.assignmentId,archived:false});
 assert.equal([...records.values()].filter(r=>r.kind==='animated-assignment').every(r=>!JSON.parse(r.dataJson).archived),true);
});

test('World Lit new editions keep both banks identical and retain earlier packages',async()=>{
 const {call,records}=harness();const red='09d7f0a7-4c29-462c-820f-e11ea914d375',blue='b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c';
 await call({action:'animatedSaveDraft',id:'quixote-edition',revision:0,pack});const v1=await call({action:'animatedPublish',id:'quixote-edition',revision:1});
 const old=await call({action:'animatedAssign',classId:red,versionId:v1.versionId,date:'2026-01-01'});
 await call({action:'animatedSaveDraft',id:'quixote-edition',revision:1,pack:{...pack,title:'Second edition'}});const v2=await call({action:'animatedPublish',id:'quixote-edition',revision:2});
 const current=await call({action:'animatedAssign',classId:blue,versionId:v2.versionId,date:'2026-01-02'});
 const rows=[...records.values()].filter(r=>r.kind==='animated-assignment').map(r=>JSON.parse(r.dataJson));
 assert.equal(rows.length,4);assert.equal(rows.filter(a=>!a.archived).length,2);
 assert.equal(rows.filter(a=>!a.archived).every(a=>a.versionId===current.versionId),true);
 assert.equal((await call({action:'animatedRead',assignmentId:old.assignmentId})).pack.title,pack.title);
});


test('World Lit synchronization checks ownership of both sections before assigning',async()=>{
 const red='09d7f0a7-4c29-462c-820f-e11ea914d375',blue='b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c';const {call,records}=harness({foreignClass:blue});
 await call({action:'animatedSaveDraft',id:'quixote-owner',revision:0,pack});const v=await call({action:'animatedPublish',id:'quixote-owner',revision:1});
 await assert.rejects(call({action:'animatedAssign',classId:red,versionId:v.versionId,date:'2026-01-01'}),/Only the class teacher/);
 assert.equal([...records.values()].filter(r=>r.kind==='animated-assignment').length,0);
});

test('English Corner writing is version/identity scoped, resumable and required for completion',async()=>{
 const {call}=harness();const p={...pack,profile:'english-corner',writing:{prompts:['Explain a change.','Explain a friendship.','Explain a decision.']}};
 await call({action:'animatedSaveDraft',id:'writing',revision:0,pack:p});const v=await call({action:'animatedPublish',id:'writing',revision:1});const a=await call({action:'animatedAssign',classId:'class',versionId:v.versionId,date:'2026-01-01'});
 const base={action:'animatedSaveAttempt',assignmentId:a.assignmentId,attemptId:'write',steps:[],quizzes:[]};const t=await call(base,'student');
 await assert.rejects(call({...base,writing:{question:0,text:'Hello',submitted:false,revision:1}},'student'),/quiz/);
 const {validatePackage,replayStory,advanceStory}=await import('./story-engine.js');const {story}=validatePackage(p);let state=replayStory(story,[],t.seed),steps=[];
 while(!state.ended){const n=story.nodes[state.cursor],option=n.type==='choice'?n.options[0].id:null;steps.push(option);state=advanceStory(story,state,option);}
 const body={...base,steps,quizzes:[p.quiz.map(q=>q.answer)]};assert.equal((await call(body,'student')).complete,false);
 const writing={question:2,text:'A specific detail supports my answer.',submitted:false,revision:1};await call({...body,writing},'student');
 assert.deepEqual((await call({action:'animatedRead',assignmentId:a.assignmentId},'student')).attempts[0].writing,writing);
 await assert.rejects(call({...body,writing:{...writing,text:'changed'}},'student'),/another device/);
 await assert.rejects(call({...body,writing:{...writing,question:3,revision:2}},'student'),/Invalid paragraph/);
 await assert.rejects(call({...body,writing:{...writing,text:' ',submitted:true,revision:2}},'student'),/Invalid paragraph/);
 const submitted={...writing,submitted:true,revision:2};assert.equal((await call({...body,writing:submitted},'student')).complete,true);
 assert.equal((await call({...body,writing:submitted},'student')).complete,true);
 await assert.rejects(call({...body,writing:{...submitted,text:'overwrite',revision:3}},'student'),/replay/);
 await assert.rejects(call({...body,writing:submitted},'student','outsider'),/not available/);
 const replay=await call({...base,attemptId:'separate'},'student');assert.equal(replay.writing,undefined);
});
