import { ClassReadingDate } from './ClassReadingDate';
import type { TextPurpose } from './TextPurpose';

export interface TextClassChoicesProps {
  classes: Array<{id:string;name:string}>;
  selected: Set<string>;
  onSelected: (value:Set<string>)=>void;
  dates: Record<string,string>;
  onDates: (value:Record<string,string>)=>void;
  purposes: Record<string,TextPurpose>;
  onPurposes: (value:Record<string,TextPurpose>)=>void;
}
export function TextClassChoices({classes,selected,onSelected,dates,onDates,purposes,onPurposes}:TextClassChoicesProps) {
  return <section className="space-y-2" aria-label="Class access and reading dates">
    <h3 className="font-semibold">Class access and reading dates</h3>
    {classes.map(cls=><div key={cls.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={selected.has(cls.id)} onChange={()=>{const next=new Set(selected);if(next.has(cls.id))next.delete(cls.id);else next.add(cls.id);onSelected(next)}}/>{cls.name}</label>
      <ClassReadingDate name={cls.name} disabled={!selected.has(cls.id)} value={dates[cls.id]||''} onChange={value=>onDates({...dates,[cls.id]:value})} purpose={purposes[cls.id]} onPurposeChange={value=>onPurposes({...purposes,[cls.id]:value})}/>
    </div>)}
  </section>;
}
