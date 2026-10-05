import {harness} from './reading-discussion-test-harness.mjs';
import { test, expect, vi, afterEach } from 'vitest';
import { discussionKey } from './reading-discussion.js';
afterEach(()=>vi.useRealTimers());
const post=(requestId,category='thought',extra={})=>({action:'postReadingDiscussion',requestId,category,content:'I noticed something.',...extra});
test('teacher usernames are private and authors can edit without changing ownership',async()=>{
 const {call,storage,teacher}=harness();await call(post('editable'));
 const own=(await call({action:'readReadingDiscussion'})).posts[0];
 expect(own).not.toHaveProperty('username');
 expect((await call({action:'readReadingDiscussion'},teacher)).posts[0].username).toBe('Student');
 const change={action:'editReadingDiscussion',postId:own.id,content:'Updated thought',quotation:'Quoted words',paragraph:3,expectedUpdatedAt:own.createdAt,authorId:'teacher',category:'question'};
 await expect(call(change,teacher)).rejects.toThrow('own');
 await expect(call({...change,content:''})).rejects.toThrow('Write');
 await call(change);
 const saved=(await call({action:'readReadingDiscussion'})).posts[0];
 expect(saved).toMatchObject({content:'Updated thought',category:'thought',paragraph:3});
 expect(storage.reading_posts[0].authorId).toBe('student');
 await expect(call({...change,expectedUpdatedAt:'old'})).rejects.toThrow('changed');
 await call({action:'moderateReadingDiscussion',postId:own.id,operation:'lock'},teacher);
 await expect(call({...change,expectedUpdatedAt:saved.updatedAt})).rejects.toThrow('locked');
});
test('listing is automatic, grouped data is section specific, deduplicated and read-only',async()=>{
  const {call,storage,db,teacher}=harness();
  storage.text_assignments.push({...storage.text_assignments[0],$id:'duplicate'});
  const mine=await call({action:'listReadingDiscussions'});
  expect(mine.readings).toHaveLength(1);expect(mine.readings[0].classId).toBe('blue');
  expect((await call({action:'listReadingDiscussions'},teacher)).readings).toHaveLength(2);
  expect(db.createDocument).not.toHaveBeenCalled();
  expect(discussionKey('text','red')).not.toBe(discussionKey('text','blue'));
});
test('release respects Friday 08:00 China and published status',async()=>{
  vi.useFakeTimers();const {call,storage,teacher}=harness();
  vi.setSystemTime(new Date('2026-09-10T23:59:59Z'));
  expect((await call({action:'listReadingDiscussions'})).readings).toHaveLength(0);
  await expect(call({action:'readReadingDiscussion'})).rejects.toThrow('not available');
  expect((await call({action:'listReadingDiscussions'},teacher)).readings).toHaveLength(2);
  vi.setSystemTime(new Date('2026-09-11T00:00:00Z'));
  expect((await call({action:'listReadingDiscussions'})).readings).toHaveLength(1);
  storage.texts[0].status='draft';await expect(call({action:'readReadingDiscussion'})).rejects.toThrow('not available');
});
test('access denied across sections, unrelated teachers, and after unassignment',async()=>{
  const {call,storage}=harness();
  await expect(call({action:'readReadingDiscussion',classId:'red'})).rejects.toThrow('Class access');
  await expect(call(post('x'),{userId:'other',role:'teacher',classIds:['blue']})).rejects.toThrow('Class access');
  storage.text_assignments=[];await expect(call(post('x'))).rejects.toThrow('not available');
});
test('all categories immediately visible with anonymous authors; retries do not duplicate',async()=>{
  const {call,storage,teacher}=harness();
  for(const c of ['thought','question','connection'])await call(post(c,c,{authorId:'impersonation'}));
  await call(post('thought'));
  expect(storage.reading_posts).toHaveLength(3);expect(storage.reading_posts[0].authorId).toBe('student');
  const read=await call({action:'readReadingDiscussion'},{userId:'classmate',role:'student',classIds:['blue']});
  expect(read.posts).toHaveLength(3);expect(read.posts[0]).not.toHaveProperty('authorId');expect(read.posts[0].label).toMatch(/^Reader /);
  const report=await call({action:'readReadingDiscussion'},teacher);expect(report.participation[0]).toMatchObject({thought:1,question:1,connection:1});
});
test('replies stay in their workspace, inherit category and stop at three levels',async()=>{
  const {call,storage}=harness();await call(post('root','question'));let parentId=storage.reading_posts[0].$id;
  for(let i=0;i<3;i++){await call(post(`reply${i}`,'thought',{parentId}));parentId=storage.reading_posts.at(-1).$id;}
  await expect(call(post('too-deep','question',{parentId}))).rejects.toThrow('three levels');
  expect(JSON.parse(storage.reading_posts[1].dataJson).category).toBe('question');
  await expect(call(post('cross','thought',{parentId,classId:'red'}),{userId:'peer',role:'student',classIds:['red']})).rejects.toThrow('hidden or locked');
});
test('upvotes are unique, toggle to neutral, and cannot impersonate another voter',async()=>{
  const {call,storage,teacher}=harness();await call(post('root'));const postId=storage.reading_posts[0].$id;
  await Promise.all([1,2,3].map(()=>call({action:'voteReadingDiscussion',postId,upvoted:true,userId:'other'})));
  expect(storage.reading_votes).toHaveLength(1);expect(storage.reading_votes[0].userId).toBe('student');
  await call({action:'voteReadingDiscussion',postId,upvoted:true},teacher);
  expect((await call({action:'readReadingDiscussion'})).posts[0].score).toBe(2);
  await call({action:'voteReadingDiscussion',postId,upvoted:false});expect(storage.reading_votes).toHaveLength(1);
  await expect(call({action:'voteReadingDiscussion',postId,upvoted:-1})).rejects.toThrow('neutral');
});
test('teacher controls lock/hide/pin; reports are private and parents cannot contribute',async()=>{
  const {call,storage,teacher}=harness();await call(post('root'));const postId=storage.reading_posts[0].$id;
  await call({action:'reportReadingDiscussion',postId,reason:'Please check this'});
  expect((await call({action:'readReadingDiscussion'})).posts[0]).not.toHaveProperty('reports');
  expect((await call({action:'readReadingDiscussion'},teacher)).posts[0].reports).toHaveLength(1);
  await expect(call({action:'moderateReadingDiscussion',postId,operation:'hide'})).rejects.toThrow('teacher');
  await call({action:'moderateReadingDiscussion',postId,operation:'lock'},teacher);
  await expect(call(post('reply','thought',{parentId:postId}))).rejects.toThrow('locked');
  expect((await call({action:'readReadingDiscussion'})).posts).toHaveLength(1);
  await call({action:'moderateReadingDiscussion',postId,operation:'pin'},teacher);
  await call({action:'moderateReadingDiscussion',postId,operation:'hide'},teacher);
  expect((await call({action:'readReadingDiscussion'})).posts).toHaveLength(0);
  expect((await call({action:'readReadingDiscussion'},teacher)).posts[0].pinned).toBe(true);
  await expect(call(post('parent'),{userId:'parent',role:'parent',classIds:['blue']})).rejects.toThrow('read-only');
});
test('quotation is a snapshot and work survives removal/reassignment',async()=>{
  const {call,storage}=harness();await call(post('root','thought',{quotation:'Original wording',paragraph:2}));
  storage.texts[0].title='Revised text';
  const prior=storage.text_assignments;storage.text_assignments=[];await expect(call({action:'readReadingDiscussion'})).rejects.toThrow();
  storage.text_assignments=prior;const result=await call({action:'readReadingDiscussion'});
  expect(result.posts[0]).toMatchObject({quotation:'Original wording',paragraph:2});expect(result.posts).toHaveLength(1);
});
test('hidden ancestor hides replies, and legacy collections are never queried or mutated',async()=>{
  const {call,storage,db,teacher}=harness();await call(post('root'));const postId=storage.reading_posts[0].$id;
  await call(post('reply','thought',{parentId:postId}));await call({action:'moderateReadingDiscussion',postId,operation:'hide'},teacher);
  expect((await call({action:'readReadingDiscussion'})).posts).toHaveLength(0);
  for(const method of ['listDocuments','createDocument','updateDocument','deleteDocument'])expect(db[method].mock.calls.some(args=>['text_annotations','tqe_records'].includes(args[1]))).toBe(false);
});

