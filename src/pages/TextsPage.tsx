import { CopyTextLinkButton } from '@/components/texts/CopyTextLinkButton';
import { ClassReadingDate } from '@/components/texts/ClassReadingDate';
import { textAssignmentAvailable } from '@/services/text-schedule';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { Markdown } from '@/components/common/Markdown';
import { MarkdownPasteEditor } from '@/components/common/MarkdownPasteEditor';
import { TextEditorModal } from '@/components/texts/TextEditorModal';
import { TextFileUpload } from '@/components/texts/TextFileUpload';
import { classLabel } from '@/utils/helpers';
import { createText, splitParagraphs } from '@/services/text.service';
import type { Class, LearningText } from '@/types';

export function TextsPage() {
  const { user, isTeacher } = useAuth(); const [creating, setCreating] = useState(false); const [editing,setEditing]=useState<LearningText|null>(null);
  const classes = useLiveQuery(async () => user ? (isTeacher ? db.classes.where('teacherId').equals(user.$id).toArray() : Promise.all((await db.class_members.where('userId').equals(user.$id).toArray()).map(m => db.classes.get(m.classId))).then(x => x.filter(Boolean))) : [], [user?.$id, isTeacher]);
  const rows = useLiveQuery(async () => {
    if (!user) return [];
    const texts = isTeacher ? await db.texts.where('teacherId').equals(user.$id).toArray() : await (async () => { const ids = [...new Set((await db.text_assignments.where('classId').anyOf((classes || []).map(c => c!.$id)).toArray()).filter(a=>textAssignmentAvailable(a)).map(a => a.textId))]; return ids.length ? db.texts.where('$id').anyOf(ids).toArray() : []; })();
    return Promise.all(texts.map(async text => ({ text, assignments: (await db.text_assignments.where('textId').equals(text.$id).toArray()).filter(a=>isTeacher||((classes||[]).some(c=>c?.$id===a.classId)&&textAssignmentAvailable(a))) })));
  }, [user?.$id, isTeacher, classes]);
  return <div className="p-4 max-w-4xl mx-auto space-y-5"><header className="space-y-5"><div><h1 className="text-2xl font-bold">Texts</h1><p className="text-sm text-gray-500">Read closely, then bring the text into Discussions.</p></div>{isTeacher && <div className="flex justify-center"><Button size="lg" className="min-h-20 w-full max-w-sm rounded-2xl text-xl shadow-sm" onClick={() => setCreating(true)}>Upload a text</Button></div>}</header>
    {rows?.length ? <TextsByWeek rows={rows} classes={classes||[]} isTeacher={isTeacher} onEdit={setEditing}/> : <EmptyState title="No texts yet" message={isTeacher ? 'Upload a text for close reading and discussion.' : 'Assigned readings will appear here.'}/>}
    {creating && user && classes && <CreateTextModal teacherId={user.$id} classes={classes.map(c => ({id:c!.$id,name:classLabel(c)}))} onClose={() => setCreating(false)}/>}
    {editing&&user&&classes&&<TextEditorModal text={editing} teacherId={user.$id} classes={classes.map(c=>({id:c!.$id,name:classLabel(c)}))} onClose={()=>setEditing(null)}/>}
  </div>;
}

