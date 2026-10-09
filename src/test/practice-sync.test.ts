import 'fake-indexeddb/auto';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {db} from '@/db/schema';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {executeLearningContent} from '@/services/learning-content.service';
import {addToQueue,processQueue} from '@/services/sync.service';
const request=vi.mocked(executeLearningContent);
beforeEach(async()=>{await db.sync_queue.clear();await db.app_metadata.clear();await db.app_metadata.put({key:'currentUserId',value:'alice'});request.mockReset();request.mockImplementation(async(payload)=>({results:(payload.operations as Array<{id:string}>).map(op=>({id:op.id,ok:true}))}));});
afterEach(()=>vi.useRealTimers());
it('batches individual reviews into one request without uploading another account’s queue',async()=>{
 for(const id of ['one','two','three'])await addToQueue('alice','card_review',id,'create',{$id:id,userId:'alice',deckId:'d'});
 await addToQueue('bob','card_review','bob','create',{$id:'bob',userId:'bob',deckId:'d'});
 expect(request).not.toHaveBeenCalled();await processQueue();
 expect(request).toHaveBeenCalledTimes(1);expect((request.mock.calls[0][0].operations as unknown[])).toHaveLength(3);
 expect((await db.sync_queue.where('userId').equals('bob').first())?.syncStatus).toBe('pending');
});
it('retains failed operations and reuses their IDs on a retry',async()=>{
 await addToQueue('alice','card_review','stable','create',{$id:'stable',userId:'alice',deckId:'d'});
 request.mockRejectedValueOnce(new Error('Offline'));await processQueue();expect((await db.sync_queue.toArray())[0].syncStatus).toBe('pending');
 await processQueue();expect((await db.sync_queue.toArray())[0].syncStatus).toBe('synced');
 expect((request.mock.calls[1][0].operations as Array<{id:string}>)[0].id).toBe('stable');
});
it('coalesces unsent session snapshots but keeps immutable review records',async()=>{
 await addToQueue('alice','flashcard_study_session','session','create',{$id:'session',cardsReviewed:0});
 await addToQueue('alice','flashcard_study_session','session','update',{$id:'session',cardsReviewed:5});
 const rows=await db.sync_queue.toArray();expect(rows).toHaveLength(1);expect(rows[0].payload).toMatchObject({cardsReviewed:5});expect(rows[0].operationType).toBe('create');
});
