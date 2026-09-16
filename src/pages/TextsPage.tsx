import { CreateTextModal } from '@/components/texts/CreateTextModal';
import { TextPurposeLabels } from '@/components/texts/TextPurpose';
import { CopyTextLinkButton } from '@/components/texts/CopyTextLinkButton';
import { textAssignmentAvailable } from '@/services/text-schedule';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { TextEditorModal } from '@/components/texts/TextEditorModal';
import { classLabel } from '@/utils/helpers';
import type { Class, LearningText } from '@/types';

export function TextsPage() {
  const { user, isTeacher } = useAuth(); const [creating, setCreating] = useState(false); const [editing,setEditing]=useState<LearningText|null>(null);
  const classes = useLiveQuery(async () => user ? (isTeacher ? db.classes.where('teacherId').equals(user.$id).toArray() : Promise.all((await db.class_members.where('userId').equals(user.$id).toArray()).map(m => db.classes.get(m.classId))).then(x => x.filter(Boolean))) : [], [user?.$id, isTeacher]);
  const rows = useLiveQuery(async () => {
    if (!user) return [];
    const texts = isTeacher ? await db.texts.where('teacherId').equals(user.$id).toArray() : await (async () => { const ids = [...new Set((await db.text_assignments.where('classId').anyOf((classes || []).map(c => c!.$id)).toArray()).filter(a=>textAssignmentAvailable(a)).map(a => a.textId))]; return ids.length ? db.texts.where('$id').anyOf(ids).toArray() : []; })();
    return Promise.all(texts.map(async text => ({ text, assignments: (await db.text_assignments.where('textId').equals(text.$id).toArray()).filter(a=>isTeacher||((classes||[]).some(c=>c?.$id===a.classId)&&textAssignmentAvailable(a))) })));
  }, [user?.$id, isTeacher, classes]);
  return <div className="p-4 max-w-4xl mx-auto space-y-5"><header className="space-y-5"><div><h1 className="text-2xl font-bold">Texts</h1><p className="text-sm text-gray-500">Read closely, then bring the text into Discussions.</p></div>{isTeacher && <div className="flex justify-center"><Button size="lg" className="min-h-20 w-full max-w-sm rounded-2xl text-xl shadow-sm" onClick={() => setCreating(true)}>Add a Text</Button></div>}</header>
    {rows?.length ? <TextsByWeek rows={rows} classes={classes||[]} isTeacher={isTeacher} onEdit={setEditing}/> : <EmptyState title="No texts yet" message={isTeacher ? 'Upload a text for close reading and discussion.' : 'Assigned readings will appear here.'}/>}
    {creating && user && classes && <CreateTextModal teacherId={user.$id} classes={classes.map(c => ({id:c!.$id,name:classLabel(c)}))} onClose={() => setCreating(false)}/>}
    {editing&&user&&classes&&<TextEditorModal text={editing} teacherId={user.$id} classes={classes.map(c=>({id:c!.$id,name:classLabel(c)}))} onClose={()=>setEditing(null)}/>}
  </div>;
}

function TextsByWeek({rows,classes,isTeacher,onEdit}:{rows:Array<{text:LearningText;assignments:Array<{classId:string;assignedAt:string;isCopywork?:boolean;isAssignedReading?:boolean}>}>;classes:Array<Class|undefined>;isTeacher:boolean;onEdit:(text:LearningText)=>void}) {
  const groups=new Map<string,typeof rows>(); for(const row of rows){const date=row.assignments.map(a=>a.assignedAt).sort()[0]||row.text.createdAt,key=weekKey(date);groups.set(key,[...(groups.get(key)||[]),row]);}
  const weeks=[...groups.entries()].sort((a,b)=>b[0].localeCompare(a[0])); const [open,setOpen]=useState<Set<string>>(new Set());
  return <div className="space-y-3">{weeks.map(([week,items])=>{const isOpen=open.has(week);return <div key={week}><button className="w-full rounded-lg border bg-white p-3 text-left font-semibold" onClick={()=>setOpen(current=>{const next=new Set(current);if(next.has(week))next.delete(week);else next.add(week);return next})}>{isOpen?'▾':'▸'} Week of {new Date(`${week}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})} <span className="text-sm font-normal text-gray-500">({items.length})</span></button>{isOpen&&<div className="mt-2 space-y-2">{items.map(({text,assignments})=><Card key={text.$id}><div className="flex justify-between gap-3"><Link to={`/texts/${text.$id}`}><h2 className="font-semibold">{text.title}</h2><p className="text-sm text-gray-500">{text.author||'Unknown author'} · {assignments.map(a=>classLabel(classes.find(c=>c?.$id===a.classId))).join(', ')||'Not assigned'}</p><span className="mt-2 flex flex-wrap gap-2">{assignments.map(a=><span key={a.classId} className="text-xs">{assignments.length>1&&`${classLabel(classes.find(c=>c?.$id===a.classId))}: `}<TextPurposeLabels value={a}/></span>)}</span></Link>{isTeacher&&<div className="flex flex-wrap gap-2"><CopyTextLinkButton textId={text.$id} title={text.title}/><Link to={`/texts/${text.$id}/present`}><Button size="sm">Present</Button></Link><Button size="sm" variant="secondary" onClick={()=>onEdit(text)}>Edit text & access</Button></div>}</div></Card>)}</div>}</div>})}</div>;
}
function weekKey(value:string){const d=new Date(value),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10)}
