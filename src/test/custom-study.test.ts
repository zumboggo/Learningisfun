import { describe, expect, it } from 'vitest';
import { filterCustomStudyCards } from '@/services/flashcard.service';
import type { FlashcardCard, StudentCardState } from '@/types';

const card = (id: string, tags: string[]): FlashcardCard => ({ $id:id, deckId:'deck-1', front:id, back:`${id} back`, frontMarkdown:id, backMarkdown:`${id} back`, hint:'', tags, sortOrder:0, createdAt:'2026-01-01T00:00:00.000Z' });
const state = (cardId: string, patch: Partial<StudentCardState> = {}): StudentCardState => ({ $id:`student-1_${cardId}`, userId:'student-1', cardId, deckId:'deck-1', fsrsState:'{}', dueDate:'2020-01-01T00:00:00.000Z', status:'review', intervalDays:2, stability:1, difficulty:5, learningSteps:0, repetitions:2, lapses:0, lastReviewAt:'2026-01-01T00:00:00.000Z', reviewCount:2, ...patch });

describe('custom flashcard study filters', () => {
  const cards = [card('poetry', ['literature']), card('syntax', ['grammar']), card('hard-word', ['literature'])];
  const states = [state('poetry'), state('hard-word', { lapses: 2, difficulty: 8 })];

  it('combines tag and difficulty filters', () => {
    expect(filterCustomStudyCards(cards, states, ['literature'], 'difficult').map(item => item.$id)).toEqual(['hard-word']);
  });

  it('finds new cards within a selected tag', () => {
    expect(filterCustomStudyCards(cards, states, ['grammar'], 'new').map(item => item.$id)).toEqual(['syntax']);
  });
});
