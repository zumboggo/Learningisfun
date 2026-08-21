import { Client, Databases, ID, Query } from 'node-appwrite';
import { createHash } from 'node:crypto';

const studentCollections = new Set(['quiz_attempts', 'writing_submissions', 'peer_reviews', 'discussion_questions', 'discussion_answers', 'question_votes', 'text_annotations', 'text_discussion_posts', 'text_discussion_votes']);
const teacherCollections = new Set(['classes', 'deck_assignments', 'quizzes', 'quiz_assignments', 'quiz_questions', 'writing_prompts', 'writing_prompt_assignments', 'texts', 'text_assignments', 'text_paragraphs']);
const clean = document => { const output = { ...document }; for (const key of Object.keys(output)) if (key.startsWith('$')) delete output[key]; output.$id = document.$id; return output; };
const membershipId = (classId, userId) => `member_${createHash('sha256').update(`${classId}:${userId}`).digest('hex').slice(0, 29)}`;
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
      const session = await db.createDocument(databaseId, 'class_sessions', ID.unique(), { classId: body.classId, assignmentId: null, discussionType: 'presentation', textId: null, promptMarkdown: String(normalizedQuestions[0].text).trim(), title: String(body.title || '').trim() || 'Writing Prompt', sessionDate: now.slice(0, 10), status: 'active', votesPerStudent: 0, allowStackedVotes: false, notesMarkdown: JSON.stringify({ reveal: false }), publishedNotesMarkdown: '', publishedAt: null, createdAt: now, updatedAt: now });
      let firstQuestionId = null;
      for (let index = 0; index < normalizedQuestions.length; index++) {
        const q = normalizedQuestions[index], options = q.options;
        const created = await db.createDocument(databaseId, 'discussion_questions', ID.unique(), { classSessionId: session.$id, authorId: userId, questionText: String(q.text).trim(), selectedPassage: JSON.stringify({ type: q.type, options, answer: String(q.answer || '') }), voteCount: index, moderationStatus: 'visible', discussionStatus: 'none', discussionNotesMarkdown: '', notesUpdatedAt: null, isTeacherQuestion: true, teacherVisibleBeforeSubmission: true, createdAt: now });
        if (!firstQuestionId) firstQuestionId = created.$id;
      }
      await db.updateDocument(databaseId, 'class_sessions', session.$id, { assignmentId: firstQuestionId, notesMarkdown: JSON.stringify({ reveal: false, lastQuestionId: firstQuestionId }) });
      return res.json({ sessionId: session.$id });
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
          const sections = questions.map(q => { const responses = allAnswers.documents.filter(row => row.questionId === q.$id); return `## ${q.questionText}\n\n${responses.length ? responses.map(row => `- ${row.answerText}`).join('\n\n') : '_No responses submitted._'}`; });
          publishedNotesMarkdown = `# Writing Prompt\n\n${sections.join('\n\n---\n\n')}`;
        }
        if (assignmentId) lastQuestionId = assignmentId;
        await db.updateDocument(databaseId, 'class_sessions', session.$id, { assignmentId, status, notesMarkdown: JSON.stringify({ reveal, lastQuestionId }), publishedNotesMarkdown, updatedAt: new Date().toISOString(), publishedAt: status === 'published' ? new Date().toISOString() : null });
        return res.json({ ok: true });
      }
      const active = questions.find(q => q.$id === session.assignmentId) || null;
      if (body.action === 'submitLiveAnswer') {
        if (profile.role !== 'student' || !active || session.status !== 'active') return res.json({ error: 'No question is accepting answers' }, 403);
        let config = {}; try { config = JSON.parse(active.selectedPassage || '{}'); } catch { /* invalid configuration */ }
        const answer = String(body.answer ?? '').trim();
        if (!answer || answer.length > 10000) return res.json({ error: 'Enter a valid answer' }, 400);
        if (config.type === 'mc' && (!/^\d+$/.test(answer) || Number(answer) < 0 || Number(answer) >= config.options.length)) return res.json({ error: 'Choose a valid answer' }, 400);
        const prior = await db.listDocuments(databaseId, 'discussion_answers', [Query.equal('questionId', active.$id), Query.equal('authorId', userId), Query.limit(1)]), now = new Date().toISOString();
        const data = { questionId: active.$id, authorId: userId, authorName: '', answerText: answer, createdAt: prior.documents[0]?.createdAt || now, updatedAt: now };
        if (prior.total) await db.updateDocument(databaseId, 'discussion_answers', prior.documents[0].$id, data); else await db.createDocument(databaseId, 'discussion_answers', ID.unique(), data);
        return res.json({ ok: true });
      }
      const answerResult = active ? await db.listDocuments(databaseId, 'discussion_answers', [Query.equal('questionId', active.$id), Query.limit(5000)]) : { documents: [] };
      const myAnswer = answerResult.documents.find(row => row.authorId === userId)?.answerText || null;
      let config = {}; try { config = active ? JSON.parse(active.selectedPassage || '{}') : {}; } catch { /* invalid configuration */ }
      const reveal = (() => { try { return Boolean(JSON.parse(session.notesMarkdown || '{}').reveal); } catch { return false; } })();
      const mcCounts = Array.isArray(config.options) ? config.options.map((_, i) => answerResult.documents.filter(row => Number(row.answerText) === i).length) : [];
      const roster = await db.listDocuments(databaseId, 'class_members', [Query.equal('classId', session.classId), Query.equal('role', 'student'), Query.limit(5000)]);
      const projectQuestion = q => { let c = {}; try { c = JSON.parse(q.selectedPassage || '{}'); } catch { /* invalid */ } return { id: q.$id, text: q.questionText, sortOrder: q.voteCount, type: c.type || 'short', options: c.options || [], answer: owns || reveal ? c.answer || '' : '' }; };
      return res.json({ session: clean(session), questions: owns ? questions.map(projectQuestion) : [], activeQuestion: active ? projectQuestion(active) : null, ownAnswer: myAnswer, answeredCount: answerResult.documents.length, enrolledCount: roster.total, mcCounts: owns || myAnswer ? mcCounts : [], reveal, responses: owns && active ? answerResult.documents.map((row, i) => ({ id: row.$id, answer: row.answerText, label: `Response ${i + 1}` })) : [], isTeacher: owns });
    }

    if (body.action === 'deleteQuiz') {
      if (profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
      const quiz = await db.getDocument(databaseId, 'quizzes', body.quizId);
      if (quiz.createdBy !== userId) return res.json({ error: 'Not the quiz owner' }, 403);
      await deleteQuizCascade(db, databaseId, quiz.$id);
      return res.json({ deletedQuizId: quiz.$id });
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
      const quizzes = [...quizzesById.values()].filter(row => profile.role === 'teacher' || row.status === 'published');
      const quizIds = quizzes.map(row => row.$id);
      if (!quizIds.length) return res.json({ assignments: assignmentResult.documents.map(clean), quizzes: [], questions: [], attempts: [], expiredQuizIds });
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
        questions: questionResult.documents.map(clean),
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
      const visibleVotes = voteResult.documents.filter(row => ownsClass || row.userId === userId).map(clean);
      return res.json({ questions: questions.map(clean), votes: visibleVotes, answers: answerResult.documents.map(clean) });
    }

    if (body.action !== 'mutate') return res.json({ error: 'Unsupported action' }, 400);
    const { collection, operation, id } = body;
    if (!studentCollections.has(collection) && !teacherCollections.has(collection)) return res.json({ error: 'Unsupported collection' }, 400);
    if (teacherCollections.has(collection) && profile.role !== 'teacher') return res.json({ error: 'Teacher role required' }, 403);
    if (studentCollections.has(collection) && profile.role === 'parent') return res.json({ error: 'Parent accounts are read-only' }, 403);
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
    if (existing && isTeacher) { const owner = existing.authorId || existing.userId || existing.reviewerId; if (owner && owner !== userId) { if (collection === 'discussion_questions') { data.questionText = existing.questionText; data.selectedPassage = existing.selectedPassage; } if (collection === 'discussion_answers') data.answerText = existing.answerText; if (collection === 'text_discussion_posts') data.content = existing.content; } }
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
