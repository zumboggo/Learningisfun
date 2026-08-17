import { Query } from 'appwrite';
import { db } from '@/db/schema';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { generateId, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import type {
  ClassSession,
  ClassSessionItem,
  DiscussionAnswer,
  DiscussionQuestion,
  QuestionVote,
} from '@/types';

export async function createClassSession(
  classId: string,
  teacherId: string,
  input: {
    title: string;
    sessionDate?: string;
    assignmentId?: string | null;
    votesPerStudent?: number;
    allowStackedVotes?: boolean;
    discussionType?: ClassSession['discussionType'];
    textId?: string | null;
    promptMarkdown?: string;
  },
): Promise<ClassSession> {
  const now = getTimestamp();
  const session: ClassSession = {
    $id: generateId(),
    classId,
    assignmentId: input.assignmentId || undefined,
    discussionType: input.discussionType || 'qft',
    textId: input.textId || null,
    promptMarkdown: input.promptMarkdown || '',
    title: input.title.trim() || 'Class discussion',
    sessionDate: input.sessionDate || todayKey(),
    status: 'active',
    votesPerStudent: normalizeVoteBudget(input.votesPerStudent),
    allowStackedVotes: Boolean(input.allowStackedVotes),
    notesMarkdown: '',
    publishedNotesMarkdown: '',
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'local',
  };

  await db.class_sessions.put(session);
  await addToQueue(teacherId, 'class_session', session.$id, 'create', session);
  return session;
}

export async function getOrCreateTodayNotes(classId: string, teacherId: string): Promise<ClassSession> {
  const date = todayKey();
  const existing = await db.class_sessions
    .where('classId')
    .equals(classId)
    .and(session => session.discussionType === 'notes' && session.sessionDate === date)
    .first();
  if (existing) return existing;

  const session = await createClassSession(classId, teacherId, {
    title: "Today's Notes",
    sessionDate: date,
    discussionType: 'notes',
    votesPerStudent: 0,
  });
  await db.class_sessions.update(session.$id, { status: 'draft' });
  return { ...session, status: 'draft' };
}

export async function saveTodayNotes(sessionId: string, userId: string, content: string): Promise<void> {
  const now = getTimestamp();
  await db.class_sessions.update(sessionId, {
    notesMarkdown: content,
    publishedNotesMarkdown: content,
    publishedAt: now,
    status: 'published',
    updatedAt: now,
    syncStatus: 'local',
  });
  const updated = await db.class_sessions.get(sessionId);
  if (updated) await addToQueue(userId, 'class_session', sessionId, 'update', updated);
}

export async function getClassSessions(classId: string): Promise<ClassSession[]> {
  return db.class_sessions
    .where('classId')
    .equals(classId)
    .reverse()
    .sortBy('sessionDate');
}

export async function getActiveClassSessions(classId: string): Promise<ClassSession[]> {
  return db.class_sessions
    .where('classId')
    .equals(classId)
    .and(s => s.status === 'active' || s.status === 'draft')
    .toArray();
}

export async function updateClassSession(
  sessionId: string,
  userId: string,
  updates: Partial<Pick<ClassSession, 'title' | 'status' | 'votesPerStudent' | 'allowStackedVotes' | 'notesMarkdown' | 'assignmentId' | 'promptMarkdown'>>,
): Promise<void> {
  const now = getTimestamp();
  const patch = {
    ...updates,
    votesPerStudent: updates.votesPerStudent === undefined ? undefined : normalizeVoteBudget(updates.votesPerStudent),
    updatedAt: now,
    syncStatus: 'local' as const,
  };
  await db.class_sessions.update(sessionId, patch);
  const session = await db.class_sessions.get(sessionId);
  if (session) await addToQueue(userId, 'class_session', sessionId, 'update', session);
}

export async function publishClassNotes(sessionId: string, userId: string): Promise<void> {
  const publishedNotesMarkdown = await buildClassNotesPreview(sessionId);
  if (!publishedNotesMarkdown) return;
  const now = getTimestamp();
  await db.class_sessions.update(sessionId, {
    publishedNotesMarkdown,
    publishedAt: now,
    status: 'published',
    updatedAt: now,
    syncStatus: 'local',
  });
  const updated = await db.class_sessions.get(sessionId);
  if (updated) await addToQueue(userId, 'class_session', sessionId, 'update', updated);
}

export async function buildClassNotesPreview(sessionId: string): Promise<string> {
  const session = await db.class_sessions.get(sessionId);
  if (!session) return '';
  const questions = await db.discussion_questions
    .where('classSessionId')
    .equals(sessionId)
    .and(q => q.moderationStatus === 'visible' && (q.discussionStatus === 'selected' || q.discussionStatus === 'discussed'))
    .toArray();
  return buildPublishedNotes(session, questions);
}

export async function addSessionItem(
  sessionId: string,
  userId: string,
  type: ClassSessionItem['type'],
  source: DiscussionQuestion,
): Promise<ClassSessionItem> {
  const count = await db.class_session_items.where('classSessionId').equals(sessionId).count();
  const snapshotMarkdown = source.questionText;
  const item: ClassSessionItem = {
    $id: generateId(),
    classSessionId: sessionId,
    type,
    sourceId: source.$id,
    sortOrder: count,
    snapshotMarkdown,
    createdAt: getTimestamp(),
    syncStatus: 'local',
  };
  await db.class_session_items.put(item);
  await addToQueue(userId, 'class_session_item', item.$id, 'create', item);
  return item;
}

// ---------------------------------------------------------------------------
// Pulling from the server
//
// A discussion is created on the teacher's device and pushed up through the
// sync queue. Nothing brought it back down again, so students — who only ever
// read their own IndexedDB — saw an empty Discussions list no matter what the
// teacher started. These pulls are the missing half.
// ---------------------------------------------------------------------------

/** Fetch every discussion belonging to these classes into the local database. */
export async function syncClassSessionsFromServer(classIds: string[]): Promise<void> {
  if (classIds.length === 0) return;
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.class_sessions, [
      Query.equal('classId', classIds),
      Query.limit(200),
    ]);

    for (const doc of result.documents as unknown as Array<Record<string, unknown>>) {
      const id = doc.$id as string;
      // Never clobber a local edit that has not reached the server yet.
      const local = await db.class_sessions.get(id);
      if (local && local.syncStatus === 'local') continue;

      await db.class_sessions.put({
        $id: id,
        classId: doc.classId as string,
        assignmentId: (doc.assignmentId as string) || undefined,
        discussionType: (doc.discussionType as ClassSession['discussionType']) || 'qft',
        textId: (doc.textId as string) || null,
        promptMarkdown: (doc.promptMarkdown as string) || '',
        title: (doc.title as string) || 'Class discussion',
        sessionDate: doc.sessionDate as string,
        status: doc.status as ClassSession['status'],
        votesPerStudent: (doc.votesPerStudent as number) ?? 4,
        allowStackedVotes: Boolean(doc.allowStackedVotes),
        notesMarkdown: (doc.notesMarkdown as string) || '',
        publishedNotesMarkdown: (doc.publishedNotesMarkdown as string) || '',
        publishedAt: (doc.publishedAt as string) || null,
        createdAt: doc.createdAt as string,
        updatedAt: (doc.updatedAt as string) || (doc.createdAt as string),
        syncStatus: 'synced',
      });
    }
  } catch {
    // Offline — whatever is cached stays on screen.
  }
}

