import { db } from '@/db/schema';

const inFlight = new Map<string, Promise<void>>();
const FAILED_RETRY_BACKOFF_MS = 60 * 1000;

export const SYNC_WINDOWS = {
  account: 15 * 60 * 1000,
  catalog: 15 * 60 * 1000,
  stableContent: 6 * 60 * 60 * 1000,
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

  if (!force) {
    const last = await db.app_metadata.get(`sync:${key}`);
    const timestamp = Number(last?.value || 0);
    if (Number.isFinite(timestamp) && Date.now() - timestamp < maxAgeMs) return;
    const lastAttempt = await db.app_metadata.get(`sync-attempt:${key}`);
    const attemptTimestamp = Number(lastAttempt?.value || 0);
    if (Number.isFinite(attemptTimestamp) && Date.now() - attemptTimestamp < FAILED_RETRY_BACKOFF_MS) return;
  }

  await db.app_metadata.put({ key: `sync-attempt:${key}`, value: String(Date.now()) });
  const promise = task()
    .then(result => result === false ? undefined : db.app_metadata.put({ key: `sync:${key}`, value: String(Date.now()) }))
    .then(() => undefined)
    .finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export async function invalidateCachedSync(key: string): Promise<void> {
  await db.app_metadata.delete(`sync:${key}`);
}
