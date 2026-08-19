import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { classLabel } from '@/utils/helpers';
import { createText, paragraphsFromFile, setTextClasses, splitParagraphs, updateTextMetadata } from '@/services/text.service';
import type { Class, LearningText } from '@/types';

export function TextsPage() {
  const { user, isTeacher } = useAuth(); const [creating, setCreating] = useState(false); const [assigning, setAssigning] = useState<LearningText | null>(null); const [editing,setEditing]=useState<LearningText|null>(null);
  const classes = useLiveQuery(async () => user ? (isTeacher ? db.classes.where('teacherId').equals(user.$id).toArray() : Promise.all((await db.class_members.where('userId').equals(user.$id).toArray()).map(m => db.classes.get(m.classId))).then(x => x.filter(Boolean))) : [], [user?.$id, isTeacher]);
  const rows = useLiveQuery(async () => {
    if (!user) return [];
    const texts = isTeacher ? await db.texts.where('teacherId').equals(user.$id).toArray() : await (async () => { const ids = [...new Set((await db.text_assignments.where('classId').anyOf((classes || []).map(c => c!.$id)).toArray()).map(a => a.textId))]; return ids.length ? db.texts.where('$id').anyOf(ids).toArray() : []; })();
    return Promise.all(texts.map(async text => ({ text, assignments: await db.text_assignments.where('textId').equals(text.$id).toArray() })));
  }, [user?.$id, isTeacher, classes]);
  return <div className="p-4 max-w-4xl mx-auto space-y-5"><header className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Texts</h1><p className="text-sm text-gray-500">Read closely, then bring the text into Discussions.</p></div>{isTeacher && <Button onClick={() => setCreating(true)}>Upload text</Button>}</header>
    {rows?.length ? <TextsByWeek rows={rows} classes={classes||[]} isTeacher={isTeacher} onAssign={setAssigning} onEdit={setEditing}/> : <EmptyState title="No texts yet" message={isTeacher ? 'Upload a text for close reading and discussion.' : 'Assigned readings will appear here.'}/>}
    {creating && user && classes && <CreateTextModal teacherId={user.$id} classes={classes.map(c => ({id:c!.$id,name:classLabel(c)}))} onClose={() => setCreating(false)}/>} 
    {assigning && user && classes && <AssignTextModal text={assigning} userId={user.$id} classes={classes.map(c => ({id:c!.$id,name:classLabel(c)}))} onClose={() => setAssigning(null)}/>} 
    {editing&&user&&<EditTextModal text={editing} teacherId={user.$id} onClose={()=>setEditing(null)}/>}
  </div>;
}

