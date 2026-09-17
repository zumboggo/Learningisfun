import { test, expect, vi, afterEach } from 'vitest';
import { readingDiscussionAction, discussionKey } from './reading-discussion.js';
afterEach(()=>vi.useRealTimers());
function harness() {
  const storage={
    classes:[{$id:'blue',teacherId:'teacher',courseName:'Literature',name:'Blue'},{$id:'red',teacherId:'teacher',courseName:'Literature',name:'Red'}],
    texts:[{$id:'text',title:'A reading',status:'published'}],
    text_assignments:[{$id:'ab',textId:'text',classId:'blue',isAssignedReading:true,assignedAt:'2026-09-01',dueDate:'2026-09-15'},{$id:'ar',textId:'text',classId:'red',isAssignedReading:true,assignedAt:'2026-09-01',dueDate:'2026-09-16'}],
    class_members:[{$id:'mb',userId:'student',classId:'blue',role:'student'},{$id:'mr',userId:'peer',classId:'red',role:'student'}],
    users:[{$id:'student',name:'Student'},{$id:'peer',name:'Peer'}],reading_posts:[],reading_votes:[],reading_reports:[],
  };
  const db={
    getDocument:vi.fn(async(_,collection,id)=>{const doc=storage[collection].find(r=>r.$id===id);if(!doc)throw Object.assign(Error('Missing'),{code:404});return doc;}),
    listDocuments:vi.fn(async(_,collection,queries)=>{
      let rows=[...storage[collection]];let limit=100;
      for(const raw of queries){const q=JSON.parse(raw);if(q.method==='equal')rows=rows.filter(r=>q.values.includes(r[q.attribute]));if(q.method==='cursorAfter')rows=rows.slice(rows.findIndex(r=>r.$id===q.values[0])+1);if(q.method==='limit')limit=q.values[0];}
      return {documents:rows.slice(0,limit),total:rows.length};
    }),
    createDocument:vi.fn(async(_,collection,id,data)=>{if(storage[collection].some(r=>r.$id===id))throw Object.assign(Error('Conflict'),{code:409});const doc={$id:id,...data};storage[collection].push(doc);return doc;}),
    updateDocument:vi.fn(async(_,collection,id,data)=>Object.assign(storage[collection].find(r=>r.$id===id),data)),
    deleteDocument:vi.fn(async(_,collection,id)=>{storage[collection]=storage[collection].filter(r=>r.$id!==id);}),
  };
  const call=(body,identity={userId:'student',role:'student',classIds:['blue']})=>readingDiscussionAction({body:{textId:'text',classId:'blue',...body},profile:{role:identity.role},userId:identity.userId,memberClassIds:new Set(identity.classIds),db,databaseId:'main'});
  const teacher={userId:'teacher',role:'teacher',classIds:[]};
  return {storage,db,call,teacher};
}
const post=(requestId,category='thought',extra={})=>({action:'postReadingDiscussion',requestId,category,content:'I noticed something.',...extra});
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
