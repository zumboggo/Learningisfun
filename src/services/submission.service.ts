import { db } from '@/db/schema';
import { countMarkdownWords } from '@/components/common/Markdown';
import { generateId, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import type { Submission } from '@/types';

export async function saveSubmissionDraft(
  userId: string,
  assignmentId: string,
  responseMarkdown: string,
): Promise<Submission> {
  return upsertSubmission(userId, assignmentId, responseMarkdown, 'draft');
}

export async function submitResponse(
  userId: string,
  assignmentId: string,
  responseMarkdown: string,
): Promise<Submission> {
  return upsertSubmission(userId, assignmentId, responseMarkdown, 'submitted');
}

export async function getStudentSubmission(
  userId: string,
  assignmentId: string,
): Promise<Submission | undefined> {
  return db.submissions
    .where('[assignmentId+userId]')
    .equals([assignmentId, userId])
    .first();
}

export async function getAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
  return db.submissions.where('assignmentId').equals(assignmentId).toArray();
}

export function isBelowMinimum(wordCount: number, minResponseWords: number): boolean {
  return minResponseWords > 0 && wordCount < minResponseWords;
}

async function upsertSubmission(
  userId: string,
  assignmentId: string,
  responseMarkdown: string,
  status: Submission['status'],
): Promise<Submission> {
  const assignment = await db.reading_assignments.get(assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  const existing = await getStudentSubmission(userId, assignmentId);
  const now = getTimestamp();
  const wordCount = countMarkdownWords(responseMarkdown);
  const submission: Submission = {
    $id: existing?.$id || generateId(),
    assignmentId,
    classId: assignment.classId,
    userId,
    responseMarkdown,
    wordCount,
    belowMinimum: isBelowMinimum(wordCount, assignment.minResponseWords || 0),
    status,
    submittedAt: status === 'submitted' ? existing?.submittedAt || now : existing?.submittedAt || null,
    updatedAt: now,
    syncStatus: 'local',
  };
  await db.submissions.put(submission);
  await addToQueue(userId, 'submission', submission.$id, existing ? 'update' : 'create', submission);
  return submission;
}
