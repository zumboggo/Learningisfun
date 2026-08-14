import type { FlashcardReviewEvent, StudentCardState } from '@/types';

/**
 * A card is treated as "known" once its scheduling interval reaches two weeks,
 * and "familiar" once it has been reviewed at all. These thresholds are shared
 * by the dashboard counters and every chart so the numbers agree.
 */
export const KNOWN_INTERVAL_DAYS = 14;

export interface StudyDay {
  date: string;
  studySeconds: number;
  activityCount: number;
}

export interface PacePoint {
  date: string;
  /** Good/Easy recalls per 10 minutes of study, or null on days with no study. */
  value: number | null;
  studyMinutes: number;
  successfulRecalls: number;
  recallAttempts: number;
  /** Set when the day falls outside the learner's own normal range. */
  signal?: 'high' | 'low';
}

export interface PaceSeries {
  points: PacePoint[];
  /** Mean pace — the learner's own baseline, not a target. */
  center: number | null;
  upperLimit: number | null;
  lowerLimit: number | null;
}

/** Days of data needed before a normal range can be estimated. */
const MIN_DAYS_FOR_LIMITS = 3;

/**
 * Constant for an individuals (XmR) control chart: multiplying the average
 * moving range by 2.66 approximates three standard deviations, which is the
 * conventional threshold for "this day is different from your usual", rather
 * than ordinary day-to-day variation.
 */
const XMR_CONSTANT = 2.66;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Reviewing pace per day, with the learner's own normal range.
 *
 * The point is not to review faster — it is to notice days that broke pattern.
 * A day below the range usually means interruptions or a card you were stuck
 * on; a day above it often means you were clicking through without recalling.
 */
export function buildReviewPaceSeries(
  days: StudyDay[],
  events: FlashcardReviewEvent[],
  deckIds?: string[],
): PaceSeries {
  const deckFilter = deckIds ? new Set(deckIds) : null;

  const byDay = new Map(
    days.map(day => [
      day.date,
      {
        date: day.date,
        studyMinutes: day.studySeconds / 60,
        successfulRecalls: 0,
        recallAttempts: 0,
      },
    ]),
  );

  for (const event of events) {
    if (deckFilter && !deckFilter.has(event.deckId)) continue;
    const day = byDay.get(event.reviewedAt.slice(0, 10));
    if (!day) continue;
    day.recallAttempts += 1;
    if (event.rating === 'good' || event.rating === 'easy') {
      day.successfulRecalls += 1;
    }
  }

  const points: PacePoint[] = Array.from(byDay.values()).map(day => ({
    ...day,
    value:
      day.studyMinutes > 0 && day.recallAttempts > 0
        ? round1((day.successfulRecalls / day.studyMinutes) * 10)
        : null,
  }));

  const values = points
    .map(point => point.value)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (values.length < MIN_DAYS_FOR_LIMITS) {
    return { points, center: null, upperLimit: null, lowerLimit: null };
  }

  const center = round1(values.reduce((sum, value) => sum + value, 0) / values.length);

  // Average moving range: the typical size of the change from one study day to
  // the next. Using it rather than the raw spread keeps a single unusual day
  // from widening the range enough to hide itself.
  const movingRanges = values.slice(1).map((value, i) => Math.abs(value - values[i]));
  const averageMovingRange =
    movingRanges.reduce((sum, range) => sum + range, 0) / Math.max(1, movingRanges.length);

  const upperLimit = round1(center + XMR_CONSTANT * averageMovingRange);
  const lowerLimit = round1(Math.max(0, center - XMR_CONSTANT * averageMovingRange));

  return {
    points: points.map(point => ({
      ...point,
      signal:
        point.value === null
          ? undefined
          : point.value > upperLimit
            ? 'high'
            : point.value < lowerLimit
              ? 'low'
              : undefined,
    })),
    center,
    upperLimit,
    lowerLimit,
  };
}

export type PaceVerdict = 'none' | 'building' | 'normal' | 'high' | 'low';

export function getPaceVerdict(series: PaceSeries): { verdict: PaceVerdict; label: string } {
  const withValues = series.points.filter(point => point.value !== null);
  if (withValues.length === 0) return { verdict: 'none', label: 'No reviews yet' };
  if (series.center === null) return { verdict: 'building', label: 'Building your range' };

  const latest = withValues[withValues.length - 1];
  if (latest.signal === 'high') return { verdict: 'high', label: 'Faster than usual' };
  if (latest.signal === 'low') return { verdict: 'low', label: 'Slower than usual' };
  return { verdict: 'normal', label: 'In your normal range' };
}

export interface KnownGrowthPoint {
  date: string;
  known: number;
}

/**
 * Growth of the known-word count over time.
 *
 * Card state records only each card's current interval, not the day it crossed
 * the threshold, so each currently-known card is placed at its last review.
 * The curve therefore answers "of the words I know today, how many had I
 * reached by this date" — it does not count words that were known back then
 * but have since lapsed.
 */
export function buildKnownGrowthSeries(
  days: StudyDay[],
  states: StudentCardState[],
  deckIds?: string[],
): KnownGrowthPoint[] {
  if (days.length === 0) return [];
  const deckFilter = deckIds ? new Set(deckIds) : null;
  const firstDate = days[0].date;

  const reachedOn = new Map<string, number>();
  let alreadyKnownBeforeWindow = 0;

  for (const state of states) {
    if (deckFilter && !deckFilter.has(state.deckId)) continue;
    if ((state.intervalDays || 0) < KNOWN_INTERVAL_DAYS) continue;
    if (!state.lastReviewAt) continue;

    const date = state.lastReviewAt.slice(0, 10);
    if (date < firstDate) {
      alreadyKnownBeforeWindow += 1;
    } else {
      reachedOn.set(date, (reachedOn.get(date) || 0) + 1);
    }
  }

  let running = alreadyKnownBeforeWindow;
  return days.map(day => {
    running += reachedOn.get(day.date) || 0;
    return { date: day.date, known: running };
  });
}

export interface DeckComposition {
  deckId: string;
  title: string;
  newCount: number;
  familiar: number;
  known: number;
  total: number;
}

/** New / familiar / known split for each deck the student is studying. */
export function buildDeckComposition(
  decks: Array<{ $id: string; title: string }>,
  cards: Array<{ $id: string; deckId: string }>,
  states: StudentCardState[],
): DeckComposition[] {
  const stateByCard = new Map(states.map(state => [state.cardId, state]));
  const byDeck = new Map<string, DeckComposition>(
    decks.map(deck => [
      deck.$id,
      { deckId: deck.$id, title: deck.title, newCount: 0, familiar: 0, known: 0, total: 0 },
    ]),
  );

  for (const card of cards) {
    const entry = byDeck.get(card.deckId);
    if (!entry) continue;
    entry.total += 1;

    const state = stateByCard.get(card.$id);
    if (!state || state.reviewCount === 0) entry.newCount += 1;
    else if ((state.intervalDays || 0) >= KNOWN_INTERVAL_DAYS) entry.known += 1;
    else entry.familiar += 1;
  }

  return Array.from(byDeck.values())
    .filter(entry => entry.total > 0)
    .sort((a, b) => b.total - a.total);
}