function TextsByWeek({rows,classes,isTeacher,onAssign,onEdit}:{rows:Array<{text:LearningText;assignments:Array<{classId:string;assignedAt:string}>}>;classes:Array<Class|undefined>;isTeacher:boolean;onAssign:(text:LearningText)=>void;onEdit:(text:LearningText)=>void}) {
  const groups=new Map<string,typeof rows>(); for(const row of rows){const date=row.assignments.map(a=>a.assignedAt).sort()[0]||row.text.createdAt,key=weekKey(date);groups.set(key,[...(groups.get(key)||[]),row]);}
  const weeks=[...groups.entries()].sort((a,b)=>b[0].localeCompare(a[0])); const [open,setOpen]=useState<Set<string>>(new Set());
  return <div className="space-y-3">{weeks.map(([week,items])=>{const isOpen=open.has(week);return <div key={week}><button className="w-full rounded-lg border bg-white p-3 text-left font-semibold" onClick={()=>setOpen(current=>{const next=new Set(current);if(next.has(week))next.delete(week);else next.add(week);return next})}>{isOpen?'▾':'▸'} Week of {new Date(`${week}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})} <span className="text-sm font-normal text-gray-500">({items.length})</span></button>{isOpen&&<div className="mt-2 space-y-2">{items.map(({text,assignments})=><Card key={text.$id}><div className="flex justify-between gap-3"><Link to={`/texts/${text.$id}`}><h2 className="font-semibold">{text.title}</h2><p className="text-sm text-gray-500">{text.author||'Unknown author'} · {assignments.map(a=>classLabel(classes.find(c=>c?.$id===a.classId))).join(', ')||'Not assigned'}</p></Link>{isTeacher&&<div className="flex flex-wrap gap-2"><Link to={`/texts/${text.$id}/present`}><Button size="sm">Present</Button></Link><Button size="sm" variant="secondary" onClick={()=>onEdit(text)}>Edit</Button><Button size="sm" variant="secondary" onClick={()=>onAssign(text)}>Assign</Button></div>}</div></Card>)}</div>}</div>})}</div>;
}
function weekKey(value:string){const d=new Date(value),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10)}

function ClassChecks({ classes, selected, onChange }: {classes:Array<{id:string;name:string}>;selected:Set<string>;onChange:(s:Set<string>)=>void}) { return <div className="space-y-2">{classes.map(c => <label key={c.id} className="flex gap-2 text-sm"><input type="checkbox" checked={selected.has(c.id)} onChange={() => { const n=new Set(selected); if(n.has(c.id))n.delete(c.id);else n.add(c.id); onChange(n); }}/>{c.name}</label>)}</div>; }

function CreateTextModal({teacherId,classes,onClose}:{teacherId:string;classes:Array<{id:string;name:string}>;onClose:()=>void}) {
  const [title,setTitle]=useState(''); const [author,setAuthor]=useState(''); const [source,setSource]=useState(''); const [raw,setRaw]=useState(''); const [paragraphs,setParagraphs]=useState<string[]>([]); const [selected,setSelected]=useState(new Set<string>()); const [busy,setBusy]=useState(false); const preview=paragraphs.length?paragraphs:splitParagraphs(raw);
  return <Modal open onClose={onClose} title="Upload text"><div className="space-y-3 max-h-[75vh] overflow-auto"><input className={input} placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}/><input className={input} placeholder="Author" value={author} onChange={e=>setAuthor(e.target.value)}/><input className={input} placeholder="Source (optional)" value={source} onChange={e=>setSource(e.target.value)}/><input type="file" accept=".txt,.docx,text/plain" onChange={e=>{const f=e.target.files?.[0];if(f)void paragraphsFromFile(f).then(setParagraphs)}}/><textarea className={input} rows={8} placeholder="Or paste text here, with blank lines between paragraphs" value={raw} onChange={e=>{setRaw(e.target.value);setParagraphs([])}}/><ClassChecks classes={classes} selected={selected} onChange={setSelected}/><div><p className="text-sm font-medium">Paragraph preview ({preview.length})</p>{preview.map((p,i)=><textarea key={i} className={`${input} mt-2`} rows={3} value={p} onChange={e=>setParagraphs(preview.map((x,j)=>j===i?e.target.value:x))}/>)}</div><Button loading={busy} disabled={!title.trim()||!preview.length} onClick={()=>{setBusy(true);void createText({teacherId,title:title.trim(),author:author.trim(),source:source.trim(),paragraphs:preview,classIds:[...selected]}).then(onClose).finally(()=>setBusy(false))}}>Save text</Button></div></Modal>;
}

function EditTextModal({text,teacherId,onClose}:{text:LearningText;teacherId:string;onClose:()=>void}){const[title,setTitle]=useState(text.title),[author,setAuthor]=useState(text.author),[source,setSource]=useState(text.source);return <Modal open onClose={onClose} title="Edit text details"><div className="space-y-3"><input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"/><input className={input} value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Author"/><input className={input} value={source} onChange={e=>setSource(e.target.value)} placeholder="Source"/><p className="text-xs text-gray-500">Paragraph wording is preserved so existing student annotations stay attached to the correct paragraphs.</p><Button className="w-full" disabled={!title.trim()} onClick={()=>void updateTextMetadata(text.$id,teacherId,{title,author,source}).then(onClose)}>Save changes</Button></div></Modal>}

function AssignTextModal({text,userId,classes,onClose}:{text:LearningText;userId:string;classes:Array<{id:string;name:string}>;onClose:()=>void}) { const assignments=useLiveQuery(()=>db.text_assignments.where('textId').equals(text.$id).toArray(),[text.$id]); const [chosen,setChosen]=useState<Set<string>|null>(null); const selected=chosen||new Set(assignments?.map(a=>a.classId)||[]); return <Modal open onClose={onClose} title="Assign text"><div className="space-y-4"><ClassChecks classes={classes} selected={selected} onChange={setChosen}/><Button onClick={()=>void setTextClasses(text.$id,[...selected],userId).then(onClose)}>Save assignments</Button></div></Modal>; }
const input='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';
