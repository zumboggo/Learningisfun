import { ID } from 'appwrite';
import { db } from '@/db/schema';
import { getApiKey, generateQuizFromSources, type QuizQuestion as AIQuizQuestion } from '@/services/ai.service';
import {
  generateQuizFromFlashcards,
  splitCardsByRecency,
  type GenerationResult,
} from '@/services/quiz-generator';
import { getClassCards } from '@/services/daily-quiz.service';
import type { Quiz, QuizAssignment, QuizQuestion, QuizAttempt } from '@/types';
import { getTimestamp } from '@/utils/helpers';
import { addToQueue } from '@/services/sync.service';
import { DATABASE_ID } from '@/lib/appwrite';
import { executeLearningContent } from '@/services/learning-content.service';

/** How many days back counts as "recent" for the quiz source slider. */
export const RECENT_WINDOW_DAYS = 7;

export async function createQuiz(params: {
  classId: string;
  createdBy: string;
  title: string;
  sourceType: 'discussion' | 'flashcards' | 'mixed';
  notesWeight: number;
  flashcardWeight: number;
  questionCount: number;
  timeLimitMinutes: number | null;
}): Promise<Quiz> {
  const quiz: Quiz = {
    $id: ID.unique(),
    classId: params.classId,
    sourceClassId: params.classId,
    createdBy: params.createdBy,
    title: params.title,
    sourceType: params.sourceType,
    notesWeight: params.notesWeight,
    flashcardWeight: params.flashcardWeight,
    questionCount: params.questionCount,
    timeLimitMinutes: params.timeLimitMinutes,
    status: 'draft',
    publishedAt: null,
    createdAt: getTimestamp(),
    syncStatus: 'local',
  };
  await db.quizzes.put(quiz);
  await addToQueue(params.createdBy, 'quiz', quiz.$id, 'create', quiz);
  return quiz;
}

export async function getQuizClassIds(quizId: string): Promise<string[]> {
  return (await db.quiz_assignments.where('quizId').equals(quizId).toArray()).map(a => a.classId);
}

export async function setQuizClasses(quizId: string, classIds: string[], userId: string): Promise<void> {
  const current = await db.quiz_assignments.where('quizId').equals(quizId).toArray();
  const wanted = new Set(classIds.filter(Boolean));
  for (const classId of wanted) {
    if (current.some(a => a.classId === classId)) continue;
    const assignment: QuizAssignment = { $id: ID.unique(), quizId, classId, assignedAt: getTimestamp() };
    await db.quiz_assignments.put(assignment);
    await addToQueue(userId, 'quiz_assignment', assignment.$id, 'create', assignment);
  }
  for (const assignment of current) {
    if (wanted.has(assignment.classId)) continue;
    await db.quiz_assignments.delete(assignment.$id);
    await addToQueue(userId, 'quiz_assignment', assignment.$id, 'delete', assignment);
  }
}

export async function generateQuizQuestions(
  quizId: string,
  notes: string,
  flashcardFronts: string[],
  userId: string,
): Promise<QuizQuestion[]> {
  const quiz = await db.quizzes.get(quizId);
  if (!quiz) throw new Error('Quiz not found');

  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key configured');

  const aiQuestions = await generateQuizFromSources(
    notes,
    flashcardFronts,
    quiz.questionCount,
    { notes: quiz.notesWeight, flashcards: quiz.flashcardWeight },
    apiKey,
  );

  const questions: QuizQuestion[] = aiQuestions.map((q: AIQuizQuestion, i: number) => ({
    $id: ID.unique(),
    quizId,
    type: q.type,
    questionText: q.questionText,
    options: q.options ? JSON.stringify(q.options) : '[]',
    correctIndex: q.correctIndex ?? 0,
    clozeAnswer: q.clozeAnswer || '',
    explanation: q.explanation,
    sortOrder: i,
  }));

  for (const q of questions) {
    await db.quiz_questions.put(q);
    await addToQueue(userId, 'quiz_question', q.$id, 'create', q);
  }

  return questions;
}

export interface FlashcardQuizPreview {
  result: GenerationResult;
  pools: { recent: number; older: number };
}

/**
 * Build a quiz straight from the class's flashcards — no AI, no network.
 *
 * `recentWeight` is the share of questions drawn from cards added in the last
 * week; the rest come from the whole course, weighted towards more recent
 * material. Nothing is written, so the teacher can review before committing.
 */
