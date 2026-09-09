import type { FlashcardCard } from '@/types';

/** Only released class-deck cards are supplied; private unit data is never queried. */
export function groupWeeklyVocabulary(cards: FlashcardCard[]): Map<string, FlashcardCard[]> {
  const result = new Map<string, FlashcardCard[]>();
  for (const card of cards) {
    const tags = card.tags || [];
    if (tags.some(tag => ['REFERENCE','SUPPORTING'].includes(tag.toUpperCase()))) continue;
    const week = tags.find(tag => /^week:\d{4}-\d{2}-\d{2}$/.test(tag))?.slice(5);
    if (!week) continue;
    const group = result.get(week) || [];
    if (!group.some(item => item.front === card.front && item.back === card.back)) group.push(card);
    result.set(week, group);
  }
  for (const group of result.values()) group.sort((a,b) => a.front.localeCompare(b.front));
  return result;
}
