import {executeLearningContent} from './learning-content.service';
import { db } from '@/db/schema';
import { generateDeviceId, isOnline, getTimestamp } from '@/utils/helpers';
import { databases, functions, DATABASE_ID, COLLECTIONS, FUNCTION_IDS } from '@/lib/appwrite';
import type { SyncOperation } from '@/types';

const MAX_RETRIES = 5;
const SYNC_DEBOUNCE_MS = 2000;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let practiceTimer: ReturnType<typeof setTimeout> | null = null;
const PRACTICE_BATCH_DELAY_MS=30_000;
const PRACTICE_BATCH_SIZE=40;
const isPractice=(type:string)=>['card_review','flashcard_review_event','flashcard_study_session'].includes(type);
let isSyncing = false;
let listenersInstalled = false;

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
  userId=userId||(await db.app_metadata.get('currentUserId'))?.value||'';
  const operationId = crypto.randomUUID();
  const deviceId = getDeviceId();

  if(entityType==='flashcard_study_session'){
    const existing=await db.sync_queue.where('entityId').equals(entityId).filter(op=>op.userId===userId&&op.entityType===entityType&&op.syncStatus==='pending').first();
    if(existing?.id){await db.sync_queue.update(existing.id,{payload,timestamp:Date.now()});schedulePracticeSync();return existing.operationId;}
  }
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

  if(isPractice(entityType))schedulePracticeSync();else scheduleSync();
  return operationId;
}

function schedulePracticeSync():void{
  if(practiceTimer)return;
  practiceTimer=setTimeout(()=>{practiceTimer=null;void processQueue();},PRACTICE_BATCH_DELAY_MS);
}

export function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void processQueue();
  }, SYNC_DEBOUNCE_MS);
}

