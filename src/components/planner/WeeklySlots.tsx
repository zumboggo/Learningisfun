import { prepareWeeklyBank, editWeeklyResource, shortWords } from '@/services/planner-bank';
import { useState, type DragEvent } from 'react';
import { compareLessons } from '@/services/planner-compare';
import { CopyLessonDialog } from './CopyLessonDialog';
import { Modal } from '@/components/common/Modal';
import type { WeeklyPlanData } from '@/services/planner.service';
import { blankResource, courseCode, resourceSlot, type LessonSlot, type UnitPlan, type ResourceKind } from '@/services/unit-planning';
import { placePlannerCard, undoPlannerPlacement, type CardSelection } from '@/services/planner-cards';
import { PlannerResourceTray } from './PlannerResourceTray';
import { recallPlannerChoice, rememberPlannerChoice } from '@/services/planner-navigation';
import { plannerLabel } from '@/services/planner-layout';

const color = (kind: LessonSlot['kind']) => kind === 'presentation' ? 'border-purple-300 bg-purple-50 text-purple-950' : kind === 'text' ? 'border-blue-300 bg-blue-50 text-blue-950' : kind === 'activity' ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : kind === 'quiz' ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-slate-300 bg-slate-50 text-slate-900';
const icon = 'min-h-8 min-w-8 rounded p-1.5 text-slate-600 hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-600';
const input = 'mt-1 w-full rounded-lg border p-2 text-sm';
const dragType = 'application/planning-slot';

