import { useState } from 'react';
import type { WeeklyPlanData } from '@/services/planner.service';
import { courseCode, type UnitPlan } from '@/services/unit-planning';
import { plannerLabel, progressLabels, preparationCode } from '@/services/planner-layout';

export function PlannerPreparation({ data, units, onChange }: { data: WeeklyPlanData; units: UnitPlan[]; onChange: (data: WeeklyPlanData) => void }) {
  const [newTask, setNewTask] = useState('');
  const mutate = (change: (draft: WeeklyPlanData) => void) => { const next = structuredClone(data); change(next); onChange(next); };
  const check = (id: string, ready: boolean) => mutate(draft => { draft.preparation.find(task => task.id === id)!.status = ready ? 'ready' : 'todo'; });
  return <>
    <section className="space-y-3 rounded-2xl border bg-white p-4" aria-label="Weekly to-do">
      <h2 className="font-semibold">1 · To do</h2>
      {data.preparation.filter(task => !task.id.startsWith('prepare-presentation-')).map(task => <label key={task.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={task.status === 'ready'} onChange={e => check(task.id, e.target.checked)}/><span className={task.status === 'ready' || task.status === 'unused' ? 'text-slate-400 line-through' : ''}>{task.label}</span>{task.url && <a className="text-blue-700 underline" href={task.url} target="_blank" rel="noreferrer">Open</a>}</label>)}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.week.blocks.filter((block, index, blocks) => blocks.findIndex(item => preparationCode(item.code) === preparationCode(block.code)) === index).map(block => {
        const code = preparationCode(block.code);
        const matches = (classCode: string) => preparationCode(classCode) === code;
        const task = data.preparation.find(item => item.id === `prepare-presentation-${code}`);
        if (!task) return null;
        const courseUnits = units.filter(unit => unit.course === courseCode(block.code));
        const cards = courseUnits.flatMap(unit => unit.cards).filter(card => card.week === data.week.startDate);
        const topics = [...new Set([
          ...(data.weeklyResources || []).filter(item => item.course === courseCode(block.code) && item.kind === 'presentation').map(item => item.title),
          ...courseUnits.flatMap(unit => unit.resources).filter(item => item.kind === 'presentation' && (item.week === data.week.startDate || data.lessons.some(lesson => matches(lesson.classCode) && lesson.date === item.date))).map(item => item.title),
          ...data.lessons.filter(lesson => matches(lesson.classCode)).flatMap(lesson => lesson.slots || []).filter(slot => slot.kind === 'presentation').map(slot => slot.title),
        ])];
        const fallback = [...new Set(data.courses.filter(course => matches(course.classCode)).flatMap(course => course.presentations.map(item => item.title)))];
        return <details key={block.code} className={`rounded-xl border p-3 ${task.status === 'ready' ? 'border-emerald-200 bg-emerald-50' : 'border-purple-200 bg-purple-50/40'}`}><summary className="cursor-pointer text-sm"><strong className="block">{code === 'WL' ? 'World Lit · Blue + Red' : plannerLabel[block.code] || block.label}</strong><span>Prepare Presentation {task.status === 'ready' ? '✓' : ''}</span></summary><div className="mt-3 space-y-3 text-sm"><p className="font-medium">{(topics.length ? topics : fallback).join(' · ') || block.unit || 'Choose a presentation topic'}</p><p className="text-slate-600">{block.goal}</p><div className="flex flex-wrap gap-1">{cards.map(card => <span key={card.id} title={card.back} className="rounded bg-white px-2 py-1 text-xs">{card.front}</span>)}</div>{!cards.length && <p className="text-xs text-slate-500">No vocabulary scheduled for this week.</p>}<label className="flex items-start gap-2"><input type="checkbox" checked={task.status === 'ready'} onChange={e => check(task.id, e.target.checked)}/>Presentation done and link posted</label></div></details>;
      })}</div>
      <details><summary className="cursor-pointer text-xs text-slate-500">Extra preparation task</summary><form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); if (!newTask.trim()) return; mutate(draft => draft.preparation.push({ id: crypto.randomUUID(), label: newTask.trim(), kind: 'other', status: 'todo' })); setNewTask(''); }}><input aria-label="Extra preparation task" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" value={newTask} onChange={e => setNewTask(e.target.value)}/><button className="rounded border px-3 text-sm" disabled={!newTask.trim()}>Add</button></form></details>
    </section>
    <section className="space-y-3" aria-label="Reality check"><h2 className="font-semibold">2 · Reality check</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{data.courses.map(course => <button key={course.classCode} className={`rounded-xl border p-3 text-left ${course.progress === 'on_track' ? 'bg-white' : 'border-amber-200 bg-amber-50'}`} aria-label={`${plannerLabel[course.classCode] || course.classCode}: ${progressLabels[course.progress]}. Click to change progress`} onClick={() => mutate(draft => { const target = draft.courses.find(item => item.classCode === course.classCode)!; target.progress = target.progress === 'on_track' ? 'partial' : target.progress === 'partial' ? 'behind' : 'on_track'; })}><strong className="block text-sm">{plannerLabel[course.classCode] || course.classCode}</strong><span className="text-xs text-slate-600">{progressLabels[course.progress]}</span></button>)}</div><details><summary className="cursor-pointer text-xs text-slate-500">Week exceptions and notes{data.flags.length || data.weekNote ? ' · saved notes' : ''}</summary>{data.flags.length > 0 && <p className="mt-2 text-sm">{data.flags.join(' · ')}</p>}<textarea aria-label="Week exceptions and notes" className="mt-2 w-full rounded-lg border p-2 text-sm" rows={2} value={data.weekNote} onChange={e => mutate(draft => { draft.weekNote = e.target.value; })}/></details></section>
  </>;
}
