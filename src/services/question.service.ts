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
    classSessionId: '',
    authorId: userId,
    questionText,
    selectedPassage,
    voteCount: 0,
    moderationStatus: 'visible',
    discussionStatus: 'none',
    discussionNotesMarkdown: '',
    notesUpdatedAt: null,
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

export async function submitSessionQuestion(
  userId: string,
  classSessionId: string,
  questionText: string,
  selectedPassage: string = '',
): Promise<DiscussionQuestion> {
  const session = await db.class_sessions.get(classSessionId);
  if (!session) throw new Error('Class session not found');
  const assignment = session.assignmentId ? await db.reading_assignments.get(session.assignmentId) : undefined;
  const id = generateId();
  const now = getTimestamp();
  const question: DiscussionQuestion = {
    $id: id,
    readingId: assignment?.readingId || '',
    assignmentId: session.assignmentId || '',
    classSessionId,
    authorId: userId,
    questionText,
    selectedPassage,
    voteCount: 0,
    moderationStatus: 'visible',
    discussionStatus: 'none',
    discussionNotesMarkdown: '',
    notesUpdatedAt: null,
    isTeacherQuestion: false,
    teacherVisibleBeforeSubmission: false,
    createdAt: now,
    syncStatus: 'local',
  };

  await db.discussion_questions.put(question);
  await addToQueue(userId, 'question', id, 'create', question);
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
    classSessionId: question.classSessionId || '',
    userId,
    weight: 1,
    createdAt: now,
    updatedAt: now,
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

export async function getSessionQuestions(classSessionId: string): Promise<DiscussionQuestion[]> {
  const questions = await db.discussion_questions
    .where('classSessionId')
    .equals(classSessionId)
    .and(q => q.moderationStatus === 'visible')
    .toArray();
  return sortQuestionsForDiscussion(questions);
}

export async function getSessionQuestionsWithAuthorship(classSessionId: string): Promise<DiscussionQuestion[]> {
  const questions = await db.discussion_questions
    .where('classSessionId')
    .equals(classSessionId)
    .toArray();
  return sortQuestionsForDiscussion(questions);
}

export async function getSessionVoteCount(userId: string, classSessionId: string): Promise<number> {
  const votes = await db.question_votes
    .where('classSessionId')
    .equals(classSessionId)
    .and(v => v.userId === userId)
    .toArray();
  return votes.reduce((sum, vote) => sum + Math.max(1, vote.weight || 1), 0);
}

export async function getQuestionVoteWeight(userId: string, questionId: string): Promise<number> {
  const vote = await db.question_votes
    .where('[questionId+userId]')
    .equals([questionId, userId])
    .first();
  return vote?.weight || 0;
}

export async function toggleSessionVote(
  userId: string,
  questionId: string,
): Promise<{ voted: boolean; usedVotes: number }> {
  const question = await db.discussion_questions.get(questionId);
  if (!question || !question.classSessionId) return { voted: false, usedVotes: 0 };
  if (question.authorId === userId) return { voted: false, usedVotes: await getSessionVoteCount(userId, question.classSessionId) };

  const session = await db.class_sessions.get(question.classSessionId);
  const voteBudget = session?.votesPerStudent ?? 4;
  const allowStacked = Boolean(session?.allowStackedVotes);
  const existingVote = await db.question_votes
    .where('[questionId+userId]')
    .equals([questionId, userId])
    .first();
  const usedVotes = await getSessionVoteCount(userId, question.classSessionId);

  if (existingVote && !allowStacked) {
    await db.question_votes.delete(existingVote.$id);
    await updateQuestionVoteCount(questionId);
    await addToQueue(userId, 'vote', existingVote.$id, 'delete', existingVote);
    return { voted: false, usedVotes: Math.max(0, usedVotes - existingVote.weight) };
  }

  if (usedVotes >= voteBudget) return { voted: Boolean(existingVote), usedVotes };

  const now = getTimestamp();
  if (existingVote && allowStacked) {
    await db.question_votes.update(existingVote.$id, {
      weight: existingVote.weight + 1,
      updatedAt: now,
      syncStatus: 'local',
    });
    const updatedVote = await db.question_votes.get(existingVote.$id);
    if (updatedVote) await addToQueue(userId, 'vote', existingVote.$id, 'update', updatedVote);
    await updateQuestionVoteCount(questionId);
    return { voted: true, usedVotes: usedVotes + 1 };
  }

  const vote: QuestionVote = {
    $id: generateId(),
    questionId,
    classSessionId: question.classSessionId,
    userId,
    weight: 1,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'local',
  };
  await db.question_votes.put(vote);
  await addToQueue(userId, 'vote', vote.$id, 'create', vote);
  await updateQuestionVoteCount(questionId);
  return { voted: true, usedVotes: usedVotes + 1 };
}

export async function clearSessionVote(userId: string, questionId: string): Promise<void> {
  const vote = await db.question_votes
    .where('[questionId+userId]')
    .equals([questionId, userId])
    .first();
  if (!vote) return;
  await db.question_votes.delete(vote.$id);
  await addToQueue(userId, 'vote', vote.$id, 'delete', vote);
  await updateQuestionVoteCount(questionId);
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
  userId: string = '',
): Promise<void> {
  await db.discussion_questions.update(questionId, { discussionStatus: status, syncStatus: 'local' });
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.discussion_questions, questionId, {
      discussionStatus: status,
    });
    await db.discussion_questions.update(questionId, { syncStatus: 'synced' });
  } catch {
    const question = await db.discussion_questions.get(questionId);
    if (question) await addToQueue(userId, 'question', questionId, 'update', question);
  }
}

export async function updateQuestionDiscussionNotes(
  questionId: string,
  userId: string,
  notesMarkdown: string,
): Promise<void> {
  const now = getTimestamp();
  await db.discussion_questions.update(questionId, {
    discussionNotesMarkdown: notesMarkdown,
    notesUpdatedAt: now,
    syncStatus: 'local',
  });
  const question = await db.discussion_questions.get(questionId);
  if (question) await addToQueue(userId, 'question', questionId, 'update', question);
}

export async function syncQuestionsFromServer(assignmentId: string): Promise<void> {
  try {
    const result = await functions.createExecution(FUNCTION_IDS.getQuestions, JSON.stringify({ assignmentId }));
    if (result.responseBody) {
      const questions = JSON.parse(result.responseBody) as DiscussionQuestion[];
      for (const q of questions) {
        await db.discussion_questions.put({
          ...q,
          classSessionId: q.classSessionId || '',
          discussionNotesMarkdown: q.discussionNotesMarkdown || '',
          notesUpdatedAt: q.notesUpdatedAt || null,
          syncStatus: 'synced',
        });
      }
    }
  } catch {
    // Offline
  }
}

export function sortQuestionsForDiscussion(questions: DiscussionQuestion[]): DiscussionQuestion[] {
  return [...questions].sort((a, b) => {
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

async function updateQuestionVoteCount(questionId: string): Promise<void> {
  const votes = await db.question_votes.where('questionId').equals(questionId).toArray();
  const voteCount = votes.reduce((sum, vote) => sum + Math.max(1, vote.weight || 1), 0);
  await db.discussion_questions.update(questionId, { voteCount, syncStatus: 'local' });
}