export async function previewFlashcardQuiz(params: {
  classId: string;
  questionCount: number;
  recentWeight: number;
  multipleChoiceWeight?: number;
  seed?: string;
}): Promise<FlashcardQuizPreview> {
  const cards = await getClassCards(params.classId);
  if (cards.length === 0) {
    throw new Error('This class has no flashcards yet — add cards or assign a deck to it first.');
  }

  const now = new Date();
  const pools = splitCardsByRecency(cards, RECENT_WINDOW_DAYS, now);
  const result = generateQuizFromFlashcards(
    pools,
    {
      questionCount: params.questionCount,
      todayWeight: params.recentWeight,
      multipleChoiceWeight: params.multipleChoiceWeight ?? 60,
      seed: params.seed || `${params.classId}:${now.toISOString()}`,
    },
    now,
  );

  if (result.questions.length === 0) {
    throw new Error('No usable questions could be built from this class\'s cards.');
  }

  return { result, pools: { recent: pools.today.length, older: pools.review.length } };
}

/** Save a previewed flashcard quiz and its questions as a draft. */
export async function saveFlashcardQuiz(params: {
  classId: string;
  classIds?: string[];
  createdBy: string;
  title: string;
  timeLimitMinutes: number | null;
  recentWeight: number;
  preview: FlashcardQuizPreview;
}): Promise<Quiz> {
  const quiz = await createQuiz({
    classId: params.classId,
    createdBy: params.createdBy,
    title: params.title,
    sourceType: 'flashcards',
    notesWeight: 0,
    flashcardWeight: 100,
    questionCount: params.preview.result.questions.length,
    timeLimitMinutes: params.timeLimitMinutes,
  });

  const questions: QuizQuestion[] = params.preview.result.questions.map((q, i) => ({
    $id: ID.unique(),
    quizId: quiz.$id,
    type: q.type,
    questionText: q.questionText,
    options: JSON.stringify(q.options),
    correctIndex: q.correctIndex,
    clozeAnswer: q.cloze?.primary || '',
    clozeVariants: JSON.stringify(q.cloze?.variants || []),
    explanation: q.explanation,
    sortOrder: i,
  }));

  for (const question of questions) {
    await db.quiz_questions.put(question);
    await addToQueue(params.createdBy, 'quiz_question', question.$id, 'create', question);
  }

  await setQuizClasses(quiz.$id, params.classIds?.length ? params.classIds : [params.classId], params.createdBy);

  return quiz;
}

/** Build a device-local quiz for student practice. It is never synchronized. */
export async function createPracticeQuiz(classId: string, userId: string, questionCount = 10): Promise<Quiz> {
  const preview = await previewFlashcardQuiz({
    classId,
    questionCount,
    recentWeight: 50,
    multipleChoiceWeight: 60,
    seed: `${classId}:${userId}:${Date.now()}`,
  });
  const quiz: Quiz = {
    $id: ID.unique(), classId, sourceClassId: classId, createdBy: userId,
    title: 'Practice Quiz', sourceType: 'flashcards', notesWeight: 0, flashcardWeight: 100,
    questionCount: preview.result.questions.length, timeLimitMinutes: null,
    status: 'published', publishedAt: getTimestamp(), createdAt: getTimestamp(), syncStatus: 'synced',
  };
  const questions: QuizQuestion[] = preview.result.questions.map((question, index) => ({
    $id: ID.unique(), quizId: quiz.$id, type: question.type, questionText: question.questionText,
    options: JSON.stringify(question.options), correctIndex: question.correctIndex,
    clozeAnswer: question.cloze?.primary || '', clozeVariants: JSON.stringify(question.cloze?.variants || []),
    explanation: question.explanation, sortOrder: index,
  }));
  await db.transaction('rw', db.quizzes, db.quiz_questions, async () => {
    await db.quizzes.put(quiz);
    await db.quiz_questions.bulkPut(questions);
  });
  return quiz;
}

export async function deleteLocalPracticeQuiz(quizId: string): Promise<void> {
  const questionIds = await db.quiz_questions.where('quizId').equals(quizId).primaryKeys();
  const attemptIds = await db.quiz_attempts.where('quizId').equals(quizId).primaryKeys();
  await db.transaction('rw', db.quizzes, db.quiz_questions, db.quiz_attempts, async () => {
    await db.quiz_questions.bulkDelete(questionIds);
    await db.quiz_attempts.bulkDelete(attemptIds);
    await db.quizzes.delete(quizId);
  });
}

