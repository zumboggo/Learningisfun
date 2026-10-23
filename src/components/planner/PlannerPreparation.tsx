import { PlannerVocabUploads } from './PlannerVocabUploads';
import { togglePlannerLesson } from '@/services/planner-days';
import { useState, type ReactNode } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import type { WeeklyPlanData } from '@/services/planner.service';
import { type UnitPlan } from '@/services/unit-planning';
import { plannerLabel } from '@/services/planner-layout';

function PreparationRow({ id, label, index, count, onMove, children }: { id: string; label: string; index: number; count: number; onMove: (offset: number) => void; children: ReactNode }) {
  const controls = useDragControls();
  return <Reorder.Item value={id} dragListener={false} dragControls={controls} className="relative flex flex-wrap items-start gap-3 rounded-lg bg-white" whileDrag={{ boxShadow: '0 4px 12px #0002' }}>
    <div className="flex items-center">
      <button type="button" aria-label={`Reorder ${label}`} title="Drag up or down, or use the arrow keys" className="min-h-9 min-w-9 touch-none cursor-grab text-slate-400 active:cursor-grabbing" onPointerDown={event => { if (!event.currentTarget.disabled && !event.currentTarget.matches(':disabled')) controls.start(event); }} onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); onMove(event.key === 'ArrowUp' ? -1 : 1); } }}>⠿</button>
      <button type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)} className="min-h-9 min-w-8 text-slate-500 disabled:opacity-25">↑</button>
      <button type="button" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(1)} className="min-h-9 min-w-8 text-slate-500 disabled:opacity-25">↓</button>
    </div>
    {children}
  </Reorder.Item>;
}

export function PlannerPreparation({ data, onChange }: { data: WeeklyPlanData; units: UnitPlan[]; onChange: (data: WeeklyPlanData) => void }) {
  const [newTask, setNewTask] = useState('');
  const priorities = data.preparation.filter(task => task.status === 'todo').slice(0, 2).map(task => task.id);
  const reorder = (ids: string[]) => mutate(draft => { const tasks = new Map(draft.preparation.map(task => [task.id, task])); draft.preparation = ids.map(id => tasks.get(id)!); });
  const move = (index: number, offset: number) => { const target = index + offset; if (target < 0 || target >= data.preparation.length) return; const ids = data.preparation.map(task => task.id); [ids[index], ids[target]] = [ids[target], ids[index]]; reorder(ids); };
  const mutate = (change: (draft: WeeklyPlanData) => void) => { const next = structuredClone(data); change(next); onChange(next); };
  const check = (id: string, ready: boolean) => mutate(draft => { draft.preparation.find(task => task.id === id)!.status = ready ? 'ready' : 'todo'; });
  return <>
    <section className="space-y-3 rounded-2xl border bg-white p-4" aria-label="Weekly to-do">
      <h2 className="font-semibold">1 · Prepare</h2>
      <p className="text-xs text-slate-500">Drag the handles or use the arrows to set your order. Your first two unfinished tasks are italicized for today’s focus.</p>
      <Reorder.Group axis="y" values={data.preparation.map(task => task.id)} onReorder={reorder} className="space-y-3" aria-label="Preparation tasks">
        {data.preparation.map((task, index) => <PreparationRow key={task.id} id={task.id} label={task.label} index={index} count={data.preparation.length} onMove={offset => move(index, offset)}>
          <label className="flex min-h-9 items-center gap-3 text-sm"><input type="checkbox" checked={task.status === 'ready'} onChange={e => check(task.id, e.target.checked)}/><span className={task.status === 'ready' || task.status === 'unused' ? 'text-slate-400 line-through' : priorities.includes(task.id) ? 'italic' : ''}>{task.label}</span>{task.url && <a className="text-blue-700 underline" href={task.url} target="_blank" rel="noreferrer">Open</a>}</label>
          {task.id === 'prepare-vocab-presentations' && <div className="min-w-0 flex-1 basis-80"><PlannerVocabUploads data={data} onChange={onChange}/></div>}
        </PreparationRow>)}
      </Reorder.Group>
      <details><summary className="cursor-pointer text-xs text-slate-500">Extra preparation task</summary><form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); if (!newTask.trim()) return; mutate(draft => draft.preparation.push({ id: crypto.randomUUID(), label: newTask.trim(), kind: 'other', status: 'todo' })); setNewTask(''); }}><input aria-label="Extra preparation task" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" value={newTask} onChange={e => setNewTask(e.target.value)}/><button className="rounded border px-3 text-sm" disabled={!newTask.trim()}>Add</button></form></details>
    </section>
    <section className="space-y-3" aria-label="Class days"><h2 className="font-semibold">2 · Class days</h2><p className="text-sm text-slate-500">Uncheck cancelled periods. Their plans are kept and can be restored. Previously shared class content is unchanged.</p><div className="grid gap-3 sm:grid-cols-2">{data.courses.map(course=><fieldset key={course.classCode} className="rounded-xl border p-3"><legend className="px-1 text-sm font-semibold">{plannerLabel[course.classCode]||course.classCode}</legend>{[...data.lessons,...(data.cancelledLessons||[])].filter(lesson=>lesson.classCode===course.classCode).sort((a,b)=>a.date.localeCompare(b.date)).map(lesson=><label key={lesson.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={data.lessons.some(active=>active.id===lesson.id)} onChange={()=>onChange(togglePlannerLesson(data,lesson.id))}/>{lesson.date}{data.cancelledLessons?.some(saved=>saved.id===lesson.id)&&<span className="text-slate-400">Cancelled · plan retained</span>}</label>)}</fieldset>)}</div><details><summary className="cursor-pointer text-xs text-slate-500">Week exceptions and notes{data.flags.length || data.weekNote ? ' · saved notes' : ''}</summary>{data.flags.length > 0 && <p className="mt-2 text-sm">{data.flags.join(' · ')}</p>}<textarea aria-label="Week exceptions and notes" className="mt-2 w-full rounded-lg border p-2 text-sm" rows={2} value={data.weekNote} onChange={e => mutate(draft => { draft.weekNote = e.target.value; })}/></details></section>
  </>;
}
