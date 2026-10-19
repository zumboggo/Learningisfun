import { addDays, type PlannerWeekSource } from '@/services/planner-parser';

export function PlannerDueLists({week,classCode}:{week:PlannerWeekSource;classCode:string}) {
  const nextWeek=addDays(week.startDate,7),end=addDays(week.startDate,14);
  return <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-2 text-xs" aria-label="Upcoming assignments">
    {(['Due this week:', 'Due Next week:'] as const).map((label,index)=>{
      const items=week.deadlines?.filter(item=>item.classCode===classCode&&item.date>=(index?nextWeek:week.startDate)&&item.date<(index?end:nextWeek));
      return <div key={label} className="min-w-0 wrap-break-word"><b>{label}</b>{items?.length?<ul className="mt-1 space-y-1">{items.map(item=><li key={item.url||item.date+item.title}>{item.url?<a className="text-blue-800 underline" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>:item.title} <span className="text-slate-500">({item.date.slice(5)})</span></li>)}</ul>:<p className="text-slate-500">{items?'None scheduled.':'No deadline inventory imported.'}</p>}</div>;
    })}
  </div>;
}
