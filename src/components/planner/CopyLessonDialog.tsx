import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import type { WeeklyPlanData } from '@/services/planner.service';
import { copyLessonCards } from '@/services/planner-compare';
import { plannerLabel } from '@/services/planner-layout';

export function CopyLessonDialog({data,sourceId,onClose,onCopy}:{data:WeeklyPlanData;sourceId:string;onClose:()=>void;onCopy:(data:WeeklyPlanData)=>void}) {
  const source=data.lessons.find(row=>row.id===sourceId)!;
  const other=source.classCode==='WL-B'?'WL-R':'WL-B';
  const targets=data.lessons.filter(row=>row.classCode===other).sort((a,b)=>a.date.localeCompare(b.date));
  const ordinal=data.lessons.filter(row=>row.classCode===source.classCode).sort((a,b)=>a.date.localeCompare(b.date)).findIndex(row=>row.id===sourceId);
  const [targetId,setTarget]=useState(targets[ordinal]?.id||targets[0]?.id||'');
  const [mode,setMode]=useState<'append'|'replace'>('append');
  const target=targets.find(row=>row.id===targetId);
  return <Modal open onClose={onClose} title={`Copy lesson cards to ${plannerLabel[other]}`}><div className="space-y-3 text-sm"><p>From {plannerLabel[source.classCode]} · {source.date}. Copies are independent; the original is unchanged.</p><label className="block">Destination<select className="mt-1 w-full rounded-lg border p-2" value={targetId} onChange={e=>setTarget(e.target.value)}>{targets.map(row=><option key={row.id} value={row.id}>{row.date} · {row.slots?.length||0} cards</option>)}</select></label><fieldset className="space-y-2"><legend>How should the cards be added?</legend><label className="block"><input type="radio" checked={mode==='append'} onChange={()=>setMode('append')}/> Add after existing cards</label><label className="block"><input type="radio" checked={mode==='replace'} onChange={()=>setMode('replace')}/> Replace the destination’s placed cards</label></fieldset><div className="rounded-lg bg-slate-50 p-3"><p>{mode==='append'?`Keep ${target?.slots?.length||0} existing cards and add ${source.slots?.length||0}.`:`Replace ${target?.slots?.length||0} existing cards with ${source.slots?.length||0}.`}</p><ul className="mt-2 list-disc pl-5">{source.slots?.map(slot=><li key={slot.id}>{slot.title}</li>)}</ul></div><p className="text-xs text-slate-500">Copied cards follow the destination lesson date and reset to Planned. Destination notes, reminders, and unplaced items remain unchanged. Undo is available.</p><button disabled={!target||!source.slots?.length} className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-40" onClick={()=>{onCopy(copyLessonCards(data,sourceId,targetId,mode));onClose();}}>{mode==='append'?'Add copies':'Confirm replacement'}</button></div></Modal>;
}
