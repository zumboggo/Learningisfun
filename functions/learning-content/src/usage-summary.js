import {teacherEpisodeRows} from './teacher-data-episodes.js';
import {createHash} from 'node:crypto';
import {Query} from 'node-appwrite';
import {listAll, writingWorkspace} from './writing-discussion.js';

const readingWorkspace = (text, cls) => createHash('sha256').update(JSON.stringify([text, cls])).digest('hex').slice(0,32);
const metricKeys = ['questions','replies','discussionStarters','writingResponses','annotations','flashcardReviews','studySeconds','episodeAttempts','episodeCompletions'];
const empty = () => Object.fromEntries(metricKeys.map(key => [key,0]));

// Aggregate summaries stay anonymous. The separate teacherData action returns
// per-student metrics only after checking ownership of the selected class.
export async function usageSummary({body, profile, userId, db, databaseId, storage, now = new Date()}) {
  if (!['teacher','admin'].includes(profile.role)) throw Object.assign(new Error('Teacher access required'), {code:403});
  const detailed = body.action === 'teacherData';
  const days = body.days ?? 0;
  if (![0,7,30].includes(days)) throw Object.assign(new Error('Choose all time, 7 days, or 30 days'), {code:400});
  const since = days ? new Date(now.getTime() - days * 86400000).toISOString() : null;
  const inRange = value => !!value && (!since || value >= since) && value <= now.toISOString();
  const missing = new Set();
  const list = async (collection, queries = []) => {
    try { return await listAll(db, databaseId, collection, queries); }
    catch (error) { if (error.code !== 404) throw error; missing.add(collection); return []; }
  };
  const byIds = async (collection, field, ids) => {
    const rows = [];
    for (let i=0;i<ids.length;i+=100) rows.push(...await list(collection,[Query.equal(field,ids.slice(i,i+100))]));
    return rows;
  };
  const ownedClasses = await list('classes',[Query.equal('teacherId',userId)]);
  if (detailed && body.classId && !ownedClasses.some(c=>c.$id===body.classId)) throw Object.assign(new Error('Only your own classes are available'),{code:403});
  if (detailed && !body.classId) return {classes:ownedClasses.map(c=>({id:c.$id,name:c.name,courseName:c.courseName||''}))};
  const classes = detailed ? ownedClasses.filter(c=>c.$id===body.classId) : ownedClasses;
  let studentRows = [], episodeRows = [];

  const totals = empty(), enrolled = new Set(), active = new Set(), rows = [];
  // Bound concurrency so a teacher with many classes cannot flood the database.
  const summarizeClass = async cls => {
    const scope = [Query.equal('classId',cls.$id)];
    const [members,sessions,assignments,legacyPosts,annotations,reviews,study,episodes] = await Promise.all([
      list('class_members',scope), list('class_sessions',scope), list('text_assignments',scope),
      list('text_discussion_posts',scope), list('text_annotations',scope),
      list('flashcard_review_events',scope), list('flashcard_study_sessions',scope), list('episode_records',[...scope,Query.or([Query.equal('kind','attempt'),Query.startsWith('kind','aa-')])]),
    ]);
    const students = new Set(members.filter(m=>m.role==='student' && (!m.expiresAt || m.expiresAt>now.toISOString()) && m.userId!==cls.teacherId).map(m=>m.userId));
    students.forEach(id=>enrolled.add(id));
    const details = new Map([...students].map(id=>[id,{userId:id,...empty(),lastActivity:null}]));
    const values = empty(), participants = new Set();
    const record = (key, id, date, amount=1) => {
      if (!students.has(id) || !inRange(date)) return;
      values[key] += amount; participants.add(id); active.add(id);
      const student=details.get(id); student[key]+=amount;
      if (!student.lastActivity || date>student.lastActivity) student.lastActivity=date;
    };
    const sessionMap = new Map(sessions.map(s=>[s.$id,s]));
    const questions = await byIds('discussion_questions','classSessionId',sessions.map(s=>s.$id));
    const questionMap = new Map(questions.map(q=>[q.$id,q]));
    const workspaces = [...new Set([
      ...assignments.map(a=>readingWorkspace(a.textId,cls.$id)),
      ...sessions.filter(s=>s.discussionType==='presentation').map(s=>writingWorkspace(s.$id)),
    ])];
    const [answers,posts,settings] = await Promise.all([
      byIds('discussion_answers','questionId',questions.map(q=>q.$id)),
      byIds('reading_posts','workspaceId',workspaces),
      byIds('reading_settings','workspaceId',sessions.filter(s=>s.discussionType==='presentation').map(s=>writingWorkspace(s.$id))),
    ]);
    const submissionSettings = new Map(settings.map(row=>[row.workspaceId,JSON.parse(row.dataJson).submissions||{}]));
    const unpacked = posts.map(row=>({...JSON.parse(row.dataJson),id:row.$id,authorId:row.authorId,workspaceId:row.workspaceId}));
    const threadPosts = new Map(unpacked.map(p=>[p.id,p]));
    for (const a of answers) {
      const session=sessionMap.get(questionMap.get(a.questionId)?.classSessionId);
      if (session?.discussionType==='presentation') {
        const workspaceId=writingWorkspace(session.$id);
        threadPosts.set(a.$id,{id:a.$id,workspaceId,...submissionSettings.get(workspaceId)?.[a.$id]});
      }
    }
    const visible = post => {
      let current=post; const seen=new Set();
      while(current) {
        if(current.hidden || current.withdrawn || seen.has(current.id) || current.workspaceId!==post.workspaceId)return false;
        seen.add(current.id);current=current.parentId?threadPosts.get(current.parentId):null;
      }
      return true;
    };
    for (const q of questions) if (!q.isTeacherQuestion && q.moderationStatus==='visible' && sessionMap.get(q.classSessionId)?.discussionType!=='presentation') record('questions',q.authorId,q.createdAt);
    for (const a of answers) {
      if (['hidden','removed'].includes(a.moderationStatus)) continue;
      const q = questionMap.get(a.questionId);
      if (!q || q.moderationStatus==='removed' || q.moderationStatus==='hidden') continue;
      if (threadPosts.has(a.$id) && !visible(threadPosts.get(a.$id))) continue;
      record(sessionMap.get(q.classSessionId)?.discussionType==='presentation'?'writingResponses':'replies',a.authorId,a.createdAt);
    }
    for (const p of legacyPosts) if (!p.isTeacherPost && p.moderationStatus==='visible') record(p.parentId?'replies':'discussionStarters',p.authorId,p.createdAt);
    for (const p of unpacked) {
      if (p.teacher || !visible(p)) continue;
      record(p.parentId?'replies':p.category==='question'?'questions':'discussionStarters',p.authorId,p.createdAt);
    }
    for (const a of annotations) if (a.moderationStatus==='visible' && (a.visibility||'class')!=='private') record('annotations',a.authorId,a.createdAt);
    for (const r of reviews) record('flashcardReviews',r.userId,r.reviewedAt);
    for (const s of study) if (Number.isFinite(s.activeSeconds) && s.activeSeconds>0) record('studySeconds',s.userId,s.startedAt,s.activeSeconds);
    // Both episode systems store immutable revisions. A play is one attempt,
    // not one snapshot, result row, page load, or save.
    const attempts = new Map();
    for (const row of episodes) {
      if (row.kind!=='attempt' && !row.kind.startsWith('aa-')) continue;
      const a=JSON.parse(row.dataJson);
      if (a.preview || !students.has(row.userId)) continue;
      const id=a.attemptId||a.id;
      if (!id) continue;
      const key=JSON.stringify([row.userId,a.assignmentId||a.episode,id]);
      const date=row.$createdAt||a.createdAt||a.updatedAt;
      if (inRange(date)) { participants.add(row.userId); active.add(row.userId); const detail=details.get(row.userId); if (!detail.lastActivity || date>detail.lastActivity) detail.lastActivity=date; }
      const complete=a.status==='complete'||a.complete===true;
      const old=attempts.get(key);
      if (!old) attempts.set(key,{userId:row.userId,startedAt:date,completedAt:complete?date:null});
      else {
        if (date<old.startedAt) old.startedAt=date;
        if (complete && (!old.completedAt||date<old.completedAt)) old.completedAt=date;
      }
    }
    for (const a of attempts.values()) {
      record('episodeAttempts',a.userId,a.startedAt);
      if (a.completedAt) record('episodeCompletions',a.userId,a.completedAt);
    }
    if (detailed) {
      const profiles = await byIds('users','$id',[...students]);
      const names = new Map(profiles.map(p=>[p.$id,p.name||p.nickname||'Unnamed student']));
      studentRows = [...details.values()].map(s=>({...s,name:names.get(s.userId)||'Unavailable student profile'})).sort((a,b)=>a.name.localeCompare(b.name));
      const assignedEpisodes = await list('episode_records',[...scope,Query.equal('kind','animated-assignment')]);
      episodeRows = await teacherEpisodeRows({records:episodes,assignments:assignedEpisodes,students,inRange,storage});
    }
    for (const key of metricKeys) totals[key]+=values[key];
    rows.push({name:cls.name,students:students.size,activeStudents:participants.size,...values});
  }
  for (let i=0;i<classes.length;i+=4) await Promise.all(classes.slice(i,i+4).map(summarizeClass));
  rows.sort((a,b)=>a.name.localeCompare(b.name));
  return {...(detailed?{studentRows,episodeRows}:{}),generatedAt:now.toISOString(),since,days,students:enrolled.size,activeStudents:active.size,classes:rows,totals,missingSources:[...missing]};
}
