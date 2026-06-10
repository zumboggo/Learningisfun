import { db } from '@/db/schema';
import { generateDeviceId, isOnline, getTimestamp } from '@/utils/helpers';
import { databases, functions, DATABASE_ID, COLLECTIONS, FUNCTION_IDS } from '@/lib/appwrite';
import type { SyncOperation } from '@/types';

const MAX_RETRIES = 5;
const SYNC_DEBOUNCE_MS = 2000;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

export function getDeviceId(): string {
  return generateDeviceId();
}

export async function addToQueue(
  userId: string,
  entityType: string,
  entityId: string,
  operationType: 'create' | 'update' | 'delete',
  payload: unknown,
): Promise<string> {
  const operationId = crypto.randomUUID();
  const deviceId = getDeviceId();

  await db.sync_queue.add({
    operationId,
    userId,
    deviceId,
    entityType,
    entityId,
    operationType,
    timestamp: Date.now(),
    localVersion: 1,
    payload,
    retryCount: 0,
    syncStatus: 'pending',
  });

  scheduleSync();
  return operationId;
}

export function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void processQueue();
  }, SYNC_DEBOUNCE_MS);
}

export async function processQueue(): Promise<void> {
  if (isSyncing || !isOnline()) return;
  isSyncing = true;

  try {
    const pending = await db.sync_queue
      .where('syncStatus')
      .anyOf('pending', 'failed')
      .and(op => op.retryCount < MAX_RETRIES)
      .sortBy('timestamp');

    for (const op of pending) {
      if (!op.id) continue;
      await db.sync_queue.update(op.id, { syncStatus: 'syncing' });

      try {
        await executeSyncOperation(op);
        await db.sync_queue.update(op.id!, { syncStatus: 'synced' });
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        await db.sync_queue.update(op.id!, {
          syncStatus: op.retryCount + 1 >= MAX_RETRIES ? 'failed' : 'pending',
          retryCount: op.retryCount + 1,
          error,
        });
      }
    }

    await db.app_metadata.put({ key: 'lastSyncAt', value: getTimestamp() });
  } finally {
    isSyncing = false;
  }
}

async function executeSyncOperation(op: SyncOperation): Promise<void> {
  const { entityType, operationType, payload } = op;
  const data = payload as Record<string, unknown>;

  if (entityType === 'annotation' && operationType === 'create') {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.annotations, data.$id as string, {
      userId: data.userId,
      readingId: data.readingId,
      type: data.type,
      selectedText: data.selectedText,
      textBefore: data.textBefore,
      textAfter: data.textAfter,
      startOffset: data.startOffset,
      endOffset: data.endOffset,
      blockId: data.blockId,
      color: data.color,
      noteText: data.noteText,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
    await db.annotations.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'annotation' && operationType === 'update') {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.annotations, data.$id as string, {
      noteText: data.noteText,
      color: data.color,
      updatedAt: data.updatedAt,
    });
    await db.annotations.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'question' && operationType === 'create') {
    await functions.createExecution(FUNCTION_IDS.submitQuestion, JSON.stringify({
      assignmentId: data.assignmentId,
      readingId: data.readingId,
      questionText: data.questionText,
      selectedPassage: data.selectedPassage || '',
    }));
    await db.discussion_questions.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'vote' && operationType === 'create') {
    await functions.createExecution(FUNCTION_IDS.toggleVote, JSON.stringify({
      questionId: data.questionId,
    }));
    await db.question_votes.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'vote' && operationType === 'delete') {
    await functions.createExecution(FUNCTION_IDS.toggleVote, JSON.stringify({
      questionId: data.questionId,
      remove: true,
    }));
  } else if (entityType === 'card_review' && operationType === 'create') {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.card_reviews, data.$id as string, {
      userId: data.userId,
      cardId: data.cardId,
      deckId: data.deckId,
      rating: data.rating,
      reviewAt: data.reviewAt,
      previousState: data.previousState,
      newState: data.newState,
      deviceId: data.deviceId,
      operationId: data.operationId,
    });
    await db.card_reviews.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'reading_progress' && operationType === 'update') {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.reading_progress, data.$id as string, {
        scrollPercent: data.scrollPercent,
        lastPosition: data.lastPosition,
        bookmarked: data.bookmarked,
        updatedAt: data.updatedAt,
      });
    } catch {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.reading_progress, data.$id as string, {
        userId: data.userId,
        readingId: data.readingId,
        scrollPercent: data.scrollPercent,
        lastPosition: data.lastPosition,
        bookmarked: data.bookmarked,
        updatedAt: data.updatedAt,
      });
    }
    await db.reading_progress.update(data.$id as string, { syncStatus: 'synced' });
  }
}

export async function getSyncStatus(): Promise<{
  pending: number;
  failed: number;
  lastSyncAt: string | null;
}> {
  const pending = await db.sync_queue.where('syncStatus').equals('pending').count();
  const failed = await db.sync_queue.where('syncStatus').equals('failed').count();
  const meta = await db.app_metadata.get('lastSyncAt');
  return { pending, failed, lastSyncAt: meta?.value || null };
}

export async function clearSyncedOperations(): Promise<void> {
  await db.sync_queue.where('syncStatus').equals('synced').delete();
}

export function setupSyncListeners(): void {
  window.addEventListener('online', () => {
    void processQueue();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isOnline()) {
      void processQueue();
    }
  });
}
