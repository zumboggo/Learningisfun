import {STONE_CLASS_ID} from '@/services/stone.service';
import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {episodeNotesEntry,exportEntries,portfolioDb,questionsForEpisode,queueEntry,readPortfolio,saveDraft,syncPortfolio,type Entry,type EpisodeNotesSource} from '@/services/ethics-portfolio.service';

type Props={userId:string;classId:string;source:EpisodeNotesSource;preview?:boolean;showSubmitted?:boolean};
export default function EpisodePortfolio(props:Props){
 const [opened,setOpened]=useState(false);
 if(props.classId!==STONE_CLASS_ID)return null;
 return <details className="my-4 rounded-xl border border-teal-200 bg-teal-50 p-4" onToggle={e=>setOpened(e.currentTarget.open)}>
  <summary className="cursor-pointer font-semibold text-teal-950">Principles Portfolio · Five questions about this episode</summary>
  {opened&&<EpisodeNotebook key={props.userId+props.classId+props.source.format+props.source.episode} {...props}/>}
 </details>;
}
export function EpisodeNotebook(props:Props){
 return props.classId===STONE_CLASS_ID?<EthicsNotebook {...props}/>:null;
}
function EthicsNotebook({userId,classId,source,preview=false,showSubmitted=false}:Props){
 const [entry,setEntry]=useState<Entry|null>(null),[status,setStatus]=useState('Opening your saved answers…');
 const [busy,setBusy]=useState(false),[hidden,setHidden]=useState(false);
 const current=useRef<Entry|null>(null),chain=useRef(Promise.resolve()),flushRef=useRef<()=>Promise<void>>(async()=>{});
 useEffect(()=>{
  let active=true,flushing=false,storageFailed=false;
  const report=(message:string)=>{if(active)setStatus(message);};
  const performFlush=async()=>{
   if(flushing)return;
   flushing=true;

   try{
    if(!preview){
     if(!navigator.onLine){await chain.current;report('Saved on this device · waiting for a connection.');return;}
     // Finish an older pending snapshot before creating another; offline edits coalesce locally.
     await syncPortfolio(userId,classId);
    }
    await (chain.current=chain.current.then(async()=>{
     const e=current.current;
     if(!e?.dirty)return;
     const stored=await portfolioDb.entries.get(e.key);
     if(!stored?.dirty)return;
     const next=await queueEntry(stored);
     const latest=current.current!;
     current.current={...latest,revision:next.revision,dirty:JSON.stringify(latest.answers)!==JSON.stringify(next.answers)};
     if(active)setEntry(current.current);
    }));
    if(storageFailed)throw Error('Device save failed. Keep this page open and export your answers.');
    if(!preview){
     if(!navigator.onLine){report('Saved on this device · waiting for a connection.');return;}
     await syncPortfolio(userId,classId);
    }
    report(current.current?.dirty?'Latest changes saved on this device · account save pending.':preview?'Teacher preview saved on this device.':'Saved to your account.');
   }catch(e){report('Save pending · '+(e instanceof Error?e.message:String(e)));}
   finally{flushing=false;}
  };
  let pending:Promise<void>|null=null;
  const flush=():Promise<void>=>{
   if(pending)return pending;
   const revision=current.current?.revision;
   return pending=performFlush().finally(()=>{pending=null;if(!active&&current.current?.dirty&&current.current.revision!==revision&&!storageFailed)void flush();});
  };
  flushRef.current=flush;
  void(async()=>{
   try{
    let e=await episodeNotesEntry(userId,classId,source,preview);
    let connected=preview;
    if(!preview&&navigator.onLine){try{await syncPortfolio(userId,classId);await readPortfolio(userId,classId);e=await portfolioDb.entries.get(e.key)||e;connected=true;}catch{ /* Local writing remains available while disconnected. */ }}
    if(!active)return;current.current=e;setEntry(e);setHidden(e.submitted&&!showSubmitted);
    report(preview?'Teacher preview · saved only on this device.':connected?'Ready · answers save automatically.':'Account unavailable · answers will save on this device until synchronization succeeds.');
   }catch{report('Device storage unavailable. Reopen this page before writing.');}
  })();
  const online=()=>void flush(),hidden=()=>{if(document.visibilityState==='hidden')void flush();};
  const timer=window.setInterval(()=>{if(current.current)void flush();},60000);
  window.addEventListener('online',online);document.addEventListener('visibilitychange',hidden);
  const beforeUnload=(e:BeforeUnloadEvent)=>{if(current.current?.dirty){e.preventDefault();e.returnValue='';}void flush();};
  window.addEventListener('beforeunload',beforeUnload);
  // Updates are serialized with queueing, so typing during an account save retains the new revision.
  edit.current=(answers:string[])=>{
   if(current.current){current.current={...current.current,answers,dirty:true};setEntry(current.current);}
   report('Saving on this device…');
   chain.current=chain.current.catch(()=>{}).then(async()=>{
    if(!current.current)return;
    const next={...current.current,answers,dirty:true};
    await saveDraft(next);storageFailed=false;
    report('Saved on this device · account saves every minute while changed.');
   }).catch(()=>{storageFailed=true;report('Device save failed. Keep this page open and export your answers.');});
  };
  return()=>{active=false;clearInterval(timer);window.removeEventListener('online',online);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('beforeunload',beforeUnload);void flush();};
 },[userId,classId,source.episode,source.format,preview,showSubmitted]);
 const submit=async()=>{
  setBusy(true);
  try{
   await flushRef.current();await chain.current;
   const latest=current.current;if(!latest)return;
   const stored=await portfolioDb.entries.get(latest.key);
   if(!stored||JSON.stringify(stored.answers)!==JSON.stringify(latest.answers))throw Error('Device save incomplete. Please retry or export your answers.');
   const next=await queueEntry({...stored,submitted:true,submittedAt:stored.submittedAt||new Date().toISOString()});
   current.current=next;setEntry(next);setHidden(true);
   setStatus(preview?'Preview submitted on this device.':'Submitted on this device · account synchronization pending.');
   if(!preview&&navigator.onLine){await syncPortfolio(userId,classId);setStatus('Submitted. You can read your answers in See all answers.');}
  }catch(e){setStatus('Your answers are retained · '+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(false);}
 };
 const edit=useRef<(answers:string[])=>void>(()=>{});
 return <section className="mt-4 space-y-4" aria-label="Episode principles answers">
  <h2 className="text-xl font-semibold">{source.title}</h2>
  <p>Return to these answers whenever you like, including for earlier episodes. Use specific moments from the story. Your reasoning can change as you learn.</p>
  <p className="text-sm">Private to you and your teacher. These answers do not affect your game score. {preview?'Teacher preview.':'Your saved answers will help you build your Principles Presentation.'}</p>
  {entry&&!hidden&&questionsForEpisode(source).map((question,i)=><label key={i} className="block font-medium">{i+1}. {question}<textarea className="mt-2 block w-full rounded-lg border border-teal-200 bg-white p-3 font-normal" disabled={busy} rows={3} maxLength={6000} value={entry.answers[i]||''} onChange={e=>edit.current(Array.from({length:5},(_,j)=>j===i?e.target.value:current.current?.answers[j]||''))}/></label>)}
  {hidden&&<p>Your answers have been submitted. Open See all answers whenever you want to read them.</p>}
  <p role="status" className="text-sm">{status}</p>
  {entry&&<div className="flex flex-wrap gap-4">{!hidden&&<button disabled={busy} className="rounded border px-3 py-2 disabled:opacity-50" onClick={()=>void submit()}>{busy?'Submitting…':'Submit'}</button>}<button className="rounded border px-3 py-2" onClick={()=>exportEntries([current.current||entry])}>Export these answers</button><Link className="px-3 py-2 underline" to={`/classes/${classId}/principles`}>See all answers</Link></div>}
 </section>;
}
