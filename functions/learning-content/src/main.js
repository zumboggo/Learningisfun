import { Client, Databases, ID, Query } from 'node-appwrite';
import { createHash } from 'node:crypto';

const studentCollections = new Set(['quiz_attempts', 'writing_submissions', 'peer_reviews', 'discussion_questions', 'discussion_answers', 'question_votes', 'text_annotations', 'text_discussion_posts', 'text_discussion_votes']);
const teacherCollections = new Set(['classes', 'deck_assignments', 'quizzes', 'quiz_assignments', 'quiz_questions', 'writing_prompts', 'writing_prompt_assignments', 'texts', 'text_assignments', 'text_paragraphs']);
const clean = document => { const output = { ...document }; for (const key of Object.keys(output)) if (key.startsWith('$')) delete output[key]; output.$id = document.$id; return output; };
const membershipId = (classId, userId) => `member_${createHash('sha256').update(`${classId}:${userId}`).digest('hex').slice(0, 29)}`;
const nicknameTokens = value => String(value || '').normalize('NFKD').toLowerCase().replace(/[013457@$!]/g, character => ({ '0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i' }[character] || character)).split(/[^a-z]+/).filter(Boolean);
const nicknameError = value => {
  const nickname = String(value || '').trim().replace(/\s+/g, ' ');
  if (nickname.length < 2 || nickname.length > 24) return 'Use between 2 and 24 characters';
  if (!/^[\p{L}\p{N} ._'’-]+$/u.test(nickname)) return 'Nickname contains unsupported characters';
  const tokens = nicknameTokens(nickname), compact = tokens.join('');
  const exact = new Set(['porn','sex','dick','penis','vagina','whore','slut','retard','nazi','hitler','kkk','teacher','admin','administrator']);
  const strong = ['fuck','shit','bitch','cunt','nigger','nigga','faggot','asshole','pornhub'];
  if (tokens.some(token=>exact.has(token)) || strong.some(term=>compact.includes(term))) return 'Please choose a school-appropriate nickname';
  return null;
};
const ensureSingleMembership = async (db, databaseId, classId, memberUserId, role) => {
  const existing = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', classId), Query.equal('userId', memberUserId), Query.limit(500)]);
  if (existing.total) {
    const keep = existing.documents[0];
    for (const duplicate of existing.documents.slice(1)) await db.deleteDocument(databaseId, 'class_members', duplicate.$id);
    return keep;
  }
  const data = { classId, userId: memberUserId, role, joinedAt: new Date().toISOString() };
  const id = membershipId(classId, memberUserId);
  try { return await db.createDocument(databaseId, 'class_members', id, data); }
  catch { return db.getDocument(databaseId, 'class_members', id); }
};
const deleteQuizCascade = async (db, databaseId, quizId) => {
  for (const collectionId of ['quiz_assignments', 'quiz_questions', 'quiz_attempts']) {
    const result = await db.listDocuments(databaseId, collectionId, [Query.equal('quizId', quizId), Query.limit(5000)]);
    for (const document of result.documents) await db.deleteDocument(databaseId, collectionId, document.$id);
  }
  await db.deleteDocument(databaseId, 'quizzes', quizId);
};
const quizAttemptLimit = quiz => quiz.allowedAttempts === 2 ? 2 : 1;
const normalizeQuizAnswer = value => String(value ?? '').trim().toLowerCase();
const quizIsAssignedToMember = async (db, databaseId, quizId, memberClassIds) => {
  const assignments = await db.listDocuments(databaseId, 'quiz_assignments', [Query.equal('quizId', quizId), Query.limit(500)]);
  return assignments.documents.some(row => memberClassIds.has(row.classId));
};
const questionVoteWeight = vote => Math.max(1, Number(vote?.weight) || 1);
const normalizeSourceLink = data => {
  const sourceTitle = String(data.sourceTitle || '').trim().slice(0, 255);
  const sourceUrl = String(data.sourceUrl || '').trim().slice(0, 2048);
  if (!sourceTitle && !sourceUrl) return { sourceTitle: '', sourceUrl: '' };
  if (!sourceTitle || !sourceUrl) throw new Error('A source link needs both a title and a URL');
  let parsed;
  try { parsed = new URL(sourceUrl); } catch { throw new Error('Enter a valid source URL'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Source links must use http or https');
  return { sourceTitle, sourceUrl: parsed.toString() };
};
const questionVoteTotals = votes => {
  const totals = new Map();
  for (const vote of votes) totals.set(vote.questionId, (totals.get(vote.questionId) || 0) + questionVoteWeight(vote));
  return totals;
};
const updateQuestionVoteTotal = async (db, databaseId, questionId) => {
  const result = await db.listDocuments(databaseId, 'question_votes', [Query.equal('questionId', questionId), Query.limit(5000)]);
  const voteCount = result.documents.reduce((sum, vote) => sum + questionVoteWeight(vote), 0);
  await db.updateDocument(databaseId, 'discussion_questions', questionId, { voteCount });
  return voteCount;
};

const TEXT_SUPPORT_PROMPT_VERSION = '2026-08-26-v1';
const textVersionId = (textId, level) => `tv_${createHash('sha256').update(`${textId}:${level}`).digest('hex').slice(0, 30)}`;
const textVersionParagraphId = (versionId, paragraphId) => `tvp_${createHash('sha256').update(`${versionId}:${paragraphId}`).digest('hex').slice(0, 28)}`;
const parseAiJson = value => {
  const text = String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(text);
};
const paragraphBatches = paragraphs => {
  const batches = []; let current = [], size = 0;
  for (const paragraph of paragraphs) {
    const nextSize = String(paragraph.content || '').length + 100;
    if (current.length && size + nextSize > 12000) { batches.push(current); current = []; size = 0; }
    current.push(paragraph); size += nextSize;
  }
  if (current.length) batches.push(current);
  return batches;
};
async function adaptTextParagraphs(paragraphs, level) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('AI text support is not configured');
  const guidance = level === 'highly_supported'
    ? 'Use very clear, direct English, mostly short sentences, and explicitly identify pronoun referents and implied relationships. Keep essential academic or literary terms and briefly explain them in context.'
    : 'Use clearer sentence structure and moderately simpler English while retaining the original detail, tone, sequence, and important academic or literary vocabulary.';
  const output = [];
  for (const batch of paragraphBatches(paragraphs)) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `You adapt grade-level classroom readings for multilingual secondary students. ${guidance} Preserve every fact, name, event, argument, theme, and paragraph boundary. Do not summarize, censor, add facts, add headings, or answer questions about the text. For literary writing, preserve meaningful imagery and explain difficult meaning through clearer wording rather than deleting it. Return only JSON: {"paragraphs":[{"id":"the supplied id","content":"adapted paragraph"}]}. Return exactly one item for every supplied paragraph in the same order.` },
          { role: 'user', content: JSON.stringify({ paragraphs: batch.map(row => ({ id: row.$id, content: row.content })) }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const body = await response.json();
    const result = parseAiJson(body.choices?.[0]?.message?.content || '{}');
    if (!Array.isArray(result.paragraphs) || result.paragraphs.length !== batch.length) throw new Error('AI returned an incomplete text version');
    const byId = new Map(result.paragraphs.map(row => [String(row.id), String(row.content || '').trim()]));
    for (const paragraph of batch) {
      const content = byId.get(paragraph.$id);
      if (!content) throw new Error('AI omitted a paragraph');
      output.push({ originalParagraphId: paragraph.$id, sortOrder: paragraph.sortOrder, content });
    }
  }
  return output;
}

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

    if (body.action === 'updateNickname') {
      if (profile.role !== 'student') return res.json({ error: 'Only students can change nicknames' }, 403);
      const nickname = String(body.nickname || '').trim().replace(/\s+/g, ' '), invalid = nicknameError(nickname);
      if (invalid) return res.json({ error: invalid }, 400);
      if (profile.nicknameUpdatedAt && Date.now() - new Date(profile.nicknameUpdatedAt).getTime() < 24 * 60 * 60 * 1000) return res.json({ error: 'You can change your nickname once every 24 hours' }, 429);
      const updated = await db.updateDocument(databaseId, 'users', userId, { name: nickname, nicknameUpdatedAt: new Date().toISOString(), nicknameModerationStatus: 'visible' });
      return res.json({ profile: clean(updated) });
    }

    if (body.action === 'readClassNicknames') {
      const targetClass = await db.getDocument(databaseId, 'classes', body.classId);
      const owns = profile.role === 'teacher' && targetClass.teacherId === userId;
      if (!memberClassIds.has(body.classId) && !owns) return res.json({ error: 'Not enrolled' }, 403);
      const roster = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', body.classId), Query.equal('role', 'student'), Query.limit(500)]);
      const ids = [...new Set(roster.documents.map(row=>row.userId))];
      const users = ids.length ? await db.listDocuments(databaseId, 'users', [Query.equal('$id', ids), Query.limit(500)]) : { documents: [] };
      const nicknames = users.documents.map(row=>({userId:row.$id,nickname:row.name || 'Student'})).sort((a,b)=>a.nickname.localeCompare(b.nickname));
      let reports = [];
      if (owns) {
        const result = await db.listDocuments(databaseId, 'nickname_reports', [Query.equal('classId', body.classId), Query.equal('status', 'open'), Query.limit(500)]);
        const names = new Map(users.documents.map(row=>[row.$id,row.name || 'Student']));
        reports = result.documents.map(row=>({...clean(row),targetName:names.get(row.targetUserId)||row.nickname,reporterName:names.get(row.reporterId)||'Student'}));
      }
      return res.json({ nicknames, reports, isTeacher: owns });
    }

    if (body.action === 'reportNickname') {
      if (profile.role !== 'student' || !memberClassIds.has(body.classId)) return res.json({ error: 'Student class membership required' }, 403);
      if (body.targetUserId === userId) return res.json({ error: 'You cannot report your own nickname' }, 400);
      const targetMembership = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', body.classId), Query.equal('userId', body.targetUserId), Query.equal('role', 'student'), Query.limit(1)]);
      if (!targetMembership.total) return res.json({ error: 'That student is not in this class' }, 404);
      const reason = String(body.reason || '').trim().slice(0,500);
      if (reason.length < 3) return res.json({ error: 'Please briefly explain the concern' }, 400);
      const prior = await db.listDocuments(databaseId, 'nickname_reports', [Query.equal('classId', body.classId), Query.equal('reporterId', userId), Query.equal('targetUserId', body.targetUserId), Query.equal('status', 'open'), Query.limit(1)]);
      if (prior.total) return res.json({ ok: true });
      const target = await db.getDocument(databaseId, 'users', body.targetUserId);
      await db.createDocument(databaseId, 'nickname_reports', ID.unique(), { classId:body.classId,reporterId:userId,targetUserId:target.$id,nickname:target.name || 'Student',reason,status:'open',createdAt:new Date().toISOString() });
      return res.json({ ok: true });
    }

    if (body.action === 'moderateNicknameReport') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const report = await db.getDocument(databaseId, 'nickname_reports', body.reportId);
      const targetClass = await db.getDocument(databaseId, 'classes', report.classId);
      if (targetClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      if (!['dismiss','reset'].includes(body.command)) return res.json({ error: 'Invalid moderation command' }, 400);
      const now = new Date().toISOString();
      if (body.command === 'reset') await db.updateDocument(databaseId, 'users', report.targetUserId, { name:`Student ${report.targetUserId.slice(-4).toUpperCase()}`,nicknameModerationStatus:'reset',nicknameUpdatedAt:now });
      await db.updateDocument(databaseId, 'nickname_reports', report.$id, { status:body.command==='reset'?'resolved':'dismissed',resolvedBy:userId,resolvedAt:now });
      return res.json({ ok: true });
    }

    if (body.action === 'joinClass') {
      const role = body.role === 'parent' ? 'parent' : 'student';
      if (profile.role !== role) return res.json({ error: `A ${profile.role} account cannot join as ${role}` }, 403);
      const targetClass = await db.getDocument(databaseId, 'classes', body.classId);
      const validCode = role === 'parent'
        ? targetClass.parentCodeActive && targetClass.parentCode === body.joinCode
        : targetClass.joinCodeActive && targetClass.joinCode === body.joinCode;
      if (!validCode || targetClass.status !== 'active') return res.json({ error: 'Invalid or expired class code' }, 403);
      const membership = await ensureSingleMembership(db, databaseId, targetClass.$id, userId, role);
      return res.json({ membership: clean(membership) });
    }

    if (body.action === 'addStudentToClass') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const targetClass = await db.getDocument(databaseId, 'classes', body.classId);
      if (targetClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      const membership = await ensureSingleMembership(db, databaseId, targetClass.$id, body.studentId, 'student');
      return res.json({ membership: clean(membership) });
    }

    if (body.action === 'removeStudent') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const targetClass = await db.getDocument(databaseId, 'classes', body.classId);
      if (targetClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      const matches = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', body.classId), Query.equal('userId', body.studentId), Query.limit(500)]);
      const studentMemberships = matches.documents.filter(row => row.role === 'student');
      for (const membership of studentMemberships) await db.deleteDocument(databaseId, 'class_members', membership.$id);
      return res.json({ removedIds: studentMemberships.map(row => row.$id) });
    }

    if (body.action === 'deduplicateClassRoster') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const targetClass = await db.getDocument(databaseId, 'classes', body.classId);
      if (targetClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      const roster = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', body.classId), Query.limit(5000)]);
      const seen = new Set(), removedIds = [];
      for (const membership of roster.documents) {
        const key = `${membership.userId}:${membership.role}`;
        if (!seen.has(key)) { seen.add(key); continue; }
        await db.deleteDocument(databaseId, 'class_members', membership.$id);
        removedIds.push(membership.$id);
      }
      return res.json({ removedIds });
    }

    if (body.action === 'moveStudent') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const sourceClass = await db.getDocument(databaseId, 'classes', body.sourceClassId);
      const targetClass = await db.getDocument(databaseId, 'classes', body.targetClassId);
      if (sourceClass.teacherId !== userId || targetClass.teacherId !== userId) return res.json({ error: 'You must own both classes' }, 403);
      const sourceResult = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', body.sourceClassId), Query.equal('userId', body.studentId), Query.limit(500)]);
      const sourceMemberships = sourceResult.documents.filter(row => row.role === 'student');
      if (!sourceMemberships.length) return res.json({ error: 'Student is not in the source class' }, 404);
      const targetResult = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', body.targetClassId), Query.equal('userId', body.studentId), Query.limit(500)]);
      const removedIds = sourceMemberships.map(row => row.$id);
      if (targetResult.total) {
        for (const source of sourceMemberships) await db.deleteDocument(databaseId, 'class_members', source.$id);
        for (const duplicate of targetResult.documents.slice(1)) await db.deleteDocument(databaseId, 'class_members', duplicate.$id);
        return res.json({ removedIds, membership: clean(targetResult.documents[0]) });
      }
      const membership = await db.updateDocument(databaseId, 'class_members', sourceMemberships[0].$id, { classId: body.targetClassId });
      for (const duplicate of sourceMemberships.slice(1)) await db.deleteDocument(databaseId, 'class_members', duplicate.$id);
      return res.json({ removedIds, membership: clean(membership) });
    }

    if (body.action === 'updateClassDetails') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const existingClass = await db.getDocument(databaseId, 'classes', body.classId);
      if (existingClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      const courseName = String(body.courseName || '').trim(), name = String(body.name || '').trim();
      if (!courseName || !name || courseName.length > 200 || name.length > 200) return res.json({ error: 'Course name and section are required' }, 400);
      const updatedClass = await db.updateDocument(databaseId, 'classes', body.classId, { courseName, name });
      return res.json({ class: clean(updatedClass) });
    }

    if (body.action === 'readPresentationLinks') {
      const requested = [...new Set(Array.isArray(body.classIds) ? body.classIds.filter(Boolean) : [])];
      const owned = profile.role === 'teacher' ? await db.listDocuments(databaseId, 'classes', [Query.equal('teacherId', userId), Query.limit(500)]) : { documents: [] };
      const ownedIds = new Set(owned.documents.map(row => row.$id));
      const allowed = requested.filter(id => memberClassIds.has(id) || ownedIds.has(id));
      if (!allowed.length) return res.json({ links: [], liveSessions: [] });
      const [result, sessionResult] = await Promise.all([
        db.listDocuments(databaseId, 'presentation_links', [Query.equal('classId', allowed), Query.limit(5000)]),
        db.listDocuments(databaseId, 'class_sessions', [Query.equal('classId', allowed), Query.equal('discussionType', 'presentation'), Query.limit(5000)]),
      ]);
      return res.json({ links: result.documents.map(clean), liveSessions: sessionResult.documents.map(clean) });
    }

    if (body.action === 'addPresentationLinks') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const title = String(body.title || '').trim(), url = String(body.url || '').trim();
      const classIds = [...new Set(Array.isArray(body.classIds) ? body.classIds.filter(Boolean) : [])];
      if (!title || title.length > 255 || !/^https?:\/\//i.test(url) || url.length > 1000000 || !classIds.length) return res.json({ error: 'Valid title, link, and class are required' }, 400);
      const classes = await db.listDocuments(databaseId, 'classes', [Query.equal('$id', classIds), Query.equal('teacherId', userId), Query.limit(500)]);
      if (classes.total !== classIds.length) return res.json({ error: 'You must own every selected class' }, 403);
      const assignedAt = String(body.assignedAt || new Date().toISOString());
      const links = [];
      for (const classId of classIds) links.push(await db.createDocument(databaseId, 'presentation_links', ID.unique(), { teacherId: userId, classId, title, url, assignedAt, watchedAt: null }));
      return res.json({ links: links.map(clean) });
    }

    if (body.action === 'setPresentationWatched' || body.action === 'deletePresentationLink') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const link = await db.getDocument(databaseId, 'presentation_links', body.linkId);
      if (link.teacherId !== userId) return res.json({ error: 'Not the presentation owner' }, 403);
      if (body.action === 'deletePresentationLink') { await db.deleteDocument(databaseId, 'presentation_links', link.$id); return res.json({ deleted: link.$id }); }
      const updated = await db.updateDocument(databaseId, 'presentation_links', link.$id, { watchedAt: body.watched ? new Date().toISOString() : null });
      return res.json({ link: clean(updated) });
    }

    if (body.action === 'createLivePresentation') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const targetClass = await db.getDocument(databaseId, 'classes', body.classId);
      if (targetClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      const questions = Array.isArray(body.questions) ? body.questions.slice(0, 100) : [];
      const validTypes = new Set(['mc', 'short', 'paragraph', 'cloze']);
      if (!questions.length || questions.some(q => !validTypes.has(q.type) || !String(q.text || '').trim())) return res.json({ error: 'Add at least one valid question' }, 400);
      const normalizedQuestions = questions.map(q => ({ ...q, options: q.type === 'mc' ? (Array.isArray(q.options) ? q.options.slice(0, 4).map(value => String(value).trim()) : []) : [] }));
      if (normalizedQuestions.some(q => q.type === 'mc' && (q.options.length < 2 || q.options.some(value => !value)))) return res.json({ error: 'Multiple-choice questions need at least two choices' }, 400);
      const now = new Date().toISOString();
      const allowResubmission = Boolean(body.allowResubmission);
      const promptSize = ['standard', 'large', 'extra-large'].includes(body.promptSize) ? body.promptSize : 'large';
      const exampleResponse = String(body.exampleResponse || '').trim().slice(0, 10000);
      const session = await db.createDocument(databaseId, 'class_sessions', ID.unique(), { classId: body.classId, assignmentId: null, discussionType: 'presentation', textId: null, promptMarkdown: String(normalizedQuestions[0].text).trim(), title: String(body.title || '').trim() || 'Writing Prompt', sessionDate: now.slice(0, 10), status: 'active', votesPerStudent: 0, allowStackedVotes: false, notesMarkdown: JSON.stringify({ reveal: false, allowResubmission, promptSize, exampleResponse }), publishedNotesMarkdown: '', publishedAt: null, createdAt: now, updatedAt: now });
      let firstQuestionId = null;
      for (let index = 0; index < normalizedQuestions.length; index++) {
        const q = normalizedQuestions[index], options = q.options;
        const created = await db.createDocument(databaseId, 'discussion_questions', ID.unique(), { classSessionId: session.$id, authorId: userId, questionText: String(q.text).trim(), selectedPassage: JSON.stringify({ type: q.type, options, answer: String(q.answer || '') }), voteCount: index, moderationStatus: 'visible', discussionStatus: 'none', discussionNotesMarkdown: '', notesUpdatedAt: null, isTeacherQuestion: true, teacherVisibleBeforeSubmission: true, createdAt: now });
        if (!firstQuestionId) firstQuestionId = created.$id;
      }
      await db.updateDocument(databaseId, 'class_sessions', session.$id, { assignmentId: firstQuestionId, notesMarkdown: JSON.stringify({ reveal: false, lastQuestionId: firstQuestionId, allowResubmission, promptSize, exampleResponse }) });
      return res.json({ sessionId: session.$id });
    }

    if (body.action === 'updateWritingPrompt') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const session = await db.getDocument(databaseId, 'class_sessions', body.sessionId);
      if (session.discussionType !== 'presentation') return res.json({ error: 'Not a writing prompt' }, 400);
      const targetClass = await db.getDocument(databaseId, 'classes', session.classId);
      if (targetClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      const prompt = String(body.prompt || '').trim();
      if (!prompt || prompt.length > 10000) return res.json({ error: 'Enter a valid prompt' }, 400);
      const promptSize = ['standard', 'large', 'extra-large'].includes(body.promptSize) ? body.promptSize : 'large';
      const exampleResponse = String(body.exampleResponse || '').trim().slice(0, 10000);
      let priorState = {}; try { priorState = JSON.parse(session.notesMarkdown || '{}'); } catch { /* invalid state */ }
      const questionResult = await db.listDocuments(databaseId, 'discussion_questions', [Query.equal('classSessionId', session.$id), Query.limit(1)]);
      if (questionResult.total) await db.updateDocument(databaseId, 'discussion_questions', questionResult.documents[0].$id, { questionText: prompt });
      const now = new Date().toISOString();
      const notesMarkdown = JSON.stringify({ ...priorState, allowResubmission: Boolean(body.allowResubmission), promptSize, exampleResponse });
      let publishedNotesMarkdown = session.publishedNotesMarkdown || '';
      if (session.status === 'published' && questionResult.total) {
        const answers = await db.listDocuments(databaseId, 'discussion_answers', [Query.equal('questionId', questionResult.documents[0].$id), Query.limit(5000)]);
        publishedNotesMarkdown = `# Writing Prompt\n\n## ${prompt}${exampleResponse ? `\n\n### Example response\n\n${exampleResponse}` : ''}\n\n### Class responses\n\n${answers.total ? answers.documents.map(row => `- ${row.answerText}`).join('\n\n') : '_No responses submitted._'}`;
      }
      const updated = await db.updateDocument(databaseId, 'class_sessions', session.$id, { promptMarkdown: prompt, notesMarkdown, publishedNotesMarkdown, updatedAt: now });
      return res.json({ session: clean(updated) });
    }

    if (['readLivePresentation', 'controlLivePresentation', 'submitLiveAnswer'].includes(body.action)) {
      const session = await db.getDocument(databaseId, 'class_sessions', body.sessionId);
      if (session.discussionType !== 'presentation') return res.json({ error: 'Not a live presentation' }, 400);
      const targetClass = await db.getDocument(databaseId, 'classes', session.classId);
      const owns = profile.role === 'teacher' && targetClass.teacherId === userId;
      const enrolled = memberClassIds.has(session.classId);
      if (!owns && !enrolled) return res.json({ error: 'Not enrolled' }, 403);
      const questionResult = await db.listDocuments(databaseId, 'discussion_questions', [Query.equal('classSessionId', session.$id), Query.limit(500)]);
      const questions = questionResult.documents.sort((a, b) => a.voteCount - b.voteCount);
      if (body.action === 'controlLivePresentation') {
        if (!owns) return res.json({ error: 'Teacher role required' }, 403);
        let priorState = {}; try { priorState = JSON.parse(session.notesMarkdown || '{}'); } catch { /* invalid state */ }
        let index = questions.findIndex(q => q.$id === session.assignmentId || (!session.assignmentId && q.$id === priorState.lastQuestionId)), assignmentId = session.assignmentId || null, reveal = false, status = session.status, lastQuestionId = priorState.lastQuestionId || null;
        if (body.command === 'next') assignmentId = questions[Math.min(index + 1, questions.length - 1)]?.$id || null;
        if (body.command === 'previous') assignmentId = questions[Math.max(index - 1, 0)]?.$id || null;
        if (body.command === 'pause') { lastQuestionId = session.assignmentId || lastQuestionId; assignmentId = null; }
        if (body.command === 'reveal') reveal = true;
        if (body.command === 'hide') reveal = false;
        let publishedNotesMarkdown = session.publishedNotesMarkdown || '';
        if (body.command === 'end') {
          assignmentId = null; status = 'published';
          const ids = questions.map(q => q.$id);
          const allAnswers = ids.length ? await db.listDocuments(databaseId, 'discussion_answers', [Query.equal('questionId', ids), Query.limit(5000)]) : { documents: [] };
          const example = String(priorState.exampleResponse || '').trim();
          const sections = questions.map(q => { const responses = allAnswers.documents.filter(row => row.questionId === q.$id); return `## ${q.questionText}${example ? `\n\n### Example response\n\n${example}` : ''}\n\n### Class responses\n\n${responses.length ? responses.map(row => `- ${row.answerText}`).join('\n\n') : '_No responses submitted._'}`; });
          publishedNotesMarkdown = `# Writing Prompt\n\n${sections.join('\n\n---\n\n')}`;
        }
        if (assignmentId) lastQuestionId = assignmentId;
        await db.updateDocument(databaseId, 'class_sessions', session.$id, { assignmentId, status, notesMarkdown: JSON.stringify({ reveal, lastQuestionId, allowResubmission: Boolean(priorState.allowResubmission), promptSize: priorState.promptSize || 'large', exampleResponse: priorState.exampleResponse || '' }), publishedNotesMarkdown, updatedAt: new Date().toISOString(), publishedAt: status === 'published' ? new Date().toISOString() : null });
        return res.json({ ok: true });
      }
      const active = questions.find(q => q.$id === session.assignmentId) || null;
      if (body.action === 'submitLiveAnswer') {
        if (profile.role !== 'student' || !active || session.status !== 'active') return res.json({ error: 'No question is accepting answers' }, 403);
        let config = {}; try { config = JSON.parse(active.selectedPassage || '{}'); } catch { /* invalid configuration */ }
        const answer = String(body.answer ?? '').trim();
        if (!answer || answer.length > 10000) return res.json({ error: 'Enter a valid answer' }, 400);
        if (config.type === 'mc' && (!/^\d+$/.test(answer) || Number(answer) < 0 || Number(answer) >= config.options.length)) return res.json({ error: 'Choose a valid answer' }, 400);
        const promptState = (() => { try { return JSON.parse(session.notesMarkdown || '{}'); } catch { return {}; } })();
        const prior = await db.listDocuments(databaseId, 'discussion_answers', [Query.equal('questionId', active.$id), Query.equal('authorId', userId), Query.limit(1)]), now = new Date().toISOString();
        if (prior.total && !promptState.allowResubmission) return res.json({ error: 'This prompt accepts one response per student' }, 409);
        const data = { questionId: active.$id, authorId: userId, authorName: '', answerText: answer, createdAt: prior.documents[0]?.createdAt || now, updatedAt: now };
        if (prior.total) await db.updateDocument(databaseId, 'discussion_answers', prior.documents[0].$id, data); else await db.createDocument(databaseId, 'discussion_answers', ID.unique(), data);
        return res.json({ ok: true });
      }
      const answerQueries = active ? [Query.equal('questionId', active.$id), Query.limit(owns ? 500 : 1)] : [];
      if (active && !owns) answerQueries.unshift(Query.equal('authorId', userId));
      const answerResult = active ? await db.listDocuments(databaseId, 'discussion_answers', answerQueries) : { documents: [] };
      const myAnswer = answerResult.documents.find(row => row.authorId === userId)?.answerText || null;
      let config = {}; try { config = active ? JSON.parse(active.selectedPassage || '{}') : {}; } catch { /* invalid configuration */ }
      const reveal = (() => { try { return Boolean(JSON.parse(session.notesMarkdown || '{}').reveal); } catch { return false; } })();
      const mcCounts = Array.isArray(config.options) ? config.options.map((_, i) => answerResult.documents.filter(row => Number(row.answerText) === i).length) : [];
      const roster = owns ? await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', session.classId), Query.equal('role', 'student'), Query.limit(100)]) : { total: 0 };
      const projectQuestion = q => { let c = {}; try { c = JSON.parse(q.selectedPassage || '{}'); } catch { /* invalid */ } return { id: q.$id, text: q.questionText, sortOrder: q.voteCount, type: c.type || 'short', options: c.options || [], answer: owns || reveal ? c.answer || '' : '' }; };
      const promptState = (() => { try { return JSON.parse(session.notesMarkdown || '{}'); } catch { return {}; } })();
      const allowResubmission = Boolean(promptState.allowResubmission);
      const promptSize = ['standard', 'large', 'extra-large'].includes(promptState.promptSize) ? promptState.promptSize : 'large';
      return res.json({ session: clean(session), questions: owns ? questions.map(projectQuestion) : [], activeQuestion: active ? projectQuestion(active) : null, ownAnswer: myAnswer, answeredCount: answerResult.documents.length, enrolledCount: roster.total, mcCounts: owns || myAnswer ? mcCounts : [], reveal, responses: owns && active ? answerResult.documents.map((row, i) => ({ id: row.$id, answer: row.answerText, label: `Response ${i + 1}` })) : [], isTeacher: owns, allowResubmission, promptSize, exampleResponse: String(promptState.exampleResponse || '') });
    }

    if (body.action === 'deleteQuiz') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const quiz = await db.getDocument(databaseId, 'quizzes', body.quizId);
      if (quiz.createdBy !== userId) return res.json({ error: 'Not the quiz owner' }, 403);
      await deleteQuizCascade(db, databaseId, quiz.$id);
      return res.json({ deletedQuizId: quiz.$id });
    }

    if (body.action === 'startQuizAttempt') {
      if (profile.role !== 'student') return res.json({ error: 'Student role required' }, 403);
      const quiz = await db.getDocument(databaseId, 'quizzes', body.quizId);
      if (quiz.status !== 'published') return res.json({ error: 'This quiz is not published' }, 403);
      if (!await quizIsAssignedToMember(db, databaseId, quiz.$id, memberClassIds)) return res.json({ error: 'This quiz is not assigned to your class' }, 403);
      const attemptResult = await db.listDocuments(databaseId, 'quiz_attempts', [Query.equal('quizId', quiz.$id), Query.equal('userId', userId), Query.limit(100)]);
      const unfinished = attemptResult.documents.find(row => !row.completedAt);
      if (unfinished) return res.json({ attempt: clean(unfinished) });
      const completed = attemptResult.documents.filter(row => row.completedAt).length;
      if (completed >= quizAttemptLimit(quiz)) return res.json({ error: 'You have used all attempts for this quiz' }, 409);
      const attempt = await db.createDocument(databaseId, 'quiz_attempts', ID.unique(), {
        quizId: quiz.$id, userId, startedAt: new Date().toISOString(), completedAt: null,
        score: 0, totalQuestions: 0, answers: '[]',
      });
      return res.json({ attempt: clean(attempt) });
    }

    if (body.action === 'submitQuizAttempt') {
      if (profile.role !== 'student') return res.json({ error: 'Student role required' }, 403);
      const attempt = await db.getDocument(databaseId, 'quiz_attempts', body.attemptId);
      if (attempt.userId !== userId) return res.json({ error: 'This is not your quiz attempt' }, 403);
      if (attempt.completedAt) return res.json({ error: 'This attempt has already been submitted' }, 409);
      const quiz = await db.getDocument(databaseId, 'quizzes', attempt.quizId);
      if (quiz.status !== 'published' || !await quizIsAssignedToMember(db, databaseId, quiz.$id, memberClassIds)) return res.json({ error: 'This quiz is no longer available' }, 403);
      const supplied = Array.isArray(body.answers) ? body.answers : [];
      const meaningfulAnswers = supplied.filter(row => row && typeof row.questionId === 'string'
        && (typeof row.answer === 'number' || (typeof row.answer === 'string' && row.answer.trim().length > 0)));
      if (!meaningfulAnswers.length) {
        return res.json({ error: 'No answers were received. This attempt was not submitted or counted.' }, 400);
      }
      const questionResult = await db.listDocuments(databaseId, 'quiz_questions', [Query.equal('quizId', quiz.$id), Query.limit(5000)]);
      const questions = [...questionResult.documents].sort((a, b) => a.sortOrder - b.sortOrder);
      const questionIds = new Set(questions.map(question => question.$id));
      if (meaningfulAnswers.some(row => !questionIds.has(row.questionId))) {
        return res.json({ error: 'This quiz changed while it was open. Refresh it and try again; this attempt was not counted.' }, 409);
      }
      const suppliedById = new Map(meaningfulAnswers.map(row => [row.questionId, row.answer]));
      let score = 0;
      const results = questions.map(question => {
        const answer = suppliedById.get(question.$id);
        let correct = false;
        if (question.type === 'mc') correct = Number(answer) === Number(question.correctIndex);
        else {
          let variants = [];
          try { const parsed = JSON.parse(question.clozeVariants || '[]'); if (Array.isArray(parsed)) variants = parsed; } catch { /* use primary answer only */ }
          const accepted = [question.clozeAnswer, ...variants].map(normalizeQuizAnswer).filter(Boolean);
          correct = accepted.includes(normalizeQuizAnswer(answer));
        }
        if (correct) score += 1;
        return { correct, explanation: String(question.explanation || '') };
      });
      const completedAt = new Date().toISOString();
      const updated = await db.updateDocument(databaseId, 'quiz_attempts', attempt.$id, {
        completedAt, score, totalQuestions: questions.length,
        answers: JSON.stringify(meaningfulAnswers.map(row => ({ questionId: row.questionId, answer: row.answer }))),
      });
      const attemptResult = await db.listDocuments(databaseId, 'quiz_attempts', [Query.equal('quizId', quiz.$id), Query.equal('userId', userId), Query.limit(100)]);
      const attemptsRemaining = Math.max(0, quizAttemptLimit(quiz) - attemptResult.documents.filter(row => row.completedAt).length);
      const showAnswerFeedback = Boolean(quiz.showAnswerFeedback);
      return res.json({
        attempt: clean(updated), score, total: questions.length,
        results: showAnswerFeedback ? results : [], showAnswerFeedback, attemptsRemaining,
      });
    }

    if (body.action === 'readQuizResults') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const [quiz, targetClass] = await Promise.all([
        db.getDocument(databaseId, 'quizzes', body.quizId),
        db.getDocument(databaseId, 'classes', body.classId),
      ]);
      if (quiz.createdBy !== userId || targetClass.teacherId !== userId) return res.json({ error: 'Not the quiz or class owner' }, 403);
      const assignment = await db.listDocuments(databaseId, 'quiz_assignments', [Query.equal('quizId', quiz.$id), Query.equal('classId', targetClass.$id), Query.limit(1)]);
      if (!assignment.total) return res.json({ error: 'This quiz is not assigned to that class' }, 403);

      const roster = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', targetClass.$id), Query.equal('role', 'student'), Query.limit(500)]);
      const studentIds = [...new Set(roster.documents.map(row => row.userId))];
      const [profiles, attemptResult] = await Promise.all([
        studentIds.length ? db.listDocuments(databaseId, 'users', [Query.equal('$id', studentIds), Query.limit(500)]) : { documents: [] },
        db.listDocuments(databaseId, 'quiz_attempts', [Query.equal('quizId', quiz.$id), Query.limit(5000)]),
      ]);
      const profilesById = new Map(profiles.documents.map(row => [row.$id, row]));
      const rosterIds = new Set(studentIds);
      const attemptsByStudent = new Map();
      for (const attempt of attemptResult.documents) {
        if (!rosterIds.has(attempt.userId)) continue;
        const projected = {
          id: attempt.$id,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt || null,
          score: Number(attempt.score) || 0,
          totalQuestions: Number(attempt.totalQuestions) || quiz.questionCount || 0,
        };
        const current = attemptsByStudent.get(attempt.userId) || [];
        current.push(projected);
        attemptsByStudent.set(attempt.userId, current);
      }
      const students = studentIds.map(studentId => {
        const student = profilesById.get(studentId);
        const attempts = (attemptsByStudent.get(studentId) || []).sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
        return { userId: studentId, name: student?.name || 'Student', attempts };
      }).sort((a, b) => a.name.localeCompare(b.name));
      return res.json({ quiz: { id: quiz.$id, title: quiz.title, questionCount: quiz.questionCount, allowedAttempts: quizAttemptLimit(quiz) }, class: { id: targetClass.$id, name: targetClass.name, courseName: targetClass.courseName }, students });
    }

    if (body.action === 'readQuizzes') {
      const requested = [...new Set(Array.isArray(body.classIds) ? body.classIds.filter(Boolean) : [])];
      let allowedClassIds = requested.filter(classId => memberClassIds.has(classId));
      let ownedQuizzes = [], expiredQuizIds = [];
      if (profile.role === 'teacher') {
        const ownedClasses = await db.listDocuments(databaseId, 'classes', [Query.equal('teacherId', userId), Query.limit(500)]);
        const ownedClassIds = new Set(ownedClasses.documents.map(row => row.$id));
        allowedClassIds = requested.filter(classId => ownedClassIds.has(classId));
        const ownResult = await db.listDocuments(databaseId, 'quizzes', [Query.equal('createdBy', userId), Query.limit(5000)]);
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const expired = ownResult.documents.filter(row => row.status === 'draft' && Number.isFinite(Date.parse(row.createdAt)) && Date.parse(row.createdAt) <= cutoff);
        for (const quiz of expired) await deleteQuizCascade(db, databaseId, quiz.$id);
        expiredQuizIds = expired.map(row => row.$id);
        const expiredIds = new Set(expiredQuizIds);
        ownedQuizzes = ownResult.documents.filter(row => !expiredIds.has(row.$id));
      }
      if (!allowedClassIds.length && !ownedQuizzes.length) return res.json({ assignments: [], quizzes: [], questions: [], attempts: [], expiredQuizIds });
      const assignmentResult = allowedClassIds.length
        ? await db.listDocuments(databaseId, 'quiz_assignments', [Query.equal('classId', allowedClassIds), Query.limit(5000)])
        : { documents: [] };
      const assignedQuizIds = [...new Set(assignmentResult.documents.map(row => row.quizId))];
      let assignedQuizzes = [];
      if (assignedQuizIds.length) {
        const quizResult = await db.listDocuments(databaseId, 'quizzes', [Query.equal('$id', assignedQuizIds), Query.limit(5000)]);
        assignedQuizzes = quizResult.documents;
      }
      const quizzesById = new Map([...ownedQuizzes, ...assignedQuizzes].map(row => [row.$id, row]));
      let quizzes = [...quizzesById.values()].filter(row => profile.role === 'teacher' || row.status === 'published');
      if (body.quizId) quizzes = quizzes.filter(row => row.$id === body.quizId);
      const quizIds = quizzes.map(row => row.$id);
      if (!quizIds.length) return res.json({ assignments: assignmentResult.documents.map(clean), quizzes: [], questions: [], attempts: [], expiredQuizIds });
      if (!body.includeDetails) return res.json({ assignments: assignmentResult.documents.filter(row => quizIds.includes(row.quizId)).map(clean), quizzes: quizzes.map(clean), questions: [], attempts: [], expiredQuizIds });
      const questionResult = await db.listDocuments(databaseId, 'quiz_questions', [Query.equal('quizId', quizIds), Query.limit(5000)]);
      let attempts = [];
      if (profile.role !== 'parent') {
        const attemptQueries = [Query.equal('quizId', quizIds), Query.limit(5000)];
        if (profile.role !== 'teacher') attemptQueries.unshift(Query.equal('userId', userId));
        const attemptResult = await db.listDocuments(databaseId, 'quiz_attempts', attemptQueries);
        attempts = attemptResult.documents;
      }
      const visibleIds = new Set(quizIds);
      return res.json({
        assignments: assignmentResult.documents.filter(row => visibleIds.has(row.quizId)).map(clean),
        quizzes: quizzes.map(clean),
        questions: questionResult.documents.map(row => {
          const projected = clean(row);
          if (profile.role !== 'teacher') {
            delete projected.correctIndex;
            delete projected.clozeAnswer;
            delete projected.clozeVariants;
            delete projected.explanation;
          }
          return projected;
        }),
        attempts: attempts.map(clean),
        expiredQuizIds,
      });
    }

    if (body.action === 'readWriting') {
      const requested = [...new Set(Array.isArray(body.classIds) ? body.classIds.filter(Boolean) : [])];
      let allowedClassIds = requested.filter(classId => memberClassIds.has(classId));
      let ownedPrompts = [];
      if (profile.role === 'teacher') {
        const ownedClasses = await db.listDocuments(databaseId, 'classes', [Query.equal('teacherId', userId), Query.limit(500)]);
        const ownedClassIds = new Set(ownedClasses.documents.map(row => row.$id));
        allowedClassIds = requested.filter(classId => ownedClassIds.has(classId));
        const ownResult = await db.listDocuments(databaseId, 'writing_prompts', [Query.equal('teacherId', userId), Query.limit(5000)]);
        ownedPrompts = ownResult.documents;
      }
      if (!allowedClassIds.length && !ownedPrompts.length) return res.json({ assignments: [], prompts: [] });
      const assignmentResult = allowedClassIds.length
        ? await db.listDocuments(databaseId, 'writing_prompt_assignments', [Query.equal('classId', allowedClassIds), Query.limit(5000)])
        : { documents: [] };
      const promptIds = [...new Set(assignmentResult.documents.map(row => row.promptId))];
      let assignedPrompts = [];
      if (promptIds.length) {
        const promptResult = await db.listDocuments(databaseId, 'writing_prompts', [Query.equal('$id', promptIds), Query.limit(5000)]);
        assignedPrompts = promptResult.documents;
      }
      const promptsById = new Map([...ownedPrompts, ...assignedPrompts].map(row => [row.$id, row]));
      const prompts = [...promptsById.values()].filter(row => profile.role === 'teacher' || row.status !== 'draft');
      const visibleIds = new Set(prompts.map(row => row.$id));
      return res.json({
        assignments: assignmentResult.documents.filter(row => visibleIds.has(row.promptId)).map(clean),
        prompts: prompts.map(clean),
      });
    }

    if (body.action === 'createPeerReviewActivity') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const targetClass = await db.getDocument(databaseId, 'classes', body.classId);
      if (targetClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      const title = String(body.title || '').trim(), reviewsRequired = Number(body.reviewsRequired || 3), now = new Date().toISOString();
      if (!title || title.length > 200 || !Number.isInteger(reviewsRequired) || reviewsRequired < 1 || reviewsRequired > 20) return res.json({ error: 'Invalid activity settings' }, 400);
      const activity = await db.createDocument(databaseId, 'peer_review_activities', ID.unique(), { classId: targetClass.$id, teacherId: userId, title, assignmentType: 'presentation_pvlegs', reviewsRequired, status: 'active', createdAt: now, updatedAt: now });
      return res.json({ activity: clean(activity) });
    }

    if (body.action === 'listPeerReviewActivities') {
      const targetClass = await db.getDocument(databaseId, 'classes', body.classId);
      const owns = profile.role === 'teacher' && targetClass.teacherId === userId;
      if (!owns && !memberClassIds.has(targetClass.$id)) return res.json({ error: 'Not enrolled' }, 403);
      const result = await db.listDocuments(databaseId, 'peer_review_activities', [Query.equal('classId', targetClass.$id), Query.limit(500)]);
      const visible = result.documents.filter(row => owns || row.status === 'active').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      let flagCounts = new Map();
      if (owns && visible.length) {
        const flagged = await db.listDocuments(databaseId, 'presentation_peer_reviews', [Query.equal('activityId', visible.map(row=>row.$id)), Query.equal('flagged', true), Query.limit(5000)]);
        for (const review of flagged.documents) flagCounts.set(review.activityId,(flagCounts.get(review.activityId)||0)+1);
      }
      return res.json({ activities: visible.map(row=>({...clean(row),flaggedCount:flagCounts.get(row.$id)||0})) });
    }

    if (['readPeerReviewActivity','setPeerReviewActivityStatus','submitPresentationPeerReview','flagPresentationPeerReview','moderatePresentationPeerReview'].includes(body.action)) {
      let review = null, activityId = body.activityId;
      if (body.reviewId) { review = await db.getDocument(databaseId, 'presentation_peer_reviews', body.reviewId); activityId = review.activityId; }
      const activity = await db.getDocument(databaseId, 'peer_review_activities', activityId);
      const targetClass = await db.getDocument(databaseId, 'classes', activity.classId);
      const owns = profile.role === 'teacher' && targetClass.teacherId === userId;
      const enrolled = memberClassIds.has(activity.classId) && memberships.documents.some(row => row.classId === activity.classId && row.role === 'student');
      if (!owns && !enrolled) return res.json({ error: 'Not enrolled' }, 403);

      if (body.action === 'setPeerReviewActivityStatus') {
        if (!owns || !['active','closed'].includes(body.status)) return res.json({ error: 'Teacher role required' }, 403);
        await db.updateDocument(databaseId, 'peer_review_activities', activity.$id, { status: body.status, updatedAt: new Date().toISOString() });
        return res.json({ ok: true });
      }

      if (body.action === 'submitPresentationPeerReview') {
        if (!enrolled || profile.role !== 'student' || activity.status !== 'active') return res.json({ error: 'This activity is not accepting reviews' }, 403);
        if (body.presenterId === userId) return res.json({ error: 'You cannot review yourself' }, 400);
        const presenterMembership = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', activity.classId), Query.equal('userId', body.presenterId), Query.limit(10)]);
        if (!presenterMembership.documents.some(row => row.role === 'student')) return res.json({ error: 'Choose a student in this class' }, 400);
        const prior = await db.listDocuments(databaseId, 'presentation_peer_reviews', [Query.equal('activityId', activity.$id), Query.equal('presenterId', body.presenterId), Query.equal('reviewerId', userId), Query.limit(1)]);
        if (prior.total) return res.json({ error: 'Choose a different presenter next' }, 409);
        const ratings = body.ratings || {}, keys = ['poise','voice','life','eyeContact','gestures','speed'];
        if (keys.some(key => ![1,2,3].includes(Number(ratings[key])))) return res.json({ error: 'Complete every PVLEGS rating' }, 400);
        const strengthComment = String(body.strengthComment || '').trim(), nextStepComment = String(body.nextStepComment || '').trim();
        if (strengthComment.split(/\s+/).length < 3 || nextStepComment.split(/\s+/).length < 3 || strengthComment.length > 1000 || nextStepComment.length > 1000) return res.json({ error: 'Write at least three words for both comments' }, 400);
        const now = new Date().toISOString();
        await db.createDocument(databaseId, 'presentation_peer_reviews', ID.unique(), { activityId: activity.$id, classId: activity.classId, presenterId: body.presenterId, reviewerId: userId, ...Object.fromEntries(keys.map(key=>[key,Number(ratings[key])])), strengthComment, nextStepComment, moderationStatus: 'visible', flagged: false, flagReason: '', createdAt: now, updatedAt: now });
        return res.json({ ok: true });
      }

      if (body.action === 'flagPresentationPeerReview') {
        if (!enrolled || review.presenterId !== userId) return res.json({ error: 'Only the recipient can flag this feedback' }, 403);
        await db.updateDocument(databaseId, 'presentation_peer_reviews', review.$id, { flagged: true, flagReason: String(body.reason || 'Inappropriate feedback').trim().slice(0,500), updatedAt: new Date().toISOString() });
        return res.json({ ok: true });
      }

      if (body.action === 'moderatePresentationPeerReview') {
        if (!owns) return res.json({ error: 'Teacher role required' }, 403);
        if (body.command === 'delete') { await db.deleteDocument(databaseId, 'presentation_peer_reviews', review.$id); return res.json({ ok: true }); }
        if (body.command === 'hide' || body.command === 'show') { await db.updateDocument(databaseId, 'presentation_peer_reviews', review.$id, { moderationStatus: body.command === 'hide' ? 'hidden' : 'visible', flagged: false, flagReason: '', updatedAt: new Date().toISOString() }); return res.json({ ok: true }); }
        if (body.command === 'update') {
          const ratings = body.ratings || {}, keys = ['poise','voice','life','eyeContact','gestures','speed'];
          if (keys.some(key => ![1,2,3].includes(Number(ratings[key])))) return res.json({ error: 'Invalid ratings' }, 400);
          const strengthComment = String(body.strengthComment || '').trim(), nextStepComment = String(body.nextStepComment || '').trim();
          if (!strengthComment || !nextStepComment) return res.json({ error: 'Comments are required' }, 400);
          await db.updateDocument(databaseId, 'presentation_peer_reviews', review.$id, { ...Object.fromEntries(keys.map(key=>[key,Number(ratings[key])])), strengthComment: strengthComment.slice(0,1000), nextStepComment: nextStepComment.slice(0,1000), flagged: false, flagReason: '', updatedAt: new Date().toISOString() });
          return res.json({ ok: true });
        }
        return res.json({ error: 'Invalid moderation command' }, 400);
      }

      const rosterResult = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', activity.classId), Query.equal('role', 'student'), Query.limit(100)]);
      const rosterIds = [...new Set(rosterResult.documents.filter(row=>row.role==='student').map(row=>row.userId))];
      const userResult = rosterIds.length ? await db.listDocuments(databaseId, 'users', [Query.equal('$id', rosterIds), Query.limit(100)]) : { documents: [] };
      const names = new Map(userResult.documents.map(row=>[row.$id,row.name || row.email || 'Student']));
      const roster = rosterIds.map(id=>({id,name:names.get(id)||'Student'})).sort((a,b)=>a.name.localeCompare(b.name));
      if (owns) {
        const reviewResult = await db.listDocuments(databaseId, 'presentation_peer_reviews', [Query.equal('activityId', activity.$id), Query.limit(500)]);
        return res.json({ activity: clean(activity), roster, reviews: reviewResult.documents.map(row=>({...clean(row),reviewerName:names.get(row.reviewerId)||'Student'})), writtenCount: 0, feedbackUnlocked: true, isTeacher: true });
      }
      const writtenResult = await db.listDocuments(databaseId, 'presentation_peer_reviews', [Query.equal('reviewerId', userId), Query.limit(500)]);
      const written = writtenResult.documents.filter(row=>row.activityId===activity.$id), feedbackUnlocked = written.length >= activity.reviewsRequired;
      const ownWritten = written.map(row=>clean(row));
      const receivedResult = feedbackUnlocked ? await db.listDocuments(databaseId, 'presentation_peer_reviews', [Query.equal('presenterId', userId), Query.limit(500)]) : { documents: [] };
      const received = receivedResult.documents.filter(row=>row.activityId===activity.$id&&row.moderationStatus==='visible').map(row=>{const projected=clean(row);delete projected.reviewerId;return projected;});
      return res.json({ activity: clean(activity), roster, reviews: [...ownWritten,...received], writtenCount: written.length, feedbackUnlocked, isTeacher: false });
    }

    if (body.action === 'readAnnotationReport') {
      if (profile.role !== 'teacher') return res.json({error:'Teacher role required'},403);
      const targetClass=await db.getDocument(databaseId,'classes',body.classId);
      if(targetClass.teacherId!==userId)return res.json({error:'Not the class owner'},403);
      const result=await db.listDocuments(databaseId,'text_annotations',[Query.equal('classId',body.classId),Query.limit(5000)]),week=new Date();
      week.setDate(week.getDate()-((week.getDay()+6)%7));week.setHours(0,0,0,0);
      const counts=new Map();
      for(const row of result.documents){if(row.moderationStatus!=='visible'||(row.visibility||'class')==='private')continue;const value=counts.get(row.authorId)||{userId:row.authorId,total:0,thisWeek:0};value.total++;if(new Date(row.createdAt)>=week)value.thisWeek++;counts.set(row.authorId,value)}
      return res.json({counts:[...counts.values()]});
    }

    if (body.action === 'flagTextAnnotation') {
      const annotation = await db.getDocument(databaseId, 'text_annotations', body.annotationId);
      if (!memberClassIds.has(annotation.classId) || annotation.authorId === userId || (annotation.visibility || 'class') === 'private') return res.json({ error: 'This annotation cannot be reported' }, 403);
      const reason = String(body.reason || '').trim().slice(0,500);
      if (reason.length < 3) return res.json({ error: 'Please briefly explain the concern' }, 400);
      await db.updateDocument(databaseId, 'text_annotations', annotation.$id, { flagged:true,flagReason:reason,updatedAt:new Date().toISOString() });
      return res.json({ ok:true });
    }

    if (body.action === 'moderateTextAnnotation') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const annotation = await db.getDocument(databaseId, 'text_annotations', body.annotationId);
      const targetClass = await db.getDocument(databaseId, 'classes', annotation.classId);
      if (targetClass.teacherId !== userId) return res.json({ error: 'Not the class owner' }, 403);
      if (body.command === 'delete') { const replies=await db.listDocuments(databaseId,'text_annotations',[Query.equal('parentId',annotation.$id),Query.limit(500)]);for(const reply of replies.documents)await db.deleteDocument(databaseId,'text_annotations',reply.$id);await db.deleteDocument(databaseId,'text_annotations',annotation.$id);return res.json({ok:true}); }
      if (!['hide','show','dismissFlag'].includes(body.command)) return res.json({ error:'Invalid moderation command' },400);
      const patch = body.command === 'hide' ? {moderationStatus:'hidden'} : body.command === 'show' ? {moderationStatus:'visible'} : {};
      await db.updateDocument(databaseId,'text_annotations',annotation.$id,{...patch,flagged:false,flagReason:'',updatedAt:new Date().toISOString()});
      return res.json({ok:true});
    }

    if (body.action === 'generateTextVersion') {
      if (profile.role === 'parent') return res.json({ error: 'Students or teachers can request reading support' }, 403);
      const level = String(body.level || '');
      if (!['supported','highly_supported'].includes(level)) return res.json({ error: 'Invalid support level' }, 400);
      const text = await db.getDocument(databaseId, 'texts', body.textId);
      if (text.contentMode === 'link') return res.json({ error: 'Reading support requires text uploaded into the app' }, 400);
      const owns = profile.role === 'teacher' && text.teacherId === userId;
      if (!owns) {
        const assignments = await db.listDocuments(databaseId, 'text_assignments', [Query.equal('textId', text.$id), Query.limit(500)]);
        if (!assignments.documents.some(row => memberClassIds.has(row.classId))) return res.json({ error: 'This text is not assigned to your class' }, 403);
      }
      const versionId = textVersionId(text.$id, level), now = new Date().toISOString();
      let version = null;
      try { version = await db.getDocument(databaseId, 'text_versions', versionId); } catch (cause) { if (cause?.code !== 404) throw cause; }
      const versionMatchesText = version && new Date(version.createdAt).getTime() >= new Date(text.updatedAt).getTime();
      const generationIsStale = version?.status === 'generating' && Date.now() - new Date(version.updatedAt).getTime() > 5 * 60 * 1000;
      if ((version?.status === 'ready' && versionMatchesText) || (version?.status === 'generating' && versionMatchesText && !generationIsStale)) {
        const rows = version.status === 'ready' ? await db.listDocuments(databaseId, 'text_version_paragraphs', [Query.equal('versionId', versionId), Query.limit(5000)]) : { documents: [] };
        return res.json({ version: clean(version), paragraphs: rows.documents.map(clean) });
      }
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
      const versionData = { textId: text.$id, level, status: 'generating', requestedBy: userId, model, promptVersion: TEXT_SUPPORT_PROMPT_VERSION, error: '', createdAt: versionMatchesText ? version.createdAt : now, updatedAt: now };
      if (version) version = await db.updateDocument(databaseId, 'text_versions', versionId, versionData);
      else {
        try { version = await db.createDocument(databaseId, 'text_versions', versionId, versionData); }
        catch (cause) {
          if (cause?.code !== 409) throw cause;
          version = await db.getDocument(databaseId, 'text_versions', versionId);
          return res.json({ version: clean(version), paragraphs: [] });
        }
      }
      try {
        const staleRows = await db.listDocuments(databaseId, 'text_version_paragraphs', [Query.equal('versionId', versionId), Query.limit(5000)]);
        for (const row of staleRows.documents) await db.deleteDocument(databaseId, 'text_version_paragraphs', row.$id);
        const paragraphResult = await db.listDocuments(databaseId, 'text_paragraphs', [Query.equal('textId', text.$id), Query.orderAsc('sortOrder'), Query.limit(5000)]);
        if (!paragraphResult.total) throw new Error('This text has no paragraphs');
        const totalCharacters = paragraphResult.documents.reduce((sum, row) => sum + String(row.content || '').length, 0);
        if (totalCharacters > 100000) throw new Error('This text is too long to adapt in one request');
        const adapted = await adaptTextParagraphs(paragraphResult.documents, level);
        for (const row of adapted) await db.createDocument(databaseId, 'text_version_paragraphs', textVersionParagraphId(versionId, row.originalParagraphId), { versionId, textId: text.$id, originalParagraphId: row.originalParagraphId, sortOrder: row.sortOrder, content: row.content });
        version = await db.updateDocument(databaseId, 'text_versions', versionId, { status: 'ready', error: '', updatedAt: new Date().toISOString() });
        const rows = await db.listDocuments(databaseId, 'text_version_paragraphs', [Query.equal('versionId', versionId), Query.orderAsc('sortOrder'), Query.limit(5000)]);
        return res.json({ version: clean(version), paragraphs: rows.documents.map(clean) });
      } catch (cause) {
        await db.updateDocument(databaseId, 'text_versions', versionId, { status: 'failed', error: String(cause.message || 'Could not create this version').slice(0, 1000), updatedAt: new Date().toISOString() });
        throw cause;
      }
    }

    if (body.action === 'readTexts') {
      const requested = Array.isArray(body.classIds) ? body.classIds : [];
      let allowedClassIds = requested.filter(classId => memberClassIds.has(classId));
      if (profile.role === 'teacher') {
        const ownedClasses = await db.listDocuments(databaseId, 'classes', [Query.equal('teacherId', userId), Query.limit(100)]);
        const ownedClassIds = new Set(ownedClasses.documents.map(row => row.$id));
        allowedClassIds = requested.filter(classId => ownedClassIds.has(classId));
      }
      if (!allowedClassIds.length) return res.json({ assignments: [], texts: [], paragraphs: [], versions: [], versionParagraphs: [], annotations: [] });
      const assignmentQueries = [Query.equal('classId', allowedClassIds), Query.limit(500)];
      if (body.textId) assignmentQueries.unshift(Query.equal('textId', body.textId));
      const assignmentResult = await db.listDocuments(databaseId, 'text_assignments', assignmentQueries);
      const assignments = assignmentResult.documents, textIds = [...new Set(assignments.map(row => row.textId))];
      if (!textIds.length) return res.json({ assignments: [], texts: [], paragraphs: [], versions: [], versionParagraphs: [], annotations: [] });
      const textResult = await db.listDocuments(databaseId, 'texts', [Query.equal('$id', textIds), Query.limit(500)]);
      if (!body.includeContent) return res.json({ assignments: assignments.map(clean), texts: textResult.documents.map(clean), paragraphs: [], versions: [], versionParagraphs: [], annotations: [] });
      const [paragraphResult, annotationResult, versionResult] = await Promise.all([
        db.listDocuments(databaseId, 'text_paragraphs', [Query.equal('textId', textIds), Query.limit(1000)]),
        db.listDocuments(databaseId, 'text_annotations', [Query.equal('textId', textIds), Query.equal('classId', allowedClassIds), Query.limit(1000)]),
        db.listDocuments(databaseId, 'text_versions', [Query.equal('textId', textIds), Query.limit(1000)]),
      ]);
      const textUpdatedAt = new Map(textResult.documents.map(row => [row.$id, new Date(row.updatedAt).getTime()]));
      const currentVersions = versionResult.documents.filter(row => new Date(row.createdAt).getTime() >= (textUpdatedAt.get(row.textId) || 0));
      const readyVersionIds = currentVersions.filter(row => row.status === 'ready').map(row => row.$id);
      const versionParagraphResult = readyVersionIds.length ? await db.listDocuments(databaseId, 'text_version_paragraphs', [Query.equal('versionId', readyVersionIds), Query.limit(5000)]) : { documents: [] };
      const ownCounts = new Map();
      for (const row of annotationResult.documents) if (row.authorId === userId && (row.visibility || 'class') === 'class' && (row.kind || 'annotation') === 'annotation') ownCounts.set(`${row.textId}:${row.classId}`, (ownCounts.get(`${row.textId}:${row.classId}`) || 0) + 1);
      const annotations = annotationResult.documents.filter(row => {
        if ((row.visibility || 'class') === 'private') return row.authorId === userId;
        return profile.role === 'teacher' || profile.role === 'parent' || row.authorId === userId || (ownCounts.get(`${row.textId}:${row.classId}`) || 0) >= 3;
      }).map(row => { const projected = clean(row); if (profile.role !== 'teacher' && row.authorId !== userId) { delete projected.authorId; delete projected.flagReason; } return projected; });
      return res.json({ assignments: assignments.map(clean), texts: textResult.documents.map(clean), paragraphs: paragraphResult.documents.map(clean), versions: currentVersions.map(clean), versionParagraphs: versionParagraphResult.documents.map(clean), annotations });
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

    if (body.action === 'readClassDiscussion') {
      const session = await db.getDocument(databaseId, 'class_sessions', body.sessionId);
      const ownsClass = profile.role === 'teacher' && (await db.listDocuments(databaseId, 'classes', [Query.equal('$id', session.classId), Query.equal('teacherId', userId), Query.limit(1)])).total > 0;
      if (!memberClassIds.has(session.classId) && !ownsClass) return res.json({ error: 'Not enrolled' }, 403);
      const questionResult = await db.listDocuments(databaseId, 'discussion_questions', [Query.equal('classSessionId', body.sessionId), Query.limit(5000)]);
      const questions = questionResult.documents.filter(row => ownsClass || row.moderationStatus === 'visible');
      const questionIds = questions.map(row => row.$id);
      if (!questionIds.length) return res.json({ questions: [], votes: [], answers: [] });
      const [voteResult, answerResult] = await Promise.all([
        db.listDocuments(databaseId, 'question_votes', [Query.equal('classSessionId', body.sessionId), Query.limit(5000)]),
        db.listDocuments(databaseId, 'discussion_answers', [Query.equal('questionId', questionIds), Query.limit(5000)]),
      ]);
      const totals = questionVoteTotals(voteResult.documents);
      const projectedQuestions = questions.map(row => ({ ...clean(row), voteCount: totals.get(row.$id) || 0 }));
      const visibleVotes = voteResult.documents.filter(row => ownsClass || row.userId === userId).map(clean);
      return res.json({ questions: projectedQuestions, votes: visibleVotes, answers: answerResult.documents.map(clean) });
    }

    if (body.action !== 'mutate') return res.json({ error: 'Unsupported action' }, 400);
    const { collection, operation, id } = body;
    if (!studentCollections.has(collection) && !teacherCollections.has(collection)) return res.json({ error: 'Unsupported collection' }, 400);
    if (teacherCollections.has(collection) && profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
    if (studentCollections.has(collection) && profile.role === 'parent') return res.json({ error: 'Parent accounts are read-only' }, 403);
    if (collection === 'quiz_attempts') return res.json({ error: 'Quiz attempts must use the secure quiz submission actions' }, 400);
    const data = { ...body.data }; delete data.$id; delete data.syncStatus;
    let existing = null; if (operation !== 'create') { try { existing = await db.getDocument(databaseId, collection, id); } catch { /* upsert */ } }
    if (collection === 'classes') {
      if (!existing || existing.teacherId !== userId || operation === 'delete') return res.json({ error: 'Only the class owner can update class links' }, 403);
      let links;
      try { links = JSON.parse(data.linksJson || '[]'); } catch { return res.json({ error: 'Invalid class links' }, 400); }
      if (!Array.isArray(links) || links.length > 14 || links.some(link =>
        typeof link?.label !== 'string' || typeof link?.url !== 'string' || !/^https?:\/\//i.test(link.url)
      )) return res.json({ error: 'Invalid class links' }, 400);
      await db.updateDocument(databaseId, collection, id, { linksJson: JSON.stringify(links) });
      return res.json({ ok: true });
    }
    let classId = data.classId || existing?.classId;
    if (!classId && data.classSessionId) { const session = await db.getDocument(databaseId, 'class_sessions', data.classSessionId); classId = session.classId; }
    if (!classId && collection === 'discussion_answers' && (data.questionId || existing?.questionId)) { const question = await db.getDocument(databaseId, 'discussion_questions', data.questionId || existing.questionId); const session = await db.getDocument(databaseId, 'class_sessions', question.classSessionId); classId = session.classId; }
    const isMember = classId ? memberClassIds.has(classId) : false;
    const ownedClass = classId ? await db.listDocuments(databaseId, 'classes', [Query.equal('$id', classId), Query.equal('teacherId', userId), Query.limit(1)]) : { total: 0 };
    const isTeacher = profile.role === 'teacher' && ownedClass.total > 0;
    if (studentCollections.has(collection) && classId && !isMember && !isTeacher) return res.json({ error: 'Not enrolled' }, 403);
    if (teacherCollections.has(collection) && classId && !isTeacher) return res.json({ error: 'Not the class owner' }, 403);
    if (existing && !isTeacher) { const owner = existing.authorId || existing.userId || existing.reviewerId; if (owner && owner !== userId) return res.json({ error: 'Cannot change another student’s work' }, 403); }
    if (existing && isTeacher) { const owner = existing.authorId || existing.userId || existing.reviewerId; if (owner && owner !== userId) { if (collection === 'discussion_questions') { data.questionText = existing.questionText; data.selectedPassage = existing.selectedPassage; data.sourceTitle = existing.sourceTitle || ''; data.sourceUrl = existing.sourceUrl || ''; } if (collection === 'discussion_answers') { data.answerText = existing.answerText; data.sourceTitle = existing.sourceTitle || ''; data.sourceUrl = existing.sourceUrl || ''; } if (collection === 'text_discussion_posts') data.content = existing.content; } }
    if ('authorId' in data && !isTeacher) data.authorId = userId; if ('userId' in data) data.userId = userId; if ('reviewerId' in data) data.reviewerId = userId;
    if (collection === 'discussion_questions' || collection === 'discussion_answers') {
      try { Object.assign(data, normalizeSourceLink(data)); }
      catch (linkError) { return res.json({ error: linkError.message }, 400); }
    }
    if (collection === 'text_discussion_posts' && data.parentId) { const parent = await db.getDocument(databaseId, collection, data.parentId); if (parent.locked || parent.depth >= 3 || parent.classId !== data.classId) return res.json({ error: 'Invalid or locked reply target' }, 400); data.depth = parent.depth + 1; }
    if (collection === 'question_votes') {
      const questionId = data.questionId || existing?.questionId;
      if (!questionId) return res.json({ error: 'Question is required' }, 400);
      const question = await db.getDocument(databaseId, 'discussion_questions', questionId);
      const session = await db.getDocument(databaseId, 'class_sessions', question.classSessionId);
      const ownsSessionClass = profile.role === 'teacher' && (await db.listDocuments(databaseId, 'classes', [Query.equal('$id', session.classId), Query.equal('teacherId', userId), Query.limit(1)])).total > 0;
      if (!memberClassIds.has(session.classId) && !ownsSessionClass) return res.json({ error: 'Not enrolled' }, 403);
      if (question.authorId === userId && !ownsSessionClass) return res.json({ error: 'You cannot vote for your own question' }, 400);

      const ownVotes = await db.listDocuments(databaseId, collection, [Query.equal('classSessionId', session.$id), Query.equal('userId', userId), Query.limit(5000)]);
      const sameQuestion = ownVotes.documents.filter(vote => vote.questionId === questionId);
      if (operation === 'delete') {
        for (const vote of sameQuestion) await db.deleteDocument(databaseId, collection, vote.$id);
        const voteCount = await updateQuestionVoteTotal(db, databaseId, questionId);
        return res.json({ ok: true, voteCount });
      }

      const requestedWeight = Math.max(1, Math.floor(Number(data.weight) || 1));
      const weight = session.allowStackedVotes ? requestedWeight : 1;
      const voteBudget = Math.max(1, Number(session.votesPerStudent) || 4);
      const otherWeight = ownVotes.documents.filter(vote => vote.questionId !== questionId).reduce((sum, vote) => sum + questionVoteWeight(vote), 0);
      if (otherWeight + weight > voteBudget) return res.json({ error: 'Vote limit reached' }, 400);

      const now = new Date().toISOString();
      const voteData = {
        questionId,
        classSessionId: session.$id,
        userId,
        weight,
        createdAt: sameQuestion[0]?.createdAt || data.createdAt || now,
        updatedAt: now,
      };
      if (sameQuestion.length) {
        await db.updateDocument(databaseId, collection, sameQuestion[0].$id, voteData);
        for (const duplicate of sameQuestion.slice(1)) await db.deleteDocument(databaseId, collection, duplicate.$id);
      } else {
        await db.createDocument(databaseId, collection, id || ID.unique(), voteData);
      }
      const voteCount = await updateQuestionVoteTotal(db, databaseId, questionId);
      return res.json({ ok: true, voteCount });
    }
    if (collection === 'text_discussion_votes') {
      const post = await db.getDocument(databaseId, 'text_discussion_posts', data.postId || existing?.postId);
      if (!memberClassIds.has(post.classId) && !isTeacher) return res.json({ error: 'Not enrolled' }, 403);
      const prior = await db.listDocuments(databaseId, collection, [Query.equal('postId', post.$id), Query.equal('userId', userId), Query.limit(1)]), oldValue = prior.documents[0]?.value || 0;
      if (operation === 'delete') { if (prior.total) await db.deleteDocument(databaseId, collection, prior.documents[0].$id); await db.updateDocument(databaseId, 'text_discussion_posts', post.$id, { score: post.score - oldValue, updatedAt: new Date().toISOString() }); return res.json({ ok: true }); }
      if (![-1, 1].includes(data.value)) return res.json({ error: 'Vote must be -1 or 1' }, 400);
      data.userId = userId; if (prior.total) await db.updateDocument(databaseId, collection, prior.documents[0].$id, data); else await db.createDocument(databaseId, collection, id || ID.unique(), data);
      await db.updateDocument(databaseId, 'text_discussion_posts', post.$id, { score: post.score - oldValue + data.value, updatedAt: new Date().toISOString() }); return res.json({ ok: true });
    }
    if (collection === 'text_annotations') {
      const textId = data.textId || existing?.textId, annotationClassId = data.classId || existing?.classId;
      const assignment = await db.listDocuments(databaseId,'text_assignments',[Query.equal('textId',textId),Query.equal('classId',annotationClassId),Query.limit(1)]);
      if (!assignment.total) return res.json({error:'Text is not assigned to this class'},403);
      if (operation === 'create') {
        data.authorId=userId;data.anonymousLabel=`Reader ${userId.slice(-4).toUpperCase()}`;data.createdAt=new Date().toISOString();data.moderationStatus='visible';data.flagged=false;data.flagReason='';
        if (!['annotation','highlight','page_note','reply'].includes(data.kind || 'annotation')) return res.json({error:'Invalid annotation kind'},400);
        if (!['class','private'].includes(data.visibility || 'class')) return res.json({error:'Invalid annotation visibility'},400);
        if (data.kind === 'highlight') data.visibility='private';
        if (data.parentId) { const parent=await db.getDocument(databaseId,'text_annotations',data.parentId);if(parent.textId!==textId||parent.classId!==annotationClassId||parent.parentId)return res.json({error:'Invalid reply target'},400);data.kind='reply';data.paragraphId=parent.paragraphId;data.selectedText=''; }
      } else if (existing && !isTeacher) {
        data.textId=existing.textId;data.classId=existing.classId;data.paragraphId=existing.paragraphId;data.authorId=existing.authorId;data.anonymousLabel=existing.anonymousLabel;data.kind=existing.kind;data.parentId=existing.parentId;data.visibility=existing.visibility;data.moderationStatus=existing.moderationStatus;data.flagged=existing.flagged;data.flagReason=existing.flagReason;data.createdAt=existing.createdAt;
      }
      let tags=[];try{tags=JSON.parse(data.tagsJson||'[]')}catch{return res.json({error:'Invalid annotation tags'},400)}
      if(!Array.isArray(tags)||tags.length>8||tags.some(tag=>typeof tag!=='string'||tag.length>40))return res.json({error:'Use up to 8 short tags'},400);
      data.tagsJson=JSON.stringify([...new Set(tags.map(tag=>tag.trim().toLowerCase()).filter(Boolean))]);data.content=String(data.content||'').trim().slice(0,5000);data.selectedText=String(data.selectedText||'').trim().slice(0,2000);data.updatedAt=new Date().toISOString();
      if(!data.content)return res.json({error:'Annotation text is required'},400);
    }
    if (operation === 'delete') {
      if(collection==='text_annotations'){const replies=await db.listDocuments(databaseId,collection,[Query.equal('parentId',id),Query.limit(500)]);for(const reply of replies.documents)await db.deleteDocument(databaseId,collection,reply.$id);}
      await db.deleteDocument(databaseId, collection, id); return res.json({ ok: true });
    }
    try { await db.createDocument(databaseId, collection, id, data); } catch { await db.updateDocument(databaseId, collection, id, data); }
    return res.json({ ok: true });
  } catch (err) { error(err.message); return res.json({ error: 'Request failed' }, 500); }
};
