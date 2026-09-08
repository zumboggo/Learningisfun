import { useState, type DragEvent } from 'react';
import { Modal } from '@/components/common/Modal';
import type { WeeklyPlanData } from '@/services/planner.service';
import { blankResource, saveUnit, courseCode, resourceSlot, type LessonSlot, type UnitPlan } from '@/services/unit-planning';
import { placePlannerCard, type CardSelection } from '@/services/planner-cards';
import { plannerLabel } from '@/services/planner-layout';

const color = (kind: LessonSlot['kind']) => kind === 'presentation' ? 'border-purple-300 bg-purple-50 text-purple-950' : kind === 'text' ? 'border-blue-300 bg-blue-50 text-blue-950' : kind === 'activity' ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : kind === 'quiz' ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-slate-300 bg-slate-50 text-slate-900';
const icon = 'rounded p-1.5 text-slate-600 hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-600';
const input = 'mt-1 w-full rounded-lg border p-2 text-sm';
const dragType = 'application/planning-slot';

export function WeeklySlots({ data, units, onChange, onUnitsChange }: { data: WeeklyPlanData; units: UnitPlan[]; onChange: (data: WeeklyPlanData) => void; onUnitsChange?: (units: UnitPlan[]) => void }) {
  const [code, setCode] = useState(data.lessons[0]?.classCode || '');
  const [selected, setSelected] = useState<CardSelection | null>(null);
  const [editing, setEditing] = useState<{ lessonId: string; slotId: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [message, setMessage] = useState('');
  const relevant = units.filter(unit => unit.course === courseCode(code));
  const cards = relevant.flatMap(unit => unit.cards).filter(card => card.week === data.week.startDate);
  const resources = relevant.flatMap(unit => unit.resources).filter(item => showAll || item.week === data.week.startDate);
  const lessons = data.lessons.filter(lesson => lesson.classCode === code);
  const mutate = (fn: (draft: WeeklyPlanData) => void) => { const next = structuredClone(data); fn(next); onChange(next); };
  const place = (lessonId: string, index: number, selection = selected) => { if (!selection) return; onChange(placePlannerCard(data, selection, lessonId, index)); setSelected(null); };
  const drop = (event: DragEvent, lessonId: string, index: number) => {
    event.preventDefault(); event.stopPropagation();
    try { const payload = JSON.parse(event.dataTransfer.getData(dragType)); if (payload.slot?.id && payload.slot?.kind) place(lessonId, index, payload); } catch { /* Ignore external drags. */ }
  };
  const addActivity = async () => {
    const title = window.prompt('Activity title'); if (!title?.trim()) return;
    const unit = relevant.find(item => item.startDate <= data.week.startDate && item.endDate >= data.week.startDate) || relevant[0];
    const resource = { ...blankResource(), title: title.trim(), week: data.week.startDate };
    if (!unit) { setSelected({ slot: resourceSlot(resource) }); setMessage('Choose a class period to add this activity.'); return; }
    const next = { ...unit, resources: [...unit.resources, resource] };
    try { await saveUnit(next); onUnitsChange?.(units.map(item => item.id === unit.id ? next : item)); setSelected({ slot: resourceSlot(resource) }); setMessage('Saved to the bank. Choose a class period.'); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Could not save activity'); }
  };
  const editedSlot = data.lessons.find(lesson => lesson.id === editing?.lessonId)?.slots?.find(slot => slot.id === editing?.slotId);
  const edit = (update: Partial<LessonSlot>) => mutate(draft => { const slot = draft.lessons.find(lesson => lesson.id === editing?.lessonId)?.slots?.find(item => item.id === editing?.slotId); if (slot) Object.assign(slot, update); });
  return <section className="space-y-3">
    {message && <p role="status" className="text-sm text-blue-800">{message}</p>}
    <div className="flex flex-wrap gap-2">{data.week.blocks.map(block => <button key={block.code} aria-pressed={code === block.code} className={'rounded-lg border px-3 py-2 text-sm ' + (code === block.code ? 'bg-blue-50 text-blue-800' : 'bg-white')} onDragOver={e => { e.preventDefault(); setCode(block.code); }} onClick={() => setCode(block.code)}>{plannerLabel[block.code] || block.label}</button>)}</div>
    <div className="rounded-xl border bg-white p-3"><h2 className="text-sm font-semibold">This week’s knowledge and skills</h2><p className="mt-1 whitespace-pre-wrap text-sm">{data.week.blocks.find(block => block.code === code)?.goal}</p>{relevant.filter(unit => unit.startDate <= data.week.startDate && unit.endDate >= data.week.startDate).map(unit => <p key={unit.id} className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{unit.knowledge} {unit.skills}</p>)}<div className="mt-2 flex flex-wrap gap-1">{cards.map(card => <details key={card.id} className="rounded-lg bg-blue-50 px-2 py-1 text-sm"><summary className="cursor-pointer">{card.front}</summary><p className="mt-1 max-w-sm">{card.back}</p></details>)}</div></div>
    <p className="text-xs text-slate-500">Drag cards between periods or over a class tab. On touch or keyboard, select a card, then choose where to place it. Purple: presentations · Blue: texts · Green: activities.</p>
    {selected && <div role="status" className="sticky top-2 z-10 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm"><span>{selected.from ? 'Move' : 'Add'}: {selected.slot.title} — choose a position below.</span><button className={icon} onClick={() => setSelected(null)}>Cancel</button></div>}
    <div className="grid items-start gap-3 lg:grid-cols-[14rem_1fr]">
      <aside className="space-y-2 rounded-xl border bg-slate-50 p-3"><h3 className="text-sm font-semibold">Resource tray</h3><label className="block text-xs"><input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)}/> Browse the course bank</label><div className="max-h-[60vh] space-y-2 overflow-auto">{resources.map(resource => <button key={resource.id} draggable onDragStart={e => e.dataTransfer.setData(dragType, JSON.stringify({ slot: resourceSlot(resource) }))} onClick={() => setSelected({ slot: resourceSlot(resource) })} className={'block w-full cursor-grab rounded-lg border px-2 py-1.5 text-left text-xs ' + color(resource.kind)}><span className="mr-1 font-medium">{resource.kind} ·</span>{resource.title}</button>)}</div><button className="text-sm text-blue-700" onClick={() => void addActivity()}>+ Activity</button></aside>
      <div className="space-y-3">{lessons.map(lesson => <article key={lesson.id} aria-label={lesson.date + ' ' + lesson.classLabel} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, lesson.id, lesson.slots?.length || 0)} className="rounded-2xl border bg-white p-3">
        <h3 className="text-sm font-semibold">{lesson.date} · {lesson.classLabel}</h3>
        <div className="mt-2 space-y-1.5">{(lesson.slots || []).map((slot, index) => <div key={slot.id} draggable onDragStart={e => { e.dataTransfer.setData(dragType, JSON.stringify({ slot, from: lesson.id, index })); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, lesson.id, index)} className={'flex cursor-grab items-center gap-1 rounded-lg border px-2 py-1 ' + color(slot.kind)}>
          <button className="min-w-0 flex-1 text-left text-sm" aria-label={selected ? 'Place before ' + slot.title : 'Select ' + slot.title + ' to move'} onClick={() => selected ? place(lesson.id, index) : setSelected({ slot, from: lesson.id, index })}><span className="mr-2 text-[10px] uppercase opacity-60">{slot.kind}</span><span className="font-medium">{slot.title}</span>{slot.content && <span className="ml-2 text-xs opacity-70">{slot.content.length > 95 ? slot.content.slice(0, 95) + '…' : slot.content}</span>}</button>
          <button className={icon} aria-label={'Edit ' + slot.title} title="Edit" onClick={() => setEditing({ lessonId: lesson.id, slotId: slot.id })}>✎</button>
          <button className={icon} aria-label={'Copy ' + slot.title} title="Copy to another period or section" onClick={() => setSelected({ slot: { ...slot } })}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button>
          <button className={icon} aria-label={'Remove ' + slot.title + ' from this lesson'} title="Remove from this lesson" onClick={() => { mutate(draft => { draft.lessons.find(item => item.id === lesson.id)!.slots!.splice(index, 1); }); setSelected(null); }}>×</button>
        </div>)}</div>
        <button className="mt-2 w-full rounded-lg border border-dashed px-2 py-2 text-left text-xs text-slate-500" disabled={!selected} onClick={() => place(lesson.id, lesson.slots?.length || 0)}>{selected ? '+ Place ' + selected.slot.title + ' here' : 'Drop an item here'}</button>
        {Boolean(lesson.overflow?.length) && <details className="mt-2"><summary className="cursor-pointer text-xs text-slate-500">Previously unplaced items ({lesson.overflow!.length})</summary>{lesson.overflow!.map((slot, index) => <div key={slot.id} className="mt-1 flex justify-between text-sm"><span>{slot.title}</span><button onClick={() => mutate(draft => { const row = draft.lessons.find(item => item.id === lesson.id)!; row.slots ||= []; row.slots.push(...row.overflow!.splice(index, 1)); })}>Place</button></div>)}</details>}
        <details className="mt-2"><summary className="cursor-pointer text-xs text-slate-400">Lesson notes and reminders</summary>{(['goal', 'settle', 'exit', 'privateNotes'] as const).map(field => <label key={field} className="mt-2 block text-xs">{field === 'privateNotes' ? 'Private notes' : field}<textarea className={input} value={lesson[field]} onChange={e => mutate(draft => { draft.lessons.find(item => item.id === lesson.id)![field] = e.target.value; })}/></label>)}<label className="mt-2 block text-xs">Reminders (one per line)<textarea className={input} value={lesson.reminders.join('\n')} onChange={e => mutate(draft => { draft.lessons.find(item => item.id === lesson.id)!.reminders = e.target.value.split('\n'); })}/></label></details>
      </article>)}</div>
    </div>
    <Modal open={Boolean(editedSlot)} onClose={() => setEditing(null)} title="Edit lesson item">{editedSlot && <div className="space-y-3"><label className="block text-sm">Title<input className={input} value={editedSlot.title} onChange={e => edit({ title: e.target.value })}/></label><label className="block text-sm">Type<select className={input} value={editedSlot.kind} onChange={e => edit({ kind: e.target.value as LessonSlot['kind'] })}>{['presentation', 'text', 'activity', 'copywork', 'quiz', 'assignment'].map(kind => <option key={kind}>{kind}</option>)}</select></label><label className="block text-sm">Details<textarea rows={5} className={input} value={editedSlot.content} onChange={e => edit({ content: e.target.value })}/></label><label className="block text-sm">Link<input className={input} value={editedSlot.url} onChange={e => edit({ url: e.target.value })}/></label><label className="block text-sm">Minutes<input type="number" min={0} className={input} value={editedSlot.minutes} onChange={e => edit({ minutes: Math.max(0, Number(e.target.value)) })}/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editedSlot.optional} onChange={e => edit({ optional: e.target.checked })}/>If time</label><label className="block text-sm">Completion<select className={input} value={editedSlot.status} onChange={e => edit({ status: e.target.value as LessonSlot['status'] })}>{['planned', 'completed', 'partial', 'skipped'].map(status => <option key={status}>{status}</option>)}</select></label><button className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" onClick={() => setEditing(null)}>Done</button><p className="text-xs text-slate-500">Changes stay in this week’s draft. Save the week to keep them.</p></div>}</Modal>
  </section>;
}
