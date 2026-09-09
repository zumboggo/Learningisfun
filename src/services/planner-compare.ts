import type { WeeklyPlanData } from './planner.service';

export function compareLessons(data: WeeklyPlanData) {
  const section = (code: string) => data.lessons.filter(lesson=>lesson.classCode===code).sort((a,b)=>a.date.localeCompare(b.date));
  const blue=section('WL-B'),red=section('WL-R');
  return Array.from({length:Math.max(blue.length,red.length)},(_,index)=>[blue[index]||null,red[index]||null]).flat();
}
export function copyLessonCards(data: WeeklyPlanData, fromId:string, toId:string, mode:'append'|'replace') {
  const next=structuredClone(data),from=next.lessons.find(row=>row.id===fromId),to=next.lessons.find(row=>row.id===toId);
  if(!from||!to||from===to||!['WL-B','WL-R'].includes(from.classCode)||!['WL-B','WL-R'].includes(to.classCode)||from.classCode===to.classCode)throw new Error('Choose a lesson in the other World Lit section.');
  const cards=(from.slots||[]).map(slot=>({...slot,id:crypto.randomUUID(),status:'planned' as const,dueDate:undefined}));
  to.slots=mode==='append'?[...(to.slots||[]),...cards]:cards;
  return next;
}
