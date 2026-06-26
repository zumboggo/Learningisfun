import { db } from '@/db/schema';
import { generateId, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import type { ClassSession, ClassSessionItem, Submission, DiscussionQuestion } from '@/types';

export async function createClassSession(
  classId: string,
  teacherId: string,
  input: {
    title: string;
    sessionDate?: string;
    assignmentId?: string | null;
    votesPerStudent?: number;
    allowStackedVotes?: boolean;
  },
): Promise<ClassSession> {
  const now = getTimestamp();
  const session: ClassSession = {
    $id: generateId(),
    classId,
    assignmentId: input.assignmentId || null,
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
  updates: Partial<Pick<ClassSession, 'title' | 'status' | 'votesPerStudent' | 'allowStackedVotes' | 'notesMarkdown' | 'assignmentId'>>,
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
  const session = await db.class_sessions.get(sessionId);
  if (!session) return;
  const questions = await db.discussion_questions
    .where('classSessionId')
    .equals(sessionId)
    .and(q => q.moderationStatus === 'visible' && (q.discussionStatus === 'selected' || q.discussionStatus === 'discussed'))
    .toArray();
  const publishedNotesMarkdown = buildPublishedNotes(session, questions);
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

export async function addSessionItem(
  sessionId: string,
  userId: string,
  type: ClassSessionItem['type'],
  source: DiscussionQuestion | Submission,
): Promise<ClassSessionItem> {
  const count = await db.class_session_items.where('classSessionId').equals(sessionId).count();
  const snapshotMarkdown = type === 'question'
    ? (source as DiscussionQuestion).questionText
    : (source as Submission).responseMarkdown;
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

function buildPublishedNotes(session: ClassSession, questions: DiscussionQuestion[]): string {
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