test('optional readings are excluded without deleting saved contributions',async()=>{
 const {call,storage,teacher}=harness();await call(post('saved'));
 storage.text_assignments.forEach(a=>a.isAssignedReading=false);
 expect((await call({action:'listReadingDiscussions'},teacher)).readings).toHaveLength(0);
 await expect(call(post('blocked'))).rejects.toThrow('Assigned Readings');
 expect((await call({action:'readReadingDiscussion'},teacher)).canWrite).toBe(false);
 expect(storage.reading_posts).toHaveLength(1);
});

test('class owner controls student names, scoped to text/class without leaking identifiers',async()=>{
 const {call,teacher}=harness();await call(post('root'));
 const read=()=>call({action:'readReadingDiscussion'});
 expect((await read()).posts[0]).not.toHaveProperty('username');
 await expect(call({action:'setReadingDiscussionIdentity',showStudentNames:true})).rejects.toThrow('teacher');
 await call({action:'setReadingDiscussionIdentity',showStudentNames:true},teacher);
 const named=await read();expect(named.showStudentNames).toBe(true);
 expect(named.posts[0].username).toBe('Student');expect(named.posts[0]).not.toHaveProperty('authorId');
 expect(named.participation).toEqual([]);
 expect((await call({action:'readReadingDiscussion',classId:'red'},teacher)).showStudentNames).toBe(false);
 const parent=await call({action:'readReadingDiscussion'},{userId:'parent',role:'parent',classIds:['blue']});
 expect(parent.posts[0]).not.toHaveProperty('username');
 await call({action:'setReadingDiscussionIdentity',showStudentNames:false},teacher);
 expect((await read()).posts[0]).not.toHaveProperty('username');
});

