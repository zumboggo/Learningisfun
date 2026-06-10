import { functions, databases, DATABASE_ID, COLLECTIONS, FUNCTION_IDS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateId, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import { Query } from 'appwrite';
import type { DiscussionQuestion, QuestionVote } from '@/types';

export async function submitQuestion(
  userId: string,
  readingId: string,
  assignmentId: string,
  questionText: string,
  selectedPassage: string = '',
): Promise<DiscussionQuestion> {
  const id = generateId();
  const now = getTimestamp();
  const question: DiscussionQuestion = {
    $id: id,
    readingId,
    assignmentId,
    authorId: userId,
    questionText,
    selectedPassage,
    voteCount: 0,
    moderationStatus: 'visible',
    discussionStatus: 'none',
    isTeacherQuestion: false,
    teacherVisibleBeforeSubmission: false,
    createdAt: now,
    syncStatus: 'local',
  };

  await db.discussion_questions.put(question);
  try {
    await functions.createExecution(FUNCTION_IDS.submitQuestion, JSON.stringify({
      assignmentId,
      readingId,
      questionText,
      selectedPassage,
    }));
    await db.discussion_questions.update(id, { syncStatus: 'synced' });
  } catch {
    await addToQueue(userId, 'question', id, 'create', question);
  }

  return question;
}

export async function hasSubmittedQuestion(userId: string, assignmentId: string): Promise<boolean> {
  const existing = await db.discussion_questions
    .where('assignmentId')
    .equals(assignmentId)
    .and(q => q.authorId === userId && q.moderationStatus !== 'removed')
    .first();
  return !!existing;
}

export async function getVisibleQuestions(assignmentId: string, userId: string): Promise<DiscussionQuestion[]> {
  const hasSubmitted = await hasSubmittedQuestion(userId, assignmentId);
  if (!hasSubmitted) {
    return db.discussion_questions
      .where('assignmentId')
      .equals(assignmentId)
      .and(q => q.isTeacherQuestion && q.teacherVisibleBeforeSubmission)
      .toArray();
  }

  const questions = await db.discussion_questions
    .where('assignmentId')
    .equals(assignmentId)
    .and(q => q.moderationStatus === 'visible')
    .toArray();

  return questions;
}

export async function getQuestionsWithAuthorship(assignmentId: string): Promise<DiscussionQuestion[]> {
  return db.discussion_questions
    .where('assignmentId')
    .equals(assignmentId)
    .toArray();
}

export async function toggleVote(
  userId: string,
  questionId: string,
): Promise<boolean> {
  const question = await db.discussion_questions.get(questionId);
  if (!question) return false;
  if (question.authorId === userId) return false;

  const existingVote = await db.question_votes
    .where('questionId')
    .equals(questionId)
    .and(v => v.userId === userId)
    .first();

  if (existingVote) {
    await db.question_votes.delete(existingVote.$id);
    await db.discussion_questions.update(questionId, {
      voteCount: Math.max(0, question.voteCount - 1),
    });
    try {
      await functions.createExecution(FUNCTION_IDS.toggleVote, JSON.stringify({
        questionId,
        remove: true,
      }));
    } catch {
      await addToQueue(userId, 'vote', existingVote.$id, 'delete', { questionId });
    }
    return false;
  }

  const voteId = generateId();
  const now = getTimestamp();
  const vote: QuestionVote = {
    $id: voteId,
    questionId,
    userId,
    createdAt: now,
    syncStatus: 'local',
  };

  await db.question_votes.put(vote);
  await db.discussion_questions.update(questionId, {
    voteCount: question.voteCount + 1,
  });

  try {
    await functions.createExecution(FUNCTION_IDS.toggleVote, JSON.stringify({ questionId }));
    await db.question_votes.update(voteId, { syncStatus: 'synced' });
  } catch {
    await addToQueue(userId, 'vote', voteId, 'create', vote);
  }

  return true;
}

export async function hasVoted(userId: string, questionId: string): Promise<boolean> {
  const vote = await db.question_votes
    .where('questionId')
    .equals(questionId)
    .and(v => v.userId === userId)
    .first();
  return !!vote;
}

export async function getUserVoteCount(userId: string, assignmentId: string): Promise<number> {
  const questions = await db.discussion_questions
    .where('assignmentId')
    .equals(assignmentId)
    .toArray();
  const questionIds = new Set(questions.map(q => q.$id));

  const votes = await db.question_votes
    .where('userId')
    .equals(userId)
    .toArray();

  return votes.filter(v => questionIds.has(v.questionId)).length;
}

export async function moderateQuestion(
  questionId: string,
  status: 'visible' | 'hidden' | 'removed',
): Promise<void> {
  await db.discussion_questions.update(questionId, { moderationStatus: status });
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.discussion_questions, questionId, {
      moderationStatus: status,
    });
  } catch {
    // Will sync later
  }
}

export async function markForDiscussion(
  questionId: string,
  status: 'none' | 'selected' | 'discussed' | 'archived',
): Promise<void> {
  await db.discussion_questions.update(questionId, { discussionStatus: status });
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.discussion_questions, questionId, {
      discussionStatus: status,
    });
  } catch {
    // Will sync later
  }
}

export async function syncQuestionsFromServer(assignmentId: string): Promise<void> {
  try {
    const result = await functions.createExecution(FUNCTION_IDS.getQuestions, JSON.stringify({ assignmentId }));
    if (result.responseBody) {
      const questions = JSON.parse(result.responseBody) as DiscussionQuestion[];
      for (const q of questions) {
        await db.discussion_questions.put({ ...q, syncStatus: 'synced' });
      }
    }
  } catch {
    // Offline
  }
}
