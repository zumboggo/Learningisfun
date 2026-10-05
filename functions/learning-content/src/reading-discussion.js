import { createHash } from 'node:crypto';
import { Query } from 'node-appwrite';
import { atomicDiscussion, guardWorkspace, curatedActions, allocateQuestions } from './curated-questions.js';
import { textAssignmentAvailable } from './text-schedule.js';

export const discussionKey = (textId, classId) => createHash('sha256').update(JSON.stringify([textId, classId])).digest('hex').slice(0, 32);
const key = (...parts) => createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32);
const fail = message => { throw Object.assign(new Error(message), { code: 403 }); };
const quotationText=value=>typeof value==='string'?value.slice(0,3000):'';
const short = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const categories = ['thought', 'question', 'connection'];

// These collections are server-only. Workspaces are implicit text/class pairs:
// listing/reading never creates documents, and reassignment reuses the same pair.
export async function readingDiscussionAction(args) { return atomicDiscussion(args, discussionAction); }
async function discussionAction({ body, profile, userId, memberClassIds, db, databaseId, transactionId }) {
  const list = async (collection, queries = []) => {
    const documents = []; let cursor;
    do {
      const page = await db.listDocuments(databaseId, collection, [...queries, Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])]);
      documents.push(...page.documents); cursor = page.documents.length === 100 ? page.documents.at(-1).$id : null;
    } while (cursor);
    return documents;
  };
  if (body.action === 'listReadingDiscussions') {
    const classes = profile.role === 'teacher'
      ? await list('classes', [Query.equal('teacherId', userId)])
      : memberClassIds.size ? await list('classes', [Query.equal('$id', [...memberClassIds])]) : [];
    if (!classes.length) return { readings: [] };
    const assignments = await list('text_assignments', [Query.equal('classId', classes.map(c => c.$id))]);
    const available = assignments.filter(a => a.isAssignedReading === true && (profile.role === 'teacher' || textAssignmentAvailable(a)));
    const ids = [...new Set(available.map(a => a.textId))];
    const texts = ids.length ? await list('texts', [Query.equal('$id', ids)]) : [];
    const seen = new Set();
    const readings = available.flatMap(a => {
      const text = texts.find(t => t.$id === a.textId), cls = classes.find(c => c.$id === a.classId);
      const id = discussionKey(a.textId, a.classId);
      if (!text || !cls || seen.has(id) || (profile.role !== 'teacher' && text.status !== 'published')) return [];
      seen.add(id);
      return [{ id, textId: text.$id, classId: cls.$id,       title: text.title, className: `${cls.courseName || ''} · ${cls.name}`, date: a.dueDate || a.assignedAt.slice(0, 10), available: text.status === 'published' && textAssignmentAvailable(a) }];
    });
    const activity = new Map();
    for(let offset=0;offset<readings.length;offset+=100) {
      const rows=await list('reading_posts',[Query.equal('workspaceId',readings.slice(offset,offset+100).map(row=>row.id))]);
      const posts=rows.map(row=>({...JSON.parse(row.dataJson),id:row.$id,workspaceId:row.workspaceId}));
      const byId=new Map(posts.map(post=>[post.id,post]));
      for(const post of posts) {
        let current=post;const seen=new Set();let visible=true;
        while(current) {
          if(current.withdrawn||current.hidden||seen.has(current.id)||seen.size>3||current.workspaceId!==post.workspaceId){visible=false;break;}
          seen.add(current.id);
          if(current.parentId&&!byId.has(current.parentId)){visible=false;break;}
          current=current.parentId?byId.get(current.parentId):null;
        }
        if(!visible)continue;
        const counts=activity.get(post.workspaceId)||{questionCount:0,replyCount:0};
        if(post.parentId)counts.replyCount++;else if(post.category==='question')counts.questionCount++;
        activity.set(post.workspaceId,counts);
      }
    }
    return {readings:readings.map(row=>({...row,...(activity.get(row.id)||{questionCount:0,replyCount:0})}))};
  }
  const cls = await db.getDocument(databaseId, 'classes', body.classId);
  const teacher = profile.role === 'teacher' && cls.teacherId === userId;
  if (!teacher && (profile.role === 'teacher' || !memberClassIds.has(cls.$id))) fail('Class access required');
  const text = await db.getDocument(databaseId, 'texts', body.textId);
  const assigned = await list('text_assignments', [Query.equal('textId', text.$id), Query.equal('classId', cls.$id)]);
  if (!assigned.some(a => teacher || textAssignmentAvailable(a)) || (!teacher && text.status !== 'published')) fail('This reading is not available to this class yet');
  const eligible = assigned.some(a => a.isAssignedReading === true);
  if (!eligible && !teacher) fail('Only Assigned Readings have text discussions');
  if (!eligible && !['readReadingDiscussion','moderateReadingDiscussion'].includes(body.action)) fail('Mark this text as Assigned Reading to contribute');
  const workspaceId = discussionKey(text.$id, cls.$id);
  if(transactionId)await guardWorkspace(db,databaseId,workspaceId);
  let settings;
  try { settings = await db.getDocument(databaseId,'reading_settings',workspaceId); }
  catch (error) { if(error.code!==404)throw error; }
  const showStudentNames = settings ? JSON.parse(settings.dataJson).showStudentNames === true : false;
  if(body.action==='setReadingDiscussionIdentity') {
    if(!teacher)fail('Only the class teacher may change name visibility');
    if(typeof body.showStudentNames!=='boolean')fail('Choose a name visibility setting');
    const data={workspaceId,dataJson:JSON.stringify({showStudentNames:body.showStudentNames,updatedBy:userId,updatedAt:new Date().toISOString()})};
    if(settings)await db.updateDocument(databaseId,'reading_settings',workspaceId,data);
    else {
      try { await db.createDocument(databaseId,'reading_settings',workspaceId,data,[]); }
      catch(error) { if(error.code!==409)throw error;await db.updateDocument(databaseId,'reading_settings',workspaceId,data); }
    }
    return {ok:true};
  }
  const showNames = teacher || (profile.role==='student' && showStudentNames);
  const queries = [Query.equal('workspaceId', workspaceId)];
  const rows = await list('reading_posts', queries);
  const unpack = r => ({ ...JSON.parse(r.dataJson), id: r.$id, authorId: r.authorId });
  const posts = rows.map(unpack);
  const byId = new Map(posts.map(p => [p.id, p]));
  const ancestors = post => {
    const result = []; let current = post;
    while (current) {
      if (result.length > 3 || result.some(p => p.id === current.id)) fail('Invalid reply thread');
      result.push(current); current = current.parentId ? byId.get(current.parentId) : null;
    }
    return result;
  };
  const visible = p => ancestors(p).every(a=>!a.withdrawn)&&(teacher || ancestors(p).every(a => !a.hidden));
  const ownQuestions=posts.filter(p=>p.authorId===userId&&!p.parentId&&p.category==='question'&&!p.withdrawn);
  const publishedCount=ownQuestions.length;
  const draftRows=profile.role==='student'?await list('reading_question_drafts',[...queries,Query.equal('authorId',userId)]):[];
  const drafts=draftRows.map(unpack);
  const roundRows=await list('reading_reply_rounds',queries);
  const rounds=roundRows.map(r=>({...JSON.parse(r.dataJson),id:r.$id}));
  const writeRound=round=>{const {id,...saved}=round;return db.updateDocument(databaseId,'reading_reply_rounds',id,{dataJson:JSON.stringify(saved)});};
  const questionCandidates=async()=>{
    const votes=await list('reading_votes',queries);
    return posts.filter(p=>!p.parentId&&p.category==='question'&&!p.withdrawn&&!p.hidden&&!p.locked).map(p=>({...p,unanswered:!posts.some(r=>r.parentId===p.id),score:votes.filter(v=>v.postId===p.id).length}));
  };
  if(curatedActions.includes(body.action)) {
    if(['previewReadingAssignments','publishReadingAssignments'].includes(body.action)){
      if(!teacher)fail('Only the class teacher may assign questions');
      const members=await list('class_members',[Query.equal('classId',cls.$id),Query.equal('role','student')]);
      const roster=new Set(members.map(m=>m.userId));
      const students=[...new Set(Array.isArray(body.studentIds)?body.studentIds:[])];
      if(students.length>500||students.some(id=>!roster.has(id)))fail('Choose students from the current class roster');
      const existing=body.roundId?rounds.find(r=>r.id===body.roundId):null;
      if(body.roundId&&!existing)fail('Assignment round is not available');
      const retained=existing?existing.assignments.filter(a=>a.status==='completed'||(a.status==='pending'&&roster.has(a.studentId))):[];
      const participants=students.filter(id=>!retained.some(a=>a.studentId===id));
      const candidates=(await questionCandidates()).map(q=>({...q,unanswered:q.unanswered&&!retained.some(a=>a.questionId===q.id)}));
      const preview=[...retained,...allocateQuestions(participants,candidates)];
      if(body.action==='previewReadingAssignments')return {assignments:preview};
      const requestId=short(body.requestId,100);if(!requestId)fail('A publication request ID is required');
      const id=existing?.id||key(workspaceId,'round',userId,requestId);
      if(!existing&&rounds.some(r=>r.id===id))return {ok:true};
      // Preview is untrusted. Validate roster and self exclusions, then compare
      // its allocation with current available questions and coverage constraints.
      const proposed=Array.isArray(body.assignments)?body.assignments:[];
      if(proposed.length!==preview.length||new Set(proposed.map(a=>a.studentId)).size!==proposed.length)fail('Preview changed. Shuffle and review again');
      for(const entry of preview){
        const chosen=proposed.find(a=>a.studentId===entry.studentId);
        const kept=retained.find(a=>a.studentId===entry.studentId);
        if(kept){if(chosen?.questionId!==kept.questionId)fail('Completed and pending work must be preserved');continue;}
        if(chosen?.questionId===null){if(candidates.some(q=>q.authorId!==entry.studentId))fail('Eligible question available; refresh preview');}
        else if(!candidates.some(q=>q.id===chosen?.questionId&&q.authorId!==entry.studentId))fail('Question changed. Refresh preview');
      }
      const fresh=proposed.filter(a=>!retained.some(r=>r.studentId===a.studentId));
      const distinct=new Set(fresh.map(a=>a.questionId).filter(Boolean)).size;
      const expectedDistinct=new Set(preview.filter(a=>!retained.some(r=>r.studentId===a.studentId)).map(a=>a.questionId).filter(Boolean)).size;
      const unansweredIds=new Set(candidates.filter(q=>q.unanswered).map(q=>q.id));
      const freshUnanswered=new Set(fresh.filter(a=>unansweredIds.has(a.questionId)).map(a=>a.questionId)).size;
      const expectedUnanswered=new Set(preview.filter(a=>!retained.some(r=>r.studentId===a.studentId)&&unansweredIds.has(a.questionId)).map(a=>a.questionId)).size;
      if(distinct<expectedDistinct||freshUnanswered<expectedUnanswered)fail('Question coverage changed. Refresh preview');
      const assignments=[...retained,...fresh.map(a=>({studentId:a.studentId,questionId:a.questionId,status:a.questionId?'pending':'gap'}))];
      const data={assignments,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),teacherId:userId};
      if(existing)await writeRound({id,...data});else await db.createDocument(databaseId,'reading_reply_rounds',id,{workspaceId,dataJson:JSON.stringify(data)},[]);
      return {ok:true};
    }
    if(teacher||profile.role!=='student')fail('Question notebooks belong to students');
    if(body.action==='saveReadingQuestionDraft'){
      const draftId=short(body.draftId,100),content=short(body.content,10000);if(!draftId||!content)fail('Write a question before saving');
      const id=key(workspaceId,userId,'draft',draftId),old=drafts.find(d=>d.id===id);
      if(old?.publishedId)fail('This draft has already been published');
      if(old&&body.expectedUpdatedAt!==old.updatedAt&&content!==old.content)throw Object.assign(Error('This draft changed on another device. Your local writing is preserved; refresh and compare before saving.'),{code:409});
      if(old&&content===old.content)return {ok:true};
      const dataJson=JSON.stringify({content,draftId,updatedAt:new Date().toISOString()});
      if(old)await db.updateDocument(databaseId,'reading_question_drafts',id,{dataJson});else await db.createDocument(databaseId,'reading_question_drafts',id,{workspaceId,authorId:userId,dataJson},[]);
      return {ok:true};
    }
    if(body.action==='deleteReadingQuestionDraft'){const draft=drafts.find(d=>d.id===body.draftId);if(!draft||draft.publishedId)fail('Private draft is not available');await db.deleteDocument(databaseId,'reading_question_drafts',draft.id);return {ok:true};}
    if(body.action==='publishReadingQuestions'){
      const ids=[...new Set(Array.isArray(body.draftIds)?body.draftIds:[])];
      if(!ids.length||ids.length>3)fail('Choose up to three saved drafts');
      const chosen=ids.map(id=>drafts.find(d=>d.id===id));if(chosen.some(d=>!d))fail('Private draft is not available');
      const fresh=chosen.filter(d=>!d.publishedId);if(fresh.length&&publishedCount+fresh.length>3)fail('You can publish at most three questions per text discussion');
      for(const draft of fresh){
        const id=key(workspaceId,userId,'published',draft.id);
        const data={parentId:null,category:'question',content:draft.content,quotation:'',paragraph:null,label:`Reader ${key(workspaceId,userId).slice(0,6).toUpperCase()}`,teacher:false,createdAt:new Date().toISOString(),hidden:false,locked:false,pinned:false};
        await db.createDocument(databaseId,'reading_posts',id,{workspaceId,authorId:userId,dataJson:JSON.stringify(data)},[]);
        const {id:unused,authorId,...saved}=draft;void unused;void authorId;
        await db.updateDocument(databaseId,'reading_question_drafts',draft.id,{dataJson:JSON.stringify({...saved,publishedId:id})});
      }return {ok:true};
    }
    if(body.action==='withdrawReadingQuestion'){
      const selected=byId.get(body.postId);if(!selected||selected.authorId!==userId||selected.parentId||selected.category!=='question')fail('Only your own questions can be withdrawn');
      if(selected.withdrawn)return {ok:true};
      if(selected.everReplied||posts.some(p=>p.parentId===selected.id))fail('This question has a reply. Edit its wording instead');
      if(selected.locked)fail('This thread is locked');
      const {id,authorId,...saved}=selected;void authorId;
      await db.updateDocument(databaseId,'reading_posts',id,{dataJson:JSON.stringify({...saved,withdrawn:true,withdrawnAt:new Date().toISOString()})});
      for(const round of rounds){let changed=false;for(const a of round.assignments)if(a.questionId===id&&a.status==='pending'){a.status='cancelled';a.cancelledReason='Question withdrawn';changed=true;}if(changed)await writeRound(round);}
      return {ok:true};
    }
  }
  if (body.action === 'readReadingDiscussion') {
    const votes = await list('reading_votes', queries);
    const reports = teacher ? await list('reading_reports', queries) : [];
    const members = teacher ? await list('class_members', [Query.equal('classId', cls.$id), Query.equal('role', 'student')]) : [];
    const studentIds = [...new Set(members.map(m => m.userId))];
    const nameIds=showNames?[...new Set([...studentIds,...posts.filter(visible).map(p=>p.authorId)])]:[];
    const people = nameIds.length ? await list('users', [Query.equal('$id', nameIds)]) : [];
    return {
      curatedReady:true, ...(profile.role==='student'?{notebook:drafts.filter(d=>!d.publishedId).map(({id,content,draftId,updatedAt})=>({id,content,draftId,updatedAt})),publishedCount,remainingSpaces:Math.max(0,3-publishedCount),assignments:rounds.flatMap(r=>r.assignments.filter(a=>a.studentId===userId).map(a=>({...a,roundId:r.id,createdAt:r.createdAt})))}:{}),
      ...(teacher?{rounds:rounds.map(round=>({...round,assignments:round.assignments.map(a=>a.status==='pending'&&!studentIds.includes(a.studentId)?{...a,status:'cancelled',cancelledReason:'Student left class'}:a)})),awaitingReplies:posts.filter(p=>!p.parentId&&p.category==='question'&&!p.withdrawn&&!p.hidden&&!posts.some(r=>r.parentId===p.id)).map(p=>p.id)}:{}),
      title: text.title, className: `${cls.courseName || ''} · ${cls.name}`, teacher, showStudentNames, canWrite: eligible && (teacher || profile.role === 'student'),
      posts: posts.filter(visible).map(p => {
        const { authorId, ...safe } = p;
        return { ...safe, everReplied:p.everReplied||posts.some(r=>r.parentId===p.id), mine: authorId === userId, ...(teacher ? {authorId} : {}), ...(showNames ? {username:people.find(person=>person.$id===authorId)?.name||p.label} : {}),
          score: votes.filter(v => v.postId === p.id).length,
          voted: votes.some(v => v.postId === p.id && v.userId === userId),
          ...(teacher ? { reports: reports.filter(r => r.postId === p.id).map(r => ({ id: r.$id, reason: r.reason })) } : {}) };
      }),
      participation: people.filter(person=>studentIds.includes(person.$id)).map(person => ({ id: person.$id, name: person.name,
        ...Object.fromEntries(categories.map(category => [category, posts.filter(p => p.authorId === person.$id && !p.withdrawn && !p.parentId && p.category === category).length])),
        replies: posts.filter(p => p.authorId === person.$id && p.parentId).length })),
    };
  }
  if (!teacher && profile.role !== 'student') fail('This account is read-only');
  const selected = byId.get(body.postId);
  if (body.action === 'postReadingDiscussion') {
    const content = short(body.content, 10000), requestId = short(body.requestId, 100);
    if (!content || !requestId) fail('Write a contribution before posting');
    const id = key(workspaceId, userId, requestId);
    if (byId.has(id)) return { ok: true }; // A retry after a dropped response is safe.
    const parent = body.parentId ? byId.get(body.parentId) : null;
    if (body.parentId && (!parent || ancestors(parent).some(p => p.withdrawn || p.hidden || p.locked))) fail('This thread is hidden or locked');
    if (parent && ancestors(parent).length >= 4) fail('Replies may be nested three levels');
    const category = parent?.category || body.category;
    if (!categories.includes(category)) fail('Choose a contribution category');
    if(!teacher&&!parent&&category==='question'&&publishedCount>=3)fail('You can publish at most three questions per text discussion');
    const paragraph = body.paragraph === '' || body.paragraph == null ? null : Number(body.paragraph);
    if (paragraph !== null && (!Number.isInteger(paragraph) || paragraph < 1 || paragraph > 10000)) fail('Use a paragraph number between 1 and 10000');
    const data = { parentId: parent?.id || null, category, content, quotation: quotationText(body.quotation), paragraph,
      label: teacher ? 'Teacher' : `Reader ${key(workspaceId, userId).slice(0, 6).toUpperCase()}`, teacher,
      createdAt: new Date().toISOString(), hidden: false, locked: false, pinned: false };
    try { await db.createDocument(databaseId, 'reading_posts', id, { workspaceId, authorId: userId, dataJson: JSON.stringify(data) }, []); }
    catch (error) { if (error.code !== 409) throw error; }
    if(parent){
      const root=ancestors(parent).at(-1);const {id:rootId,authorId,...saved}=root;void authorId;
      await db.updateDocument(databaseId,'reading_posts',rootId,{dataJson:JSON.stringify({...saved,everReplied:true})});
      if(parent.id===rootId)for(const round of rounds){let changed=false;for(const a of round.assignments)if(a.studentId===userId&&a.questionId===rootId&&a.status==='pending'){a.status='completed';a.replyId=id;a.completedAt=data.createdAt;changed=true;}if(changed)await writeRound(round);}
    }
    return { ok: true };
  }
  if (!selected || !visible(selected)) fail('Contribution is not available');
  if (body.action === 'editReadingDiscussion') {
    if(selected.authorId!==userId)fail('Only your own contributions can be edited');
    if(ancestors(selected).some(p=>p.hidden||p.locked))fail('This thread is hidden or locked');
    if(body.expectedUpdatedAt!==(selected.updatedAt||selected.createdAt))throw Object.assign(new Error('This post changed. Refresh before editing again.'),{code:409});
    const content=short(body.content,10000),quotation=quotationText(body.quotation);
    if(!content)fail('Write a contribution before saving');
    const paragraph=body.paragraph===''||body.paragraph==null?null:Number(body.paragraph);
    if(paragraph!==null&&(!Number.isInteger(paragraph)||paragraph<1||paragraph>10000))fail('Use a paragraph number between 1 and 10000');
    const {id,authorId,...saved}=selected;
    await db.updateDocument(databaseId,'reading_posts',id,{dataJson:JSON.stringify({...saved,content,quotation,paragraph,updatedAt:new Date().toISOString()})});
    return {ok:true};
  }
  if (body.action === 'voteReadingDiscussion') {
    if (ancestors(selected).some(p => p.hidden)) fail('Contribution is hidden');
    if (typeof body.upvoted !== 'boolean') fail('Choose upvote or neutral');
    const id = key(workspaceId, selected.id, userId);
    if (body.upvoted) {
      try { await db.createDocument(databaseId, 'reading_votes', id, { workspaceId, postId: selected.id, userId }, []); }
      catch (error) { if (error.code !== 409) throw error; }
    } else { try { await db.deleteDocument(databaseId, 'reading_votes', id); } catch (error) { if (error.code !== 404) throw error; } }
    return { ok: true };
  }
  if (body.action === 'reportReadingDiscussion') {
    const reason = short(body.reason, 1000); if (reason.length < 3) fail('Please explain your concern');
    try { await db.createDocument(databaseId, 'reading_reports', key(workspaceId, selected.id, userId), { workspaceId, postId: selected.id, userId, reason }, []); }
    catch (error) { if (error.code !== 409) throw error; }
    return { ok: true };
  }
  if (body.action === 'moderateReadingDiscussion') {
    if (!teacher) fail('Only the class teacher may moderate');
    const fields = { hide: ['hidden', true], show: ['hidden', false], lock: ['locked', true], unlock: ['locked', false], pin: ['pinned', true], unpin: ['pinned', false] };
    if (body.operation === 'dismissReports') {
      const reports = await list('reading_reports', [...queries, Query.equal('postId', selected.id)]);
      for (const report of reports) await db.deleteDocument(databaseId, 'reading_reports', report.$id);
    } else {
      const change = fields[body.operation]; if (!change) fail('Invalid moderation action');
      const { id, authorId, ...data } = selected;
      await db.updateDocument(databaseId, 'reading_posts', id, { dataJson: JSON.stringify({ ...data, [change[0]]: change[1] }) });
    }
    return { ok: true };
  }
  fail('Unknown text discussion action');
}
