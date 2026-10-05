import { togglePlannerLesson } from '@/services/planner-days';
import { useState } from 'react';
import type { WeeklyPlanData } from '@/services/planner.service';
import { type UnitPlan } from '@/services/unit-planning';
import { plannerLabel } from '@/services/planner-layout';

export function PlannerPreparation({ data, onChange }: { data: WeeklyPlanData; units: UnitPlan[]; onChange: (data: WeeklyPlanData) => void }) {
  const [newTask, setNewTask] = useState('');
  const mutate = (change: (draft: WeeklyPlanData) => void) => { const next = structuredClone(data); change(next); onChange(next); };
  const check = (id: string, ready: boolean) => mutate(draft => { draft.preparation.find(task => task.id === id)!.status = ready ? 'ready' : 'todo'; });
  return <>
    <section className="space-y-3 rounded-2xl border bg-white p-4" aria-label="Weekly to-do">
      <h2 className="font-semibold">1 · Prepare</h2>
      {data.preparation.map(task => <label key={task.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={task.status === 'ready'} onChange={e => check(task.id, e.target.checked)}/><span className={task.status === 'ready' || task.status === 'unused' ? 'text-slate-400 line-through' : ''}>{task.label}</span>{task.url && <a className="text-blue-700 underline" href={task.url} target="_blank" rel="noreferrer">Open</a>}</label>)}
      <details><summary className="cursor-pointer text-xs text-slate-500">Extra preparation task</summary><form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); if (!newTask.trim()) return; mutate(draft => draft.preparation.push({ id: crypto.randomUUID(), label: newTask.trim(), kind: 'other', status: 'todo' })); setNewTask(''); }}><input aria-label="Extra preparation task" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" value={newTask} onChange={e => setNewTask(e.target.value)}/><button className="rounded border px-3 text-sm" disabled={!newTask.trim()}>Add</button></form></details>
    </section>
    <section className="space-y-3" aria-label="Class days"><h2 className="font-semibold">2 · Class days</h2><p className="text-sm text-slate-500">Uncheck cancelled periods. Their plans are kept and can be restored. Previously shared class content is unchanged.</p><div className="grid gap-3 sm:grid-cols-2">{data.courses.map(course=><fieldset key={course.classCode} className="rounded-xl border p-3"><legend className="px-1 text-sm font-semibold">{plannerLabel[course.classCode]||course.classCode}</legend>{[...data.lessons,...(data.cancelledLessons||[])].filter(lesson=>lesson.classCode===course.classCode).sort((a,b)=>a.date.localeCompare(b.date)).map(lesson=><label key={lesson.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={data.lessons.some(active=>active.id===lesson.id)} onChange={()=>onChange(togglePlannerLesson(data,lesson.id))}/>{lesson.date}{data.cancelledLessons?.some(saved=>saved.id===lesson.id)&&<span className="text-slate-400">Cancelled · plan retained</span>}</label>)}</fieldset>)}</div><details><summary className="cursor-pointer text-xs text-slate-500">Week exceptions and notes{data.flags.length || data.weekNote ? ' · saved notes' : ''}</summary>{data.flags.length > 0 && <p className="mt-2 text-sm">{data.flags.join(' · ')}</p>}<textarea aria-label="Week exceptions and notes" className="mt-2 w-full rounded-lg border p-2 text-sm" rows={2} value={data.weekNote} onChange={e => mutate(draft => { draft.weekNote = e.target.value; })}/></details></section>
  </>;
}
