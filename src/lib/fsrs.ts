import { fsrs, generatorParameters, type Card, type RecordLogItem, Rating, State, createEmptyCard } from 'ts-fsrs';

const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 365,
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
});

const f = fsrs(params);

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