/** Every discussion in every class this user belongs to. */
export async function syncMyClassSessionsFromServer(userId: string): Promise<void> {
  const memberships = await db.class_members.where('userId').equals(userId).toArray();
  await syncClassSessionsFromServer([...new Set(memberships.map(m => m.classId))]);
}

/**
 * Fetch one discussion's questions, votes and replies. Called when a discussion
 * is opened so students see each other's questions and the teacher sees theirs.
 */
export async function syncDiscussionFromServer(classSessionId: string): Promise<void> {
  await Promise.all([
    pullQuestions(classSessionId),
    pullVotes(classSessionId),
  ]);
  // Replies hang off questions, so they can only be fetched once the question
  // ids are known locally.
  await pullAnswers(classSessionId);
}

async function pullQuestions(classSessionId: string): Promise<void> {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.discussion_questions, [
      Query.equal('classSessionId', classSessionId),
      Query.limit(500),
    ]);
    for (const doc of result.documents as unknown as Array<Record<string, unknown>>) {
      const id = doc.$id as string;
      const local = await db.discussion_questions.get(id);
      if (local && local.syncStatus === 'local') continue;

      await db.discussion_questions.put({
        $id: id,
        classSessionId,
        authorId: doc.authorId as string,
        questionText: (doc.questionText as string) || '',
        selectedPassage: (doc.selectedPassage as string) || '',
        voteCount: (doc.voteCount as number) ?? 0,
        moderationStatus: (doc.moderationStatus as DiscussionQuestion['moderationStatus']) || 'visible',
        discussionStatus: (doc.discussionStatus as DiscussionQuestion['discussionStatus']) || 'none',
        discussionNotesMarkdown: (doc.discussionNotesMarkdown as string) || '',
        notesUpdatedAt: (doc.notesUpdatedAt as string) || null,
        isTeacherQuestion: Boolean(doc.isTeacherQuestion),
        teacherVisibleBeforeSubmission: Boolean(doc.teacherVisibleBeforeSubmission),
        createdAt: doc.createdAt as string,
        syncStatus: 'synced',
      });
    }
  } catch {
    // Offline
  }
}

