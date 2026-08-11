/**
 * Builds the daily Canvas quiz for a class: gathers the class's flashcards,
 * runs the deterministic generator, records the quiz locally, and produces the
 * JSON bundle that `scripts/push-to-canvas.mjs` sends to Canvas.
 *
 * The push itself deliberately does not happen here. This app is a static PWA
 * served from GitHub Pages: Canvas's REST API sends no CORS headers for token
 * auth, so a browser fetch would be blocked, and an API token in IndexedDB on a
 * public origin would hand over full teacher rights to anyone with an XSS.
 */

import { ID } from 'appwrite';
import { db } from '@/db/schema';
import { getTimestamp } from '@/utils/helpers';
import { addToQueue } from '@/services/sync.service';
import {
  generateQuizFromFlashcards,
  splitCardsByDay,
  DEFAULT_GENERATION_OPTIONS,
  type GenerationOptions,
  type GenerationResult,
} from '@/services/quiz-generator';
import { buildExportBundle, type CanvasExportBundle, type CanvasQuizSettings } from '@/services/canvas-payload';
import type { FlashcardCard, Quiz, QuizQuestion } from '@/types';

export interface DailyQuizConfig {
  classId: string;
  /** Local calendar date the quiz covers. Defaults to today. */
  quizDate: Date;
  title?: string;
  questionCount: number;
  todayWeight: number;
  multipleChoiceWeight: number;
  recencyHalfLifeDays: number;
  pointsPerQuestion: number;
  timeLimitMinutes: number | null;
  allowedAttempts: number;
  canvasCourseId: number;
  /**
   * Canvas assignment group. Worth setting explicitly: Canvas silently files a
   * new quiz into the course's first group, and a course imported from a
   * Blueprint often has several similarly-named groups.
   */
  canvasAssignmentGroupId?: number | null;
  dueAt?: string | null;
}

export const DEFAULT_DAILY_QUIZ_CONFIG = {
  ...DEFAULT_GENERATION_OPTIONS,
  timeLimitMinutes: 10,
  allowedAttempts: 1,
};

/** Every flashcard reachable by a class, via its deck assignments. */
export async function getClassCards(classId: string): Promise<FlashcardCard[]> {
  const assignments = await db.deck_assignments.where('classId').equals(classId).toArray();
  const deckIds = [...new Set(assignments.map(a => a.deckId))];
  if (deckIds.length === 0) return [];
  return db.flashcard_cards.where('deckId').anyOf(deckIds).toArray();
}

export interface DailyQuizPreview {
  result: GenerationResult;
  pools: { today: number; review: number };
  settings: CanvasQuizSettings;
}

export function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generate a preview without writing anything. Same seed as `commit`, so what
 * you review here is exactly what gets pushed.
 */
export async function previewDailyQuiz(config: DailyQuizConfig): Promise<DailyQuizPreview> {
  const cards = await getClassCards(config.classId);
  if (cards.length === 0) {
    throw new Error('This class has no flashcards yet — assign a deck to it first.');
  }

  const quizDate = formatDayKey(config.quizDate);
  const pools = splitCardsByDay(cards, config.quizDate);

  const options: Partial<GenerationOptions> & { seed: string } = {
    questionCount: config.questionCount,
    todayWeight: config.todayWeight,
    multipleChoiceWeight: config.multipleChoiceWeight,
    recencyHalfLifeDays: config.recencyHalfLifeDays,
    pointsPerQuestion: config.pointsPerQuestion,
    // Seeded on class + date so re-generating the same day is idempotent.
    seed: `${config.classId}:${quizDate}`,
  };

  const result = generateQuizFromFlashcards(pools, options, config.quizDate);
  if (result.questions.length === 0) {
    throw new Error('No usable questions could be built from this class\'s cards.');
  }

  const cls = await db.classes.get(config.classId);
  const settings: CanvasQuizSettings = {
    title: config.title?.trim() || `${cls?.name || 'Class'} — Daily Quiz ${quizDate}`,
    quizDate,
    classId: config.classId,
    description: `Daily review quiz generated from class flashcards for ${quizDate}.`,
    timeLimitMinutes: config.timeLimitMinutes,
    allowedAttempts: config.allowedAttempts,
    shuffleAnswers: true,
    assignmentGroupId: config.canvasAssignmentGroupId ?? null,
    dueAt: config.dueAt ?? null,
  };

  return {
    result,
    pools: { today: pools.today.length, review: pools.review.length },
    settings,
  };
}

/**
 * Record the quiz locally and return the bundle to hand to the push script.
 *
 * The local record stays `draft` on purpose — students take this one in Canvas,
 * so publishing it in-app would put the same quiz in front of them twice.
 */
export async function commitDailyQuiz(
  preview: DailyQuizPreview,
  config: DailyQuizConfig,
  createdBy: string,
): Promise<{ quiz: Quiz; bundle: CanvasExportBundle }> {
  const existing = await findLocalDailyQuiz(config.classId, preview.settings.quizDate);
  if (existing) {
    throw new Error(
      `A daily quiz for ${preview.settings.quizDate} already exists ("${existing.title}"). Delete it first, or pick another date.`,
    );
  }

  const quiz: Quiz = {
    $id: ID.unique(),
    classId: config.classId,
    createdBy,
    title: preview.settings.title,
    sourceType: 'flashcards',
    notesWeight: 0,
    flashcardWeight: 100,
    questionCount: preview.result.questions.length,
    timeLimitMinutes: config.timeLimitMinutes,
    status: 'draft',
    publishedAt: null,
    createdAt: getTimestamp(),
    syncStatus: 'local',
  };
  await db.quizzes.put(quiz);
  await addToQueue(createdBy, 'quiz', quiz.$id, 'create', quiz);

  const questions: QuizQuestion[] = preview.result.questions.map((q, i) => ({
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
    await addToQueue(createdBy, 'quiz_question', question.$id, 'create', question);
  }

  const bundle = buildExportBundle(
    preview.settings,
    preview.result.questions,
    {
      ...preview.result.summary,
      canvasCourseId: config.canvasCourseId,
      localQuizId: quiz.$id,
      pools: preview.pools,
    },
    getTimestamp(),
  );

  return { quiz, bundle };
}

/** Local half of the duplicate guard; the CLI performs the Canvas-side check. */
export async function findLocalDailyQuiz(classId: string, quizDate: string): Promise<Quiz | null> {
  const quizzes = await db.quizzes.where('classId').equals(classId).toArray();
  const match = quizzes.find(
    q => q.sourceType === 'flashcards' && q.title.includes(quizDate),
  );
  return match || null;
}

/** Trigger a browser download of the bundle for the push script to read. */
export function downloadBundle(bundle: CanvasExportBundle): string {
  const filename = `canvas-quiz-${bundle.settings.quizDate}.json`;
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}
