/**
 * Translates generated questions into Canvas Classic Quizzes API payloads.
 *
 * Pure and network-free on purpose: the shape of every request body can be
 * asserted in tests, and the Node push script does nothing but POST what this
 * module returns. If Canvas ever needs the New Quizzes API instead, this is the
 * only file that changes.
 *
 * Endpoints these payloads target:
 *   POST /api/v1/courses/:course_id/quizzes
 *   POST /api/v1/courses/:course_id/quizzes/:quiz_id/questions
 */

import type { GeneratedQuestion } from '@/services/quiz-generator';

/** Marker written into the quiz description so a re-run can recognise its own work. */
export const FINGERPRINT_PREFIX = 'edu-spark-daily';

export interface CanvasQuizSettings {
  title: string;
  /** Local calendar date the quiz belongs to, `YYYY-MM-DD`. */
  quizDate: string;
  /** App-side class id — half of the duplicate-detection fingerprint. */
  classId: string;
  description?: string;
  timeLimitMinutes?: number | null;
  allowedAttempts?: number;
  shuffleAnswers?: boolean;
  /** Canvas assignment group to file the quiz under, if you use groups. */
  assignmentGroupId?: number | null;
  /** ISO 8601. Canvas hides the quiz from students after this. */
  dueAt?: string | null;
}

/**
 * A stable id for "the daily quiz for this class on this date". Written into
 * the description and checked before creating, so running the generator twice
 * updates nothing rather than producing two graded quizzes.
 */
export function buildFingerprint(classId: string, quizDate: string): string {
  return `${FINGERPRINT_PREFIX}:${classId}:${quizDate}`;
}

export function findFingerprint(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(new RegExp(`${FINGERPRINT_PREFIX}:[^\\s"'<]+`));
  return match ? match[0] : null;
}

/* ------------------------------------------------------------------ *
 * Text -> Canvas HTML
 * ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Canvas renders question_text as HTML, but our cards carry light markdown.
 * Escape first, then re-introduce only bold and line breaks — anything richer
 * isn't worth the injection surface.
 */
export function toCanvasHtml(text: string): string {
  const escaped = escapeHtml(text);
  const bolded = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return bolded
    .split(/\n{2,}/)
    .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * The app writes cloze blanks as `___`; Canvas needs a named `[blank_id]`
 * placeholder that matches the blank_id on each answer.
 */
export function toCanvasClozeText(questionText: string, blankId: string): string {
  const html = toCanvasHtml(questionText);
  if (!html.includes('___')) {
    // Shouldn't happen, but a blank-less FIMB question is ungradeable in Canvas
    // and would silently award everyone full marks.
    throw new Error(`Cloze question has no "___" blank: ${questionText.slice(0, 80)}`);
  }
  return html.replace('___', `[${blankId}]`);
}

/* ------------------------------------------------------------------ *
 * Payload builders
 * ------------------------------------------------------------------ */

export interface CanvasQuizPayload {
  quiz: Record<string, unknown>;
}

export function buildQuizPayload(
  settings: CanvasQuizSettings,
  questions: GeneratedQuestion[],
): CanvasQuizPayload {
  const fingerprint = buildFingerprint(settings.classId, settings.quizDate);
  const intro = settings.description?.trim() || 'Daily review quiz generated from class flashcards.';
  const pointsPossible = questions.reduce((sum, q) => sum + q.points, 0);

  return {
    quiz: {
      title: settings.title,
      // The fingerprint rides along invisibly so students never see it.
      description: `${toCanvasHtml(intro)}<!-- ${fingerprint} -->`,
      quiz_type: 'assignment',
      points_possible: pointsPossible,
      time_limit: settings.timeLimitMinutes ?? null,
      allowed_attempts: settings.allowedAttempts ?? 1,
      shuffle_answers: settings.shuffleAnswers ?? true,
      scoring_policy: 'keep_highest',
      // Created unpublished; the push script publishes only once every question
      // landed, so students can never open a half-built quiz.
      published: false,
      ...(settings.assignmentGroupId ? { assignment_group_id: settings.assignmentGroupId } : {}),
      ...(settings.dueAt ? { due_at: settings.dueAt } : {}),
    },
  };
}

export interface CanvasQuestionPayload {
  question: Record<string, unknown>;
}

export function buildQuestionPayload(
  question: GeneratedQuestion,
  position: number,
): CanvasQuestionPayload {
  const base = {
    question_name: `Question ${position}`,
    points_possible: question.points,
    position,
    neutral_comments: question.explanation,
  };

  if (question.type === 'mc') {
    if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      throw new Error(`Multiple choice question ${position} has no valid correct answer`);
    }
    return {
      question: {
        ...base,
        question_type: 'multiple_choice_question',
        question_text: toCanvasHtml(question.questionText),
        answers: question.options.map((option, index) => ({
          answer_text: option,
          answer_weight: index === question.correctIndex ? 100 : 0,
        })),
      },
    };
  }

  const cloze = question.cloze;
  if (!cloze) throw new Error(`Cloze question ${position} is missing its answer set`);

  // Every accepted spelling is its own weight-100 answer on the same blank_id —
  // that is how Canvas models "any of these count as correct".
  const answers = [cloze.primary, ...cloze.variants].map(text => ({
    answer_text: text,
    answer_weight: 100,
    blank_id: cloze.blankId,
  }));

  return {
    question: {
      ...base,
      question_type: 'fill_in_multiple_blanks_question',
      question_text: toCanvasClozeText(question.questionText, cloze.blankId),
      answers,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Export bundle — what the app hands to the push script
 * ------------------------------------------------------------------ */

export interface CanvasExportBundle {
  /** Bumped if the bundle shape ever changes, so the CLI can reject old files. */
  formatVersion: 1;
  generatedAt: string;
  fingerprint: string;
  settings: CanvasQuizSettings;
  quizPayload: CanvasQuizPayload;
  questionPayloads: CanvasQuestionPayload[];
  /** Human-readable mix summary, printed by the CLI before it pushes. */
  summary: Record<string, unknown>;
}

export function buildExportBundle(
  settings: CanvasQuizSettings,
  questions: GeneratedQuestion[],
  summary: Record<string, unknown>,
  generatedAt: string,
): CanvasExportBundle {
  return {
    formatVersion: 1,
    generatedAt,
    fingerprint: buildFingerprint(settings.classId, settings.quizDate),
    settings,
    quizPayload: buildQuizPayload(settings, questions),
    questionPayloads: questions.map((q, i) => buildQuestionPayload(q, i + 1)),
    summary,
  };
}
