import { test, expect } from 'vitest';
import { harness } from './reading-discussion-test-harness.mjs';
import { allocatePreferredQuestions } from './question-voting.js';

const read = {action:'readReadingDiscussion'};
const peer = {userId:'peer',role:'student',classIds:['blue']};
async function fixture(count=9) {
  const h=harness();h.storage.class_members.push({$id:'bp',userId:'peer',classId:'blue',role:'student'});
  for(let i=0;i<count;i++)await h.call({action:'postReadingDiscussion',category:'question',content:`Question ${i}?`,requestId:`q-${i}`},h.teacher);
  return h;
}
const start = {action:'startReadingQuestionVoting',requestId:'voting-1'};
const choose = (voting,postId=voting.questionIds[0]) => ({action:'chooseReadingQuestionVote',sessionId:voting.sessionId,roundIndex:voting.completedRounds,postId});

test('defaults to three rounds of three, persists choices, upvotes once, and keeps ballots private',async()=>{
  const {call,teacher,storage}=await fixture();
  await call(start,teacher);await call(start,teacher);
  expect(storage.reading_reply_rounds).toHaveLength(1);
  const seen=new Set();const choices=[];
  for(let step=0;step<3;step++){
    const data=await call(read),v=data.voting;
    expect(v.completedRounds).toBe(step);expect(v.totalRounds).toBe(3);expect(v.questionIds).toHaveLength(3);
    expect(v.questionIds.every(id=>!seen.has(id))).toBe(true);v.questionIds.forEach(id=>seen.add(id));
    const vote=choose(v);choices.push(vote.postId);await call(vote);await call(vote);
  }
  expect((await call(read)).voting).toMatchObject({completed:true,choices,questionIds:[]});
  expect(storage.reading_votes).toHaveLength(3);
  expect((await call(read)).posts.filter(p=>choices.includes(p.id)).every(p=>p.score===1)).toBe(true);
  expect((await call(read,peer)).voting.choices).toEqual([]);
  expect((await call(read,{userId:'parent',role:'parent',classIds:['blue']})).voting).toBeUndefined();
  const teacherData=await call(read,teacher);
  expect(teacherData.rounds).toEqual([]);
  expect(teacherData.voting.progress.find(p=>p.studentId==='student').completed).toBe(true);
  expect(teacherData.voting.choices).toBeUndefined();expect((await call(read)).assignments).toEqual([]);
});

test('enforces teacher controls, round order, issued options, roster and class isolation',async()=>{
  const {call,teacher}=await fixture();
  await expect(call(start)).rejects.toThrow('teacher');
  await expect(call({...start,roundCount:0},teacher)).rejects.toThrow('1–10');
  await expect(call({...start,questionsPerRound:1},teacher)).rejects.toThrow('2–10');
  await call({...start,roundCount:2,questionsPerRound:4},teacher);
  const v=(await call(read)).voting;
  expect(v).toMatchObject({totalRounds:2,questionsPerRound:4});
  await expect(call({...start,requestId:'second'},teacher)).rejects.toThrow('End the current');
  await expect(call({...choose(v),roundIndex:1})).rejects.toThrow('current round');
  const notOffered=(await call(read)).posts.find(p=>!v.questionIds.includes(p.id));
  await expect(call(choose(v,notOffered.id))).rejects.toThrow('current round');
  await expect(call({...choose(v),classId:'red'}, {userId:'peer',role:'student',classIds:['red']})).rejects.toThrow('available');
  await expect(call({action:'endReadingQuestionVoting',sessionId:v.sessionId})).rejects.toThrow('teacher');
  await call({action:'endReadingQuestionVoting',sessionId:v.sessionId},teacher);
  await expect(call(choose(v))).rejects.toThrow('current round');
  await call({...start,requestId:'second'},teacher);
  expect((await call(read)).voting.sessionId).not.toBe(v.sessionId);
});

test('reduces rounds for a small pool and excludes own, hidden, withdrawn and locked questions',async()=>{
  const {call,teacher}=await fixture(2);
  await call({action:'postReadingDiscussion',category:'question',content:'My own?',requestId:'own'});
  const own=(await call(read)).posts.find(p=>p.mine);
  await call(start,teacher);
  let v=(await call(read)).voting;expect(v.totalRounds).toBe(2);expect(v.questionIds).toHaveLength(2);expect(v.questionIds).not.toContain(own.id);
  const removed=v.questionIds[0];await call({action:'moderateReadingDiscussion',postId:removed,operation:'hide'},teacher);
  await expect(call(choose(v,removed))).rejects.toThrow('current round');
  v=(await call(read)).voting;expect(v.questionIds).toHaveLength(1);expect(v.totalRounds).toBe(1);
  await call(choose(v));expect((await call(read)).voting.completed).toBe(true);
});

