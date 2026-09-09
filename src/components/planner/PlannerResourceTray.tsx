import { isQuiz, isCopywork, resourceCategory, resourceTitle, resourceColor, resourcePriority } from '@/services/planner-appearance';
import { useState } from 'react';
import { resourceSlot, type LessonSlot, type UnitResource, type ResourceKind } from '@/services/unit-planning';
import type { LessonPlan } from '@/services/planner.service';
import { shortWords, type WeeklyResource } from '@/services/planner-bank';

export function PlannerResourceTray({resources,week,lessons,onSelect,onAdd,items=[],onEdit,onPlace,onDelete,onAddRoutine,courseLabel='Weekly resource bank'}:{
  resources:UnitResource[];week:string;lessons:LessonPlan[];
  onSelect:(slot:LessonSlot)=>void;onAdd:(kind:ResourceKind)=>void;
  courseLabel?:string;onAddRoutine?:()=>void;items?:WeeklyResource[];onEdit?:(id:string)=>void;onPlace?:(slot:LessonSlot)=>void;onDelete?:(id:string)=>void;
}) {
  const icon='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-base text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600';
  const [category,setCategory]=useState<string>('all');
  const [weeklySearch,setWeeklySearch]=useState('');
  const [search,setSearch]=useState('');
  const matching=resources.filter(resource=>`${resource.title} ${resource.content} ${resource.kind}`.toLowerCase().includes(search.trim().toLowerCase()));
  const renderResource=(resource:UnitResource)=>{
    const dates=[...new Set(lessons.filter(lesson=>lesson.slots?.some(slot=>slot.resourceId===resource.id)).map(lesson=>lesson.date))];
    return <button key={resource.id} draggable onDragStart={e=>e.dataTransfer.setData('application/planning-slot',JSON.stringify({slot:resourceSlot(resource)}))} onClick={()=>onSelect(resourceSlot(resource))} className="block w-full rounded-lg border bg-white px-2 py-2 text-left text-xs"><span className="font-medium">{resource.title}</span><span className="block text-[10px] text-slate-500">{resource.kind}{dates.length?` · Placed: ${dates.join(', ')}`:''}</span></button>;
  };
  return <aside aria-label="Planning resources" className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:top-32 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto">
    <h3 className="text-sm font-semibold">{courseLabel}</h3>
    <input aria-label="Search weekly resources" placeholder="Search this week’s resources…" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={weeklySearch} onChange={e=>setWeeklySearch(e.target.value)}/>
    <div aria-label="Resource categories" className="flex flex-wrap gap-1">{(['all','presentation','routine','text','activity'] as const).map(kind=><button key={kind} aria-pressed={category===kind} onClick={()=>setCategory(current=>current===kind?'all':kind)} className={'rounded-md border px-2 py-1 text-[11px] '+(category===kind?'border-slate-800 bg-slate-800 text-white':'border-slate-200 bg-white text-slate-600')}>{kind==='all'?'All':kind==='presentation'?'Presentations':kind==='routine'?'Routines':kind==='text'?'Texts':'Activities'} <span className="opacity-60">{items.filter(item=>kind==='all'||resourceCategory(item)===kind).length}</span></button>)}</div>
    <div className="space-y-3">
      {(['presentation','routine','text','activity'] as const).filter(kind=>category==='all'||kind===category).map(kind=><section key={kind} aria-label={kind+' resources'} className={'min-w-0 rounded-xl border p-2 '+(kind==='presentation'?'border-purple-200 bg-purple-50':kind==='text'?'border-blue-200 bg-blue-50':kind==='routine'?'border-amber-200 bg-amber-50':'border-emerald-200 bg-emerald-50')}>
        <div className="mb-2 flex items-center justify-between gap-1"><h4 className="text-sm font-semibold">{kind==='activity'?'Activities':kind==='routine'?'Routines':kind==='text'?'Texts':'Presentations'}</h4><button className="rounded border bg-white px-2 py-1 text-xs" onClick={()=>kind==='routine'?onAddRoutine?.():onAdd(kind)}>+ {kind[0].toUpperCase()+kind.slice(1)}</button></div>
        {kind==='activity'&&!items.some(isQuiz)&&<button className="mb-2 block w-full rounded-lg border border-rose-300 bg-rose-50 p-2 text-left text-sm font-semibold text-rose-950" onClick={()=>onAdd('quiz')}>+ Quiz</button>}<div className="space-y-1">{items.filter(item=>resourceCategory(item)===kind && (resourceTitle(item)+' '+item.content).toLowerCase().includes(weeklySearch.trim().toLowerCase())).sort((a,b)=>resourcePriority(a)-resourcePriority(b)).map(item=>{
          const slot={...item,planningItemId:item.id};
          const count=lessons.filter(lesson=>lesson.slots?.some(s=>s.planningItemId===item.id)).length;
          return <div key={item.id} draggable onDragStart={e=>e.dataTransfer.setData('application/planning-slot',JSON.stringify({slot}))} className={"flex min-h-12 items-center gap-1 rounded-lg border px-2 py-1 "+resourceColor(item)}>
            <div className="min-w-0 flex-1"><button title={resourceTitle(item)} className="block w-full truncate text-left text-xs font-medium" onClick={()=>onSelect(slot)}>{isCopywork(item)&&<span aria-label="Copywork" className="mr-1 rounded border px-1 font-bold">C</span>}{shortWords(resourceTitle(item),6)}</button>
            {!isQuiz(item)&&<p className="truncate text-xs opacity-70">{shortWords(item.content,12)}</p>}
            </div><div className="flex shrink-0 items-center gap-1 text-xs"><span className="sr-only">{count ? `In ${count} lesson${count===1?'':'s'}` : 'Not placed'}</span><div className="flex gap-0.5"><button aria-label={'Add '+item.title+' to a lesson'} title="Add to a lesson" className={icon} onClick={()=>onPlace?onPlace(slot):onSelect(slot)}>+</button><button aria-label={'Edit resource '+item.title} title="Edit resource" className={icon} onClick={()=>onEdit?.(item.id)}>✎</button>{onDelete&&<button aria-label={'Delete resource '+item.title} title="Delete resource" className={icon} onClick={()=>onDelete(item.id)}>×</button>}</div></div>
          </div>;
        })}</div>
      </section>)}
    </div>
    <details><summary className="cursor-pointer text-sm font-medium">Source suggestions · {resources.filter(item=>item.week===week).length}</summary><div className="mt-2 space-y-1">{resources.filter(item=>item.week===week).map(renderResource)}</div></details>
    <details><summary className="cursor-pointer text-sm font-medium">Unit bank · {resources.length}</summary><input aria-label="Search resource bank" placeholder="Search title, details, or type" className="mt-2 w-full rounded-lg border p-2 text-xs" value={search} onChange={e=>setSearch(e.target.value)}/><div className="mt-2 space-y-2">{matching.map(renderResource)}{!matching.length&&<p className="text-xs text-slate-500">No matching resources.</p>}</div></details>
  </aside>;
}
