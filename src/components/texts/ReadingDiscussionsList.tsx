import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { executeLearningContent } from '@/services/learning-content.service';
import { readingWeek, type ReadingDiscussionListing } from '@/services/reading-discussion.service';
import { Button } from '@/components/common/Button';

export function ReadingDiscussionsList() {
  const [rows,setRows]=useState<ReadingDiscussionListing[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const refresh=useCallback(async()=>{setLoading(true);try{const result=await executeLearningContent<{readings:ReadingDiscussionListing[]}>({action:'listReadingDiscussions'});setRows(result.readings);setError('');}catch(e){setError(e instanceof Error?e.message:'Unable to load readings');}finally{setLoading(false);}},[]);
  useEffect(()=>{void Promise.resolve().then(refresh);},[refresh]);
  const groups = new Map<string,ReadingDiscussionListing[]>();
  for(const row of [...rows].sort((a,b)=>a.className.localeCompare(b.className)||b.date.localeCompare(a.date))) {
    const group=`${row.className} — week of ${readingWeek(row.date)}`;
    groups.set(group,[...(groups.get(group)||[]),row]);
  }
  return <section aria-label="Text discussions" className="mb-6 space-y-3">
    <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Texts</h2><Button size="sm" variant="secondary" loading={loading} onClick={()=>void refresh()}>Refresh texts</Button></div>
    <p className="text-sm text-slate-600">Read, wonder, connect. Every assigned reading has a separate conversation for your class.</p>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {!loading&&!error&&!rows.length&&<p className="text-slate-500">Your available assigned texts will appear here.</p>}
    {[...groups].map(([group,readings])=><details key={group} open className="rounded-2xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-600">{group}</summary><div className="mt-2 divide-y divide-slate-100">{readings.map(row=><Link className="flex min-h-12 items-center justify-between gap-3 py-3 text-blue-800" key={row.id} to={`/discussions/texts/${row.textId}/${row.classId}`}><span>{row.title}{!row.available&&<small className="ml-2 text-slate-500">Teacher preview · not released</small>}</span><span aria-hidden="true">→</span></Link>)}</div></details>)}
  </section>;
}