function TextsByWeek({rows,classes,isTeacher,onEdit}:{rows:Array<{text:LearningText;assignments:Array<{classId:string;assignedAt:string}>}>;classes:Array<Class|undefined>;isTeacher:boolean;onEdit:(text:LearningText)=>void}) {
  const groups=new Map<string,typeof rows>(); for(const row of rows){const date=row.assignments.map(a=>a.assignedAt).sort()[0]||row.text.createdAt,key=weekKey(date);groups.set(key,[...(groups.get(key)||[]),row]);}
  const weeks=[...groups.entries()].sort((a,b)=>b[0].localeCompare(a[0])); const [open,setOpen]=useState<Set<string>>(new Set());
  return <div className="space-y-3">{weeks.map(([week,items])=>{const isOpen=open.has(week);return <div key={week}><button className="w-full rounded-lg border bg-white p-3 text-left font-semibold" onClick={()=>setOpen(current=>{const next=new Set(current);if(next.has(week))next.delete(week);else next.add(week);return next})}>{isOpen?'▾':'▸'} Week of {new Date(`${week}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})} <span className="text-sm font-normal text-gray-500">({items.length})</span></button>{isOpen&&<div className="mt-2 space-y-2">{items.map(({text,assignments})=><Card key={text.$id}><div className="flex justify-between gap-3"><Link to={`/texts/${text.$id}`}><h2 className="font-semibold">{text.title}</h2><p className="text-sm text-gray-500">{text.author||'Unknown author'} · {assignments.map(a=>classLabel(classes.find(c=>c?.$id===a.classId))).join(', ')||'Not assigned'}</p></Link>{isTeacher&&<div className="flex flex-wrap gap-2"><CopyTextLinkButton textId={text.$id} title={text.title}/><Link to={`/texts/${text.$id}/present`}><Button size="sm">Present</Button></Link><Button size="sm" variant="secondary" onClick={()=>onEdit(text)}>Edit text & access</Button></div>}</div></Card>)}</div>}</div>})}</div>;
}
function weekKey(value:string){const d=new Date(value),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10)}


function CreateTextModal({teacherId,classes,onClose}:{teacherId:string;classes:Array<{id:string;name:string}>;onClose:()=>void}) {
  const [title,setTitle]=useState(''); const [author,setAuthor]=useState(''); const [source,setSource]=useState(''); const [mode,setMode]=useState<'full'|'link'>('full'); const [externalUrl,setExternalUrl]=useState(''); const [raw,setRaw]=useState(''); const [paragraphs,setParagraphs]=useState<string[]>([]); const [selected,setSelected]=useState(new Set<string>()); const [busy,setBusy]=useState(false); const preview=paragraphs.length?paragraphs:splitParagraphs(raw);
  const [dates,setDates]=useState<Record<string,string>>({});
  const [originalPdf,setOriginalPdf]=useState<File>(); const [saveError,setSaveError]=useState('');
  const valid = title.trim() && (mode==='link' ? /^https?:\/\//i.test(externalUrl) : (preview.length > 0 || Boolean(originalPdf)));
  return <Modal open onClose={()=>!busy&&onClose()} title="Add text"><div className="space-y-3 max-h-[75vh] overflow-auto">{saveError&&<p role="alert" className="text-sm text-red-700">{saveError}</p>}<div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1"><button className={`rounded-md px-3 py-2 text-sm font-medium ${mode==='full'?'bg-white shadow-sm':''}`} onClick={()=>setMode('full')}>Full text</button><button className={`rounded-md px-3 py-2 text-sm font-medium ${mode==='link'?'bg-white shadow-sm':''}`} onClick={()=>setMode('link')}>Link only</button></div><input className={input} placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}/><input className={input} placeholder="Author" value={author} onChange={e=>setAuthor(e.target.value)}/><input className={input} placeholder="Source (optional)" value={source} onChange={e=>setSource(e.target.value)}/>{mode==='link'?<input className={input} type="url" placeholder="https://…" value={externalUrl} onChange={e=>setExternalUrl(e.target.value)}/>:<><TextFileUpload onBusyChange={setBusy} onImport={(content,file)=>{setRaw(content);setParagraphs([]);setOriginalPdf(file)}}/><MarkdownPasteEditor value={raw} onChange={value=>{setRaw(value);setParagraphs([])}} rows={10}/><div><p className="text-sm font-medium">Paragraph preview ({preview.length})</p><div className="mt-2 space-y-2">{preview.map((p,i)=><div key={i} className="rounded-lg border bg-white p-3"><p className="mb-2 text-xs text-gray-400">Paragraph {i+1}</p><Markdown content={p}/></div>)}</div></div></>}<div className="space-y-3">{classes.map(c=><div key={c.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3"><label className="flex gap-2 text-sm"><input type="checkbox" checked={selected.has(c.id)} onChange={()=>setSelected(current=>{const next=new Set(current);if(next.has(c.id))next.delete(c.id);else next.add(c.id);return next})}/>{c.name}</label><ClassReadingDate name={c.name} value={dates[c.id]||''} onChange={value=>setDates(current=>({...current,[c.id]:value}))} disabled={!selected.has(c.id)}/></div>)}</div><Button loading={busy} disabled={!valid} onClick={()=>{setBusy(true);void createText({teacherId,title:title.trim(),author:author.trim(),source:source.trim(),paragraphs:mode==='full'?preview:[],originalPdf:mode==='full'?originalPdf:undefined,classIds:[...selected],classDates:dates,contentMode:mode,externalUrl:mode==='link'?externalUrl.trim():''}).then(onClose).catch(cause=>setSaveError(cause instanceof Error?cause.message:'Could not save the text.')).finally(()=>setBusy(false))}}>Save text</Button></div></Modal>;
}
const input='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';
