import { useEffect, useReducer, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlannerAutosave } from '@/services/planner-autosave';
import { migrateCardEditor, projectCardMaterials } from '@/services/planner-editor';
import { publishWeeklyPlan, saveWeeklyPlan, type WeeklyPlanData, type WeeklyPlanRecord } from '@/services/planner.service';
import type { UnitPlan } from '@/services/unit-planning';
import { PlannerPreparation } from './PlannerPreparation';
import { PlannerSharePreview } from './PlannerSharePreview';
import { WeeklySlots } from './WeeklySlots';

export function WeeklyPlannerEditor({ initial, record, sourceId, userId, units, onUnitsChange, onSaved }: { initial: WeeklyPlanData; record?: WeeklyPlanRecord; sourceId: string; userId: string; units: UnitPlan[]; onUnitsChange: (units: UnitPlan[]) => void; onSaved: (record: WeeklyPlanRecord) => void }) {
  const [, redraw] = useReducer(value => value + 1, 0);
  const [writer] = useState(() => new PlannerAutosave(`planner-draft:${userId}:${sourceId}:${initial.week.key}`, { data: migrateCardEditor(initial), ready: record?.status === 'ready' || record?.status === 'published' }, record, localStorage, async (draft, id) => { const saved = (await saveWeeklyPlan(sourceId, projectCardMaterials(draft.data), draft.ready ? 'ready' : 'draft', id)).plan; onSaved(saved); return saved; }));
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [share,setShare]=useState<WeeklyPlanData|null>(null);
  const [shareError,setShareError]=useState('');
  const navigate = useNavigate();
  useEffect(() => writer.subscribe(redraw), [writer]);
  useEffect(() => {
    const online = () => { if (writer.pending) void writer.flush().catch(() => {}); };
    const leaving = (event: BeforeUnloadEvent) => { if (writer.pending) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('online', online); window.addEventListener('beforeunload', leaving);
    return () => { window.removeEventListener('online', online); window.removeEventListener('beforeunload', leaving); };
  }, [writer]);
  const data = writer.draft.data;
  const change = (next: WeeklyPlanData) => writer.update({ ...writer.draft, data: next });
  const action = async (publish: boolean) => {
    setBusy(true); setMessage(''); setShareError('');
    try {
      await writer.flush();
      // An edit could arrive during a save; always flush the latest revision.
      if (writer.pending) await writer.flush();
      if (publish) { const result = await publishWeeklyPlan(writer.record!.$id, writer.record!.updatedAt); writer.acceptRecord(result.plan); onSaved(result.plan); setShare(null); setMessage(`Published ${result.published.agendas} agendas, ${result.published.texts} texts, and ${result.published.presentations} presentations.`); }
      else navigate(`/planner/${writer.record!.$id}/print`);
    } catch (cause) { const error=cause instanceof Error ? cause.message : 'Could not complete this action.'; if(publish)setShareError(error);else setMessage(error); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5">
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white/95 p-3 shadow-sm"><div><p role="status" className={`text-sm ${writer.state === 'error' ? 'text-amber-800' : 'text-slate-600'}`}>{writer.state === 'saved' ? 'Saved' : writer.state === 'saving' ? 'Saving…' : writer.state === 'local' ? 'Saved on this device · waiting to sync' : writer.error}</p><p className="text-xs text-slate-400">Private planning · saving never publishes to students</p></div><div className="flex items-center gap-3">{writer.state === 'error' && <button className="text-sm text-blue-700" onClick={() => void writer.flush().catch(() => {})}>Retry save</button>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy||Boolean(share)} checked={writer.draft.ready} onChange={e => writer.update({data,ready:e.target.checked})}/>Week ready</label><button className="rounded-lg border px-3 py-2 text-sm" disabled={busy} onClick={() => void action(false)}>Print / PDF</button></div></div>
    {message && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm">{message}</p>}
    <fieldset disabled={busy||Boolean(share)} className="min-w-0 space-y-5">
      <PlannerPreparation data={data} units={units} onChange={change}/>
      <section className="space-y-3"><div className="flex justify-between"><h2 className="text-xl font-semibold">3 · Class plans</h2><Link to="/planning" className="text-sm text-blue-700">Units &amp; resources →</Link></div><WeeklySlots preferenceKey={'planner-class:'+userId+':'+sourceId} data={data} units={units} onChange={change} onUnitsChange={onUnitsChange}/></section>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.publishAgenda} onChange={e => change({...data,publishAgenda:e.target.checked})}/>Include a weekly class agenda when publishing</label><button className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-40" disabled={!writer.draft.ready || busy} onClick={() => {setShareError('');setShare(structuredClone(data));}}>Share with students…</button><p className="w-full text-xs text-slate-500">Week ready is only a planning status. Review the preview and confirm before sharing. Changes to already-published content require publishing again.</p></section>
    </fieldset>
    {share&&<PlannerSharePreview data={share} busy={busy} error={shareError} onClose={()=>setShare(null)} onConfirm={()=>void action(true)}/>}
  </div>;
}
