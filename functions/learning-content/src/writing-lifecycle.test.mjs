import {beforeEach,afterEach,expect,test,vi} from 'vitest';
const holder=vi.hoisted(()=>({db:null}));
vi.mock('node-appwrite',async original=>({...await original(),Databases:class{constructor(){return holder.db;}}}));
import handler from './main.js';
import {harness} from './reading-discussion-test-harness.mjs';
let h;
beforeEach(()=>{
 vi.stubEnv('APPWRITE_ENDPOINT','https://example.invalid/v1');vi.stubEnv('APPWRITE_FUNCTION_PROJECT_ID','test');vi.stubEnv('APPWRITE_API_KEY','test');
 h=harness();holder.db=h.db;
 h.storage.users.push({$id:'teacher',name:'Teacher',role:'teacher'});h.storage.users[0].role='student';
 h.storage.class_sessions=[];h.storage.discussion_questions=[];h.storage.discussion_answers=[];
});
afterEach(()=>vi.unstubAllEnvs());
const invoke=async(userId,body)=>handler({req:{headers:{'x-appwrite-user-id':userId},bodyText:JSON.stringify(body)},res:{json:(body,code=200)=>({body,code})},error:message=>{throw Error(message);}});
const create=async(mode=false)=>(await invoke('teacher',{action:'createLivePresentation',classId:'blue',questions:[{type:'paragraph',text:'Explain the ending',options:[],answer:''}],discussionMode:mode})).body.sessionId;
test('create, revise, finish, and archive preserve settings and root IDs',async()=>{
 const sessionId=await create(true);
 await invoke('student',{action:'submitLiveAnswer',sessionId,answer:'First draft'});
 const root=h.storage.discussion_answers[0].$id;
 await invoke('student',{action:'submitLiveAnswer',sessionId,answer:'Final draft'});
 expect(h.storage.discussion_answers).toHaveLength(1);expect(h.storage.discussion_answers[0].$id).toBe(root);
 await invoke('teacher',{action:'setWritingDiscussionSettings',writingSessionId:sessionId,studentsCanView:false});
 await invoke('teacher',{action:'updateWritingPrompt',sessionId,prompt:'Revised prompt',promptSize:'standard',exampleResponse:'Example'});
 expect(JSON.parse(h.storage.class_sessions[0].notesMarkdown)).toMatchObject({discussionMode:true,studentsCanView:false});
 expect((await invoke('teacher',{action:'controlLivePresentation',sessionId,command:'end'})).code).toBe(200);
 const finished=h.storage.class_sessions[0];expect(finished.status).toBe('published');expect(finished.publishedNotesMarkdown).toContain(`/presentations/${sessionId}/live`);expect(finished.publishedNotesMarkdown).not.toContain('Final draft');
 const student=(await invoke('student',{action:'readLivePresentation',sessionId})).body;
 expect(student.ownAnswer).toBe('Final draft');expect(student.discussion.posts).toEqual([]);expect(student.discussion.canSubmit).toBe(false);
 expect((await invoke('teacher',{action:'readLivePresentation',sessionId})).body.responses[0].answer).toBe('Final draft');
 expect((await invoke('student',{action:'submitLiveAnswer',sessionId,answer:'Too late'})).code).toBe(403);
});
test('legacy APIs cannot read or overwrite writing submissions, even with a forged create',async()=>{
 const sessionId=await create();await invoke('student',{action:'submitLiveAnswer',sessionId,answer:'Private'});
 expect((await invoke('student',{action:'readClassDiscussion',sessionId})).code).toBe(403);
 const row=h.storage.discussion_answers[0];
 expect((await invoke('student',{action:'mutate',collection:'discussion_answers',operation:'create',id:row.$id,data:{questionId:row.questionId,answerText:'Bypass'}})).code).toBe(403);
 expect((await invoke('student',{action:'mutate',collection:'class_sessions',operation:'update',id:sessionId,data:{notesMarkdown:'{"studentsCanView":true}'}})).code).toBe(403);
 expect(h.storage.discussion_answers[0].answerText).toBe('Private');
});
test('secure class-session sync preserves teacher notes and rejects student edits',async()=>{
 const notes={classId:'blue',discussionType:'notes',title:'Class notes',sessionDate:'2026-10-15',status:'draft',votesPerStudent:0,allowStackedVotes:false,createdAt:'2026-10-15T00:00:00Z',updatedAt:'2026-10-15T00:00:00Z'};
 expect((await invoke('teacher',{action:'mutate',collection:'class_sessions',operation:'create',id:'notes',data:notes})).code).toBe(200);
 expect((await invoke('teacher',{action:'mutate',collection:'class_sessions',operation:'update',id:'notes',data:{publishedNotesMarkdown:'Published notes',status:'published'}})).code).toBe(200);
 expect((await invoke('student',{action:'mutate',collection:'class_sessions',operation:'update',id:'notes',data:{publishedNotesMarkdown:'Forged'}})).code).toBe(403);
 expect(h.storage.class_sessions[0].publishedNotesMarkdown).toBe('Published notes');
});
