import { plannerDeadlinesForWeek, type PlannerWeekSource } from '@/services/planner-parser';

export function PlannerDueLists({week,classCode}:{week:PlannerWeekSource;classCode:string}) {
  return <div className="grid grid-cols-2 gap-3 border-b border-slate-200 p-3 text-xs" aria-label="Upcoming assignments">
    {(['Due this week:', 'Due Next week:'] as const).map((label,index)=>{
      const items=plannerDeadlinesForWeek(week,classCode,index===0?0:1);
      return <div key={label} className="min-w-0 wrap-break-word"><b>{label}</b>{items?.length?<ul className="mt-1 space-y-1">{items.map(item=><li key={item.url||item.date+item.title}>{item.url?<a className="text-blue-800 underline" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>:item.title} <span className="text-slate-500">({item.date.slice(5)})</span></li>)}</ul>:<p className="text-slate-500">{items?'None scheduled.':'No deadline inventory imported.'}</p>}</div>;
    })}
  </div>;
}
