import {afterEach,expect,it,vi} from 'vitest';
import {validatePairs,textTranslationAction,languages} from '../../functions/learning-content/src/text-translation.js';
const paid=vi.hoisted(()=>vi.fn());
vi.mock('../../functions/learning-content/src/teacher-ai.js',()=>({paidCompletion:paid}));
const missing=()=>Object.assign(Error('Missing'),{code:404});
function fixture(){
 const docs=new Map();const db={
 getDocument:vi.fn(async(...args)=>{if(args[1]==='texts')return {$id:'t',teacherId:'teacher',status:'published',contentMode:'full'};const a=args[0];const doc=docs.get(a.collectionId+':'+a.documentId);if(!doc)throw missing();return doc;}),
 listDocuments:vi.fn(async(_d,collection)=>({documents:collection==='text_paragraphs'?[{$id:'p',content:'Hello. ',sortOrder:0}]:collection==='text_assignments'?[{classId:'c',assignedAt:'2000-01-01'}]:[]})),
 createDocument:vi.fn(async a=>{const key=a.collectionId+':'+a.documentId;if(docs.has(key))throw Object.assign(Error('Conflict'),{code:409});docs.set(key,{...a.data,$createdAt:new Date().toISOString()});}),
 updateDocument:vi.fn(async a=>{docs.set(a.collectionId+':'+a.documentId,{...docs.get(a.collectionId+':'+a.documentId),...a.data});}),
 deleteDocument:vi.fn(async a=>{docs.delete(a.collectionId+':'+a.documentId);})};
 return {db,body:{action:'generateTextTranslation',textId:'t',paragraphId:'p',content:'Hello. ',level:'original',language:'zh-Hans'},databaseId:'main',profile:{role:'student'},userId:'s',memberClassIds:new Set(['c'])};
}
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();paid.mockReset();});
it('rejects altered English, missing translation, and whitespace loss',()=>{
 for(const pairs of [[],[{english:'Hello.',translation:'你好'}],[{english:'Hello. ',translation:''}]])expect(()=>validatePairs(pairs,'Hello. ')).toThrow();
 expect(validatePairs([{english:'Hello. ',translation:'你好'}],'Hello. ')).toHaveLength(1);
});
it('authorizes before looking up or generating translations',async()=>{const f=fixture();f.memberClassIds.clear();await expect(textTranslationAction(f)).rejects.toThrow('not available');expect(f.db.createDocument).not.toHaveBeenCalled();});
it('rejects outdated source and unavailable supported versions',async()=>{const f=fixture();f.body.content='Old';await expect(textTranslationAction(f)).rejects.toThrow('changed');f.body.level='supported';await expect(textTranslationAction(f)).rejects.toThrow('support version');});
it('shares a translation, reports it, and invalidates after source changes',async()=>{
 paid.mockResolvedValue(JSON.stringify({sentences:[{id:0,translation:'你好'}]}));
 const f=fixture();expect((await textTranslationAction(f)).status).toBe('ready');expect((await textTranslationAction(f)).status).toBe('ready');expect(paid).toHaveBeenCalledTimes(1);
 await textTranslationAction({...f,body:{...f.body,action:'reportTextTranslation'}});expect(f.db.updateDocument).toHaveBeenCalledWith(expect.objectContaining({data:{reported:true}}));
 f.body.language='fr';await textTranslationAction(f);expect(paid).toHaveBeenCalledTimes(2);
});
it('releases the generation claim after provider failure',async()=>{paid.mockRejectedValue(Error('unavailable'));const f=fixture();await expect(textTranslationAction(f)).rejects.toThrow('unavailable');expect(f.db.deleteDocument).toHaveBeenCalled();});
it('offers distinct Chinese scripts',()=>{expect(languages).toContain('zh-Hans');expect(languages).toContain('zh-Hant');});

it('deduplicates concurrent generation requests',async()=>{let resolve;paid.mockImplementation(()=>new Promise(r=>{resolve=r}));const f=fixture();const first=textTranslationAction(f);await vi.waitFor(()=>expect(paid).toHaveBeenCalledTimes(1));expect((await textTranslationAction(f)).status).toBe('generating');resolve(JSON.stringify({sentences:[{id:0,translation:'你好'}]}));await first;expect(paid).toHaveBeenCalledTimes(1);});
