import {paidCompletion,maximumCost,monthKey} from '../functions/learning-content/src/teacher-ai.js';
import {emptyPlanner} from '../functions/learning-content/src/general-planner-model.js';
import assert from 'node:assert/strict';
import {Client,Databases,Functions,Users,Query} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {allRows,readRecord,writeRecord,recordId} from '../functions/learning-content/src/teacher-workspace.js';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
loadEnvFile(join(homedir(),'.config/learningisfun/teacher-onboarding.env'));
const endpoint=process.env.APPWRITE_ENDPOINT,project=process.env.APPWRITE_PROJECT_ID,databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const admin=new Client().setEndpoint(endpoint).setProject(project).setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin),created=[],classes=[];
async function call(client,body){const r=await new Functions(client).createExecution({functionId:'learning-content',body:JSON.stringify(body)});const value=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||value.error)throw Object.assign(Error(value.error||'Execution failed'),{code:r.responseStatusCode});return value;}
async function temporary(label){const id='lifetest-'+randomUUID().slice(0,20);await users.create({userId:id,email:id+'@example.invalid',password:randomUUID()+'Aa1!',name:'Temporary '+label});created.push(id);const session=await users.createSession({userId:id});const jwt=await users.createJWT({userId:id,sessionId:session.$id,duration:900});const client=new Client().setEndpoint(endpoint).setProject(project).setJWT(jwt.jwt);await call(client,{action:'selfProfile'});return {id,client};}
const deny=async promise=>assert.rejects(promise,e=>[400,401,403,404].includes(e.code));
try{
 const a=await temporary('teacher A'),b=await temporary('teacher B'),student=await temporary('student'),blocked=await temporary('invitation attempts');
 for(let i=0;i<5;i++)await deny(call(blocked.client,{action:'redeemTeacherInvitation',code:'wrong'}));await deny(call(blocked.client,{action:'redeemTeacherInvitation',code:process.env.TEACHER_INVITATION_CODE}));
 for(const actor of [a,b]){await call(actor.client,{action:'redeemTeacherInvitation',code:process.env.TEACHER_INVITATION_CODE});assert.equal((await call(actor.client,{action:'selfProfile'})).profile.role,'teacher');const prefs=await call(actor.client,{action:'readTeacherPreferences'});assert.equal(prefs.legacyPlanner,false);assert.equal(prefs.value?.presentationFolderUrl,undefined);assert.equal((await call(actor.client,{action:'readAIAllowance'})).limit,1);await deny(call(actor.client,{action:'manageTeacherInvitation',enabled:false}));}
 const classFor=async actor=>{const id='lifetest-'+randomUUID().slice(0,20);classes.push(id);await call(actor.client,{action:'scopedData',collection:'classes',operation:'create',id,data:{teacherId:actor.id,name:'Temporary test class',courseName:'Test',schoolYear:'2026',status:'active',joinCode:id.slice(-8),joinCodeActive:true,parentCode:id.slice(-7),parentCodeActive:false,createdAt:new Date().toISOString()}});return id};
 const ca=await classFor(a),cb=await classFor(b);
 for(const classId of [ca,cb])await db.createDocument(databaseId,'class_members','lifetest-'+randomUUID().slice(0,20),{classId,userId:student.id,role:'student',joinedAt:new Date().toISOString()},[]);
 assert.equal((await call(a.client,{action:'scopedData',collection:'classes',operation:'list'})).documents.length,1);
 assert.equal((await call(student.client,{action:'scopedData',collection:'classes',operation:'list'})).documents.length,2);
 await deny(call(a.client,{action:'scopedData',collection:'classes',operation:'get',id:cb}));await deny(call(a.client,{action:'scopedData',collection:'classes',operation:'update',id:cb,data:{name:'Not allowed'}}));
 await db.createDocument(databaseId,'quizzes','lifetest-quiz',{classId:cb,createdBy:b.id,title:'Test quiz',sourceType:'discussion',notesWeight:100,flashcardWeight:0,status:'draft',questionCount:0,createdAt:new Date().toISOString()},[]);await deny(call(a.client,{action:'mutate',collection:'quizzes',operation:'update',id:'lifetest-quiz',data:{title:'Not allowed'}}));
 await deny(call(a.client,{action:'readPrivateEpisode',classId:'88421c66-9cda-4002-8e15-086312b7805e',episode:'own-english',version:4}));
 await deny(call(a.client,{action:'readPrivateAnimatedPreview',slug:'the-measure-that-changed'}));
 await deny(call(student.client,{action:'saveTeacherPreferences',revision:0,presentationFolderUrl:'https://example.org/'}));
 await call(a.client,{action:'saveTeacherPreferences',revision:0,presentationFolderUrl:'https://example.org/a'});assert.equal((await call(b.client,{action:'readTeacherPreferences'})).value,null);
 const plan={...emptyPlanner(),calendar:{...emptyPlanner().calendar,start:'2026-10-26',end:'2026-10-30'},subjects:[{id:'subject',name:'English',classId:ca}],timetable:[{id:'block',day:1,title:'Lesson',subjectId:'subject',startTime:'09:00',minutes:40}],resources:[],lessons:[{id:'lesson',date:'2026-10-26',blockId:'block',title:'Test',notes:'Private teacher notes',completed:false,items:[{id:'link',kind:'link',title:'Test materials',url:'https://example.org/test',instructions:'Private instructions',minutes:10}]}]};
 const saved=await call(a.client,{action:'saveGeneralPlanner',revision:0,plan});assert.equal((await call(a.client,{action:'readGeneralPlanner'})).value.lessons[0].notes,'Private teacher notes');assert.equal((await call(b.client,{action:'readGeneralPlanner'})).value.lessons.length,0);await deny(call(b.client,{action:'saveGeneralPlanner',revision:0,plan}));
 for(let i=0;i<2;i++)await call(a.client,{action:'publishGeneralLesson',revision:saved.revision,lessonId:'lesson',itemIds:['link']});const links=await allRows(db,databaseId,'presentation_links',[Query.equal('classId',ca)]);assert.equal(links.length,1);assert(!JSON.stringify(links).includes('Private instructions'));
 // Set only the disposable teacher's allowance to one reservation; concurrent calls must not overspend.
 await writeRecord(db,databaseId,a.id,'ai-allowance',{usd:0},0);const rejected=await Promise.allSettled(Array.from({length:3},()=>call(a.client,{action:'generateTeacherAI',feature:'flashcards',notes:'Test'})));assert(rejected.every(r=>r.status==='rejected'));assert.equal((await readRecord(db,databaseId,a.id,'ai-month:'+new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit'}).format(new Date()))).revision,0);
 // Exercise real Appwrite transaction conflicts with a fake provider; no paid request is sent.
 const messages=[{role:'user',content:'Concurrency fixture'}],cap=maximumCost(messages),allowance=await readRecord(db,databaseId,b.id,'ai-allowance');await writeRecord(db,databaseId,b.id,'ai-allowance',{usd:cap},allowance.revision);
 const oldFetch=globalThis.fetch,oldKey=process.env.OPENROUTER_API_KEY;let sent=0;process.env.OPENROUTER_API_KEY='test-only';globalThis.fetch=async(url,options)=>String(url).startsWith('https://openrouter.ai/')?(sent++,{ok:true,json:async()=>({id:'fixture',choices:[{message:{content:'[]'}}],usage:{cost:cap}})}):oldFetch(url,options);
 try{const results=await Promise.allSettled(Array.from({length:4},()=>paidCompletion({db,databaseId,userId:b.id,body:{}},{ownerId:b.id,messages})));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(sent,1);const ledger=await readRecord(db,databaseId,b.id,'ai-month:'+monthKey());assert.equal(ledger.value.used,cap);}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;}
 if(process.argv.includes('--locked')){await deny(new Databases(a.client).getDocument({databaseId,collectionId:'classes',documentId:cb}));await deny(new Databases(student.client).updateDocument({databaseId,collectionId:'users',documentId:student.id,data:{role:'teacher'}}));}
 const retired=await new Functions(a.client).createExecution({functionId:'writing-ai-feedback',body:'{}'});assert.equal(retired.responseStatusCode,410);
 console.log('PASS: immediate teacher invitation, account-only preferences, isolated classes, shared student enrollment, blocked foreign access, attempt limits, and concurrent zero-allowance refusal.');
}finally{
 for(const collection of ['teacher_workspace','class_members','users','classes','reading_question_state','quizzes','presentation_links']){const rows=await allRows(db,databaseId,collection);for(const r of rows){if(created.includes(r.$id)||classes.includes(r.$id)||created.includes(r.ownerId)||created.includes(r.userId)||created.includes(r.createdBy)||classes.includes(r.classId)||collection==='reading_question_state'&&created.some(id=>r.$id===recordId('teacher-lock',id)))await db.deleteDocument(databaseId,collection,r.$id);}}
 for(const id of created)await users.delete({userId:id});console.log('Disposable test accounts and their records removed.');
}
