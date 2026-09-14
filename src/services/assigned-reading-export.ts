import type { LearningText, TextAssignment } from '@/types';
import { textShareContent } from '@/utils/text-share';
export function readingWeekMonday(date:string) {
  const day=new Date(date+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==date)throw new Error('Choose a valid week.');
  day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
  return day.toISOString().slice(0,10);
}
export function assignedReadingPrompt(classes: { $id:string;name:string;courseName:string;canvasCourseId?:string }[],texts:LearningText[],assignments:TextAssignment[],base:string,selectedDate:string) {
  const monday=readingWeekMonday(selectedDate),end=new Date(monday+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+7);
  const nextWeek=end.toISOString().slice(0,10),groups:string[]=[],seen=new Set<string>();
  let count=0;
  const singleLine=(s:string)=>s.replace(/[\r\n|]+/g,' ').trim();
  for(const cls of [...classes].sort((a,b)=>Number(a.canvasCourseId||0)-Number(b.canvasCourseId||0))) {
    const lines=assignments.filter(a=>a.classId===cls.$id&&a.isAssignedReading===true&&a.dueDate&&a.dueDate>=monday&&a.dueDate<nextWeek).sort((a,b)=>a.dueDate!.localeCompare(b.dueDate!)||a.textId.localeCompare(b.textId)).flatMap(a=>{
      const text=texts.find(t=>t.$id===a.textId&&t.status==='published'),key=cls.$id+':'+a.textId+':'+a.dueDate;
      if(!text||seen.has(key))return [];
      seen.add(key);
      const source=text.externalUrl&&/^https?:\/\//i.test(text.externalUrl)?' | src:'+singleLine(text.externalUrl):'';
      return ['- '+singleLine(text.title)+' | '+textShareContent(text.$id,text.title,base).url+' | '+a.dueDate!.slice(5)+source];
    });
    if(!lines.length)continue;
    if(!/^\d+$/.test(cls.canvasCourseId||''))throw new Error('Set a Canvas course ID in Edit class for '+cls.courseName+' · '+cls.name+' before exporting.');
    count+=lines.length;groups.push(cls.canvasCourseId+'\n'+lines.join('\n'));
  }
  return {count,prompt:'Canvas readings — week of '+monday+(groups.length?'\n\n'+groups.join('\n\n'):'')};
}
