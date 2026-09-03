import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { addCopywork, copyworkMarkdown, deleteCopywork, readCopywork } from '@/services/copywork.service';
import type { CopyworkEntry } from '@/types';

export function CopyworkPanel() {
  const [entries, setEntries] = useState<CopyworkEntry[]>([]), [content, setContent] = useState(''), [sourceTitle, setSourceTitle] = useState(''), [sourceUrl, setSourceUrl] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const load = async () => { try { setEntries((await readCopywork()).entries); } catch { setMessage('Copywork could not be loaded right now.'); } };
  useEffect(() => { const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer); }, []);
  const add = async () => { if (!content.trim()) return; setBusy(true); setMessage(''); try { const { entry } = await addCopywork(content.trim(), sourceTitle.trim(), sourceUrl.trim()); setEntries(old => [entry, ...old]); setContent(''); setSourceTitle(''); setSourceUrl(''); setMessage('Saved with today’s date.'); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Could not save.'); } finally { setBusy(false); } };
  const markdown = () => copyworkMarkdown([...entries].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)));
  const copyAll = async () => { await navigator.clipboard.writeText(markdown()); setMessage('All copywork copied as Markdown.'); };
  const download = () => { const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([markdown()],{type:'text/markdown'}));link.download=`copywork-${new Date().toISOString().slice(0,10)}.md`;link.click();URL.revokeObjectURL(link.href); };
  return <details className="student-progress-details">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4"><span><strong className="block text-slate-950">Copywork</strong><span className="text-sm text-slate-500">Keep language worth remembering—quotes, passages, and articles.</span></span><span className="text-sm font-semibold text-slate-500">{entries.length} saved ▾</span></summary>
    <div className="space-y-4 border-t border-slate-200 p-4">
      <div><textarea className="w-full rounded-xl border border-slate-300 p-3 text-sm" rows={5} placeholder="Paste a quote, paragraph, or passage you want to keep…" value={content} onChange={e=>setContent(e.target.value)}/><div className="mt-2 grid gap-2 sm:grid-cols-2"><input className="rounded-lg border px-3 py-2 text-sm" placeholder="Source title (optional)" value={sourceTitle} onChange={e=>setSourceTitle(e.target.value)}/><input className="rounded-lg border px-3 py-2 text-sm" type="url" placeholder="Source link (optional)" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)}/></div><Button className="mt-2" loading={busy} disabled={!content.trim()} onClick={()=>void add()}>Save copywork</Button></div>
      {message&&<p className="text-sm text-slate-600" role="status">{message}</p>}
      {entries.length>0&&<><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={()=>void copyAll()}>Copy all</Button><Button size="sm" variant="secondary" onClick={download}>Export Markdown</Button></div><div className="max-h-96 space-y-3 overflow-auto">{entries.map(entry=><article key={entry.$id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><time className="text-xs font-semibold text-slate-500">{new Date(entry.createdAt).toLocaleString()}</time><button className="text-xs text-red-600" onClick={()=>void deleteCopywork(entry.$id).then(()=>setEntries(old=>old.filter(item=>item.$id!==entry.$id)))}>Delete</button></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{entry.content}</p>{entry.sourceTitle&&(entry.sourceUrl?<a className="mt-2 inline-block text-xs font-semibold text-blue-700" href={entry.sourceUrl} target="_blank" rel="noreferrer">{entry.sourceTitle} ↗</a>:<p className="mt-2 text-xs italic text-slate-500">— {entry.sourceTitle}</p>)}</article>)}</div></>}
    </div>
  </details>;
}