async function pullVotes(classSessionId: string): Promise<void> {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.question_votes, [
      Query.equal('classSessionId', classSessionId),
      Query.limit(2000),
    ]);
    for (const doc of result.documents as unknown as Array<Record<string, unknown>>) {
      const id = doc.$id as string;
      const local = await db.question_votes.get(id);
      if (local && local.syncStatus === 'local') continue;

      await db.question_votes.put({
        $id: id,
        questionId: doc.questionId as string,
        classSessionId,
        userId: doc.userId as string,
        weight: (doc.weight as number) ?? 1,
        createdAt: doc.createdAt as string,
        updatedAt: (doc.updatedAt as string) || (doc.createdAt as string),
        syncStatus: 'synced',
      } as QuestionVote);
    }
  } catch {
    // Offline
  }
}

async function pullAnswers(classSessionId: string): Promise<void> {
  const questions = await db.discussion_questions
    .where('classSessionId')
    .equals(classSessionId)
    .toArray();
  if (questions.length === 0) return;

  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.discussion_answers, [
      Query.equal('questionId', questions.map(q => q.$id)),
      Query.limit(1000),
    ]);
    for (const doc of result.documents as unknown as Array<Record<string, unknown>>) {
      const id = doc.$id as string;
      const local = await db.discussion_answers.get(id);
      if (local && local.syncStatus === 'local') continue;

      await db.discussion_answers.put({
        $id: id,
        questionId: doc.questionId as string,
        authorId: doc.authorId as string,
        authorName: (doc.authorName as string) || '',
        answerText: (doc.answerText as string) || '',
        createdAt: doc.createdAt as string,
        updatedAt: (doc.updatedAt as string) || (doc.createdAt as string),
        syncStatus: 'synced',
      } as DiscussionAnswer);
    }
  } catch {
    // Offline, or the collection has not been created yet.
  }
}

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeVoteBudget(value: number | undefined): number {
  if (!Number.isFinite(value)) return 4;
  return Math.min(20, Math.max(0, Math.round(value || 4)));
}

function buildPublishedNotes(
  session: ClassSession,
  questions: DiscussionQuestion[],
): string {
  const sections = [`# ${session.title}`];
  if (session.notesMarkdown.trim()) sections.push(session.notesMarkdown.trim());
  const selected = [...questions].sort((a, b) => b.voteCount - a.voteCount);
  if (selected.length > 0) {
    sections.push('## Discussed Questions');
    for (const question of selected) {
      sections.push(`### ${question.questionText}`);
      if (question.selectedPassage) sections.push(`> ${question.selectedPassage}`);
      if (question.discussionNotesMarkdown.trim()) sections.push(question.discussionNotesMarkdown.trim());
    }
  }
  return sections.join('\n\n');
}
