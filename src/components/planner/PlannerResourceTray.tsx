import { useState } from 'react';
import { resourceSlot, type LessonSlot, type UnitResource, type ResourceKind } from '@/services/unit-planning';
import type { LessonPlan } from '@/services/planner.service';
import { routineNames, routineSlot } from '@/services/planner-routines';
import { shortWords, type WeeklyResource } from '@/services/planner-bank';

export function PlannerResourceTray({resources,week,lessons,onSelect,onAdd,items=[],onEdit,onPlace,onDelete}:{
  resources:UnitResource[];week:string;lessons:LessonPlan[];
  onSelect:(slot:LessonSlot)=>void;onAdd:(kind:ResourceKind)=>void;
  items?:WeeklyResource[];onEdit?:(id:string)=>void;onPlace?:(slot:LessonSlot)=>void;onDelete?:(id:string)=>void;
}) {
  const icon='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-base text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600';
  const [search,setSearch]=useState('');
  const matching=resources.filter(resource=>`${resource.title} ${resource.content} ${resource.kind}`.toLowerCase().includes(search.trim().toLowerCase()));
  const renderResource=(resource:UnitResource)=>{
    const dates=[...new Set(lessons.filter(lesson=>lesson.slots?.some(slot=>slot.resourceId===resource.id)).map(lesson=>lesson.date))];
    return <button key={resource.id} draggable onDragStart={e=>e.dataTransfer.setData('application/planning-slot',JSON.stringify({slot:resourceSlot(resource)}))} onClick={()=>onSelect(resourceSlot(resource))} className="block w-full rounded-lg border bg-white px-2 py-2 text-left text-xs"><span className="font-medium">{resource.title}</span><span className="block text-[10px] text-slate-500">{resource.kind}{dates.length?` · Placed: ${dates.join(', ')}`:''}</span></button>;
  };
  return <aside aria-label="Planning resources" className="space-y-3 rounded-2xl border bg-slate-50 p-3">
    <h3 className="font-semibold">Weekly planning area</h3>
    <p className="text-xs text-slate-600">Create and edit here. Use + to choose a lesson without scrolling, or drag items into place. World Lit Blue and Red share the same items.</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_.8fr_1fr_1fr]">
      {(['presentation','copywork','text','activity'] as const).map(kind=><section key={kind} aria-label={kind+' resources'} className={'min-w-0 rounded-xl border p-2 '+(kind==='presentation'?'border-purple-200 bg-purple-50':kind==='text'?'border-blue-200 bg-blue-50':kind==='copywork'?'border-amber-200 bg-amber-50':'border-emerald-200 bg-emerald-50')}>
        <div className="mb-2 flex items-center justify-between gap-1"><h4 className="text-sm font-semibold">{kind==='activity'?'Activities':kind==='copywork'?'Copywork':kind==='text'?'Texts':'Presentations'}</h4><button className="rounded border bg-white px-2 py-1 text-xs" onClick={()=>onAdd(kind)}>+ {kind[0].toUpperCase()+kind.slice(1)}</button></div>
        <div className="max-h-80 space-y-2 overflow-y-auto">{items.filter(item=>item.kind===kind || kind==='activity' && ['quiz','assignment'].includes(item.kind)).map(item=>{
          const slot={...item,planningItemId:item.id};
          const count=lessons.filter(lesson=>lesson.slots?.some(s=>s.planningItemId===item.id)).length;
          return <div key={item.id} draggable onDragStart={e=>e.dataTransfer.setData('application/planning-slot',JSON.stringify({slot}))} className="rounded-xl border bg-white p-2">
            <button className="block w-full text-left text-sm font-medium" onClick={()=>onSelect(slot)}>{shortWords(item.title,6)}</button>
            <p className="text-xs text-slate-500">{shortWords(item.content,12)}</p>
            <div className="mt-2 flex items-center justify-between gap-1 text-xs"><span>{count ? `In ${count} lesson${count===1?'':'s'}` : 'Not placed'}</span><div className="flex gap-1"><button aria-label={'Add '+item.title+' to a lesson'} title="Add to a lesson" className={icon} onClick={()=>onPlace?onPlace(slot):onSelect(slot)}>+</button><button aria-label={'Edit resource '+item.title} title="Edit resource" className={icon} onClick={()=>onEdit?.(item.id)}>✎</button>{onDelete&&<button aria-label={'Delete resource '+item.title} title="Delete resource" className={icon} onClick={()=>onDelete(item.id)}>×</button>}</div></div>
          </div>;
        })}</div>
        {kind==='activity' && <details className="mt-2"><summary className="cursor-pointer text-sm">Routines</summary><div className="mt-2 flex flex-wrap gap-1">{routineNames.map(name=><button key={name} draggable onDragStart={e=>e.dataTransfer.setData('application/planning-slot',JSON.stringify({slot:routineSlot(name)}))} onClick={()=>onSelect(routineSlot(name))} className="rounded-lg border bg-white px-2 py-2 text-xs">{name}</button>)}</div></details>}
      </section>)}
    </div>
    <details><summary className="cursor-pointer text-sm font-medium">Source suggestions · {resources.filter(item=>item.week===week).length}</summary><div className="mt-2 grid gap-2 sm:grid-cols-3">{resources.filter(item=>item.week===week).map(renderResource)}</div></details>
    <details><summary className="cursor-pointer text-sm font-medium">Unit bank · {resources.length}</summary><input aria-label="Search resource bank" placeholder="Search title, details, or type" className="mt-2 w-full rounded-lg border p-2 text-xs" value={search} onChange={e=>setSearch(e.target.value)}/><div className="mt-2 space-y-2">{matching.map(renderResource)}{!matching.length&&<p className="text-xs text-slate-500">No matching resources.</p>}</div></details>
  </aside>;
}