test('simultaneous choices for one round cannot create extra votes or advance twice',async()=>{
  const {call,teacher,storage}=await fixture();await call(start,teacher);
  const v=(await call(read)).voting;
  const results=await Promise.allSettled([call(choose(v,v.questionIds[0])),call(choose(v,v.questionIds[1]))]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  expect((await call(read)).voting.completedRounds).toBe(1);expect(storage.reading_votes).toHaveLength(1);
});

test('uses students’ saved choices for preview and publication without mixing voting and reply rounds',async()=>{
  const {call,teacher}=await fixture();await call(start,teacher);
  for(const identity of [undefined,peer])for(let step=0;step<3;step++)await call(choose((await call(read,identity)).voting),identity);
  const a=(await call(read)).voting.choices,b=(await call(read,peer)).voting.choices;
  const preview=await call({action:'previewReadingAssignments',studentIds:['student','peer']},teacher);
  expect(a).toContain(preview.assignments.find(a=>a.studentId==='student').questionId);
  expect(b).toContain(preview.assignments.find(a=>a.studentId==='peer').questionId);
  await call({action:'publishReadingAssignments',studentIds:['student','peer'],assignments:preview.assignments,requestId:'reply-1'},teacher);
  expect((await call(read,teacher)).rounds).toHaveLength(1);
  expect((await call(read)).assignments).toHaveLength(1);
});

test('maximizes preference matches subject to distinct and unanswered coverage and self exclusions',()=>{
  const q=(id,authorId='teacher',unanswered=true)=>({id,authorId,unanswered,score:0});
  const result=allocatePreferredQuestions(['a','b'],[q('q1'),q('q2')],new Map([['a',['q1','q2']],['b',['q1']]]),()=>0);
  expect(result.find(r=>r.studentId==='a').questionId).toBe('q2');expect(result.find(r=>r.studentId==='b').questionId).toBe('q1');
  const collision=allocatePreferredQuestions(['a','b','c'],[q('q1'),q('q2')],new Map(['a','b','c'].map(s=>[s,['q1']])),()=>0);
  expect(new Set(collision.map(r=>r.questionId)).size).toBe(2);expect(collision.filter(r=>r.questionId==='q1')).toHaveLength(2);
  const unanswered=allocatePreferredQuestions(['a'],[q('answered','teacher',false),q('waiting')],new Map([['a',['answered']]]));
  expect(unanswered[0].questionId).toBe('waiting');
  expect(allocatePreferredQuestions(['a'],[q('own','a')],new Map([['a',['own']]]))[0].status).toBe('gap');
});

test('matches the best feasible allocation across small exhaustive cases',()=>{
  let seed=19;const random=()=>{seed=(seed*48271)%2147483647;return seed/2147483647;};
  const students=['a','b','c'];
  for(let trial=0;trial<40;trial++){
    const questions=Array.from({length:4},(_,i)=>({id:`q${i}`,authorId:['a','b','c','teacher'][Math.floor(random()*4)],unanswered:random()<0.5,score:Math.floor(random()*10)}));
    const preferences=new Map(students.map(s=>[s,questions.filter(()=>random()<0.5).map(q=>q.id)]));
    const quality=ids=>{
      const distinct=[...new Set(ids.filter(Boolean))];
      return distinct.length*100+distinct.filter(id=>questions.find(q=>q.id===id).unanswered).length*10+ids.filter((id,i)=>preferences.get(students[i]).includes(id)).length;
    };
    let best=-1;
    const search=(ids=[])=>{
      if(ids.length===students.length){best=Math.max(best,quality(ids));return;}
      const eligible=questions.filter(q=>q.authorId!==students[ids.length]).map(q=>q.id);
      for(const id of eligible.length?eligible:[null])search([...ids,id]);
    };
    search();
    const result=allocatePreferredQuestions(students,questions,preferences,random);
    expect(quality(result.map(r=>r.questionId))).toBe(best);
  }
});

test('a directly posted student question is immediately visible to classmates who have posted nothing',async()=>{
 const {call,teacher,storage}=await fixture(0);
 const request={action:'postReadingDiscussion',category:'question',content:'Can everyone see this?',requestId:'direct'};
 await call(request);await call(request);
 expect(storage.reading_posts).toHaveLength(1);expect(storage.reading_question_drafts).toHaveLength(0);
 expect((await call(read,peer)).posts).toEqual([expect.objectContaining({content:request.content,mine:false})]);
 expect((await call(read,teacher)).posts[0].content).toBe(request.content);
 expect((await call({...read,classId:'red'},{...peer,classIds:['red']})).posts).toEqual([]);
});
