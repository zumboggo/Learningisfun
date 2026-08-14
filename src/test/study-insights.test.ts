import { describe, it, expect } from 'vitest';
import {
  buildReviewPaceSeries,
  buildKnownGrowthSeries,
  buildDeckComposition,
  getPaceVerdict,
  type StudyDay,
} from '@/services/study-insights';
import type { FlashcardReviewEvent, StudentCardState } from '@/types';

function day(date: string, minutes: number): StudyDay {
  return { date, studySeconds: minutes * 60, activityCount: 1 };
}

function review(date: string, rating: FlashcardReviewEvent['rating'], deckId = 'd1'): FlashcardReviewEvent {
  return {
    $id: `${date}-${Math.random()}`,
    userId: 'u1',
    classId: null,
    deckId,
    cardId: 'c1',
    sessionId: 's1',
    rating,
    reviewedAt: `${date}T10:00:00.000Z`,
    elapsedSeconds: 5,
    syncStatus: 'synced',
  };
}

function state(overrides: Partial<StudentCardState> & { cardId: string }): StudentCardState {
  return {
    $id: overrides.cardId,
    userId: 'u1',
    deckId: 'd1',
    fsrsState: '{}',
    dueDate: '2026-01-01',
    status: 'review',
    intervalDays: 0,
    stability: 1,
    difficulty: 5,
    learningSteps: 0,
    repetitions: 1,
    lapses: 0,
    lastReviewAt: '2026-01-01T00:00:00.000Z',
    reviewCount: 1,
    ...overrides,
  };
}

describe('review pace series', () => {
  it('scores Good and Easy recalls per 10 study minutes', () => {
    const days = [day('2026-01-01', 20)];
    const events = [
      review('2026-01-01', 'good'),
      review('2026-01-01', 'easy'),
      review('2026-01-01', 'again'),
      review('2026-01-01', 'hard'),
    ];
    const series = buildReviewPaceSeries(days, events);
    // 2 successful recalls over 20 minutes = 1.0 per 10 minutes.
    expect(series.points[0].value).toBe(1);
    expect(series.points[0].successfulRecalls).toBe(2);
    expect(series.points[0].recallAttempts).toBe(4);
  });

  it('leaves days without study or reviews empty rather than zero', () => {
    const days = [day('2026-01-01', 0), day('2026-01-02', 10)];
    const series = buildReviewPaceSeries(days, []);
    expect(series.points[0].value).toBeNull();
    expect(series.points[1].value).toBeNull();
  });

  it('withholds a normal range until three study days exist', () => {
    const days = [day('2026-01-01', 10), day('2026-01-02', 10)];
    const events = [review('2026-01-01', 'good'), review('2026-01-02', 'good')];
    const series = buildReviewPaceSeries(days, events);
    expect(series.center).toBeNull();
    expect(series.upperLimit).toBeNull();
    expect(getPaceVerdict(series).verdict).toBe('building');
  });

  it('centres the range on the average pace', () => {
    // 10, 20 and 30 recalls per 10 min across three days.
    const days = [day('2026-01-01', 10), day('2026-01-02', 10), day('2026-01-03', 10)];
    const events = [
      ...Array.from({ length: 10 }, () => review('2026-01-01', 'good')),
      ...Array.from({ length: 20 }, () => review('2026-01-02', 'good')),
      ...Array.from({ length: 30 }, () => review('2026-01-03', 'good')),
    ];
    const series = buildReviewPaceSeries(days, events);
    expect(series.center).toBe(20);
    // Average moving range is 10, so limits sit 26.6 either side of centre.
    expect(series.upperLimit).toBe(46.6);
    expect(series.lowerLimit).toBe(0);
  });

  it('never reports a negative lower limit', () => {
    const days = [day('2026-01-01', 10), day('2026-01-02', 10), day('2026-01-03', 10)];
    const events = [
      review('2026-01-01', 'good'),
      ...Array.from({ length: 40 }, () => review('2026-01-02', 'good')),
      review('2026-01-03', 'good'),
    ];
    const series = buildReviewPaceSeries(days, events);
    expect(series.lowerLimit).toBe(0);
  });

  it('flags a day that breaks out of the normal range', () => {
    const days = [
      day('2026-01-01', 10), day('2026-01-02', 10), day('2026-01-03', 10),
      day('2026-01-04', 10), day('2026-01-05', 10),
    ];
    const steady = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'].flatMap(d =>
      Array.from({ length: 10 }, () => review(d, 'good')),
    );
    // A fifth day far above the steady baseline.
    const spike = Array.from({ length: 80 }, () => review('2026-01-05', 'good'));
    const series = buildReviewPaceSeries(days, [...steady, ...spike]);
    expect(series.points[4].signal).toBe('high');
    expect(getPaceVerdict(series).verdict).toBe('high');
  });

  it('only counts reviews from the decks in scope', () => {
    const days = [day('2026-01-01', 10)];
    const events = [review('2026-01-01', 'good', 'd1'), review('2026-01-01', 'good', 'd2')];
    const series = buildReviewPaceSeries(days, events, ['d1']);
    expect(series.points[0].successfulRecalls).toBe(1);
  });

  it('reports no reviews for an empty history', () => {
    expect(getPaceVerdict(buildReviewPaceSeries([day('2026-01-01', 0)], [])).verdict).toBe('none');
  });
});

