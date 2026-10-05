import {useEffect,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {useLiveQuery} from 'dexie-react-hooks';
import {db} from '@/db/schema';
import {useAuth} from '@/contexts/AuthContext';
import {syncMyClassSessionsFromServer} from '@/services/class-session.service';
import {Button} from '@/components/common/Button';
import {StatusBadge} from '@/components/common/StatusBadge';
import {classLabel} from '@/utils/helpers';
import {Modal} from '@/components/common/Modal';
import {runCachedSync,SYNC_WINDOWS} from '@/services/sync-policy';
import {ReadingDiscussionsList} from '@/components/texts/ReadingDiscussionsList';

export function DiscussionsListPage() {
 const {user,isTeacher}=useAuth();
 const [searchParams]=useSearchParams();
 const [creating,setCreating]=useState(false),[showArchive,setShowArchive]=useState(()=>searchParams.get('archived')==='1');
 const userId=user?.$id;
 useEffect(()=>{if(userId)void runCachedSync(`sessions:${userId}`,SYNC_WINDOWS.catalog,()=>syncMyClassSessionsFromServer(userId));},[userId]);
 const archive=useLiveQuery(async()=>{
   if(!userId||!showArchive)return [];
   const classes=isTeacher?await db.classes.where('teacherId').equals(userId).toArray():await db.classes.where('$id').anyOf((await db.class_members.where('userId').equals(userId).toArray()).map(member=>member.classId)).toArray();
   if(!classes.length)return [];
   const sessions=await db.class_sessions.where('classId').anyOf(classes.map(cls=>cls.$id)).toArray();
   return sessions.filter(session=>session.discussionType!=='notes'&&session.discussionType!=='presentation'&&(isTeacher||session.status!=='draft'))
     .sort((a,b)=>b.sessionDate.localeCompare(a.sessionDate))
     .map(session=>({session,className:classLabel(classes.find(cls=>cls.$id===session.classId)!)}));
 },[userId,isTeacher,showArchive]);
 return <div className="mx-auto max-w-4xl p-4">
   <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold">Discussions</h1>{isTeacher&&<Button size="sm" onClick={()=>setCreating(true)}>Start discussion</Button>}</div>
   <ReadingDiscussionsList/>
   <div className="mt-8 border-t pt-4"><Button size="sm" variant="secondary" aria-expanded={showArchive} aria-controls="archived-discussions" onClick={()=>setShowArchive(value=>!value)}>{showArchive?'Hide archived Discussions':'View archived Discussions'}</Button>
     {showArchive&&<section id="archived-discussions" aria-label="Archived Discussions" className="mt-4 space-y-2">
       {archive===undefined?<p className="text-sm text-slate-500">Loading archived discussions…</p>:archive.length?archive.map(({session,className})=><Link key={session.$id} to={`/discussions/${session.$id}`} className="flex items-center justify-between gap-3 rounded-xl border p-3"><span><strong className="block text-sm">{session.title}</strong><span className="text-xs text-slate-500">{className} · {session.sessionDate}</span></span><StatusBadge status={session.status}/></Link>):<p className="text-sm text-slate-500">No archived discussions.</p>}
     </section>}
   </div>
   {creating&&user&&<StartTextDiscussionModal teacherId={user.$id} onClose={()=>setCreating(false)}/>}
 </div>;
}

export function StartTextDiscussionModal({teacherId,initialClassId='',onClose}:{teacherId:string;initialClassId?:string;onClose:()=>void}) {
 const navigate=useNavigate();
 const [classId,setClassId]=useState(initialClassId),[textId,setTextId]=useState('');
 const classes=useLiveQuery(()=>db.classes.where('teacherId').equals(teacherId).toArray(),[teacherId]);
 const selectedClassId=classId||classes?.[0]?.$id||'';
 const texts=useLiveQuery(async()=>{
   if(!selectedClassId)return [];
   const ids=[...new Set((await db.text_assignments.where('classId').equals(selectedClassId).toArray()).filter(item=>item.isAssignedReading===true).map(item=>item.textId))];
   return ids.length?db.texts.where('$id').anyOf(ids).and(text=>text.status!=='archived').toArray():[];
 },[selectedClassId]);
 return <Modal open onClose={onClose} title="Start text discussion"><div className="space-y-4">
   <label className="block text-sm">Class<select className={input} value={selectedClassId} onChange={event=>{setClassId(event.target.value);setTextId('');}}>{classes?.map(cls=><option key={cls.$id} value={cls.$id}>{classLabel(cls)}</option>)}</select></label>
   <label className="block text-sm">Text<select className={input} value={textId} onChange={event=>setTextId(event.target.value)}><option value="">Choose a text</option>{texts?.map(text=><option key={text.$id} value={text.$id}>{text.title}</option>)}</select></label>
   {texts?.length===0&&<p className="text-sm text-slate-500">Mark a text as Assigned Reading to discuss it here.</p>}
   <Button disabled={!selectedClassId||!texts?.some(text=>text.$id===textId)} onClick={()=>{navigate(`/discussions/texts/${textId}/${selectedClassId}`);onClose();}}>Open text discussion</Button>
 </div></Modal>;
}
const input='mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';
