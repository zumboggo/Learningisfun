import { describe, expect, it } from 'vitest';
import { countMarkdownWords } from '@/components/common/Markdown';
import { isBelowMinimum } from '@/services/submission.service';
import { masteryBucketForState } from '@/services/flashcard.service';
import { sortQuestionsForDiscussion } from '@/services/question.service';
import { detectMapping, parseCsvContent } from '@/utils/csv-parser';
import type { DiscussionQuestion, StudentCardState } from '@/types';

describe('Classroom MVP rules', () => {
  it('counts Markdown words without counting formatting syntax', () => {
    expect(countMarkdownWords('**Bold idea** and *careful* `code` [link text](https://example.com)')).toBe(7);
  });

  it('flags short submissions without blocking them', () => {
    expect(isBelowMinimum(199, 200)).toBe(true);
    expect(isBelowMinimum(200, 200)).toBe(false);
    expect(isBelowMinimum(50, 0)).toBe(false);
  });

  it('detects optional flashcard CSV columns', () => {
    const mapping = detectMapping(['term', 'definition', 'hint', 'tags', 'source']);
    expect(mapping).toEqual({
      front: 'term',
      back: 'definition',
      hint: 'hint',
      tags: 'tags',
      source: 'source',
    });
  });

  it('parses duplicate CSV rows while preserving optional fields', () => {
    const csv = 'front,back,hint,tags\njustice,fairness,Plato,philosophy\njustice,fairness,Plato,philosophy';
    const result = parseCsvContent(csv, null);
    expect(result.rows).toHaveLength(1);
    expect(result.duplicates).toBe(1);
    expect(result.rows[0].hint).toBe('Plato');
  });

  it('sorts refreshed questions by votes, then oldest first', () => {
    const questions = [
      question('later', 4, '2026-01-02T00:00:00.000Z'),
      question('top', 5, '2026-01-03T00:00:00.000Z'),
      question('earlier', 4, '2026-01-01T00:00:00.000Z'),
    ];
    expect(sortQuestionsForDiscussion(questions).map(item => item.questionText)).toEqual(['top', 'earlier', 'later']);
  });

  it('calculates New, Familiar, Known flashcard buckets from interval thresholds', () => {
    expect(masteryBucketForState(undefined)).toBe('new');
    expect(masteryBucketForState(state({ reviewCount: 1, repetitions: 1, intervalDays: 3 }))).toBe('familiar');
    expect(masteryBucketForState(state({ reviewCount: 3, repetitions: 3, intervalDays: 14 }))).toBe('known');
  });
});

function question(questionText: string, voteCount: number, createdAt: string): DiscussionQuestion {
  return {
    $id: questionText,
    readingId: '',
    assignmentId: '',
    classSessionId: 'session',
    authorId: 'student',
    questionText,
    selectedPassage: '',
    voteCount,
    moderationStatus: 'visible',
    discussionStatus: 'none',
    discussionNotesMarkdown: '',
    notesUpdatedAt: null,
    isTeacherQuestion: false,
    teacherVisibleBeforeSubmission: false,
    createdAt,
    syncStatus: 'local',
  };
}

function state(overrides: Partial<StudentCardState>): StudentCardState {
  return {
    $id: 'state',
    userId: 'student',
    cardId: 'card',
    deckId: 'deck',
    fsrsState: '{}',
    dueDate: '2026-01-01T00:00:00.000Z',
    status: 'review',
    intervalDays: 0,
    stability: 0,
    difficulty: 0,
    learningSteps: 0,
    repetitions: 0,
    lapses: 0,
    lastReviewAt: '2026-01-01T00:00:00.000Z',
    reviewCount: 0,
    ...overrides,
  };
}
