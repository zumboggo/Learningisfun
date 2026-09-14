import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { executeLearningContent } from '@/services/learning-content.service';
import type { PresentationLink } from '@/types';
import { Button } from './Button';
import { Modal } from './Modal';
export function PowerPointUpload({classId}:{classId?:string}) {
  const {user}=useAuth();
  const classes=useLiveQuery(()=>user?db.classes.where('teacherId').equals(user.$id).and(c=>c.status==='active').toArray():[],[user?.$id]);
  const [open,setOpen]=useState(false),[file,setFile]=useState<File>(),[title,setTitle]=useState(''),[selected,setSelected]=useState(classId||''),[date,setDate]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const upload=async()=>{
    if(!file||!selected||!title.trim())return;
    setBusy(true);setError('');
    try {
      if(!/\.pptx?$/i.test(file.name)||file.size>5*1024*1024) throw new Error('Choose a .ppt or .pptx file of 5 MB or smaller.');
      const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Could not read the file.'));reader.readAsDataURL(file);});
      const result=await executeLearningContent<{link:PresentationLink}>({action:'uploadPresentationFile',data,name:file.name,title:title.trim(),classId:selected,assignedAt:date?new Date(date+'T12:00:00+08:00').toISOString():new Date().toISOString()});
      await db.presentation_links.put(result.link);
      setOpen(false);setMessage('PowerPoint added to the class’s weekly links.');
    }catch(cause){setError(cause instanceof Error?cause.message:'Upload failed.');}finally{setBusy(false);}
  };
  return <div><Button variant="secondary" onClick={()=>{setFile(undefined);setTitle('');setSelected(classId||'');setDate('');setError('');setMessage('');setOpen(true);}}>Upload PowerPoint</Button>{message&&<p role="status" className="mt-1 text-xs text-green-800">{message}</p>}<Modal open={open} onClose={()=>{if(!busy)setOpen(false)}} title="Upload PowerPoint to class"><fieldset disabled={busy} className="space-y-4">
    <p className="text-sm text-slate-600">This uploads directly to the selected class’s weekly links, not just your private plan. Students can download the file immediately. The date chooses which week it belongs to; it does not delay access.</p>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    <label className="block text-sm font-medium">PowerPoint file (.ppt or .pptx, up to 5 MB)<input type="file" accept=".ppt,.pptx" className="mt-2 block w-full rounded-lg border p-3" onChange={e=>{const f=e.target.files?.[0];setFile(f);if(f)setTitle(f.name.replace(/\.pptx?$/i,''));}}/></label>
    <label className="block text-sm font-medium">Title<input className="mt-1 w-full rounded border p-2" maxLength={255} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label className="block text-sm font-medium">Class<select className="mt-1 w-full rounded border p-2" disabled={Boolean(classId)||busy} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose class</option>{classes?.map(c=><option key={c.$id} value={c.$id}>{c.courseName} · {c.name}</option>)}</select></label>
    <label className="block text-sm font-medium">Date / week (optional)<input type="date" className="mt-1 w-full rounded border p-2" value={date} onChange={e=>setDate(e.target.value)}/></label>
    <Button loading={busy} disabled={!file||!selected||!title.trim()} onClick={()=>void upload()}>Upload and add to class</Button>
  </fieldset></Modal></div>;
}
