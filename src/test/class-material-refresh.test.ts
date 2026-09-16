import { expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({sessions:vi.fn(async()=>true),quizzes:vi.fn(async()=>true),texts:vi.fn(async()=>true),presentations:vi.fn(async()=>true),writing:vi.fn(async()=>true),cards:vi.fn(async()=>true)}));
vi.mock('@/services/class-session.service',()=>({syncClassSessionsFromServer:mocks.sessions}));
vi.mock('@/services/quiz.service',()=>({syncQuizzesFromServer:mocks.quizzes}));
vi.mock('@/services/text.service',()=>({syncTextsFromServer:mocks.texts}));
vi.mock('@/services/presentation.service',()=>({syncPresentationLinks:mocks.presentations}));
vi.mock('@/services/writing.service',()=>({syncWritingFromServer:mocks.writing}));
vi.mock('@/services/flashcard.service',()=>({syncDecksFromServer:mocks.cards}));
vi.mock('@/services/sync-policy',()=>({SYNC_WINDOWS:{catalog:100,stableContent:200},runCachedSync:vi.fn(async(_key:string,_age:number,task:()=>Promise<unknown>)=>task())}));
import { refreshClassMaterials, syncClassMaterials } from '@/services/class-material-refresh.service';
it('refreshes remaining domains when one fails and reports the failed domain',async()=>{
  mocks.quizzes.mockResolvedValueOnce(false);
  const result=await refreshClassMaterials('blue','teacher',true);
  expect(result.failed).toEqual(['quizzes']);
  expect(result.refreshed).toHaveLength(5);
  expect(mocks.texts).toHaveBeenCalledWith(['blue'],'teacher',true);
});
it('background refresh can request only the changed domain',async()=>{
  vi.clearAllMocks();
  const result=await syncClassMaterials(['red'],'student',false,false,['texts']);
  expect(result.refreshed).toEqual(['texts']);
  expect(mocks.quizzes).not.toHaveBeenCalled();
  expect(mocks.texts).toHaveBeenCalledWith(['red'],'student',false);
});
