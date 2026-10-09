import 'fake-indexeddb/auto';
import {beforeEach,afterAll,describe,it,expect,vi} from 'vitest';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {executeLearningContent} from '@/services/learning-content.service';
import {stoneDb,newAttempt,extendAttempt,localAttempts,syncStone,STONE_CLASS_ID} from '@/services/stone.service';
const request=vi.mocked(executeLearningContent);
beforeEach(async()=>{await stoneDb.attempts.clear();request.mockReset();});
afterAll(async()=>{await stoneDb.delete();});
describe('offline account saves',()=>{
 it('survives a connection failure and syncs on retry without mixing accounts',async()=>{
  const alice=extendAttempt(newAttempt('alice',STONE_CLASS_ID,false),['listen','needs']);
  const bob=newAttempt('bob',STONE_CLASS_ID,false);await stoneDb.attempts.bulkPut([alice,bob]);
  request.mockRejectedValueOnce(new Error('Offline'));
  await expect(syncStone('alice',STONE_CLASS_ID)).rejects.toThrow('Offline');
  expect((await localAttempts('alice',STONE_CLASS_ID))[0].choices).toEqual(['listen','needs']);
  expect((await localAttempts('alice',STONE_CLASS_ID))[0].pending).toBe(true);
  request.mockResolvedValueOnce({saved:true}).mockResolvedValueOnce({preview:false,attempts:[],leaderboard:[]});
  await syncStone('alice',STONE_CLASS_ID);expect((await stoneDb.attempts.get(alice.attemptId))?.pending).toBe(false);
  expect((await stoneDb.attempts.get(bob.attemptId))?.pending).toBe(true);
  expect(request.mock.calls.every(([p])=>!('attempt' in p)||(p.attempt as {userId:string}).userId==='alice')).toBe(true);
 });
 it('retains newer local decisions made while a save is in flight',async()=>{
  const a=extendAttempt(newAttempt('alice',STONE_CLASS_ID,false),['listen']);await stoneDb.attempts.put(a);
  request.mockImplementationOnce(async()=>{await stoneDb.attempts.put(extendAttempt(a,['listen','needs']));return {saved:true};});
  request.mockResolvedValueOnce({preview:false,attempts:[],leaderboard:[]});await syncStone('alice',STONE_CLASS_ID);
  expect((await stoneDb.attempts.get(a.attemptId))?.pending).toBe(true);expect((await stoneDb.attempts.get(a.attemptId))?.choices).toEqual(['listen','needs']);
 });
 it('forks a conflicting device history and restores the original remote branch',async()=>{
  const a=extendAttempt(newAttempt('alice',STONE_CLASS_ID,false),['listen','needs']);await stoneDb.attempts.put(a);
  request.mockRejectedValueOnce(new Error('This attempt changed on another device. Keep both attempts.'));
  request.mockResolvedValueOnce({preview:false,attempts:[{...a,choices:['ledger','equal'],pending:false}],leaderboard:[]});
  await syncStone('alice',STONE_CLASS_ID);const rows=await localAttempts('alice',STONE_CLASS_ID);
  expect(rows).toHaveLength(2);expect(rows.find(r=>r.attemptId===a.attemptId)?.choices).toEqual(['ledger','equal']);
  expect(rows.find(r=>r.attemptId!==a.attemptId)?.choices).toEqual(['listen','needs']);expect(rows.find(r=>r.attemptId!==a.attemptId)?.pending).toBe(true);
 });
 it('keeps completed first attempts when starting a replay and never uploads previews',async()=>{
  const choices=['listen','needs','paid','bargain','investigate','balance','preserve','delegate','publish','council'];
  const first=extendAttempt(newAttempt('alice',STONE_CLASS_ID,false),choices),replay=newAttempt('alice',STONE_CLASS_ID,false);
  await stoneDb.attempts.bulkPut([first,replay]);expect(await localAttempts('alice',STONE_CLASS_ID)).toHaveLength(2);
  const preview=extendAttempt(newAttempt('teacher',STONE_CLASS_ID,true),choices);await stoneDb.attempts.put(preview);
  request.mockResolvedValueOnce({preview:true,attempts:[],leaderboard:[]});await syncStone('teacher',STONE_CLASS_ID);
  expect(request).toHaveBeenCalledTimes(1);expect(request.mock.calls[0][0].action).toBe('readStone');
 });
});
