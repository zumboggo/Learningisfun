import { ClassReadingDate } from './ClassReadingDate';
import { textSchedule } from '@/services/text-schedule';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { MarkdownPasteEditor } from '@/components/common/MarkdownPasteEditor';
import { loadTextForEditing, splitParagraphs, updateTextAssignments, updateTextMetadata, updateTextParagraphs } from '@/services/text.service';
import type { LearningText, TextAssignment, TextParagraph } from '@/types';

export function TextEditorModal({text,teacherId,classes,onClose}:{text:LearningText;teacherId:string;classes:Array<{id:string;name:string}>;onClose:()=>void}){
  const [loaded, setLoaded] = useState<{textId:string;paragraphs:TextParagraph[]}|null>(null), [loadError, setLoadError] = useState('');
  useEffect(() => { let active = true; void loadTextForEditing(text.$id).then(paragraphs => { if(active)setLoaded({textId:text.$id,paragraphs}); }).catch(() => { if(active)setLoadError('Could not load the complete text. Reconnect and reopen this editor before making changes.'); }); return () => { active = false; }; }, [text.$id]);
  const paragraphs=loaded?.textId===text.$id ? loaded.paragraphs : undefined;
  const assignments=useLiveQuery(()=>db.text_assignments.where('textId').equals(text.$id).toArray(),[text.$id]);
  if(loadError)return <Modal open onClose={onClose} title="Edit text"><p role="alert">{loadError}</p></Modal>;
  if(!loaded||!paragraphs||!assignments)return <Modal open onClose={onClose} title="Edit text"><p className="p-4 text-sm text-gray-500">Loading text…</p></Modal>;
  return <TextEditorForm key={text.$id} text={text} teacherId={teacherId} classes={classes} paragraphs={paragraphs} assignments={assignments} onClose={onClose}/>;
}

function TextEditorForm({text,teacherId,classes,paragraphs,assignments,onClose}:{text:LearningText;teacherId:string;classes:Array<{id:string;name:string}>;paragraphs:TextParagraph[];assignments:TextAssignment[];onClose:()=>void}){
  const[title,setTitle]=useState(text.title),[author,setAuthor]=useState(text.author),[source,setSource]=useState(text.source),[externalUrl,setExternalUrl]=useState(text.externalUrl||'');
  const[raw,setRaw]=useState(paragraphs.map(row=>row.content).join('\n\n')),[selected,setSelected]=useState(new Set(assignments.map(row=>row.classId))),[dates,setDates]=useState<Record<string,string>>(Object.fromEntries(assignments.map(row=>[row.classId,row.dueDate||'']))),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const chosen=selected,content=raw,parsed=splitParagraphs(content);
  const toggle=(classId:string)=>{const next=new Set(chosen);if(next.has(classId))next.delete(classId);else next.add(classId);setSelected(next)};
  const valid=Boolean(title.trim())&&(text.contentMode==='link'?(!externalUrl.trim()||/^https?:\/\//i.test(externalUrl)):parsed.length>0);
  const save=async()=>{setBusy(true);setError('');try{if(text.contentMode!=='link')await updateTextParagraphs(text.$id,teacherId,parsed);await updateTextMetadata(text.$id,teacherId,{title,author,source,externalUrl});await updateTextAssignments(text.$id,teacherId,[...chosen].map(classId=>({classId,...textSchedule(dates[classId]||'',assignments.find(row=>row.classId===classId&&!row.dueDate)?.assignedAt)})));onClose()}catch(cause){setError(cause instanceof Error?cause.message:'Could not save this text.')}finally{setBusy(false)}};
  return <Modal open onClose={()=>!busy&&onClose()} title="Edit text"><div className="max-h-[78vh] space-y-4 overflow-y-auto pr-1">{error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium sm:col-span-2">Title<input className={input} value={title} onChange={event=>setTitle(event.target.value)}/></label><label className="text-sm font-medium">Author<input className={input} value={author} onChange={event=>setAuthor(event.target.value)}/></label><label className="text-sm font-medium">Source<input className={input} value={source} onChange={event=>setSource(event.target.value)}/></label></div>{text.contentMode==='link'?<label className="block text-sm font-medium">Link<input type="url" className={input} value={externalUrl} onChange={event=>setExternalUrl(event.target.value)} placeholder="https://…"/></label>:<section><h3 className="mb-2 font-semibold">Text</h3><MarkdownPasteEditor value={content} onChange={setRaw} rows={14}/><p className="mt-2 text-xs text-gray-500">{parsed.length} paragraph{parsed.length===1?'':'s'} · Existing paragraph positions are preserved so annotations stay attached. Annotated paragraphs cannot be removed.</p></section>}<section className="space-y-2"><div><h3 className="font-semibold">Class access and reading date</h3><p className="text-xs text-gray-500">Uncheck a class to remove access. Each class can have its own date.</p></div>{classes.map(cls=><div key={cls.id} className="grid grid-cols-[minmax(0,1fr)_145px] items-center gap-3 rounded-lg border p-3"><label className="flex min-w-0 items-center gap-3 text-sm font-medium"><input type="checkbox" className="h-4 w-4" checked={chosen.has(cls.id)} onChange={()=>toggle(cls.id)}/><span className="truncate">{cls.name}</span></label><ClassReadingDate name={cls.name} value={dates[cls.id]||''} disabled={!chosen.has(cls.id)} onChange={value=>setDates(current=>({...current,[cls.id]:value}))}/></div>)}</section><Button className="w-full" loading={busy} disabled={!valid} onClick={()=>void save()}>Save all changes</Button></div></Modal>;
}
const input='mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';