describe('known growth series', () => {
  const days = [day('2026-01-02', 10), day('2026-01-03', 10), day('2026-01-04', 10)];

  it('accumulates known cards on the day they were last reviewed', () => {
    const states = [
      state({ cardId: 'a', intervalDays: 20, lastReviewAt: '2026-01-02T09:00:00.000Z' }),
      state({ cardId: 'b', intervalDays: 30, lastReviewAt: '2026-01-04T09:00:00.000Z' }),
    ];
    expect(buildKnownGrowthSeries(days, states).map(p => p.known)).toEqual([1, 1, 2]);
  });

  it('counts cards known before the window in the opening balance', () => {
    const states = [
      state({ cardId: 'a', intervalDays: 20, lastReviewAt: '2025-12-01T09:00:00.000Z' }),
      state({ cardId: 'b', intervalDays: 20, lastReviewAt: '2026-01-03T09:00:00.000Z' }),
    ];
    expect(buildKnownGrowthSeries(days, states).map(p => p.known)).toEqual([1, 2, 2]);
  });

  it('ignores cards below the known threshold', () => {
    const states = [state({ cardId: 'a', intervalDays: 13, lastReviewAt: '2026-01-02T09:00:00.000Z' })];
    expect(buildKnownGrowthSeries(days, states).map(p => p.known)).toEqual([0, 0, 0]);
  });

  it('never decreases', () => {
    const states = [
      state({ cardId: 'a', intervalDays: 20, lastReviewAt: '2026-01-04T09:00:00.000Z' }),
      state({ cardId: 'b', intervalDays: 20, lastReviewAt: '2026-01-02T09:00:00.000Z' }),
    ];
    const series = buildKnownGrowthSeries(days, states);
    for (let i = 1; i < series.length; i++) {
      expect(series[i].known).toBeGreaterThanOrEqual(series[i - 1].known);
    }
  });

  it('returns nothing without a date window', () => {
    expect(buildKnownGrowthSeries([], [])).toEqual([]);
  });
});

describe('deck composition', () => {
  const decks = [{ $id: 'd1', title: 'HSK 1' }, { $id: 'd2', title: 'HSK 2' }];
  const cards = [
    { $id: 'c1', deckId: 'd1' },
    { $id: 'c2', deckId: 'd1' },
    { $id: 'c3', deckId: 'd1' },
    { $id: 'c4', deckId: 'd2' },
  ];

  it('splits a deck into new, familiar and known', () => {
    const states = [
      state({ cardId: 'c1', intervalDays: 20, reviewCount: 5 }),
      state({ cardId: 'c2', intervalDays: 3, reviewCount: 2 }),
    ];
    const [first] = buildDeckComposition(decks, cards, states);
    expect(first).toMatchObject({ deckId: 'd1', known: 1, familiar: 1, newCount: 1, total: 3 });
  });

  it('treats a card with no reviews as new even if state exists', () => {
    const states = [state({ cardId: 'c1', intervalDays: 0, reviewCount: 0 })];
    const [first] = buildDeckComposition(decks, cards, states);
    expect(first.newCount).toBe(3);
  });

  it('orders decks by size and drops empty ones', () => {
    const result = buildDeckComposition(
      [...decks, { $id: 'd3', title: 'Empty' }],
      cards,
      [],
    );
    expect(result.map(d => d.deckId)).toEqual(['d1', 'd2']);
  });

  it('adds up to the deck total', () => {
    const states = [state({ cardId: 'c1', intervalDays: 20, reviewCount: 5 })];
    for (const deck of buildDeckComposition(decks, cards, states)) {
      expect(deck.newCount + deck.familiar + deck.known).toBe(deck.total);
    }
  });
});
