import { useState } from 'react';
import { resourceSlot, type LessonSlot, type UnitResource } from '@/services/unit-planning';
import type { LessonPlan } from '@/services/planner.service';
import { routineNames, routineSlot } from '@/services/planner-routines';

export function PlannerResourceTray({resources,week,lessons,onSelect,onAdd}:{resources:UnitResource[];week:string;lessons:LessonPlan[];onSelect:(slot:LessonSlot)=>void;onAdd:(kind:'activity'|'text'|'presentation')=>void}) {
  const [search,setSearch]=useState('');
  const matching=resources.filter(resource=>`${resource.title} ${resource.content} ${resource.kind}`.toLowerCase().includes(search.trim().toLowerCase()));
  const renderResource=(resource:UnitResource)=>{
    const dates=[...new Set(lessons.filter(lesson=>lesson.slots?.some(slot=>slot.resourceId===resource.id)).map(lesson=>new Date(lesson.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'})))];
    return <button key={resource.id} draggable onDragStart={e=>e.dataTransfer.setData('application/planning-slot',JSON.stringify({slot:resourceSlot(resource)}))} onClick={()=>onSelect(resourceSlot(resource))} className={`block w-full rounded-lg border px-2 py-2 text-left text-xs ${resource.kind==='presentation'?'border-purple-200 bg-purple-50':resource.kind==='text'?'border-blue-200 bg-blue-50':'border-emerald-200 bg-emerald-50'}`}><span className="font-medium">{resource.title}</span><span className="block text-[10px] text-slate-500">{resource.kind}{dates.length?` · Placed: ${dates.join(', ')}`:''}</span></button>;
  };
  return <aside aria-label="Planning resources" className="space-y-3 rounded-xl border bg-slate-50 p-3 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
    <h3 className="text-sm font-semibold">Possible activities</h3>
    <details open><summary className="cursor-pointer text-sm font-medium">This week · {resources.filter(item=>item.week===week).length}</summary><div className="mt-2 space-y-2">{resources.filter(item=>item.week===week).map(renderResource)}{!resources.some(item=>item.week===week)&&<p className="text-xs text-slate-500">No resources scheduled. Choose from the bank or add one below.</p>}</div></details>
    <details><summary className="cursor-pointer text-sm font-medium">Routines</summary><div className="mt-2 space-y-1">{routineNames.map(name=><button key={name} draggable onDragStart={e=>e.dataTransfer.setData('application/planning-slot',JSON.stringify({slot:routineSlot(name)}))} onClick={()=>onSelect(routineSlot(name))} className="block w-full rounded-lg border border-emerald-200 bg-white px-2 py-2 text-left text-xs">{name}</button>)}</div></details>
    <details><summary className="cursor-pointer text-sm font-medium">Unit bank · {resources.length}</summary><input aria-label="Search resource bank" placeholder="Search title, details, or type" className="mt-2 w-full rounded-lg border p-2 text-xs" value={search} onChange={e=>setSearch(e.target.value)}/><div className="mt-2 space-y-2">{matching.map(renderResource)}{!matching.length&&<p className="text-xs text-slate-500">No matching resources.</p>}</div></details>
    <div className="flex flex-wrap gap-2 border-t pt-2">{(['activity','text','presentation'] as const).map(kind=><button key={kind} className="text-xs font-medium text-blue-700" onClick={()=>onAdd(kind)}>+ {kind[0].toUpperCase()+kind.slice(1)}</button>)}</div>
  </aside>;
}
