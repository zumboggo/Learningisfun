import {test,expect} from 'vitest';
import {harness} from './reading-discussion-test-harness.mjs';
import {allocateQuestions} from './curated-questions.js';
const read={action:'readReadingDiscussion'};
const question=id=>({action:'postReadingDiscussion',category:'question',content:`Why ${id}?`,requestId:id});
const peer={userId:'peer',role:'student',classIds:['blue']};
const addPeer=storage=>storage.class_members.push({$id:'bp',userId:'peer',classId:'blue',role:'student'});
const save=(id,content=`Private ${id}?`)=>({action:'saveReadingQuestionDraft',draftId:id,content});

test('notebook is account-backed and invisible to peers, parents and teachers',async()=>{
 const {call,storage,teacher}=harness();addPeer(storage);
 for(let i=0;i<110;i++)await call(save(String(i)));
 const recovered=await call(read);expect(recovered.notebook).toHaveLength(110);expect(recovered.posts).toEqual([]);
 expect((await call(read,teacher)).notebook).toBeUndefined();expect((await call(read,peer)).notebook).toEqual([]);
 expect((await call(read,{userId:'parent',role:'parent',classIds:['blue']})).notebook).toBeUndefined();
 const draft=recovered.notebook[0];await expect(call({action:'publishReadingQuestions',draftIds:[draft.id]},peer)).rejects.toThrow('Private');
 await expect(call({...save(draft.draftId,'Changed elsewhere'),expectedUpdatedAt:'stale'})).rejects.toThrow('another device');
 await call({...save(draft.draftId,'Updated on another device'),expectedUpdatedAt:draft.updatedAt});
 expect((await call(read)).notebook[0].content).toBe('Updated on another device');
});
test('publishing selected drafts is atomic and retry-idempotent; hidden questions count',async()=>{
 const {call,teacher}=harness();for(let i=0;i<4;i++)await call(save(String(i)));
 const drafts=(await call(read)).notebook;
 const publish={action:'publishReadingQuestions',draftIds:drafts.slice(0,3).map(d=>d.id)};
 await call(publish);await call(publish);
 let data=await call(read);expect(data.posts).toHaveLength(3);expect(data.publishedCount).toBe(3);expect(data.notebook).toHaveLength(1);
 await call({action:'moderateReadingDiscussion',postId:data.posts[0].id,operation:'hide'},teacher);
 data=await call(read);expect(data.publishedCount).toBe(3);expect(data.remainingSpaces).toBe(0);
 await expect(call({action:'publishReadingQuestions',draftIds:[drafts[3].id]})).rejects.toThrow('three');
 await expect(call(question('old-client-bypass'))).rejects.toThrow('three');
 for(let i=0;i<5;i++)await call(question(`teacher-${i}`),teacher);
});
test('concurrent tabs cannot publish a fourth question',async()=>{
 const {call,storage}=harness();const results=await Promise.allSettled([0,1,2,3].map(i=>call(question(`concurrent-${i}`))));
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(3);expect(storage.reading_posts).toHaveLength(3);
 expect((await call(read)).publishedCount).toBe(3);
});
test('withdrawal retains history, frees a slot and never transfers votes',async()=>{
 const {call,storage}=harness();await call(question('original'));const original=(await call(read)).posts[0];
 await call({action:'voteReadingDiscussion',postId:original.id,upvoted:true});
 await call({action:'withdrawReadingQuestion',postId:original.id});await call({action:'withdrawReadingQuestion',postId:original.id});
 expect((await call(read)).posts).toEqual([]);expect(JSON.parse(storage.reading_posts[0].dataJson).withdrawn).toBe(true);
 expect(storage.reading_votes).toHaveLength(1);await call(question('replacement'));expect((await call(read)).posts[0].score).toBe(0);
 await expect(call({action:'voteReadingDiscussion',postId:original.id,upvoted:true})).rejects.toThrow('available');
});
test('reply and withdrawal race cannot leave a reply on a withdrawn question',async()=>{
 const {call,storage}=harness();addPeer(storage);await call(question('race'));const root=(await call(read)).posts[0];
 const results=await Promise.allSettled([call({action:'withdrawReadingQuestion',postId:root.id}),call({...question('reply-race'),parentId:root.id},peer)]);
 expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 const saved=JSON.parse(storage.reading_posts.find(r=>r.$id===root.id).dataJson);
 expect(Boolean(saved.withdrawn)&&storage.reading_posts.some(r=>JSON.parse(r.dataJson).parentId===root.id)).toBe(false);
});
test('replied questions retain their thread and can be edited, including hidden replies',async()=>{
 const {call,teacher}=harness();await call(question('root'));const root=(await call(read)).posts[0];
 await call({...question('reply'),parentId:root.id},teacher);const reply=(await call(read)).posts.find(p=>p.parentId);
 await call({action:'moderateReadingDiscussion',postId:reply.id,operation:'hide'},teacher);
 expect((await call(read)).posts[0].everReplied).toBe(true);
 await expect(call({action:'withdrawReadingQuestion',postId:root.id})).rejects.toThrow('reply');
 await call({action:'editReadingDiscussion',postId:root.id,expectedUpdatedAt:root.createdAt,content:'Better wording'});
 expect((await call(read)).posts[0].content).toBe('Better wording');
});
test('legacy students above three retain editing and unlimited replies',async()=>{
 const {call,storage,teacher}=harness();for(let i=0;i<5;i++)await call(question(`old-${i}`),teacher);
 storage.reading_posts.forEach(r=>{r.authorId='student';});const data=await call(read);expect(data.publishedCount).toBe(5);
 await expect(call(question('new'))).rejects.toThrow('three');
 for(let i=0;i<8;i++)await call({...question(`reply-${i}`),parentId:data.posts[0].id});
 expect((await call(read)).posts.filter(p=>p.parentId)).toHaveLength(8);
});
test('matching prevents avoidable self-exclusion gaps and gives distinct ranked questions first',()=>{
 const questions=[{id:'a',authorId:'s2',score:10,unanswered:true},{id:'b',authorId:'s1',score:2,unanswered:true}];
 const result=allocateQuestions(['s1','s2'],questions,()=>0);
 expect(result).toEqual([{studentId:'s1',questionId:'a',status:'pending'},{studentId:'s2',questionId:'b',status:'pending'}]);
 expect(allocateQuestions(['s1'],[{id:'own',authorId:'s1',score:0,unanswered:true}])[0].status).toBe('gap');
 const ranked=allocateQuestions(['s1'],[{id:'answered',authorId:'other',score:100,unanswered:false},{id:'unanswered',authorId:'other',score:1,unanswered:true}]);
 expect(ranked[0].questionId).toBe('unanswered');
});
test('rounds are private to each assigned student; direct replies complete and later rounds cover remaining questions',async()=>{
 const {call,storage,teacher}=harness();addPeer(storage);
 for(let i=0;i<3;i++)await call(question(`teacher-q-${i}`),teacher);
 const students=['student','peer'];const preview=await call({action:'previewReadingAssignments',studentIds:students},teacher);
 expect(new Set(preview.assignments.map(a=>a.questionId)).size).toBe(2);
 const publish={action:'publishReadingAssignments',studentIds:students,assignments:preview.assignments,requestId:'round-1'};
 await call(publish,teacher);await call(publish,teacher);expect(storage.reading_reply_rounds).toHaveLength(1);
 const own=(await call(read)).assignments;expect(own).toHaveLength(1);expect(own[0].studentId).toBe('student');
 expect((await call(read)).rounds).toBeUndefined();await call({...question('answer'),parentId:own[0].questionId});
 expect((await call(read)).assignments[0].status).toBe('completed');
 const next=await call({action:'previewReadingAssignments',studentIds:students},teacher);
 expect(next.assignments.every(a=>a.questionId!==own[0].questionId)).toBe(true);
 expect((await call(read,teacher)).awaitingReplies).toHaveLength(2);
});
test('withdrawal cancels pending assignments; rerunning fills gaps and retains completed work',async()=>{
 const {call,storage,teacher}=harness();addPeer(storage);await call(question('student-q'));await call(question('peer-q'),peer);
 await call(question('teacher-q'),teacher);
 const students=['student','peer'];const preview=await call({action:'previewReadingAssignments',studentIds:students},teacher);
 await call({action:'publishReadingAssignments',studentIds:students,assignments:preview.assignments,requestId:'round'},teacher);
 const round=(await call(read,teacher)).rounds[0];const studentAssignment=round.assignments.find(a=>a.studentId==='student');
 await call({...question('answer'),parentId:studentAssignment.questionId});
 const peerAssignment=round.assignments.find(a=>a.studentId==='peer');const root=storage.reading_posts.find(p=>p.$id===peerAssignment.questionId);
 if(root.authorId==='student')await call({action:'withdrawReadingQuestion',postId:root.$id});
 else { // Teacher-owned question can't be withdrawn; test cancellation using a student-owned assignment.
   const studentRoot=storage.reading_posts.find(p=>p.authorId==='student'&&!JSON.parse(p.dataJson).parentId);
   const raw=storage.reading_reply_rounds[0];const data=JSON.parse(raw.dataJson);data.assignments.find(a=>a.studentId==='peer').questionId=studentRoot.$id;raw.dataJson=JSON.stringify(data);
   await call({action:'withdrawReadingQuestion',postId:studentRoot.$id});
 }
 expect((await call(read,teacher)).rounds[0].assignments.find(a=>a.studentId==='peer').status).toBe('cancelled');
 const replacement=await call({action:'previewReadingAssignments',roundId:round.id,studentIds:students},teacher);
 expect(replacement.assignments.find(a=>a.studentId==='student')).toMatchObject({status:'completed',questionId:studentAssignment.questionId});
 await call({action:'publishReadingAssignments',roundId:round.id,studentIds:students,assignments:replacement.assignments,requestId:'fill'},teacher);
 expect((await call(read,teacher)).rounds[0].assignments.find(a=>a.studentId==='peer').status).toBe('pending');
});
test('roster validation and self-answer exclusion are enforced on publication',async()=>{
 const {call,storage,teacher}=harness();addPeer(storage);await call(question('own'));
 const id=(await call(read)).posts[0].id;
 await expect(call({action:'previewReadingAssignments',studentIds:['outsider']},teacher)).rejects.toThrow('roster');
 await expect(call({action:'publishReadingAssignments',studentIds:['student'],requestId:'bad',assignments:[{studentId:'student',questionId:id}]},teacher)).rejects.toThrow('Question changed');
 const preview=await call({action:'previewReadingAssignments',studentIds:['peer']},teacher);storage.class_members=storage.class_members.filter(m=>m.userId!=='peer');
 await expect(call({action:'publishReadingAssignments',studentIds:['peer'],requestId:'gone',assignments:preview.assignments},teacher)).rejects.toThrow('roster');
});
