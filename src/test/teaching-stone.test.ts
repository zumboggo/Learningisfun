import {describe,it,expect,vi} from 'vitest';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {extendAttempt,newAttempt,validStoneMessage,STONE_CLASS_ID} from '@/services/stone.service';
describe('Teaching Stone account bridge',()=>{
 it('resumes from an immutable history and creates independent replay attempts',()=>{
  const a=newAttempt('alice',STONE_CLASS_ID,false);const next=extendAttempt(a,['listen','needs']);
  expect(a.choices).toEqual([]);expect(next.revision).toBe(2);expect(next.pending).toBe(true);
  expect(()=>extendAttempt(next,['ledger'])).toThrow();
  const replay=newAttempt('alice',STONE_CLASS_ID,false);expect(replay.attemptId).not.toBe(a.attemptId);expect(replay.choices).toEqual([]);
  expect(next.userId).toBe('alice');expect(newAttempt('bob',STONE_CLASS_ID,false).userId).toBe('bob');
 });
 it('keeps teacher previews unranked and marks completions',()=>{
  const a=newAttempt('teacher',STONE_CLASS_ID,true);const next=extendAttempt(a,['listen','needs','paid','bargain','investigate','balance','preserve','delegate','publish','council']);
  expect(next.pending).toBe(false);expect(next.status).toBe('complete');
 });
 it('rejects foreign frames, origins, stale channels and unknown commands',()=>{
  const source={} as Window;const base={source,origin:window.location.origin,data:{protocol:'teaching-stone-v1',channel:'abc',type:'save'}} as MessageEvent;
  expect(validStoneMessage(base,source,'abc')).toBeTruthy();
  expect(validStoneMessage({...base,origin:'https://evil.example'} as MessageEvent,source,'abc')).toBeFalsy();
  expect(validStoneMessage(base,{} as Window,'abc')).toBeFalsy();expect(validStoneMessage(base,source,'different')).toBeFalsy();
  expect(validStoneMessage({...base,data:{...base.data,type:'fetchCredentials'}} as MessageEvent,source,'abc')).toBeFalsy();
 });
});
