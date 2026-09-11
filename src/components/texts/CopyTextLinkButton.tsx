import { useState } from 'react';
import { copyTextLink, textShareContent } from '@/utils/text-share';
export function CopyTextLinkButton({textId,title}:{textId:string;title:string}) {
  const [status,setStatus]=useState<'idle'|'copied'|'error'>('idle');
  return <div><button type="button" title="Copy title and link" aria-label={`Copy title and link for ${title}`} className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-blue-700 hover:bg-blue-50" onClick={()=>{void copyTextLink(textId,title).then(()=>setStatus('copied')).catch(()=>setStatus('error'))}}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/></svg>{status==='copied'&&<span role="status" className="text-xs">Copied</span>}</button>{status==='error'&&<label className="block text-xs">Copy manually:<textarea readOnly aria-label="Text title and share link" value={textShareContent(textId,title).plain} onFocus={e=>e.target.select()} className="block w-full rounded border p-2"/></label>}</div>;
}
