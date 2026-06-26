import { fsrs, type Card, type RecordLogItem, Rating, State, createEmptyCard } from 'ts-fsrs';

const f = fsrs({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_short_term: true,
  learning_steps: ['1m', '5m'],
  relearning_steps: ['1m', '5m'],
});

export type MasteryBucket = 'new' | 'familiar' | 'known';

export function createNewCard(): Card {
  return createEmptyCard(new Date());
}

export function scheduleReview(card: Card, rating: Rating): RecordLogItem {
  const result = f.repeat(card, new Date());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result as any)[rating];
}

export function getCardFromState(stateJson: string): Card {
  try {
    const parsed = JSON.parse(stateJson);
    return {
      ...parsed,
      due: new Date(parsed.due),
      last_review: parsed.last_review ? new Date(parsed.last_review) : undefined,
    };
  } catch {
    return createEmptyCard(new Date());
  }
}

export function cardToJson(card: Card): string {
  return JSON.stringify(card);
}

export function getCardIntervalDays(card: Card): number {
  return Math.max(0, Math.round(card.scheduled_days ?? 0));
}

export function getCardMastery(card: Card, knownIntervalDays = 14): MasteryBucket {
  if (card.state === State.New && (card.reps ?? 0) === 0) return 'new';
  return getCardIntervalDays(card) >= knownIntervalDays ? 'known' : 'familiar';
}

export function getCardReviewFields(card: Card): {
  intervalDays: number;
  stability: number;
  difficulty: number;
  learningSteps: number;
  repetitions: number;
  lapses: number;
} {
  return {
    intervalDays: getCardIntervalDays(card),
    stability: round(card.stability),
    difficulty: round(card.difficulty),
    learningSteps: Math.max(0, Math.round(card.learning_steps ?? 0)),
    repetitions: Math.max(0, Math.round(card.reps ?? 0)),
    lapses: Math.max(0, Math.round(card.lapses ?? 0)),
  };
}

export function getNextDueDate(card: Card): Date {
  return card.due;
}

export function getCardStatus(card: Card): 'new' | 'learning' | 'review' | 'relearning' {
  switch (card.state) {
    case State.New:
      return 'new';
    case State.Learning:
      return 'learning';
    case State.Review:
      return 'review';
    case State.Relearning:
      return 'relearning';
    default:
      return 'new';
  }
}

export function toFsrsRating(rating: 'again' | 'hard' | 'good' | 'easy'): Rating {
  switch (rating) {
    case 'again': return Rating.Again;
    case 'hard': return Rating.Hard;
    case 'good': return Rating.Good;
    case 'easy': return Rating.Easy;
  }
}

export { Rating, State };

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : 0;
}
