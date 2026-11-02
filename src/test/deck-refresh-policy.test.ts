import 'fake-indexeddb/auto';
import {expect,it,vi,beforeEach} from 'vitest';
import {deckRefreshBoundary,deckRefreshKey} from '@/services/deck-refresh-policy';
import {db} from '@/db/schema';
import {deckCacheKey,refreshDueDeckCards} from '@/services/flashcard-cache';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {executeLearningContent} from '@/services/learning-content.service';
const request=vi.mocked(executeLearningContent);
beforeEach(async()=>{await db.app_metadata.clear();request.mockReset();vi.spyOn(navigator,'onLine','get').mockReturnValue(true);});
it.each([
 ['2026-11-06T00:59:59Z','2026-10-30T01:00:00Z'],
 ['2026-11-06T01:00:00Z','2026-11-06T01:00:00Z'],
 ['2026-11-09T10:00:00Z','2026-11-06T01:00:00Z'],
 ['2027-01-01T01:00:00Z','2027-01-01T01:00:00Z'],
])('finds the Friday boundary for %s',(now,expected)=>expect(deckRefreshBoundary(Date.parse(now))).toBe(Date.parse(expected)));
it('catches up after offline time, avoids repeat lookups, isolates accounts and backs off failures',async()=>{
 await db.app_metadata.bulkPut([{key:'currentUserId',value:'a'},{key:deckCacheKey('a','d'),value:'r1'},{key:deckCacheKey('b','other'),value:'r1'}]);
 vi.spyOn(navigator,'onLine','get').mockReturnValue(false);await refreshDueDeckCards('a');expect(request).not.toHaveBeenCalled();
 vi.spyOn(navigator,'onLine','get').mockReturnValue(true);
 request.mockResolvedValue({unchanged:true,revision:'r1'});await refreshDueDeckCards('a');expect(request).toHaveBeenCalledTimes(1);
 await refreshDueDeckCards('a');expect(request).toHaveBeenCalledTimes(1);
 await db.app_metadata.delete(deckRefreshKey('a','d'));await db.app_metadata.delete('deck-content-attempt:a:d');
 request.mockRejectedValue(Error('offline'));await refreshDueDeckCards('a');await refreshDueDeckCards('a');expect(request).toHaveBeenCalledTimes(2);
 expect(await db.app_metadata.get(deckRefreshKey('a','d'))).toBeUndefined();
});