test('students can upvote many questions and replies once each without a vote budget',async()=>{
 const {call,storage,teacher}=harness();
 for(let i=0;i<8;i++) await call(post(`question-${i}`,'question'),teacher);
 const parentId=storage.reading_posts[0].$id;
 for(let i=0;i<5;i++) await call(post(`reply-${i}`,'question',{parentId}));
 for(const row of storage.reading_posts) {
  await call({action:'voteReadingDiscussion',postId:row.$id,upvoted:true});
  await call({action:'voteReadingDiscussion',postId:row.$id,upvoted:true});
 }
 expect(storage.reading_votes).toHaveLength(13);
 expect((await call({action:'readReadingDiscussion'})).posts.every(p=>p.score===1&&p.voted)).toBe(true);
});

test('listing reports visible questions and replies by class without leaking posts or authors',async()=>{
 const {call,storage,teacher}=harness();
 await call(post('thought','thought'));
 let listing=await call({action:'listReadingDiscussions'});
 expect(listing.readings[0]).toMatchObject({questionCount:0,replyCount:0});
 const parentId=storage.reading_posts[0].$id;
 await call(post('reply','thought',{parentId}));
 await call(post('question','question'));
 await call(post('red-question','question',{classId:'red'}),{userId:'peer',role:'student',classIds:['red']});
 listing=await call({action:'listReadingDiscussions'});
 expect(listing.readings).toHaveLength(1);
 expect(listing.readings[0]).toMatchObject({classId:'blue',questionCount:1,replyCount:1});
 expect(listing.readings[0]).not.toHaveProperty('posts');expect(listing.readings[0]).not.toHaveProperty('authorId');
 const all=(await call({action:'listReadingDiscussions'},teacher)).readings;
 expect(all.find(row=>row.classId==='red')).toMatchObject({questionCount:1,replyCount:0});
});
test('hidden questions and replies beneath hidden ancestors do not make a listing active',async()=>{
 const {call,storage,teacher}=harness();
 await call(post('root','question'));const parentId=storage.reading_posts[0].$id;
 await call(post('reply','thought',{parentId}));
 await call({action:'moderateReadingDiscussion',postId:parentId,operation:'hide'},teacher);
 expect((await call({action:'listReadingDiscussions'})).readings[0]).toMatchObject({questionCount:0,replyCount:0});
 await call({action:'moderateReadingDiscussion',postId:parentId,operation:'show'},teacher);
 expect((await call({action:'listReadingDiscussions'})).readings[0]).toMatchObject({questionCount:1,replyCount:1});
});
test('listing counts beyond a page of contributions and ignores unassigned workspaces',async()=>{
 const {call,storage}=harness();
 for(let i=0;i<105;i++)storage.reading_posts.push({$id:`post-${i}`,workspaceId:discussionKey('text','blue'),authorId:'student',dataJson:JSON.stringify({parentId:null,category:'question',hidden:false})});
 storage.reading_posts.push({$id:'other',workspaceId:discussionKey('other-text','blue'),authorId:'student',dataJson:JSON.stringify({category:'question'})});
 expect((await call({action:'listReadingDiscussions'})).readings[0].questionCount).toBe(105);
});