export async function processQueue():Promise<void>{
 if(navigator.locks)return navigator.locks.request('learning-is-fun-sync',{ifAvailable:true},async lock=>{if(lock)await processQueueUnlocked();});
 return processQueueUnlocked();
}
async function processQueueUnlocked(): Promise<void> {
  if (isSyncing || !isOnline()) return;
  isSyncing = true;

  try {
    const owner=(await db.app_metadata.get('currentUserId'))?.value;
    if(!owner)return;
    const abandoned=await db.sync_queue.where('syncStatus').equals('syncing').filter(op=>op.userId===owner&&(!!navigator.locks||Date.now()-op.timestamp>120000)).toArray();
    for(const op of abandoned)if(op.id)await db.sync_queue.update(op.id,{syncStatus:'pending'});
    // Upgrade legacy card/assignment entries that were queued without an owner.
    const legacy=await db.sync_queue.where('userId').equals('').toArray();
    for(const op of legacy){
      if(!op.id||!['card','deck_assignment'].includes(op.entityType))continue;
      const deckId=(op.payload as {deckId?:string}).deckId;
      const deck=deckId?await db.flashcard_decks.get(deckId):null;
      if(deck?.creatorId===owner)await db.sync_queue.update(op.id,{userId:owner});
    }
    const pending = await db.sync_queue
      .where('syncStatus')
      .anyOf('pending', 'failed')
      .and(op => op.retryCount < MAX_RETRIES && op.userId === owner)
      .sortBy('timestamp');

    let practiceCount=0;
    const batch=pending.filter(op=>!isPractice(op.entityType)||practiceCount++<PRACTICE_BATCH_SIZE);
    const practice=batch.filter(op=>isPractice(op.entityType)&&op.id);
    if(practice.length){
      for(const op of practice)await db.sync_queue.update(op.id!,{syncStatus:'syncing',timestamp:Date.now()});
      try{
        const result=await executeLearningContent<{results:Array<{id:string;ok:boolean;error?:string}>}>({action:'saveFlashcardBatch',operations:practice.map(op=>({id:op.entityId,entityType:op.entityType,payload:op.payload}))});
        for(const op of practice){
          const saved=result.results.find(row=>row.id===op.entityId);
          if(saved?.ok){const latest=await db.sync_queue.get(op.id!);await db.sync_queue.update(op.id!,{syncStatus:JSON.stringify(latest?.payload)===JSON.stringify(op.payload)?'synced':'pending'});if(op.entityType==='card_review')await db.card_reviews.update(op.entityId,{syncStatus:'synced'});else await markEntitySynced(op.entityType,op.entityId);}
          else await db.sync_queue.update(op.id!,{syncStatus:op.retryCount+1>=MAX_RETRIES?'failed':'pending',retryCount:op.retryCount+1,error:saved?.error||'Practice save not confirmed'});
        }
      }catch(error){for(const op of practice)await db.sync_queue.update(op.id!,{syncStatus:op.retryCount+1>=MAX_RETRIES?'failed':'pending',retryCount:op.retryCount+1,error:error instanceof Error?error.message:'Connection unavailable'});}
    }
    for (const op of batch.filter(op=>!isPractice(op.entityType))) {
      if((await db.app_metadata.get('currentUserId'))?.value!==owner)break;
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

    const remaining=await db.sync_queue.where('syncStatus').equals('pending').filter(op=>op.userId===owner&&isPractice(op.entityType)&&op.retryCount<MAX_RETRIES).count();
    if(remaining)schedulePracticeSync();
    await db.app_metadata.put({ key: 'lastSyncAt', value: getTimestamp() });
  } finally {
    isSyncing = false;
  }
}

async function executeSyncOperation(op: SyncOperation): Promise<void> {
  const { entityType, entityId, operationType, payload } = op;
  const data = payload as Record<string, unknown>;

  const secureCollection = collectionForEntity(entityType);
  if (FUNCTION_IDS.learningContent && secureCollection && [
    'quiz', 'quiz_assignment', 'quiz_question', 'quiz_attempt', 'writing_prompt',
    'writing_prompt_assignment', 'writing_submission', 'peer_review', 'text',
    'text_assignment', 'text_paragraph', 'text_annotation', 'text_discussion_post',
    'text_discussion_vote', 'question', 'vote', 'discussion_answer', 'class_links', 'deck_assignment',
  ].includes(entityType)) {
    const execution = await functions.createExecution(FUNCTION_IDS.learningContent, JSON.stringify({
      action: 'mutate', collection: secureCollection, operation: operationType,
      id: (data.$id as string | undefined) || entityId, data,
    }));
    if (execution.status === 'failed') throw new Error(execution.errors || 'Secure sync failed');
    const response = JSON.parse(execution.responseBody || '{}');
    if (response.error || execution.responseStatusCode >= 400) throw new Error(response.error || 'Secure sync was rejected');
    await markEntitySynced(entityType, (data.$id as string | undefined) || entityId);
    return;
  }

  if (entityType === 'question' && operationType === 'create') {
    if (data.classSessionId) {
      await upsertDocument(COLLECTIONS.discussion_questions, data);
    } else {
      await functions.createExecution(FUNCTION_IDS.submitQuestion, JSON.stringify({
        assignmentId: data.assignmentId,
        readingId: data.readingId,
        questionText: data.questionText,
        selectedPassage: data.selectedPassage || '',
      }));
    }
    await db.discussion_questions.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'question' && operationType === 'update') {
    await upsertDocument(COLLECTIONS.discussion_questions, data);
    await db.discussion_questions.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'vote' && operationType === 'create') {
    if (data.classSessionId) {
      await upsertDocument(COLLECTIONS.question_votes, data);
    } else {
      await functions.createExecution(FUNCTION_IDS.toggleVote, JSON.stringify({
        questionId: data.questionId,
      }));
    }
    await db.question_votes.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'vote' && operationType === 'update') {
    await upsertDocument(COLLECTIONS.question_votes, data);
    await db.question_votes.update(data.$id as string, { syncStatus: 'synced' });
  } else if (entityType === 'vote' && operationType === 'delete') {
    if (data.classSessionId) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.question_votes, data.$id as string);
    } else {
      await functions.createExecution(FUNCTION_IDS.toggleVote, JSON.stringify({
        questionId: data.questionId,
        remove: true,
      }));
    }
  } else if (entityType === 'card_review' && operationType === 'create') {
    try{await databases.createDocument(DATABASE_ID, COLLECTIONS.card_reviews, data.$id as string, {
      userId: data.userId,
      cardId: data.cardId,
      deckId: data.deckId,
      rating: data.rating,
      reviewAt: data.reviewAt,
      previousState: data.previousState,
      newState: data.newState,
      deviceId: data.deviceId,
      operationId: data.operationId,
    });}catch(error){if((error as {code?:number}).code!==409)throw error;} // Immutable review ID makes retries idempotent.
    await db.card_reviews.update(data.$id as string, { syncStatus: 'synced' });
  } else {
    const collection = collectionForEntity(entityType);
    if (!collection) return;
    const documentId = (data.$id as string | undefined) || entityId;
    const opType: string = operationType;
    if (opType === 'delete') {
      await databases.deleteDocument(DATABASE_ID, collection, documentId);
    } else if (opType === 'create' && data.$id) {
      await upsertDocument(collection, data);
      await markEntitySynced(entityType, documentId);
    } else {
      await databases.updateDocument(DATABASE_ID, collection, documentId, toRemoteDocument(data));
      await markEntitySynced(entityType, documentId);
    }
    if(entityType==='card'&&typeof data.deckId==='string'){
      const updatedAt=getTimestamp();
      await databases.updateDocument(DATABASE_ID,COLLECTIONS.flashcard_decks,data.deckId,{updatedAt});
      await db.flashcard_decks.update(data.deckId,{updatedAt});
    }
  }
}

async function upsertDocument(collectionId: string, data: Record<string, unknown>): Promise<void> {
  const id = data.$id as string;
  try {
    await databases.createDocument(DATABASE_ID, collectionId, id, toRemoteDocument(data));
  } catch {
    await databases.updateDocument(DATABASE_ID, collectionId, id, toRemoteDocument(data));
  }
}

