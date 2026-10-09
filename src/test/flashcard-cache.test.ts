import 'fake-indexeddb/auto';
import {beforeEach,it,expect,vi} from 'vitest';
import {db} from '@/db/schema';
import {ensureDeckCards,deckCacheKey,invalidateDeckCards} from '@/services/flashcard-cache';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {executeLearningContent} from '@/services/learning-content.service';
const request=vi.mocked(executeLearningContent);
const deck={$id:'d',creatorId:'teacher',title:'Deck',description:'',type:'teacher' as const,status:'published' as const,createdAt:'',updatedAt:'r1'};
const card={$id:'card',deckId:'d',front:'one',back:'1',frontMarkdown:'one',backMarkdown:'1',hint:'',tags:[],sortOrder:0,createdAt:''};
beforeEach(async()=>{await db.flashcard_decks.clear();await db.flashcard_cards.clear();await db.app_metadata.clear();await db.sync_queue.clear();request.mockReset();vi.spyOn(navigator,'onLine','get').mockReturnValue(true);});
it('coalesces simultaneous downloads and sends the cached revision on reopening',async()=>{
 request.mockResolvedValue({deck,cards:[card],revision:'r1',unchanged:false});
 await Promise.all([ensureDeckCards('a','d'),ensureDeckCards('a','d')]);expect(request).toHaveBeenCalledTimes(1);
 request.mockResolvedValue({deck,revision:'r1',unchanged:true});await ensureDeckCards('a','d');expect(request.mock.lastCall?.[0].revision).toBe('r1');
 await ensureDeckCards('b','d');expect(request.mock.lastCall?.[0].revision).toBeUndefined();
});
it('reconciles deletions while preserving queued offline edits',async()=>{
 await db.flashcard_cards.bulkPut([card,{...card,$id:'deleted'},{...card,$id:'offline'}]);
 await db.sync_queue.add({operationId:'o',userId:'a',entityId:'offline',entityType:'card',operationType:'create',deviceId:'x',timestamp:1,localVersion:1,payload:{},retryCount:0,syncStatus:'pending'});
 request.mockResolvedValue({deck,cards:[card],revision:'r2',unchanged:false});await ensureDeckCards('a','d');
 expect(await db.flashcard_cards.get('deleted')).toBeUndefined();expect(await db.flashcard_cards.get('offline')).toBeDefined();
});
it('keeps an invalidated download available offline only to its account',async()=>{
 await db.app_metadata.put({key:deckCacheKey('a','d'),value:'r1'});await invalidateDeckCards('a','d');
 vi.spyOn(navigator,'onLine','get').mockReturnValue(false);await ensureDeckCards('a','d');
 await expect(ensureDeckCards('b','d')).rejects.toThrow('online');expect(request).not.toHaveBeenCalled();
});
