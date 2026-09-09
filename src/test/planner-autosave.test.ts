import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlannerAutosave } from '@/services/planner-autosave';
import { createWeeklyPlan, type WeeklyPlanRecord } from '@/services/planner.service';

const data = () => createWeeklyPlan({ key:'Week',startDate:'2026-09-07',header:'',calendar:'',blocks:[] }, {});
const record = { $id:'saved' } as WeeklyPlanRecord;
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });
describe('private planner autosaving', () => {
  it('writes recovery immediately and batches typing into one server save', async () => {
    vi.useFakeTimers(); const send = vi.fn().mockResolvedValue(record);
    const writer = new PlannerAutosave('test', {data:data(),ready:false},record,localStorage,send);
    const stop = writer.subscribe(() => {});
    for (const weekNote of ['a','ab','abc']) { writer.update({data:{...data(),weekNote},ready:false}); await vi.advanceTimersByTimeAsync(1000); }
    expect(JSON.parse(localStorage.getItem('test')!).data.weekNote).toBe('abc');
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(4000);
    expect(send).toHaveBeenCalledTimes(1); expect(writer.state).toBe('saved');
    expect(localStorage.getItem('test')).toBeNull(); stop();
  });
  it('serializes saves and retains newer changes during an in-flight save', async () => {
    let resolve!: (value: WeeklyPlanRecord) => void;
    const send = vi.fn().mockImplementationOnce(() => new Promise<WeeklyPlanRecord>(done => {resolve=done;})).mockResolvedValue(record);
    const writer = new PlannerAutosave('test', {data:data(),ready:false},record,localStorage,send);
    writer.update({data:{...data(),weekNote:'old'},ready:false});
    const first = writer.flush();
    writer.update({data:{...data(),weekNote:'new'},ready:true});
    resolve(record); await first;
    expect(writer.pending).toBe(true); expect(localStorage.getItem('test')).toContain('new');
    await writer.flush(); expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.lastCall?.[0].data.weekNote).toBe('new'); expect(writer.state).toBe('saved');
  });
  it('recovers offline edits and retries without discarding data', async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(record);
    const writer = new PlannerAutosave('test', {data:data(),ready:false},record,localStorage,send);
    writer.update({data:{...data(),weekNote:'keep me'},ready:false});
    await expect(writer.flush()).rejects.toThrow('Offline'); expect(writer.state).toBe('error');
    const recovered = new PlannerAutosave('test', {data:data(),ready:false},record,localStorage,send);
    expect(recovered.draft.data.weekNote).toBe('keep me');
    await recovered.flush(); expect(recovered.pending).toBe(false);
  });
  it('reports local storage failures rather than claiming edits are safely saved', async () => {
    const storage = {getItem:()=>null,setItem:()=>{throw new Error('Full');},removeItem:()=>{}};
    const writer = new PlannerAutosave('test', {data:data(),ready:false},record,storage,async()=>record);
    writer.update({data:data(),ready:false}); expect(writer.state).toBe('error');
    expect(writer.error).toContain('Keep this page open'); await writer.flush(); expect(writer.state).toBe('saved');
  });
});
