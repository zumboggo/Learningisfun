import { publicReadingRequest } from '@/services/public-reading.service';
import { useEffect, useState } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
import { Button } from '@/components/common/Button';

export function OriginalPdf({ textId, embedded=false, publicAccess=false }: { textId: string; embedded?: boolean; publicAccess?: boolean }) {
  const [preview,setPreview]=useState<{id:string;url:string}|null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const previewUrl=preview?.id===textId?preview.url:'';
  useEffect(()=>{
    if(!embedded)return;
    let cancelled=false;
    void (publicAccess?publicReadingRequest<{url:string}>(textId,'original'):executeLearningContent<{url:string}>({action:'readOriginalPdf',textId,download:false})).then(result=>{if(!cancelled){setPreview({id:textId,url:result.url});setError('');}}).catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:'Could not load original PDF.')});
    return ()=>{cancelled=true};
  },[textId,embedded,publicAccess]);
  async function open(download: boolean) {
    // Open synchronously to avoid popup blockers while authorization is checked.
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    setBusy(true); setError('');
    try {
      const result = publicAccess ? await publicReadingRequest<{url:string}>(textId,'original',download) : await executeLearningContent<{ url: string }>({ action: 'readOriginalPdf', textId, download });
      if (tab) tab.location.replace(result.url);
      else window.location.assign(result.url);
    } catch (cause) {
      tab?.close(); setError(cause instanceof Error ? cause.message : 'Could not open the PDF.');
    } finally { setBusy(false); }
  }
  return <section aria-label="Original file" className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex flex-wrap items-center gap-2"><div className="mr-auto"><p className="text-sm font-medium">Original file · PDF</p><p className="text-xs text-slate-600">Original layout and images. If the preview is unavailable, open or download the file.</p></div><Button size="sm" variant="secondary" disabled={busy} onClick={() => void open(false)}>View Original ↗</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => void open(true)}>Download Original</Button></div>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}{embedded&&!previewUrl&&!error&&<p role="status" className="p-4 text-sm">Loading original PDF…</p>}{embedded&&previewUrl&&<iframe title="Original uploaded PDF" src={previewUrl} className="mt-3 h-[75vh] min-h-96 w-full rounded-lg border-0" referrerPolicy="no-referrer"/>}</section>;
}
