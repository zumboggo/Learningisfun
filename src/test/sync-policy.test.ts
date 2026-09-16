import { beforeEach, expect, it, vi } from 'vitest';
const metadata=vi.hoisted(()=>new Map<string,{key:string;value:string}>());
vi.mock('@/db/schema',()=>({db:{app_metadata:{
  get:vi.fn(async(key:string)=>metadata.get(key)),
  put:vi.fn(async(row:{key:string;value:string})=>{metadata.set(row.key,row)}),
  delete:vi.fn(async(key:string)=>{metadata.delete(key)}),
}}}));
import { runCachedSync } from '@/services/sync-policy';
beforeEach(()=>metadata.clear());
it('coalesces simultaneous refreshes even while reading cache timestamps',async()=>{
  const task=vi.fn(async()=>true);
  await Promise.all([runCachedSync('same',10000,task),runCachedSync('same',10000,task),runCachedSync('same',10000,task,true)]);
  expect(task).toHaveBeenCalledTimes(1);
});
it('manual refresh bypasses cache, but normal refresh reuses it',async()=>{
  const task=vi.fn(async()=>true);
  await runCachedSync('cached',10000,task);
  await runCachedSync('cached',10000,task);
  expect(task).toHaveBeenCalledTimes(1);
  await runCachedSync('cached',10000,task,true);
  expect(task).toHaveBeenCalledTimes(2);
});
it('failed requests remain retryable and are not marked successful',async()=>{
  const task=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(true);
  await expect(runCachedSync('retry',10000,task)).rejects.toThrow('offline');
  expect(metadata.has('sync:retry')).toBe(false);
  await runCachedSync('retry',10000,task,true);
  expect(metadata.has('sync:retry')).toBe(true);
});
it('different accounts and classes never share cached results',async()=>{
  const task=vi.fn(async()=>true);
  await Promise.all(['teacher:A','teacher:B','student:A'].map(key=>runCachedSync(key,10000,task)));
  expect(task).toHaveBeenCalledTimes(3);
});
