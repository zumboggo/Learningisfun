import { useRef, useState } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
export function PlannerPowerPointAttachment({title,url,onAttach}:{title:string;url:string;onAttach:(url:string)=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const latest=useRef(onAttach);latest.current=onAttach;
  return <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
    <label className="block text-sm font-semibold">{url.startsWith('presentation-file:')?'Replace attached PowerPoint':'Attach PowerPoint'}<input aria-label="Attach PowerPoint" disabled={busy} type="file" accept=".ppt,.pptx" className="mt-2 block w-full text-sm" onChange={async event=>{
      const file=event.target.files?.[0];event.target.value='';if(!file)return;
      setBusy(true);setError('');
      try {
        if(!/\.pptx?$/i.test(file.name)||file.size>5*1024*1024)throw new Error('Choose a .ppt or .pptx file up to 5 MB.');
        const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Could not read file.'));reader.readAsDataURL(file);});
        const result=await executeLearningContent<{url:string}>({action:'uploadPlannerPresentation',title:title.trim()||file.name,name:file.name,data});
        latest.current(result.url);
      }catch(cause){setError(cause instanceof Error?cause.message:'Upload failed.');}finally{setBusy(false);}
    }}/></label>
    <p role="status" className="mt-2 text-xs text-purple-950">{busy?'Uploading…':url.startsWith('presentation-file:')?'PowerPoint attached. Title and vocabulary details are unchanged.':'PowerPoint files up to 5 MB. Attaching replaces the resource’s current link.'}</p>
    <p className="mt-1 text-xs text-slate-600">Private until you use Share with students. Choose classes below; you can also place the resource in lesson slots.</p>
    {error&&<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
