// Vocabulary releases Friday 08:00 Asia/Shanghai (planning.fridayRelease).
// Refresh content one hour later: Friday 01:00 UTC, with no DST ambiguity.
export function deckRefreshBoundary(now = Date.now()): number {
  const date = new Date(now);
  date.setUTCHours(1, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 2) % 7);
  if (date.getTime() > now) date.setUTCDate(date.getUTCDate() - 7);
  return date.getTime();
}
export const deckRefreshKey = (userId: string, deckId: string) => `deck-content-checked:${userId}:${deckId}`;
