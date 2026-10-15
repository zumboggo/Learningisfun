import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { db } from '@/db/schema';
import { useWeeklyVocabulary } from '@/hooks/useWeeklyVocabulary';
import { executeLearningContent } from '@/services/learning-content.service';
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: vi.fn() }));
const request = vi.mocked(executeLearningContent);
const deck = { $id: 'ethics', creatorId: 'teacher', title: 'Ethics core', description: '', type: 'teacher' as const, status: 'published' as const, createdAt: '', updatedAt: 'r1' };
const card = { $id: 'word', deckId: 'ethics', front: 'Justice', back: 'Fair treatment', frontMarkdown: '', backMarkdown: '', hint: '', tags: ['week:2026-10-12'], sortOrder: 0, createdAt: '' };
function Weekly() {
  const { vocabulary, error } = useWeeklyVocabulary('ethics-class', 'student');
  return <div>{[...vocabulary.values()].flat().map(c => <p key={c.$id}>{c.front}</p>)}{error && <p role="alert">{error}</p>}</div>;
}
beforeEach(async () => {
  await Promise.all([db.deck_assignments.clear(), db.flashcard_decks.clear(), db.flashcard_cards.clear(), db.app_metadata.clear(), db.sync_queue.clear()]);
  request.mockReset();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  await db.flashcard_decks.put(deck);
  await db.deck_assignments.put({ $id: 'assignment', deckId: 'ethics', classId: 'ethics-class', isRequired: true, dailyTarget: 6, assignedAt: '' });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('loads this week on a fresh browser without opening a deck and refreshes cached cards on return', async () => {
  request.mockResolvedValue({ deck, cards: [card], revision: 'r1', unchanged: false });
  render(<Weekly />);
  await screen.findByText('Justice');
  expect(request.mock.calls.every(([payload]) => payload.deckId === 'ethics')).toBe(true);
  request.mockResolvedValue({ deck, cards: [card, { ...card, $id: 'new', front: 'Duty' }], revision: 'r2', unchanged: false });
  fireEvent.focus(window);
  await screen.findByText('Duty');
  expect(request.mock.lastCall?.[0].revision).toBe('r1');
});
it('keeps downloaded vocabulary during errors and retries on reconnect', async () => {
  await db.flashcard_cards.put(card);
  request.mockRejectedValue(new Error('Network unavailable'));
  render(<Weekly />);
  await screen.findByRole('alert');
  expect(await screen.findByText('Justice')).toBeInTheDocument();
  request.mockResolvedValue({ deck, cards: [card], revision: 'r1', unchanged: false });
  fireEvent.online(window);
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
it('loads newly synced assignments while the class page stays open', async () => {
  await db.deck_assignments.clear();
  request.mockResolvedValue({ deck, cards: [card], revision: 'r1', unchanged: false });
  render(<Weekly />);
  await db.deck_assignments.put({ $id: 'assignment', deckId: 'ethics', classId: 'ethics-class', isRequired: true, dailyTarget: 6, assignedAt: '' });
  await screen.findByText('Justice');
});
