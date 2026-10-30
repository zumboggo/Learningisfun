import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {readingDiscussion, readingCompletion, type ReadingDiscussion, type ReadingDiscussionListing} from '@/services/reading-discussion.service';

export function ReadingRequirementsPanel({textId,classId,data:provided,onSaved,showRoster=false}:{textId:string;classId:string;data?:ReadingDiscussion;onSaved?:()=>Promise<void>;showRoster?:boolean}) {
  const [loaded,setLoaded]=useState<ReadingDiscussion|null>(null),[error,setError]=useState('');
  useEffect(()=>{
    if(provided)return;
    let active=true;
    void readingDiscussion<ReadingDiscussion>('readReadingDiscussion',textId,classId).then(r=>{if(active)setLoaded(r);}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[textId,classId,provided]);
  const data=provided||loaded;
  if(!data)return error?<p role="alert">Could not load reading requirements: {error}</p>:<p role="status">Loading reading requirements…</p>;
  return <RequirementsEditor key={JSON.stringify(data.requirements)} {...{textId,classId,data,showRoster}} onSaved={async()=>{if(onSaved)await onSaved();else setLoaded(await readingDiscussion<ReadingDiscussion>('readReadingDiscussion',textId,classId));}}/>;
}

function RequirementsEditor({textId,classId,data,onSaved,showRoster}:{textId:string;classId:string;data:ReadingDiscussion;onSaved:()=>Promise<void>;showRoster:boolean}) {
  const [questions,setQuestions]=useState(String(data.requirements?.questions??0)),[replies,setReplies]=useState(String(data.requirements?.replies??0)),[quote,setQuote]=useState(data.requirements?.replyQuoteRequired??false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const requirements=data.requirements;
  return <section aria-label="Reading requirements" className="space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
    <h2 className="font-semibold">Reading requirements</h2>
    <p className="text-sm">{requirements?`${requirements.questions} questions · ${requirements.replies} replies${requirements.replyQuoteRequired?' · Each counted reply needs a quote in the quote field':''}`:'No completion requirements set for this text yet.'}</p>
    {data.teacher&&<form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();setBusy(true);setError('');setSaved(false);void readingDiscussion('setReadingRequirements',textId,classId,{requirements:{questions:Number(questions),replies:Number(replies),replyQuoteRequired:quote}}).then(async()=>{await onSaved();setSaved(true);}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}>
      <label className="grid gap-1 text-sm">Questions required<input required type="number" min={0} max={100} step={1} className="w-28 rounded border bg-white p-2" value={questions} onChange={e=>setQuestions(e.target.value)}/></label>
      <label className="grid gap-1 text-sm">Replies required<input required type="number" min={0} max={100} step={1} className="w-28 rounded border bg-white p-2" value={replies} onChange={e=>setReplies(e.target.value)}/></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={quote} onChange={e=>setQuote(e.target.checked)}/>Replies must include a quote</label>
      <button disabled={busy} className="rounded-lg bg-teal-900 px-4 py-2 text-white disabled:opacity-50">{busy?'Saving…':'Save requirements'}</button>
      <p className="w-full text-xs text-slate-600">Saved for this text and class. Zero means none required. Completion counts all posted work for this text, including moderated posts, and excludes withdrawn threads. Quotes count when the reply’s quote field is filled; review their relevance when marking.</p>
    </form>}
    {saved&&<p role="status">Requirements saved.</p>}{error&&<p role="alert" className="text-red-800">{error}</p>}
    {showRoster&&data.teacher&&requirements&&<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Student','Questions','Replies','Replies with quotes','Completion'].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{data.participation.map(p=><tr key={p.id}><th scope="row" className="p-2 font-medium">{p.name}</th><td>{p.question} / {requirements.questions}</td><td>{p.replies} / {requirements.replies}</td><td>{p.quotedReplies||0}</td><td>{readingCompletion(p,requirements)?'Complete':'Incomplete'}</td></tr>)}</tbody></table></div>}
  </section>;
}

export function ClassReadingRequirements({classId}:{classId:string}) {
  const [rows,setRows]=useState<ReadingDiscussionListing[]>([]),[selected,setSelected]=useState(''),[error,setError]=useState('');
  useEffect(()=>{let active=true;void readingDiscussion<{readings:ReadingDiscussionListing[]}>('listReadingDiscussions','',classId).then(r=>{if(active){setRows(r.readings.filter(row=>row.classId===classId).sort((a,b)=>b.date.localeCompare(a.date)));}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[classId]);
  return <section className="space-y-3 rounded-xl border bg-white p-4"><h2 className="font-semibold">Assigned text completion</h2><p className="text-sm text-slate-600">Choose a text to set its question and reply requirements and check completion. These counts cover all dates, independently of the Data period filter.</p><label className="grid gap-1 text-sm">Assigned text<select className="rounded-lg border p-2" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a text…</option>{rows.map(row=><option key={row.id} value={row.textId}>{row.date} · {row.title}</option>)}</select></label>{error&&<p role="alert">{error}</p>}{selected&&<><Link className="text-sm text-teal-800 underline" to={`/discussions/texts/${selected}/${classId}`}>Open text discussion</Link><ReadingRequirementsPanel key={`${classId}:${selected}`} textId={selected} classId={classId} showRoster/></>}</section>;
}