export function WeeklySlots({ data: suppliedData, units, onChange, preferenceKey }: { data: WeeklyPlanData; units: UnitPlan[]; onChange: (data: WeeklyPlanData) => void; onUnitsChange?: (units: UnitPlan[]) => void; preferenceKey?: string }) {
  const data = prepareWeeklyBank(suppliedData);
  const [code, setClassCode] = useState(() => preferenceKey ? recallPlannerChoice(preferenceKey, data.week.blocks.map(block=>block.code), data.lessons[0]?.classCode || '') : data.lessons[0]?.classCode || '');
  const [compare,setCompare]=useState(false);
  const [copySource,setCopySource]=useState('');
  const setCode = (value:string) => { setCompare(false); setClassCode(value); if(preferenceKey)rememberPlannerChoice(preferenceKey,value); };
  const [history,setHistory] = useState<Array<{before:WeeklyPlanData; label:string}>>([]);
  const [dragTarget,setDragTarget] = useState('');
  const commitPlacement = (next:WeeklyPlanData,label:string) => { if(next===data)return; setHistory(old=>[...old.slice(-9),{before:structuredClone(data),label}]); onChange(next); };
  const placementMutation = (fn:(draft:WeeklyPlanData)=>void,label:string) => { const next=structuredClone(data);fn(next);commitPlacement(next,label); };
  const [selected, setSelected] = useState<CardSelection | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [preview, setPreview] = useState<LessonSlot | null>(null);
  const [message, setMessage] = useState('');
  const relevant = units.filter(unit => unit.course === courseCode(code));
  const cards = relevant.flatMap(unit => unit.cards).filter(card => card.week === data.week.startDate);
  const resources = relevant.flatMap(unit => unit.resources);
  const lessons = data.lessons.filter(lesson => compare ? lesson.classCode.startsWith('WL-') : lesson.classCode === code);
  const displayedLessons=compare?compareLessons(data):lessons;
  const mutate = (fn: (draft: WeeklyPlanData) => void) => { const next = structuredClone(data); fn(next); onChange(next); };
  const register = (draft:WeeklyPlanData, slot:LessonSlot, targetCode:string) => {
    const course=courseCode(targetCode);
    let item=draft.weeklyResources!.find(item=>item.course===course && (slot.planningItemId ? item.id===slot.planningItemId : slot.resourceId ? item.resourceId===slot.resourceId : item.id===slot.id));
    if(!item){ item={...slot,id:crypto.randomUUID(),course}; draft.weeklyResources!.push(item); }
    return {...item,planningItemId:item.id};
  };
  const selectResource=(slot:LessonSlot)=>{
    const next=structuredClone(data), linked=register(next,slot,code);
    onChange(next);setSelected({slot:linked});
  };
  const place = (lessonId: string, index: number, selection = selected) => {
    if (!selection) return;
    const next=structuredClone(data), destination=next.lessons.find(l=>l.id===lessonId);
    if(!destination)return;
    const source=selection.from ? next.lessons.find(l=>l.id===selection.from) : undefined;
    const linked=next.weeklyResources!.find(item=>item.id===selection.slot.planningItemId);
    if((source && courseCode(source.classCode)!==courseCode(destination.classCode)) || (linked && linked.course!==courseCode(destination.classCode))) {
      setMessage('Use this item within its course. World Lit Blue and Red share a course.');return;
    }
    const prepared=selection.from?selection:{slot:register(next,selection.slot,destination.classCode)};
    commitPlacement(placePlannerCard(next,prepared,lessonId,index), selection.from ? 'Moved card' : 'Added card');
    setSelected(null);setDragTarget('');
  };
  const drop = (event: DragEvent, lessonId: string, index: number) => {
    event.preventDefault(); event.stopPropagation(); setDragTarget('');
    try { const payload = JSON.parse(event.dataTransfer.getData(dragType)); if (payload.slot?.id && payload.slot?.kind) place(lessonId, index, payload); } catch { /* Ignore external drags. */ }
  };
  const addResource = (kind:ResourceKind) => {
    const slot=resourceSlot({...blankResource(),kind,title:'New '+kind,week:data.week.startDate});
    const next=structuredClone(data),linked=register(next,slot,code);
    onChange(next);setEditing(linked.planningItemId!);setSelected(null);
  };
  const editedSlot = data.weeklyResources?.find(item=>item.id===editing);
  const removeResource = () => {
    if(!editing || !window.confirm('Delete this planning resource and remove it from every lesson in this week? Published class materials will remain.'))return;
    const next=structuredClone(data);
    next.weeklyResources=next.weeklyResources!.filter(item=>item.id!==editing);
    for(const lesson of next.lessons){
      lesson.slots=lesson.slots?.filter(slot=>slot.planningItemId!==editing);
      lesson.overflow=lesson.overflow?.filter(slot=>slot.planningItemId!==editing);
    }
    onChange(next);setEditing(null);setSelected(null);setHistory([]);
  };
  const edit = (update:Partial<LessonSlot>) => { if(editing)onChange(editWeeklyResource(data,editing,update)); };
  return <section className="space-y-3" onDragEnd={()=>setDragTarget('')}>
    {history.length>0&&<div role="status" className="sticky top-20 z-10 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm"><span>{history.at(-1)!.label}</span><button className="rounded border border-emerald-300 bg-white px-3 py-2 font-medium" onClick={()=>{onChange(undoPlannerPlacement(data,history.at(-1)!.before));setHistory(old=>old.slice(0,-1));setSelected(null);setEditing(null);}}>↶ Undo</button></div>}
    {message && <p role="status" className="text-sm text-blue-800">{message}</p>}
    <div className="flex flex-wrap gap-2">{data.week.blocks.map(block => <button key={block.code} aria-pressed={!compare && code === block.code} className={'rounded-lg border px-3 py-2 text-sm ' + (code === block.code ? 'bg-blue-50 text-blue-800' : 'bg-white')} onDragOver={e => { e.preventDefault(); setCode(block.code); }} onClick={() => setCode(block.code)}>{plannerLabel[block.code] || block.label}</button>)}{data.week.blocks.some(block=>block.code==='WL-B')&&data.week.blocks.some(block=>block.code==='WL-R')&&<button className={'rounded-lg border px-3 py-2 text-sm '+(compare?'bg-blue-50 text-blue-800':'bg-white')} aria-pressed={compare} onClick={()=>{setClassCode('WL-B');setCompare(true);}}>Compare Blue / Red</button>}</div>
    <div className="rounded-xl border bg-white p-3"><h2 className="text-sm font-semibold">This week’s knowledge and skills</h2><p className="mt-1 whitespace-pre-wrap text-sm">{data.week.blocks.find(block => block.code === code)?.goal}</p>{relevant.filter(unit => unit.startDate <= data.week.startDate && unit.endDate >= data.week.startDate).map(unit => <p key={unit.id} className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{unit.knowledge} {unit.skills}</p>)}<div className="mt-2 flex flex-wrap gap-1">{cards.map(card => <details key={card.id} className="rounded-lg bg-blue-50 px-2 py-1 text-sm"><summary className="cursor-pointer">{card.front}</summary><p className="mt-1 max-w-sm">{card.back}</p></details>)}</div></div>
    <details className="rounded-lg border bg-white p-2"><summary className="cursor-pointer text-xs text-slate-500">Course notes and activity leadership</summary>{data.courses.filter(course => course.classCode === code).map(course => <div key={course.classCode} className="mt-2 space-y-2"><label className="block text-sm">Private weekly intention<textarea className={input} value={course.intention} onChange={e => mutate(draft => { draft.courses.find(row => row.classCode === code)!.intention=e.target.value; })}/></label><label className="block text-sm">We Do leader<select className={input} value={course.weDoLead} onChange={e => mutate(draft => { draft.courses.find(row => row.classCode === code)!.weDoLead=e.target.value as typeof course.weDoLead; })}><option value="teacher">Teacher</option><option value="students">Students</option><option value="named">Named student</option></select></label>{course.weDoLead === 'named' && <input aria-label="Leader name" className={input} value={course.leadName} onChange={e => mutate(draft => { draft.courses.find(row => row.classCode === code)!.leadName=e.target.value; })}/>} {code.startsWith('WL-') && <label className="block text-sm">Keep Blue and Red aligned<textarea className={input} value={course.sectionBalanceNote || ''} onChange={e => mutate(draft => { draft.courses.filter(row => row.classCode.startsWith('WL-')).forEach(row => { row.sectionBalanceNote=e.target.value; }); })}/></label>}</div>)}</details>
    <p className="text-xs text-slate-500">Drag cards between periods or over a class tab. On touch or keyboard, use a card’s move handle, then choose where to place it. Click a lesson card to view details. Edit content in the planning area to update every linked card. Purple: presentations · Blue: texts · Green: activities.</p>
    {selected && <div role="status" className="sticky top-2 z-10 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm"><span>{selected.from ? 'Move' : 'Add'}: {selected.slot.title} — choose a position below.</span><button className={icon} onClick={() => setSelected(null)}>Cancel</button></div>}
    <div className="space-y-4">
      <PlannerResourceTray resources={resources} week={data.week.startDate} lessons={data.lessons.filter(l=>courseCode(l.classCode)===courseCode(code))} items={(data.weeklyResources||[]).filter(item=>item.course===courseCode(code))} onSelect={selectResource} onAdd={addResource} onEdit={setEditing}/>
      <div className={'grid min-w-0 items-start gap-3 md:grid-cols-2 '+(compare?'':'2xl:grid-cols-3')}>{displayedLessons.map((lesson,position) => lesson ? <article key={lesson.id} aria-label={lesson.date + ' ' + lesson.classLabel} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, lesson.id, lesson.slots?.length || 0)} className="rounded-2xl border bg-white p-3">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500">{compare?'Period '+(Math.floor(position/2)+1)+' · ':''}{plannerLabel[lesson.classCode]||lesson.classLabel}</span>{lesson.classCode.startsWith('WL-')&&<button className="text-xs text-blue-700" onClick={()=>setCopySource(lesson.id)}>Copy lesson cards…</button>}</div><h3 className="text-sm font-semibold">{new Date(lesson.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
        <div className="mt-2 space-y-1.5">{(lesson.slots || []).map((slot, index) => <div key={slot.id} draggable onDragStart={e => { e.dataTransfer.setData(dragType, JSON.stringify({ slot, from: lesson.id, index })); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={e => {e.preventDefault();e.stopPropagation();setDragTarget(lesson.id+':'+index);}} onDrop={e => drop(e, lesson.id, index)} className={'flex h-28 cursor-grab items-center gap-1 rounded-xl border px-2 py-2 ' + color(slot.kind) + (dragTarget===lesson.id+':'+index?' border-t-4 border-t-blue-600':'')}>
          <button className="min-w-0 flex-1 text-left text-sm" aria-label={selected ? 'Place before ' + slot.title : 'Open ' + slot.title + ' details'} onClick={() => selected ? place(lesson.id, index) : setPreview(slot)}><span className="block text-[10px] uppercase opacity-60">{slot.kind === 'activity' ? slot.activityType || slot.kind : slot.kind}</span><span className="block line-clamp-2 font-medium">{shortWords(slot.title,6)}</span>{slot.content && <span className="mt-1 block line-clamp-2 text-xs opacity-70">{shortWords(slot.content,12)}</span>}</button>
          <div className="flex shrink-0 flex-col"><button className={icon} aria-label={'Move ' + slot.title} title="Select, then choose a new position" onClick={() => setSelected({ slot, from: lesson.id, index })}>⠿</button>
          <button className={icon} aria-label={'Copy ' + slot.title} title="Copy to another period or section" onClick={() => setSelected({ slot: { ...slot } })}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg></button>
          <button className={icon} aria-label={'Remove ' + slot.title + ' from this lesson'} title="Remove from this lesson" onClick={() => { placementMutation(draft => { draft.lessons.find(item => item.id === lesson.id)!.slots!.splice(index, 1); }, 'Removed card'); setSelected(null); }}>×</button></div>
        </div>)}</div>
        <button className="mt-2 w-full rounded-lg border border-dashed px-2 py-2 text-left text-xs text-slate-500" disabled={!selected} onClick={() => place(lesson.id, lesson.slots?.length || 0)}>{selected ? '+ Place ' + selected.slot.title + ' here' : 'Drop an item here'}</button>
        {Boolean(lesson.overflow?.length) && <details className="mt-2"><summary className="cursor-pointer text-xs text-slate-500">Previously unplaced items ({lesson.overflow!.length})</summary>{lesson.overflow!.map((slot, index) => <div key={slot.id} className="mt-1 flex justify-between text-sm"><button className="text-left" onClick={() => setPreview(slot)}>{slot.title} ✎</button><button aria-label={'Remove unplaced ' + slot.title} onClick={() => placementMutation(draft => { draft.lessons.find(row => row.id === lesson.id)!.overflow!.splice(index,1); }, 'Removed unplaced card')}>×</button><button onClick={() => placementMutation(draft => { const row = draft.lessons.find(item => item.id === lesson.id)!; row.slots ||= []; row.slots.push(...row.overflow!.splice(index, 1)); }, 'Placed card')}>Place</button></div>)}</details>}
        <details className="mt-2"><summary className="cursor-pointer text-xs text-slate-400">Lesson notes and reminders</summary>{(['goal', 'settle', 'exit', 'privateNotes'] as const).map(field => <label key={field} className="mt-2 block text-xs">{field === 'privateNotes' ? 'Private notes' : field}<textarea className={input} value={lesson[field]} onChange={e => mutate(draft => { draft.lessons.find(item => item.id === lesson.id)![field] = e.target.value; })}/></label>)}<label className="mt-2 block text-xs">Reminders (one per line)<textarea className={input} value={lesson.reminders.join('\n')} onChange={e => mutate(draft => { draft.lessons.find(item => item.id === lesson.id)!.reminders = e.target.value.split('\n'); })}/></label></details>
      </article> : <div key={'missing-'+position} className="rounded-xl border border-dashed p-4 text-sm text-slate-400">No {position%2===0?'Blue':'Red'} lesson for period {Math.floor(position/2)+1}.</div>)}</div>
    </div>
    {copySource&&<CopyLessonDialog key={copySource} data={data} sourceId={copySource} onClose={()=>setCopySource('')} onCopy={next=>{commitPlacement(next,'Copied lesson cards');setSelected(null);}}/>}
    <Modal open={Boolean(preview)} onClose={()=>setPreview(null)} title="Lesson item">{preview && <div className="space-y-3"><p className="text-xs uppercase text-slate-500">{preview.kind === 'activity' ? preview.activityType || preview.kind : preview.kind}</p><h3 className="text-lg font-semibold">{preview.title}</h3><p className="whitespace-pre-wrap">{preview.content}</p>{preview.url && <a className="break-all text-blue-700 underline" href={/^https?:\/\//i.test(preview.url)?preview.url:undefined} target="_blank" rel="noreferrer">{preview.url}</a>}<p className="text-sm text-slate-500">Edit this item in the weekly planning area. Changes apply to all its lesson placements.</p><button className="rounded-lg bg-slate-900 px-3 py-2 text-white" onClick={()=>{setEditing(preview.planningItemId||null);setPreview(null);}}>Edit in planning area</button></div>}</Modal>
    <Modal open={Boolean(editedSlot)} onClose={() => setEditing(null)} title="Edit planning resource">{editedSlot && <div className="space-y-3"><label className="block text-sm">Title<input className={input} value={editedSlot.title} onChange={e => edit({ title: e.target.value })}/></label><label className="block text-sm">Type<select className={input} value={editedSlot.kind} onChange={e => edit({ kind: e.target.value as LessonSlot['kind'] })}>{['presentation', 'text', 'activity', 'copywork', 'quiz', 'assignment'].map(kind => <option key={kind}>{kind}</option>)}</select></label>{editedSlot.kind==='activity' && <label className="block text-sm">Activity type<select className={input} value={editedSlot.activityType||'Activity'} onChange={e=>edit({activityType:e.target.value})}>{['Activity','I do','We do','They do','Check','Exit'].map(type=><option key={type}>{type}</option>)}</select></label>}<label className="block text-sm">Details<textarea rows={5} className={input} value={editedSlot.content} onChange={e => edit({ content: e.target.value })}/></label><label className="block text-sm">Link<input className={input} value={editedSlot.url} onChange={e => edit({ url: e.target.value })}/></label>{(editedSlot.kind === 'text' || editedSlot.kind === 'presentation') && <><label className="block text-sm">Assigned / due date (leave blank to follow lesson)<input type="date" className={input} value={editedSlot.dueDate || ''} onChange={e => edit({dueDate:e.target.value})}/></label><p className="text-xs text-slate-500">Not shared by autosave. Text links require a URL to create a separate class reading. </p></>}{editedSlot.kind === 'presentation' && <label className="block text-sm">Presenter<input className={input} value={editedSlot.givenBy || ''} onChange={e => edit({givenBy:e.target.value})}/></label>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editedSlot.publish !== false} onChange={e => edit({publish:e.target.checked})}/>Include for students when I publish</label><p className="text-xs text-slate-500">Controls the agenda and separate text/presentation entry. Previously published items remain until changed in the class.</p><label className="block text-sm">Minutes<input type="number" min={0} className={input} value={editedSlot.minutes} onChange={e => edit({ minutes: Math.max(0, Number(e.target.value)) })}/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editedSlot.optional} onChange={e => edit({ optional: e.target.checked })}/>If time</label><div className="flex items-center justify-between"><button className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" disabled={!editedSlot.title.trim()} onClick={() => setEditing(null)}>Done</button><button className="text-sm text-red-700" onClick={removeResource}>Delete resource</button></div><p className="text-xs text-slate-500">Changes autosave privately and update every linked lesson item in this week, including both World Lit sections. Other weeks and unit originals are unchanged.</p></div>}</Modal>
  </section>;
}
