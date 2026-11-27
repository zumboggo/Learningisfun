import { useEffect, useId, useRef, useState } from 'react';
import { WorkshopLink as Link } from '@/components/WorkshopLink';
import { EditReadingContribution } from '@/components/discussions/EditReadingContribution';
import { executeLearningContent } from '@/services/learning-content.service';
import { readingDiscussion, readingWeek, type ReadingDiscussionListing, type ReadingDiscussionPost } from '@/services/reading-discussion.service';

export type MyResponse = { reading: ReadingDiscussionListing; post: ReadingDiscussionPost; canEdit: boolean; context: ReadingDiscussionPost[]; teacherReplies: ReadingDiscussionPost[] };
const kind = (post: ReadingDiscussionPost) => post.parentId ? 'Reply' : ({ question: 'Question', thought: 'Thought', connection: 'Connection' }[post.category]);
const date = (value: string) => new Date(value).toLocaleString(undefined, { timeZone: 'Asia/Shanghai' });

export function MyResponses({ classId }: { classId: string }) {
  const panelId = useId();
  const [open, setOpen] = useState(false), [rows, setRows] = useState<MyResponse[]>();
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const [week, setWeek] = useState('all'), [type, setType] = useState('all');
  const [editing, setEditing] = useState<string>(), [busy, setBusy] = useState(false), [saved, setSaved] = useState('');
  const [refresh, setRefresh] = useState(0);
  const opened = useRef(false);
  useEffect(() => {
    if (!open && !opened.current) return;
    opened.current = true;
    let active = true;
    setLoading(true); setError('');
    executeLearningContent<{ responses: MyResponse[] }>({ action: 'listMyReadingResponses', listingClassId: classId })
      .then(result => { if (active) setRows(result.responses); })
      .catch(() => { if (active) setError('Could not load your responses. Try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [classId, open, refresh]);
  useEffect(() => {
    const update = (event: Event) => { if ((event as CustomEvent).detail === classId) setRefresh(value => value + 1); };
    window.addEventListener('class-materials-refreshed', update);
    return () => window.removeEventListener('class-materials-refreshed', update);
  }, [classId]);
  const weeks = [...new Set((rows || []).map(row => readingWeek(row.reading.date)))].sort().reverse();
  const filtered = (rows || []).filter(row => (week === 'all' || readingWeek(row.reading.date) === week) && (type === 'all' || kind(row.post) === type));
  const groups = new Map<string, MyResponse[]>();
  for (const row of filtered) groups.set(row.reading.id, [...(groups.get(row.reading.id) || []), row]);
  return <section aria-label="My responses" className="min-w-0 overflow-hidden rounded-xl border border-teal-200 bg-white">
    <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)} className="flex min-h-14 w-full items-center justify-between gap-3 bg-teal-50 px-4 py-3 text-left text-teal-950 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-teal-700 focus-visible:-outline-offset-2">
      <span><strong className="block">My Responses{rows && <span className="ml-2 rounded-full bg-white px-2 text-sm">{rows.length}</span>}</strong><span className="text-sm">Review and improve your writing in this class</span></span><span aria-hidden="true" className="shrink-0 text-sm font-semibold">{open ? 'Hide ▴' : 'Show ▾'}</span>
    </button>
    <div id={panelId} hidden={!open} className="space-y-4 border-t border-teal-200 p-4">
      {loading && <p role="status">Loading responses…</p>}
      {error && <p role="alert">{error} <button className="underline" onClick={() => setRefresh(value => value + 1)}>Retry</button></p>}
      {saved && <p role="status" className="text-sm text-teal-800">{saved}</p>}
      {rows && <><div className="flex flex-wrap gap-3 text-sm">
        <label>Week<select className="ml-2 rounded border p-2" value={week} disabled={!!editing} onChange={e => setWeek(e.target.value)}><option value="all">All weeks</option>{weeks.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Type<select className="ml-2 rounded border p-2" value={type} disabled={!!editing} onChange={e => setType(e.target.value)}>{['all', 'Question', 'Reply', 'Thought', 'Connection'].map(value => <option key={value} value={value}>{value === 'all' ? 'All responses' : value}</option>)}</select></label>
      </div>
      {!filtered.length && <p className="text-sm text-gray-600">{rows.length ? 'No responses match these filters.' : 'Your contributions to assigned readings will appear here.'}</p>}
      {[...groups].map(([id, entries]) => <section key={id} className="space-y-3"><h3 className="font-semibold text-teal-950">{entries[0].reading.title}</h3>{entries.map(row => <article key={row.post.id} className="space-y-3 rounded-xl border border-slate-200 p-3 text-sm [overflow-wrap:anywhere]">
        <div className="flex flex-wrap justify-between gap-2"><strong>{kind(row.post)}</strong><span className="text-xs text-gray-500">{row.post.updatedAt ? 'Edited ' + date(row.post.updatedAt) : date(row.post.createdAt)}</span></div>
        {row.context.map(parent => <blockquote key={parent.id} className="border-l-2 border-teal-200 pl-3 text-gray-600"><strong className="block">{parent.teacher ? 'Teacher' : 'Discussion context'}</strong><p className="whitespace-pre-wrap">{parent.content}</p></blockquote>)}
        {editing === row.post.id ? <EditReadingContribution post={row.post} busy={busy} onCancel={() => setEditing(undefined)} onSave={async fields => {
          setBusy(true); setSaved('');
          try {
            await readingDiscussion('editReadingDiscussion', row.reading.textId, classId, { postId: row.post.id, ...fields });
            setSaved('Response saved. Any mark change requires reassessment.');
            window.dispatchEvent(new CustomEvent('class-materials-refreshed', { detail: classId }));
          } finally { setBusy(false); }
        }} /> : <><p className="whitespace-pre-wrap">{row.post.content}</p>{row.post.quotation && <blockquote className="border-l-2 pl-3 whitespace-pre-wrap">{row.post.quotation}{row.post.paragraph && <span className="block text-xs">Paragraph {row.post.paragraph}</span>}</blockquote>}</>}
        {row.teacherReplies.map(reply => <div key={reply.id} className="rounded-lg bg-teal-50 p-3"><strong>Teacher reply</strong><p className="whitespace-pre-wrap">{reply.content}</p></div>)}
        <div className="flex flex-wrap items-center gap-3">{row.canEdit ? editing !== row.post.id && <button className="min-h-11 font-semibold text-teal-800 underline" disabled={!!editing} onClick={() => { setEditing(row.post.id); setSaved(''); }}>Edit response</button> : <span className="text-gray-500">This thread is locked.</span>}<Link className="min-h-11 inline-flex items-center text-teal-800 underline" to={`/discussions/texts/${row.reading.textId}/${classId}`}>Open discussion</Link></div>
      </article>)}</section>)}
      </>}
    </div>
  </section>;
}
