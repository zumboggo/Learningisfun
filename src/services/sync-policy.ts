import { db } from '@/db/schema';

const inFlight = new Map<string, Promise<void>>();
const FAILED_RETRY_BACKOFF_MS = 60 * 1000;

export const SYNC_WINDOWS = {
  account: 15 * 60 * 1000,
  catalog: 15 * 60 * 1000,
  stableContent: 30 * 60 * 1000,
} as const;

/**
 * Coalesces duplicate syncs and persists a successful refresh timestamp in
 * IndexedDB. This keeps reloads, focus events, and multiple mounted views from
 * starting the same server read repeatedly.
 */
export async function runCachedSync(
  key: string,
  maxAgeMs: number,
  task: () => Promise<unknown>,
  force = false,
): Promise<void> {
  const existing = inFlight.get(key);
  if (existing) return existing;

  // Register before the first asynchronous cache read: simultaneous callers
  // must share the entire operation, not only the eventual network request.
  const promise = (async () => {
    if (!force) {
      const last = await db.app_metadata.get(`sync:${key}`);
      if (Date.now() - Number(last?.value || 0) < maxAgeMs) return;
      const attempt = await db.app_metadata.get(`sync-attempt:${key}`);
      if (Date.now() - Number(attempt?.value || 0) < FAILED_RETRY_BACKOFF_MS) return;
    }
    await db.app_metadata.put({ key: `sync-attempt:${key}`, value: String(Date.now()) });
    const result = await task();
    if (result !== false) await db.app_metadata.put({ key: `sync:${key}`, value: String(Date.now()) });
  })().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export async function invalidateCachedSync(key: string): Promise<void> {
  await db.app_metadata.delete(`sync:${key}`);
}
