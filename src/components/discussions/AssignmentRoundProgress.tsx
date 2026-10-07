import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/common/Button';
import type { ReplyAssignment } from '@/services/reading-discussion.service';

export function AssignmentRoundProgress({index, assignments, studentName}: {
  index:number; assignments:ReplyAssignment[]; studentName:(id:string)=>string;
}) {
  const [visible,setVisible]=useState(false);
  const timer=useRef<number | undefined>(undefined);
  const revealId=useId();
  const remaining=assignments.filter(assignment=>assignment.status!=='completed');
  useEffect(()=>{
    const hide=()=>{window.clearTimeout(timer.current);setVisible(false);};
    const onVisibility=()=>{if(document.visibilityState==='hidden')hide();};
    window.addEventListener('blur',hide);
    document.addEventListener('visibilitychange',onVisibility);
    return()=>{window.clearTimeout(timer.current);window.removeEventListener('blur',hide);document.removeEventListener('visibilitychange',onVisibility);};
  },[]);
  const reveal=()=>{
    window.clearTimeout(timer.current);
    setVisible(true);
    timer.current=window.setTimeout(()=>setVisible(false),3000);
  };
  return <div role="group" aria-label={`Round ${index+1} progress`}>
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="font-medium">Round {index+1} · {assignments.length-remaining.length} of {assignments.length} completed</h3>
      <Button size="sm" variant="secondary" disabled={!remaining.length} aria-expanded={visible&&remaining.length>0} aria-controls={revealId} onClick={reveal}>Not yet completed</Button>
    </div>
    {visible&&remaining.length>0&&<div id={revealId} className="mt-2 rounded-lg border bg-white p-3">
      <p className="mb-1 text-xs text-slate-500">Names hide automatically after 3 seconds.</p>
      <ul aria-label="Students not yet completed" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{remaining.map(assignment=><li key={assignment.studentId}>{studentName(assignment.studentId)}</li>)}</ul>
    </div>}
  </div>;
}
