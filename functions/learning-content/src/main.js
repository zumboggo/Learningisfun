import { Client, Databases, ID, Query } from 'node-appwrite';

const studentCollections = new Set(['quiz_attempts', 'writing_submissions', 'peer_reviews', 'discussion_questions', 'discussion_answers', 'question_votes', 'text_annotations', 'text_discussion_posts', 'text_discussion_votes']);
const teacherCollections = new Set(['quizzes', 'quiz_assignments', 'quiz_questions', 'writing_prompts', 'writing_prompt_assignments', 'texts', 'text_assignments', 'text_paragraphs']);
const clean = document => { const output = { ...document }; for (const key of Object.keys(output)) if (key.startsWith('$')) delete output[key]; output.$id = document.$id; return output; };

export default async ({ req, res, error }) => {
  try {
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ error: 'Authentication required' }, 401);
    const body = JSON.parse(req.bodyText || '{}');
    const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
    const db = new Databases(client), databaseId = process.env.APPWRITE_DATABASE_ID || 'main';
    const profile = await db.getDocument(databaseId, 'users', userId);
    const memberships = await db.listDocuments(databaseId, 'class_members', [Query.equal('userId', userId), Query.limit(500)]);
    const memberClassIds = new Set(memberships.documents.map(row => row.classId));

    if (body.action === 'readTexts') {
      const requested = Array.isArray(body.classIds) ? body.classIds : [];
      const allowedClassIds = requested.filter(classId => memberClassIds.has(classId));
      if (!allowedClassIds.length) return res.json({ assignments: [], texts: [], paragraphs: [], annotations: [] });
      const assignmentResult = await db.listDocuments(databaseId, 'text_assignments', [Query.equal('classId', allowedClassIds), Query.limit(5000)]);
      const assignments = assignmentResult.documents, textIds = [...new Set(assignments.map(row => row.textId))];
      if (!textIds.length) return res.json({ assignments: [], texts: [], paragraphs: [], annotations: [] });
      const [textResult, paragraphResult, annotationResult] = await Promise.all([
        db.listDocuments(databaseId, 'texts', [Query.equal('$id', textIds), Query.limit(5000)]),
        db.listDocuments(databaseId, 'text_paragraphs', [Query.equal('textId', textIds), Query.limit(5000)]),
        db.listDocuments(databaseId, 'text_annotations', [Query.equal('textId', textIds), Query.equal('classId', allowedClassIds), Query.limit(5000)]),
      ]);
      const ownCounts = new Map();
      for (const row of annotationResult.documents) if (row.authorId === userId) ownCounts.set(`${row.textId}:${row.classId}`, (ownCounts.get(`${row.textId}:${row.classId}`) || 0) + 1);
      const annotations = annotationResult.documents.filter(row => profile.role === 'teacher' || profile.role === 'parent' || row.authorId === userId || (ownCounts.get(`${row.textId}:${row.classId}`) || 0) >= 3).map(row => { const projected = clean(row); if (profile.role !== 'teacher' && row.authorId !== userId) delete projected.authorId; return projected; });
      return res.json({ assignments: assignments.map(clean), texts: textResult.documents.map(clean), paragraphs: paragraphResult.documents.map(clean), annotations });
    }

    if (body.action === 'readDiscussion') {
      const session = await db.getDocument(databaseId, 'class_sessions', body.sessionId);
      if (!memberClassIds.has(session.classId)) return res.json({ error: 'Not enrolled' }, 403);
      const [postResult, voteResult] = await Promise.all([
        db.listDocuments(databaseId, 'text_discussion_posts', [Query.equal('classSessionId', body.sessionId), Query.limit(5000)]),
        db.listDocuments(databaseId, 'text_discussion_votes', [Query.equal('classSessionId', body.sessionId), Query.limit(5000)]),
      ]);
      const posts = postResult.documents.filter(row => profile.role === 'teacher' || row.moderationStatus === 'visible').map(row => { const projected = clean(row); if (profile.role !== 'teacher' && row.authorId !== userId) delete projected.authorId; return projected; });
      const votes = voteResult.documents.filter(row => profile.role === 'teacher' || row.userId === userId).map(row => { const projected = clean(row); if (profile.role !== 'teacher') delete projected.userId; return projected; });
      return res.json({ posts, votes });
    }

    if (body.action !== 'mutate') return res.json({ error: 'Unsupported action' }, 400);
    const { collection, operation, id } = body;
    if (!studentCollections.has(collection) && !teacherCollections.has(collection)) return res.json({ error: 'Unsupported collection' }, 400);
    if (teacherCollections.has(collection) && profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
    if (studentCollections.has(collection) && profile.role === 'parent') return res.json({ error: 'Parent accounts are read-only' }, 403);
    const data = { ...body.data }; delete data.$id; delete data.syncStatus;
    let existing = null; if (operation !== 'create') { try { existing = await db.getDocument(databaseId, collection, id); } catch { /* upsert */ } }
    let classId = data.classId || existing?.classId;
    if (!classId && data.classSessionId) { const session = await db.getDocument(databaseId, 'class_sessions', data.classSessionId); classId = session.classId; data.classId ||= classId; }
    const isMember = classId ? memberClassIds.has(classId) : false;
    const ownedClass = classId ? await db.listDocuments(databaseId, 'classes', [Query.equal('$id', classId), Query.equal('teacherId', userId), Query.limit(1)]) : { total: 0 };
    const isTeacher = profile.role === 'teacher' && ownedClass.total > 0;
    if (studentCollections.has(collection) && classId && !isMember && !isTeacher) return res.json({ error: 'Not enrolled' }, 403);
    if (existing && !isTeacher) { const owner = existing.authorId || existing.userId || existing.reviewerId; if (owner && owner !== userId) return res.json({ error: 'Cannot change another student’s work' }, 403); }
    if ('authorId' in data && !isTeacher) data.authorId = userId; if ('userId' in data) data.userId = userId; if ('reviewerId' in data) data.reviewerId = userId;
    if (collection === 'text_discussion_posts' && data.parentId) { const parent = await db.getDocument(databaseId, collection, data.parentId); if (parent.locked || parent.depth >= 3 || parent.classId !== data.classId) return res.json({ error: 'Invalid or locked reply target' }, 400); data.depth = parent.depth + 1; }
    if (collection === 'text_discussion_votes') {
      const post = await db.getDocument(databaseId, 'text_discussion_posts', data.postId || existing?.postId);
      if (!memberClassIds.has(post.classId) && !isTeacher) return res.json({ error: 'Not enrolled' }, 403);
      const prior = await db.listDocuments(databaseId, collection, [Query.equal('postId', post.$id), Query.equal('userId', userId), Query.limit(1)]), oldValue = prior.documents[0]?.value || 0;
      if (operation === 'delete') { if (prior.total) await db.deleteDocument(databaseId, collection, prior.documents[0].$id); await db.updateDocument(databaseId, 'text_discussion_posts', post.$id, { score: post.score - oldValue, updatedAt: new Date().toISOString() }); return res.json({ ok: true }); }
      if (![-1, 1].includes(data.value)) return res.json({ error: 'Vote must be -1 or 1' }, 400);
      data.userId = userId; if (prior.total) await db.updateDocument(databaseId, collection, prior.documents[0].$id, data); else await db.createDocument(databaseId, collection, id || ID.unique(), data);
      await db.updateDocument(databaseId, 'text_discussion_posts', post.$id, { score: post.score - oldValue + data.value, updatedAt: new Date().toISOString() }); return res.json({ ok: true });
    }
    if (operation === 'delete') { await db.deleteDocument(databaseId, collection, id); return res.json({ ok: true }); }
    try { await db.createDocument(databaseId, collection, id, data); } catch { await db.updateDocument(databaseId, collection, id, data); }
    return res.json({ ok: true });
  } catch (err) { error(err.message); return res.json({ error: 'Request failed' }, 500); }
};
