import { describe, it, expect } from 'vitest';
import {
  buildQuizPayload,
  buildQuestionPayload,
  buildExportBundle,
  buildFingerprint,
  findFingerprint,
  toCanvasHtml,
  toCanvasClozeText,
  type CanvasQuizSettings,
} from '@/services/canvas-payload';
import type { GeneratedQuestion } from '@/services/quiz-generator';

const settings: CanvasQuizSettings = {
  title: 'Biology — Daily Quiz 2026-08-09',
  quizDate: '2026-08-09',
  classId: 'class-1',
  timeLimitMinutes: 10,
  allowedAttempts: 1,
};

const mcQuestion: GeneratedQuestion = {
  type: 'mc',
  sourceCardId: 'card-1',
  bucket: 'today',
  questionText: 'Which of these best matches **osmosis**?',
  options: ['water movement', 'cell division', 'particle spread', 'gamete division'],
  correctIndex: 0,
  cloze: null,
  explanation: 'osmosis — water movement',
  points: 1,
};

const clozeQuestion: GeneratedQuestion = {
  type: 'cloze',
  sourceCardId: 'card-2',
  bucket: 'review',
  questionText: 'The ___ makes energy for the cell.',
  options: [],
  correctIndex: -1,
  cloze: { blankId: 'blank1', primary: 'mitochondrion', variants: ['mitochondrions', 'mitochondria'] },
  explanation: 'mitochondrion — the powerhouse',
  points: 1,
};

describe('fingerprints', () => {
  it('round-trips through a quiz description', () => {
    const payload = buildQuizPayload(settings, [mcQuestion]);
    const description = payload.quiz.description as string;
    expect(findFingerprint(description)).toBe(buildFingerprint('class-1', '2026-08-09'));
  });

  it('returns null when there is no fingerprint', () => {
    expect(findFingerprint('An ordinary quiz description.')).toBe(null);
    expect(findFingerprint(null)).toBe(null);
  });

  it('is stable for the same class and date, and differs otherwise', () => {
    expect(buildFingerprint('c', '2026-08-09')).toBe(buildFingerprint('c', '2026-08-09'));
    expect(buildFingerprint('c', '2026-08-09')).not.toBe(buildFingerprint('c', '2026-08-10'));
    expect(buildFingerprint('c', '2026-08-09')).not.toBe(buildFingerprint('d', '2026-08-09'));
  });
});

describe('toCanvasHtml', () => {
  it('escapes HTML so card text cannot inject markup', () => {
    expect(toCanvasHtml('<script>alert(1)</script>')).toContain('&lt;script&gt;');
  });

  it('converts markdown bold', () => {
    expect(toCanvasHtml('Which matches **osmosis**?')).toBe('<p>Which matches <strong>osmosis</strong>?</p>');
  });

  it('turns blank lines into paragraphs and single newlines into breaks', () => {
    expect(toCanvasHtml('a\n\nb')).toBe('<p>a</p><p>b</p>');
    expect(toCanvasHtml('a\nb')).toBe('<p>a<br>b</p>');
  });
});

describe('toCanvasClozeText', () => {
  it('replaces the app blank with a Canvas blank_id placeholder', () => {
    expect(toCanvasClozeText('The ___ makes energy.', 'blank1')).toBe('<p>The [blank1] makes energy.</p>');
  });

  it('throws rather than emit an ungradeable question', () => {
    expect(() => toCanvasClozeText('No blank here.', 'blank1')).toThrow(/no "___" blank/);
  });
});

describe('buildQuizPayload', () => {
  it('creates the quiz unpublished so students cannot see a half-built quiz', () => {
    expect(buildQuizPayload(settings, [mcQuestion, clozeQuestion]).quiz.published).toBe(false);
  });

  it('sums points possible across questions', () => {
    expect(buildQuizPayload(settings, [mcQuestion, clozeQuestion]).quiz.points_possible).toBe(2);
  });

  it('files it as a graded assignment so marks reach the gradebook', () => {
    expect(buildQuizPayload(settings, [mcQuestion]).quiz.quiz_type).toBe('assignment');
  });

  it('files the quiz into the assignment group when one is given', () => {
    const quiz = buildQuizPayload(
      { ...settings, assignmentGroupId: 92409, dueAt: '2026-08-09T23:59:00.000Z' },
      [mcQuestion],
    ).quiz;
    expect(quiz.assignment_group_id).toBe(92409);
    expect(quiz.due_at).toBe('2026-08-09T23:59:00.000Z');
  });

  it('omits assignment_group_id and due_at when not set', () => {
    const quiz = buildQuizPayload(settings, [mcQuestion]).quiz;
    expect(quiz).not.toHaveProperty('assignment_group_id');
    expect(quiz).not.toHaveProperty('due_at');
  });
});

describe('buildQuestionPayload', () => {
  it('weights exactly one multiple choice answer at 100', () => {
    const { question } = buildQuestionPayload(mcQuestion, 1);
    expect(question.question_type).toBe('multiple_choice_question');
    const answers = question.answers as Array<{ answer_text: string; answer_weight: number }>;
    expect(answers.filter(a => a.answer_weight === 100)).toEqual([
      { answer_text: 'water movement', answer_weight: 100 },
    ]);
    expect(answers).toHaveLength(4);
  });

  it('rejects a multiple choice question with no valid correct answer', () => {
    expect(() => buildQuestionPayload({ ...mcQuestion, correctIndex: 9 }, 1)).toThrow(/correct answer/);
  });

  it('maps every cloze variant onto the same blank_id at weight 100', () => {
    const { question } = buildQuestionPayload(clozeQuestion, 2);
    expect(question.question_type).toBe('fill_in_multiple_blanks_question');
    expect(question.question_text).toContain('[blank1]');
    const answers = question.answers as Array<{ answer_text: string; answer_weight: number; blank_id: string }>;
    expect(answers.map(a => a.answer_text)).toEqual(['mitochondrion', 'mitochondrions', 'mitochondria']);
    expect(answers.every(a => a.answer_weight === 100 && a.blank_id === 'blank1')).toBe(true);
  });

  it('carries the explanation through as feedback', () => {
    expect(buildQuestionPayload(mcQuestion, 1).question.neutral_comments).toBe('osmosis — water movement');
  });

  it('numbers questions by position', () => {
    expect(buildQuestionPayload(mcQuestion, 3).question.position).toBe(3);
    expect(buildQuestionPayload(mcQuestion, 3).question.question_name).toBe('Question 3');
  });
});

describe('buildExportBundle', () => {
  it('produces a bundle the push script accepts', () => {
    const bundle = buildExportBundle(settings, [mcQuestion, clozeQuestion], { produced: 2 }, '2026-08-09T10:00:00.000Z');
    expect(bundle.formatVersion).toBe(1);
    expect(bundle.fingerprint).toBe(buildFingerprint('class-1', '2026-08-09'));
    expect(bundle.questionPayloads).toHaveLength(2);
    expect(bundle.questionPayloads[0].question.position).toBe(1);
    expect(bundle.questionPayloads[1].question.position).toBe(2);
  });

  it('serialises to JSON without losing anything', () => {
    const bundle = buildExportBundle(settings, [mcQuestion, clozeQuestion], { produced: 2 }, '2026-08-09T10:00:00.000Z');
    expect(JSON.parse(JSON.stringify(bundle))).toEqual(bundle);
  });
});