function parseClozeVariants(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export async function publishQuiz(quizId: string, userId: string): Promise<void> {
  await db.quizzes.update(quizId, {
    status: 'published',
    publishedAt: getTimestamp(),
    syncStatus: 'local',
  });
  const quiz = await db.quizzes.get(quizId);
  if (quiz) await addToQueue(userId, 'quiz', quizId, 'update', quiz);
}

export async function unpublishQuiz(quizId: string, userId: string): Promise<void> {
  await db.quizzes.update(quizId, { status: 'draft', publishedAt: null, syncStatus: 'local' });
  const quiz = await db.quizzes.get(quizId); if (quiz) await addToQueue(userId, 'quiz', quizId, 'update', quiz);
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await executeLearningContent({ action: 'deleteQuiz', quizId });
  const assignments = await db.quiz_assignments.where('quizId').equals(quizId).primaryKeys();
  const questions = await db.quiz_questions.where('quizId').equals(quizId).primaryKeys();
  const attempts = await db.quiz_attempts.where('quizId').equals(quizId).primaryKeys();
  await db.transaction('rw', db.quizzes, db.quiz_assignments, db.quiz_questions, db.quiz_attempts, async () => {
    await db.quiz_assignments.bulkDelete(assignments);
    await db.quiz_questions.bulkDelete(questions);
    await db.quiz_attempts.bulkDelete(attempts);
    await db.quizzes.delete(quizId);
  });
}

export async function startQuizAttempt(quizId: string, userId: string): Promise<QuizAttempt> {
  const attempt: QuizAttempt = {
    $id: ID.unique(),
    quizId,
    userId,
    startedAt: getTimestamp(),
    completedAt: null,
    score: 0,
    totalQuestions: 0,
    answers: '[]',
    syncStatus: 'local',
  };
  await db.quiz_attempts.put(attempt);
  return attempt;
}

export async function submitQuizAttempt(
  attemptId: string,
  answers: Array<{ questionId: string; answer: number | string }>,
  options: { sync?: boolean } = {},
): Promise<{ score: number; total: number; results: Array<{ correct: boolean; explanation: string }> }> {
  const attempt = await db.quiz_attempts.get(attemptId);
  if (!attempt) throw new Error('Attempt not found');

  const questions = await db.quiz_questions.where('quizId').equals(attempt.quizId).toArray();
  const questionsById = new Map(questions.map(q => [q.$id, q]));

  let score = 0;
  const results: Array<{ correct: boolean; explanation: string }> = [];

  for (const ans of answers) {
    const question = questionsById.get(ans.questionId);
    if (!question) continue;

    let correct = false;
    if (question.type === 'mc') {
      correct = ans.answer === question.correctIndex;
    } else {
      // Accept the same alternate spellings Canvas does, so a student isn't
      // marked wrong here for a plural or a hyphen but right over there.
      const given = String(ans.answer).trim().toLowerCase();
      const accepted = [question.clozeAnswer, ...parseClozeVariants(question.clozeVariants)]
        .map(a => a.trim().toLowerCase())
        .filter(Boolean);
      correct = accepted.includes(given);
    }

    if (correct) score++;
    results.push({ correct, explanation: question.explanation });
  }

  await db.quiz_attempts.update(attemptId, {
    completedAt: getTimestamp(),
    score,
    totalQuestions: questions.length,
    answers: JSON.stringify(answers),
    syncStatus: 'local',
  });

  const updated = await db.quiz_attempts.get(attemptId);
  if (updated && options.sync !== false) await addToQueue(updated.userId, 'quiz_attempt', attemptId, 'update', updated);

  return { score, total: questions.length, results };
}

export async function getQuizWithQuestions(quizId: string): Promise<{
  quiz: Quiz;
  questions: QuizQuestion[];
} | null> {
  const quiz = await db.quizzes.get(quizId);
  if (!quiz) return null;
  const questions = await db.quiz_questions.where('quizId').equals(quizId).toArray();
  questions.sort((a, b) => a.sortOrder - b.sortOrder);
  return { quiz, questions };
}

export async function getClassQuizzes(classId: string): Promise<Quiz[]> {
  const assignments = await db.quiz_assignments.where('classId').equals(classId).toArray();
  const ids = [...new Set(assignments.map(a => a.quizId))];
  if (ids.length === 0) return db.quizzes.where('classId').equals(classId).toArray();
  return db.quizzes.where('$id').anyOf(ids).toArray();
}

/** Pull quizzes assigned to the user's classes, including their questions. */
export async function syncQuizzesFromServer(classIds: string[], options: { includeDetails?: boolean; quizId?: string } = {}): Promise<boolean> {
  if (!DATABASE_ID || classIds.length === 0) return true;
  try {
    const result = await executeLearningContent<{
      assignments: Array<{ $id: string } & Record<string, unknown>>;
      quizzes: Array<{ $id: string } & Record<string, unknown>>;
      questions: Array<{ $id: string } & Record<string, unknown>>;
      attempts: Array<{ $id: string } & Record<string, unknown>>;
      expiredQuizIds: string[];
    }>({ action: 'readQuizzes', classIds, includeDetails: Boolean(options.includeDetails), quizId: options.quizId });
    for (const quizId of result.expiredQuizIds || []) {
      const assignmentIds = await db.quiz_assignments.where('quizId').equals(quizId).primaryKeys();
      const questionIds = await db.quiz_questions.where('quizId').equals(quizId).primaryKeys();
      const attemptIds = await db.quiz_attempts.where('quizId').equals(quizId).primaryKeys();
      await db.quiz_assignments.bulkDelete(assignmentIds);
      await db.quiz_questions.bulkDelete(questionIds);
      await db.quiz_attempts.bulkDelete(attemptIds);
      await db.quizzes.delete(quizId);
    }
    const assignments = result.assignments.map(doc => ({
      $id: doc.$id, quizId: doc.quizId as string, classId: doc.classId as string,
      assignedAt: doc.assignedAt as string,
    } satisfies QuizAssignment));
    await db.transaction('rw', db.quiz_assignments, async () => {
      if (!options.quizId) {
        for (const classId of classIds) {
          const cached = await db.quiz_assignments.where('classId').equals(classId).toArray();
          const visibleIds = new Set(assignments.filter(row => row.classId === classId).map(row => row.$id));
          await db.quiz_assignments.bulkDelete(cached.filter(row => !visibleIds.has(row.$id)).map(row => row.$id));
        }
      }
      if (assignments.length) await db.quiz_assignments.bulkPut(assignments);
    });
    for (const doc of result.quizzes) {
      await db.quizzes.put({
        $id: doc.$id, classId: doc.classId as string, sourceClassId: (doc.sourceClassId as string) || doc.classId as string,
        createdBy: doc.createdBy as string, title: doc.title as string, sourceType: doc.sourceType as Quiz['sourceType'],
        notesWeight: doc.notesWeight as number, flashcardWeight: doc.flashcardWeight as number,
        questionCount: doc.questionCount as number, timeLimitMinutes: (doc.timeLimitMinutes as number) || null,
        status: doc.status as Quiz['status'], publishedAt: (doc.publishedAt as string) || null,
        createdAt: doc.createdAt as string, syncStatus: 'synced',
      });
    }
    for (const doc of result.questions) {
      await db.quiz_questions.put({
        $id: doc.$id, quizId: doc.quizId as string, type: doc.type as QuizQuestion['type'],
        questionText: doc.questionText as string, options: (doc.options as string) || '[]',
        correctIndex: (doc.correctIndex as number) || 0, clozeAnswer: (doc.clozeAnswer as string) || '',
        clozeVariants: (doc.clozeVariants as string) || '[]', explanation: (doc.explanation as string) || '',
        sortOrder: doc.sortOrder as number,
      });
    }
    for (const doc of result.attempts) {
      await db.quiz_attempts.put({
        $id: doc.$id, quizId: doc.quizId as string, userId: doc.userId as string,
        startedAt: doc.startedAt as string, completedAt: (doc.completedAt as string) || null,
        score: (doc.score as number) || 0, totalQuestions: (doc.totalQuestions as number) || 0,
        answers: (doc.answers as string) || '[]', syncStatus: 'synced',
      });
    }
    return true;
  } catch { return false; }
}

export async function syncQuizFromServer(quizId: string): Promise<void> {
  const assignments = await db.quiz_assignments.where('quizId').equals(quizId).toArray();
  const classIds = [...new Set(assignments.map(assignment => assignment.classId))];
  if (classIds.length) await syncQuizzesFromServer(classIds, { includeDetails: true, quizId });
}

export async function getStudentQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
  return db.quiz_attempts.where('quizId').equals(quizId).and(a => a.userId === userId).toArray();
}

export async function getAllQuizAttemptsForQuiz(quizId: string): Promise<QuizAttempt[]> {
  return db.quiz_attempts.where('quizId').equals(quizId).toArray();
}
