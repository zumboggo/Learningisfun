import { describe, it, expect } from 'vitest';
import { createNewCard, scheduleReview, getCardFromState, cardToJson, getCardStatus, toFsrsRating } from '@/lib/fsrs';
import { Rating, State } from 'ts-fsrs';

describe('FSRS', () => {
  it('creates a new card', () => {
    const card = createNewCard();
    expect(card.state).toBe(State.New);
    expect(card.due).toBeInstanceOf(Date);
  });

  it('schedules a review with Good rating', () => {
    const card = createNewCard();
    const result = scheduleReview(card, Rating.Good);
    expect(result.card.state).toBe(State.Learning);
    expect(result.card.due).toBeInstanceOf(Date);
    expect(result.card.due.getTime()).toBeGreaterThan(card.due.getTime());
  });

  it('schedules a review with Again rating', () => {
    const card = createNewCard();
    const result = scheduleReview(card, Rating.Again);
    expect(result.card.state).toBe(State.Learning);
  });

  it('serializes and deserializes card state', () => {
    const card = createNewCard();
    const json = cardToJson(card);
    const restored = getCardFromState(json);
    expect(restored.state).toBe(card.state);
    expect(restored.due.getTime()).toBe(card.due.getTime());
  });

  it('returns correct card status', () => {
    expect(getCardStatus(createNewCard())).toBe('new');
  });

  it('converts rating strings', () => {
    expect(toFsrsRating('again')).toBe(Rating.Again);
    expect(toFsrsRating('hard')).toBe(Rating.Hard);
    expect(toFsrsRating('good')).toBe(Rating.Good);
    expect(toFsrsRating('easy')).toBe(Rating.Easy);
  });
});
