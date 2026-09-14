import { syncClassesFromServer } from '@/services/class.service';
import { plannerMonday } from '@/services/planner-navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { syncTextsFromServer } from '@/services/text.service';
import { assignedReadingPrompt } from '@/services/assigned-reading-export';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CopyButton } from '@/components/common/CopyButton';

export function ExportAssignedReadings({weekStart}:{weekStart?:string}) {
  const [chosenWeek,setChosenWeek]=useState(plannerMonday());
  const {user}=useAuth();
  const [busy,setBusy]=useState(false),[open,setOpen]=useState(false),[prompt,setPrompt]=useState(''),[status,setStatus]=useState('');
  const prepare=async()=>{
    if(!user)return;
    setBusy(true);setPrompt('');setStatus('');
    try {
      if(!await syncClassesFromServer(user.$id))throw new Error('Could not refresh classes. Please reconnect and retry.');
      const classes=await db.classes.where('teacherId').equals(user.$id).and(c=>c.status==='active').toArray();
      const ids=classes.map(c=>c.$id);
      if(!await syncTextsFromServer(ids,user.$id,true)) throw new Error('Could not refresh readings. Please reconnect and try again so the export is up to date.');
      const assignments=ids.length?await db.text_assignments.where('classId').anyOf(ids).toArray():[];
      const texts=await db.texts.toArray();
      const result=assignedReadingPrompt(classes,texts,assignments,window.location.href,weekStart||chosenWeek);
      setPrompt(result.prompt);setOpen(true);
      if(!result.count) {setStatus('No assigned readings with due dates in this week.');return;}
      try {await navigator.clipboard.writeText(result.prompt);setStatus(`Copied ${result.count} class reading entries. Review the prompt below.`);}
      catch {setStatus('Prompt ready. Use Copy prompt below, or select and copy the text manually.');}
    } catch(error) {setOpen(true);setStatus(error instanceof Error?error.message:'Export failed.');}
    finally {setBusy(false);}
  };
  return <><label className="text-xs">Export week<input aria-label="Export readings week" type="date" disabled={Boolean(weekStart)} value={weekStart||chosenWeek} onChange={e=>setChosenWeek(e.target.value)} className="ml-2 rounded border p-2"/></label><Button variant="secondary" loading={busy} onClick={()=>void prepare()}>Export Assigned Readings</Button><Modal open={open} onClose={()=>setOpen(false)} title="Export Assigned Readings" panelClassName="sm:max-w-3xl"><p role="status" className="mb-3 text-sm">{status}</p>{prompt&&<><textarea aria-label="Assigned readings prompt" readOnly value={prompt} className="h-80 w-full rounded-lg border p-3 text-sm"/><div className="mt-3"><CopyButton text={prompt} label="Copy prompt"/></div></>}</Modal></>;
}
