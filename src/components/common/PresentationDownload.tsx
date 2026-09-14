import { useState, type ReactNode } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
export function PresentationDownload({id,children,className}:{id:string;children:ReactNode;className?:string}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  return <span className={className}><button type="button" disabled={busy} className="text-left hover:underline disabled:opacity-50" onClick={async event=>{
    event.preventDefault();event.stopPropagation();setBusy(true);setError('');
    try {
      const result=await executeLearningContent<{url:string}>({action:'downloadPresentationFile',linkId:id});
      const a=document.createElement('a');a.href=result.url;a.rel='noreferrer';a.download='';document.body.appendChild(a);a.click();a.remove();
    }catch(cause){setError(cause instanceof Error?cause.message:'Download failed. Please try again.');}finally{setBusy(false);}
  }}>{children} <span className="text-xs">{busy?'Preparing…':'↓ PowerPoint'}</span></button>{error&&<span role="alert" className="block text-xs text-red-700">{error}</span>}</span>;
}
