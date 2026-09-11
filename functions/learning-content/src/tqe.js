import { textAssignmentAvailable } from './text-schedule.js';
import { createHash } from 'node:crypto';

export const tqeComplete = (rows, stage = 'full') => (stage === 'thought' ? ['thought'] : ['thought','question','epiphany']).every(type => rows.some(a => a.tqeType === type && (a.kind || 'annotation') === 'annotation' && (a.visibility || 'class') === 'class' && a.moderationStatus === 'visible' && a.content?.trim()));

// Each nomination, nudge, group, and response is a separate document, avoiding
// whole-class read/modify/write races when students submit simultaneously.
export async function handleTqe({ body, db, databaseId, Query, userId, profile, res }) {
  const text = await db.getDocument(databaseId, 'texts', body.textId);
  const cls = await db.getDocument(databaseId, 'classes', body.classId);
  const teacher = profile.role === 'teacher' && cls.teacherId === userId;
  const members = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', cls.$id), Query.limit(5000)]);
  const student = profile.role === 'student' && members.documents.some(m => m.userId === userId && m.role === 'student');
  if (!teacher && !student) return res.json({ error: 'Class access required' }, 403);
  if (!teacher && text.status !== 'published') return res.json({ error: 'Reading is not published' }, 403);
  const assigned = await db.listDocuments(databaseId, 'text_assignments', [Query.equal('textId', text.$id), Query.equal('classId', cls.$id), Query.limit(1)]);
  if (!assigned.documents.some(row=>teacher||textAssignmentAvailable(row))) return res.json({ error: 'Text is not assigned here' }, 403);
  const list = async collection => {
    const rows = []; let cursor;
    do {
      const page = await db.listDocuments(databaseId, collection, [Query.equal('textId', text.$id), Query.equal('classId', cls.$id), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])]);
      rows.push(...page.documents); cursor = page.documents.length === 100 ? page.documents.at(-1).$id : undefined;
    } while (cursor);
    return rows;
  };
  const [annotations, records] = await Promise.all([list('text_annotations'), list('tqe_records')]);
  const eligible = annotations.filter(a => a.moderationStatus === 'visible' && (a.visibility || 'class') === 'class' && (a.kind || 'annotation') === 'annotation' && a.tqeType);
  const mine = annotations.filter(a => a.authorId === userId);
  const unlocked = teacher || tqeComplete(mine, text.tqeStage);
  const unpack = row => ({ id: row.$id, kind: row.kind, ownerId: row.ownerId, ...JSON.parse(row.payloadJson) });
  const groups = records.filter(r => r.kind === 'group').map(unpack);
  if (body.action === 'readTqe') {
    const visible = records.filter(r => {
      const payload = JSON.parse(r.payloadJson);
      if (!teacher && ['table','bring'].includes(r.kind) && !eligible.some(a => a.$id === payload.annotationId)) return false;
      return teacher || r.ownerId === userId || (r.kind === 'nudge' && payload.studentId === userId) || (unlocked && ['group','table','bring'].includes(r.kind));
    }).map(unpack);
    for (const row of visible) if (row.kind === 'group') row.candidateIds = eligible.filter(a => row.memberIds.includes(a.authorId) && tqeComplete(annotations.filter(note => note.authorId === a.authorId), text.tqeStage)).map(a => a.$id);
    if (!teacher) for (const row of visible) { if (row.ownerId !== userId) delete row.ownerId; if (row.kind === 'group') { row.mine = row.memberIds.includes(userId); delete row.memberIds; } delete row.studentId; }
    let roster = [];
    if (teacher) roster = await Promise.all([...new Set(members.documents.filter(m => m.role === 'student').map(m => m.userId))].map(async id => {
      let name = 'Student'; try { name = (await db.getDocument(databaseId, 'users', id)).name || name; } catch { /* roster may precede profile */ }
      const own = eligible.filter(a => a.authorId === id);
      return { id, name, thought: own.filter(a => a.tqeType === 'thought').length, question: own.filter(a => a.tqeType === 'question').length, epiphany: own.filter(a => a.tqeType === 'epiphany').length };
    }));
    return res.json({ records: visible, roster, unlocked });
  }
  const kind = body.kind;
  if (!['bring','table','nudge','group','door','exit','participation'].includes(kind)) return res.json({error:'Invalid TQE action'},400);
  if (['table','nudge','participation'].includes(kind) && !teacher) return res.json({error:'Teacher only'},403);
  let ownerId = userId, key = userId, payload = {};
  const short = value => String(value || '').trim().slice(0,5000);
  const findAnnotation = id => eligible.find(a => a.$id === id);
  if (kind === 'bring' || kind === 'table' || kind === 'nudge') {
    const annotation = findAnnotation(body.annotationId);
    if (!annotation || (kind === 'bring' && annotation.authorId !== userId)) return res.json({error:'Choose an available annotation'},403);
    if (kind !== 'bring') key = annotation.$id;
    payload = { annotationId: annotation.$id };
    if (kind === 'table') Object.assign(payload, { content: short(body.content) || annotation.content, discussed: Boolean(body.discussed) });
    if (kind === 'nudge') Object.assign(payload, { studentId: annotation.authorId, content: short(body.content) });
  }
  if (kind === 'group') {
    key = short(body.groupId);
    if (!key) return res.json({error:'Group is required'},400);
    const group = groups.find(g => g.groupId === key);
    if (!teacher && (!group || !group.memberIds.includes(userId) || !unlocked)) return res.json({error:'Complete your TQEs and join this group first'},403);
    const memberIds = teacher ? [...new Set((body.memberIds || []).filter(id => members.documents.some(m => m.userId === id && m.role === 'student')))] : group.memberIds;
    if (teacher && groups.some(g => g.groupId !== key && g.memberIds.some(id => memberIds.includes(id)))) return res.json({error:'A student already belongs to another group'},400);
    const selections = Array.isArray(body.selections) ? body.selections : [];
    if (selections.length > 2 || new Set(selections).size !== selections.length || selections.some(id => { const a = findAnnotation(id); return !a || !memberIds.includes(a.authorId) || !tqeComplete(annotations.filter(row => row.authorId === a.authorId), text.tqeStage); })) return res.json({error:'Choose up to two different TQEs from prepared group members'},400);
    ownerId = cls.teacherId;
    payload = { groupId:key, label:short(teacher ? body.label : group.label), memberIds, selections };
  }
  if (kind === 'door') {
    if (!['speak','annotations','conversation'].includes(body.choice)) return res.json({error:'Choose a participation option'},400);
    payload = { choice:body.choice };
  }
  if (kind === 'exit') { payload = { content:short(body.content) }; if (!payload.content) return res.json({error:'Write an exit reflection'},400); }
  if (kind === 'participation') {
    if (!members.documents.some(m => m.userId === body.studentId && m.role === 'student') || !['thought','question','epiphany'].includes(body.type)) return res.json({error:'Invalid participation entry'},400);
    key = short(body.eventId); if (!key) return res.json({error:'Event ID required'},400);
    payload = { studentId:body.studentId, type:body.type, date:new Date().toISOString() };
  }
  const id = 'tqe_' + createHash('sha256').update(`${text.$id}:${cls.$id}:${kind}:${key}`).digest('hex').slice(0,32);
  if (body.remove) {
    if (!records.some(r => r.$id === id)) return res.json({ok:true});
    if (kind === 'group' && !teacher) return res.json({error:'Teacher only'},403);
    await db.deleteDocument(databaseId,'tqe_records',id);
  } else {
    const data = { textId:text.$id, classId:cls.$id, kind, ownerId, payloadJson:JSON.stringify(payload), updatedAt:new Date().toISOString() };
    try { await db.createDocument(databaseId,'tqe_records',id,data,[]); } catch (error) { if (error.code !== 409) throw error; await db.updateDocument(databaseId,'tqe_records',id,data); }
  }
  return res.json({ok:true});
}
