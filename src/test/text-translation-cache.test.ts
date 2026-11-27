import 'fake-indexeddb/auto';
import {webcrypto} from 'node:crypto';
import {afterEach,expect,it,vi} from 'vitest';
import {db} from '@/db/schema';
import {getTranslation,translationKey} from '@/services/text-translation.service';
const execute=vi.hoisted(()=>vi.fn());
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:execute}));
afterEach(async()=>{await db.text_translations.clear();vi.unstubAllGlobals();vi.restoreAllMocks();execute.mockReset();});
it('reuses saved translation offline and changes keys when surrounding context changes',async()=>{
 vi.stubGlobal('crypto',webcrypto);const request={textId:'t',paragraphId:'p',language:'fr',level:'original',content:'Hello.'};
 execute.mockResolvedValue({status:'ready',pairs:[{english:'Hello.',translation:'Bonjour.'}]});
 const first=await getTranslation(request,'context',()=>true);expect(execute).toHaveBeenCalledTimes(1);
 vi.spyOn(navigator,'onLine','get').mockReturnValue(false);expect(await getTranslation(request,'context',()=>true)).toEqual(first);expect(execute).toHaveBeenCalledTimes(1);
 expect(await translationKey(request,'context')).not.toBe(await translationKey(request,'new context'));
 await expect(getTranslation(request,'new context',()=>true)).rejects.toThrow('Connect');
});
