import { createHash } from 'node:crypto';
import { Query } from 'node-appwrite';
import { textAssignmentAvailable } from './text-schedule.js';

export const discussionKey = (textId, classId) => createHash('sha256').update(JSON.stringify([textId, classId])).digest('hex').slice(0, 32);
const key = (...parts) => createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32);
const fail = message => { throw Object.assign(new Error(message), { code: 403 }); };
const short = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const categories = ['thought', 'question', 'connection'];

// These collections are server-only. Workspaces are implicit text/class pairs:
// listing/reading never creates documents, and reassignment reuses the same pair.
export async function readingDiscussionAction({ body, profile, userId, memberClassIds, db, databaseId }) {
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
    return { readings: available.flatMap(a => {
      const text = texts.find(t => t.$id === a.textId), cls = classes.find(c => c.$id === a.classId);
      const id = discussionKey(a.textId, a.classId);
      if (!text || !cls || seen.has(id) || (profile.role !== 'teacher' && text.status !== 'published')) return [];
      seen.add(id);
      return [{ id, textId: text.$id, classId: cls.$id, title: text.title, className: `${cls.courseName || ''} · ${cls.name}`, date: a.dueDate || a.assignedAt.slice(0, 10), available: text.status === 'published' && textAssignmentAvailable(a) }];
    }) };
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
  const visible = p => teacher || ancestors(p).every(a => !a.hidden);
  if (body.action === 'readReadingDiscussion') {
    const votes = await list('reading_votes', queries);
    const reports = teacher ? await list('reading_reports', queries) : [];
    const members = teacher ? await list('class_members', [Query.equal('classId', cls.$id), Query.equal('role', 'student')]) : [];
    const studentIds = [...new Set(members.map(m => m.userId))];
    const people = studentIds.length ? await list('users', [Query.equal('$id', studentIds)]) : [];
    return {
      title: text.title, className: `${cls.courseName || ''} · ${cls.name}`, teacher, canWrite: eligible && (teacher || profile.role === 'student'),
      posts: posts.filter(visible).map(p => {
        const { authorId, ...safe } = p;
        return { ...safe, mine: authorId === userId, ...(teacher ? { authorId } : {}),
          score: votes.filter(v => v.postId === p.id).length,
          voted: votes.some(v => v.postId === p.id && v.userId === userId),
          ...(teacher ? { reports: reports.filter(r => r.postId === p.id).map(r => ({ id: r.$id, reason: r.reason })) } : {}) };
      }),
      participation: people.map(person => ({ id: person.$id, name: person.name,
        ...Object.fromEntries(categories.map(category => [category, posts.filter(p => p.authorId === person.$id && !p.parentId && p.category === category).length])),
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
    if (body.parentId && (!parent || ancestors(parent).some(p => p.hidden || p.locked))) fail('This thread is hidden or locked');
    if (parent && ancestors(parent).length >= 4) fail('Replies may be nested three levels');
    const category = parent?.category || body.category;
    if (!categories.includes(category)) fail('Choose a contribution category');
    const paragraph = body.paragraph === '' || body.paragraph == null ? null : Number(body.paragraph);
    if (paragraph !== null && (!Number.isInteger(paragraph) || paragraph < 1 || paragraph > 10000)) fail('Use a paragraph number between 1 and 10000');
    const data = { parentId: parent?.id || null, category, content, quotation: short(body.quotation, 3000), paragraph,
      label: teacher ? 'Teacher' : `Reader ${key(workspaceId, userId).slice(0, 6).toUpperCase()}`, teacher,
      createdAt: new Date().toISOString(), hidden: false, locked: false, pinned: false };
    try { await db.createDocument(databaseId, 'reading_posts', id, { workspaceId, authorId: userId, dataJson: JSON.stringify(data) }, []); }
    catch (error) { if (error.code !== 409) throw error; }
    return { ok: true };
  }
  if (!selected || !visible(selected)) fail('Contribution is not available');
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