function toRemoteDocument(data: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === '$id' || key === 'syncStatus' || value === undefined) continue;
    output[key] = value;
  }
  return output;
}

function collectionForEntity(entityType: string): string | null {
  switch (entityType) {
    case 'question': return COLLECTIONS.discussion_questions;
    case 'vote': return COLLECTIONS.question_votes;
    case 'class_session': return COLLECTIONS.class_sessions;
    case 'class_session_item': return COLLECTIONS.class_session_items;
    case 'discussion_answer': return COLLECTIONS.discussion_answers;
    case 'flashcard_review_event': return COLLECTIONS.flashcard_review_events;
    case 'flashcard_study_session': return COLLECTIONS.flashcard_study_sessions;
    case 'deck': return COLLECTIONS.flashcard_decks;
    case 'card': return COLLECTIONS.flashcard_cards;
    case 'deck_assignment': return COLLECTIONS.deck_assignments;
    case 'class': return COLLECTIONS.classes;
    case 'class_links': return COLLECTIONS.classes;
    case 'class_member': return COLLECTIONS.class_members;
    case 'quiz': return COLLECTIONS.quizzes;
    case 'quiz_assignment': return COLLECTIONS.quiz_assignments;
    case 'quiz_question': return COLLECTIONS.quiz_questions;
    case 'quiz_attempt': return COLLECTIONS.quiz_attempts;
    case 'text': return COLLECTIONS.texts;
    case 'text_assignment': return COLLECTIONS.text_assignments;
    case 'text_paragraph': return COLLECTIONS.text_paragraphs;
    case 'text_annotation': return COLLECTIONS.text_annotations;
    case 'text_discussion_post': return COLLECTIONS.text_discussion_posts;
    case 'text_discussion_vote': return COLLECTIONS.text_discussion_votes;
    case 'writing_prompt': return COLLECTIONS.writing_prompts;
    case 'writing_prompt_assignment': return COLLECTIONS.writing_prompt_assignments;
    case 'writing_submission': return COLLECTIONS.writing_submissions;
    case 'peer_review': return COLLECTIONS.peer_reviews;
    default: return null;
  }
}

async function markEntitySynced(entityType: string, entityId: string): Promise<void> {
  switch (entityType) {
    case 'class_session':
      await db.class_sessions.update(entityId, { syncStatus: 'synced' });
      break;
    case 'class_session_item':
      await db.class_session_items.update(entityId, { syncStatus: 'synced' });
      break;
    case 'discussion_answer':
      await db.discussion_answers.update(entityId, { syncStatus: 'synced' });
      break;
    case 'flashcard_review_event':
      await db.flashcard_review_events.update(entityId, { syncStatus: 'synced' });
      break;
    case 'flashcard_study_session':
      await db.flashcard_study_sessions.update(entityId, { syncStatus: 'synced' });
      break;
    case 'quiz':
      await db.quizzes.update(entityId, { syncStatus: 'synced' });
      break;
    case 'quiz_attempt':
      await db.quiz_attempts.update(entityId, { syncStatus: 'synced' });
      break;
    case 'writing_prompt':
      await db.writing_prompts.update(entityId, { syncStatus: 'synced' });
      break;
    case 'writing_submission':
      await db.writing_submissions.update(entityId, { syncStatus: 'synced' });
      break;
    case 'peer_review':
      await db.peer_reviews.update(entityId, { syncStatus: 'synced' });
      break;
  }
}

export async function getSyncStatus(userId?: string): Promise<{
  pending: number;
  failed: number;
  lastSyncAt: string | null;
}> {
  const pendingRows = db.sync_queue.where('syncStatus').anyOf('pending','syncing');
  const failedRows = db.sync_queue.where('syncStatus').equals('failed');
  const pending = userId ? await pendingRows.and(operation => operation.userId === userId).count() : await pendingRows.count();
  const failed = userId ? await failedRows.and(operation => operation.userId === userId).count() : await failedRows.count();
  const meta = await db.app_metadata.get('lastSyncAt');
  return { pending, failed, lastSyncAt: meta?.value || null };
}

export async function retryFailedOperations(userId: string): Promise<void> {
  const failed = await db.sync_queue.where('syncStatus').equals('failed').and(operation => operation.userId === userId).toArray();
  await db.transaction('rw', db.sync_queue, async () => {
    for (const operation of failed) if (operation.id) await db.sync_queue.update(operation.id, { syncStatus: 'pending', retryCount: 0, error: undefined });
  });
}

export async function clearSyncedOperations(): Promise<void> {
  await db.sync_queue.where('syncStatus').equals('synced').delete();
}

export function setupSyncListeners(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;
  window.addEventListener('online', () => {
    void processQueue();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isOnline()) {
      void processQueue();
    }
  });
}
