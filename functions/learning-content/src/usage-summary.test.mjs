import {test,expect,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {usageSummary} from './usage-summary.js';
const now=new Date('2026-10-26T12:00:00Z'), date='2026-10-25T12:00:00Z';
function fixture(extra={}) {
  const data={
    classes:[{$id:'c',teacherId:'t',name:'Class'},{$id:'c2',teacherId:'t',name:'Second'},{$id:'foreign',teacherId:'other'}],
    class_members:[{$id:'m',classId:'c',userId:'s',role:'student'},{$id:'m2',classId:'c2',userId:'s',role:'student'},{$id:'m3',classId:'c',userId:'inactive',role:'student'}],
    class_sessions:[{$id:'session',classId:'c',discussionType:'text'}],
    discussion_questions:[{$id:'q',classSessionId:'session',authorId:'s',moderationStatus:'visible',createdAt:date}],
    discussion_answers:[{$id:'a',questionId:'q',authorId:'s',createdAt:date}],
    ...extra,
  };
  const matches=(r,q)=>q.method==='equal'?q.values.includes(r[q.attribute]):q.method==='startsWith'?r[q.attribute]?.startsWith(q.values[0]):q.method==='or'?q.values.some(v=>matches(r,typeof v==='string'?JSON.parse(v):v)):true;
  const db={listDocuments:vi.fn(async(_,collection,queries)=>{
    const qs=queries.map(JSON.parse); let rows=(data[collection]||[]).filter(r=>qs.every(q=>matches(r,q)));
    const cursor=qs.find(q=>q.method==='cursorAfter');if(cursor)rows=rows.slice(rows.findIndex(r=>r.$id===cursor.values[0])+1);
    return {documents:rows.slice(0,qs.find(q=>q.method==='limit')?.values[0]||100)};
  })};
  return {db,databaseId:'main',profile:{role:'teacher'},userId:'t',body:{},now};
}
test('only owned classes; unique current students; no student data in response',async()=>{
  const result=await usageSummary(fixture());
  expect(result.students).toBe(2);expect(result.activeStudents).toBe(1);expect(result.classes).toHaveLength(2);
  expect(result.totals).toMatchObject({questions:1,replies:1});
  expect(JSON.stringify(result)).not.toMatch(/authorId|userId|inactive|foreign|dataJson/);
});
test('reject students, substitutes, invalid periods before data reads',async()=>{
  for(const role of ['student','substitute','parent']){const ctx=fixture();await expect(usageSummary({...ctx,profile:{role}})).rejects.toMatchObject({code:403});expect(ctx.db.listDocuments).not.toHaveBeenCalled();}
  await expect(usageSummary({...fixture(),body:{days:-1}})).rejects.toMatchObject({code:400});
});
test('pagination counts every question and excludes teacher, removed and non-members',async()=>{
  const questions=Array.from({length:205},(_,i)=>({$id:`q${i}`,classSessionId:'session',authorId:'s',moderationStatus:'visible',createdAt:date}));
  questions.push({...questions[0],$id:'teacher',isTeacherQuestion:true},{...questions[0],$id:'removed',moderationStatus:'removed'},{...questions[0],$id:'stranger',authorId:'outside'});
  expect((await usageSummary(fixture({discussion_questions:questions}))).totals.questions).toBe(205);
});
test('reading questions and replies are separate from thoughts and hidden/withdrawn posts',async()=>{
  const workspaceId=createHash('sha256').update(JSON.stringify(['text','c'])).digest('hex').slice(0,32);
  const posts=[{category:'question'},{category:'thought'},{parentId:'p0',category:'question'},{category:'question',hidden:true},{category:'question',withdrawn:true},{category:'question',teacher:true}].map((p,i)=>({$id:`p${i}`,workspaceId,authorId:'s',dataJson:JSON.stringify({...p,createdAt:date})}));
  const result=await usageSummary(fixture({text_assignments:[{$id:'ta',textId:'text',classId:'c'}],reading_posts:posts}));
  expect(result.totals).toMatchObject({questions:2,replies:2,discussionStarters:1});
});
test('episode snapshots deduplicate by student, assignment and attempt, excluding previews/results',async()=>{
  const episode=(id,kind,a,createdAt=date)=>({$id:id,kind,classId:'c',userId:'s',$createdAt:createdAt,dataJson:JSON.stringify(a)});
  const rows=[episode('e0','attempt',{attemptId:'one',assignmentId:'x',revision:0},'2026-09-01T00:00:00Z'),episode('e1','attempt',{attemptId:'one',assignmentId:'x',revision:1,status:'complete'}),episode('e2','attempt',{attemptId:'one',assignmentId:'x',revision:2,status:'complete'}),episode('preview','attempt',{attemptId:'preview',preview:true}),episode('an0','aa-xyz',{id:'two',assignmentId:'y',revision:0}),episode('an1','aa-xyz',{id:'two',assignmentId:'y',revision:1,complete:true}),episode('an2','animated-result',{id:'two',assignmentId:'y',complete:true})];
  const ctx=fixture({episode_records:rows});
  expect((await usageSummary(ctx)).totals).toMatchObject({episodeAttempts:2,episodeCompletions:2});
  expect((await usageSummary({...ctx,body:{days:7}})).totals).toMatchObject({episodeAttempts:1,episodeCompletions:2});
});
test('range, shared annotations and class-scoped practice count accurately',async()=>{
  const result=await usageSummary({...fixture({
    text_annotations:[{$id:'n',classId:'c',authorId:'s',moderationStatus:'visible',visibility:'private',createdAt:date}],
    flashcard_review_events:[{$id:'r',classId:'c',userId:'s',reviewedAt:date},{$id:'old',classId:'c',userId:'s',reviewedAt:'2026-01-01T00:00:00Z'}],
    flashcard_study_sessions:[{$id:'ss',classId:'c',userId:'s',startedAt:date,activeSeconds:120}],
  }),body:{days:7}});
  expect(result.totals).toMatchObject({annotations:0,flashcardReviews:1,studySeconds:120});
});
test('missing sources are explicit; service errors never become zero counts',async()=>{
  const ctx=fixture(), original=ctx.db.listDocuments;
  ctx.db.listDocuments=async(...args)=>{if(args[1]==='episode_records')throw {code:404};return original(...args);};
  expect((await usageSummary(ctx)).missingSources).toEqual(['episode_records']);
  ctx.db.listDocuments=async()=>{throw {code:503};};
  await expect(usageSummary(ctx)).rejects.toMatchObject({code:503});
});

test('teacher Data lists owned classes and rejects another teacher’s class before student reads',async()=>{
  const ctx=fixture();
  expect((await usageSummary({...ctx,body:{action:'teacherData'}})).classes.map(c=>c.id)).toEqual(['c','c2']);
  ctx.db.listDocuments.mockClear();
  await expect(usageSummary({...ctx,body:{action:'teacherData',classId:'foreign'}})).rejects.toMatchObject({code:403});
  expect(ctx.db.listDocuments.mock.calls.every(c=>c[1]==='classes')).toBe(true);
});
test('teacher Data includes zero-activity students and scoped participation without private writing',async()=>{
  const ctx=fixture({users:[{$id:'s',name:'Sam',email:'private@example.test'},{$id:'inactive',name:'Lee'}]});
  const r=await usageSummary({...ctx,body:{action:'teacherData',classId:'c',days:7}});
  expect(r.studentRows).toHaveLength(2);
  expect(r.studentRows.find(s=>s.name==='Sam')).toMatchObject({questions:1,replies:1});
  expect(r.studentRows.find(s=>s.name==='Lee')).toMatchObject({questions:0,replies:0,lastActivity:null});
  expect(JSON.stringify(r)).not.toMatch(/private@example|answerText|questionText/);
});
