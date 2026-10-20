import {STONE_CLASS_ID} from '@/services/stone.service';
import {useLiveQuery} from 'dexie-react-hooks';
import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {db} from '@/db/schema';
import PortfolioEditor from '@/components/ethics/PortfolioEditor';
import {EpisodeNotebook} from '@/components/ethics/EpisodePortfolio';
import {exportEntries,localEntries,principleQuestions,readPortfolio,syncNotebookDrafts,type Entry} from '@/services/ethics-portfolio.service';
export default function PrinciplesPortfolioPage(){const {user}=useAuth(),{classId=''}=useParams();return classId!==STONE_CLASS_ID?<main className="p-6">The Principles Portfolio is available only for Ethics and Leadership. <Link className="underline" to={`/classes/${classId}`}>Return to class</Link></main>:user?<Portfolio key={user.$id+classId} userId={user.$id} role={user.role} classId={classId}/>:null;}
function Portfolio({userId,role,classId}:{userId:string;role:string;classId:string}){
 const [entries,setEntries]=useState<Entry[]>([]),[editor,setEditor]=useState<Entry|null>(null),[teacher,setTeacher]=useState(false),[allowed,setAllowed]=useState(false),[status,setStatus]=useState('Checking access…'),[busy,setBusy]=useState(false),[selected,setSelected]=useState<string[]>([]);
 const deviceEntries=useLiveQuery(()=>localEntries(userId,classId),[userId,classId]);
 const shownEntries=teacher?entries:deviceEntries||entries;
 const refresh=async()=>{setBusy(true);try{await syncNotebookDrafts(userId,classId);const data=await readPortfolio(userId,classId);setTeacher(data.teacher);setEntries(data.teacher?data.entries:await localEntries(userId,classId));setStatus('Account entries updated.');}catch(e){setStatus('Showing this device’s saved entries. '+(e instanceof Error?e.message:''));}finally{setBusy(false);}};
 useEffect(()=>{let active=true;void(async()=>{const cls=await db.classes.get(classId),members=await db.class_members.where('[classId+userId]').equals([classId,userId]).toArray();const ownTeacher=cls?.teacherId===userId&&['teacher','admin'].includes(role);if(!ownTeacher&&!(role==='student'&&members.some(m=>m.role==='student'&&(!m.expiresAt||Date.parse(m.expiresAt)>Date.now())))){if(active)setStatus('Class membership required.');return;}if(!active)return;setAllowed(true);setTeacher(ownTeacher);setEntries(await localEntries(userId,classId));await refresh();})().catch(()=>{if(active)setStatus('Could not open this class. Please try again.');});return()=>{active=false;};},[userId,classId]);
 return <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
  <Link className="text-teal-900 underline" to={`/classes/${classId}/game`}>← Class episodes</Link>
  <h1 className="text-3xl font-bold">Principles Portfolio</h1>
  <p>Every Ethics and Leadership episode has five questions ready for you. Open any episode, including an earlier one, and expand its Principles Portfolio to begin. Return to your answers as your thinking develops.</p>
  <p>For your Principles Presentation, look for a principle that appears in several episodes, a challenge to it, and a moment when your thinking changed. Select entries below to export your evidence.</p>
  <p role="status" className="text-sm">{status}</p>
  {allowed&&<>
   <button className="rounded-lg border px-4 py-3" disabled={busy||!!editor} onClick={()=>void refresh()}>Refresh saved portfolio</button>
   {editor&&<section className="rounded-xl border bg-teal-50 p-4"><button className="mb-4 rounded border px-3 py-2" onClick={()=>setEditor(null)}>Close answers</button>{editor.source.kind==='episode-notes'?<EpisodeNotebook key={editor.key} userId={userId} classId={classId} source={editor.source} preview={editor.preview}/>:<PortfolioEditor key={editor.key} initial={editor}/>}</section>}
   <section className="space-y-3"><h2 className="text-xl font-semibold">{teacher?'Class answers · private teacher view':'All your saved answers'}</h2>
    {teacher&&<p>Portfolio questions are automatically available in every episode. No assignment or discussion-stage setup is needed.</p>}
    {!shownEntries.length&&<p>No answers yet. <Link className="underline" to={`/classes/${classId}/game`}>Choose an episode to begin.</Link></p>}
    {shownEntries.map(e=><article className="rounded-xl border p-4" key={e.userId+e.id}>
     <div className="flex items-start gap-3"><input aria-label={`Select ${e.source.title||'entry'} for export`} type="checkbox" checked={selected.includes(e.userId+e.id)} onChange={ev=>setSelected(s=>ev.target.checked?[...s,e.userId+e.id]:s.filter(k=>k!==e.userId+e.id))}/>
      <div className="min-w-0 flex-1"><h3 className="font-semibold">{e.source.title||'Reading draft'}</h3>
       <p className="text-sm">{teacher?`${e.studentName||'Student'} · `:''}{e.source.kind==='episode-notes'?`${e.answers.filter(a=>a.trim()).length}/5 answered`:'Earlier portfolio entry'} · Updated {new Date(e.updatedAt).toLocaleDateString()}{e.dirty?' · device changes pending':''}{e.preview?' · preview':''}</p>
       <details className="mt-3"><summary className="cursor-pointer">Read answers</summary>{e.answers.map((a,i)=><div key={i} className="my-3"><p className="font-semibold">{i+1}. {e.source.kind==='episode-notes'?principleQuestions[i]:['Idea or choice','Reasons and difficulty','Original judgment'][i]}</p><p className="whitespace-pre-wrap">{a||'Not answered yet'}</p></div>)}{e.reconsideration&&<p className="whitespace-pre-wrap"><strong>Earlier reconsideration:</strong> {e.reconsideration}</p>}</details>
       {!teacher&&<button disabled={!!editor} className="mt-3 rounded border px-3 py-2" onClick={()=>setEditor(e)}>Continue writing</button>}
      </div></div>
    </article>)}
    <button disabled={!selected.length} className="rounded-lg border px-4 py-3 disabled:opacity-50" onClick={()=>exportEntries(shownEntries.filter(e=>selected.includes(e.userId+e.id)))}>Export selected answers for my Principles Presentation</button>
   </section>
  </>}
 </main>;
}
