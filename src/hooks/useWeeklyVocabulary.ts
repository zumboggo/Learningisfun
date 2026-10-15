import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { ensureDeckCards } from '@/services/flashcard-cache';
import { groupWeeklyVocabulary } from '@/services/weekly-vocabulary';

/** Class materials need their cards even when no vocabulary deck has been opened. */
export function useWeeklyVocabulary(classId: string, userId?: string) {
  const [failure, setFailure] = useState<{ classId: string; userId: string; message: string }>();
  const decks = useLiveQuery(async () => {
    const assignments = await db.deck_assignments.where('classId').equals(classId).toArray();
    const ids = [...new Set(assignments.map(item => item.deckId))].sort();
    const rows = await db.flashcard_decks.bulkGet(ids);
    return ids.map((id, index) => ({ id, revision: rows[index]?.updatedAt || '' }));
  }, [classId]);
  const deckKey = JSON.stringify(decks || []);
  const cards = useLiveQuery(async () => {
    const ids = (JSON.parse(deckKey) as { id: string }[]).map(deck => deck.id);
    return ids.length ? db.flashcard_cards.where('deckId').anyOf(ids).toArray() : [];
  }, [classId, deckKey]);

  useEffect(() => {
    if (!userId) return;
    let disposed = false;
    const ids = (JSON.parse(deckKey) as { id: string }[]).map(deck => deck.id);
    const refresh = async () => {
      const results = await Promise.allSettled(ids.map(id => ensureDeckCards(userId, id)));
      if (!disposed) setFailure({ classId, userId, message: results.some(result => result.status === 'rejected')
        ? 'Some vocabulary could not load. Reconnect and return to this page to retry.' : '' });
    };
    void refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    return () => {
      disposed = true;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
    };
  }, [classId, userId, deckKey]);

  return { vocabulary: groupWeeklyVocabulary(cards || []),
    error: failure?.classId === classId && failure?.userId === userId ? failure?.message || '' : '' };
}
