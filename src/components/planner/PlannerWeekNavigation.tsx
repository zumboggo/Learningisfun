import type { PlannerWeekSource } from '@/services/planner-parser';
import { plannerMonday } from '@/services/planner-navigation';

export function PlannerWeekNavigation({weeks,selected,onChange}:{weeks:PlannerWeekSource[];selected:string;onChange:(key:string)=>void}) {
  const sorted=[...weeks].sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const index=sorted.findIndex(week=>week.key===selected);
  const current=sorted.find(week=>week.startDate===plannerMonday());
  const next=sorted.find(week=>week.startDate===plannerMonday(new Date(),1));
  const button='rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40';
  return <nav aria-label="Planning weeks" className="flex flex-wrap items-end gap-2"><button aria-label="Previous planning week" className={button} disabled={index<=0} onClick={()=>onChange(sorted[index-1].key)}>←</button><label className="min-w-0 flex-1 text-sm font-semibold">Week<select className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" value={selected} onChange={e=>onChange(e.target.value)}>{sorted.map(week=><option key={week.key} value={week.key}>{week.key} · {week.startDate}</option>)}</select></label><button aria-label="Next planning week" className={button} disabled={index<0||index>=sorted.length-1} onClick={()=>onChange(sorted[index+1].key)}>→</button><button className={button} disabled={!current} title={!current?'This week is not in the imported calendar':undefined} onClick={()=>current&&onChange(current.key)}>This week</button><button className={button} disabled={!next} title={!next?'Next week is not in the imported calendar':undefined} onClick={()=>next&&onChange(next.key)}>Next week</button></nav>;
}
