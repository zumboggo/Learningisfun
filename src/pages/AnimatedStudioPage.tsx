import './episode-studio.css';
import EpisodeAuthoringPanel from '@/components/animated/EpisodeAuthoringPanel';
import EpisodePublicSharing from '@/components/animated/EpisodePublicSharing';
import {invalidateAnimatedLibrary} from '@/services/use-animated-library';
import {useEffect,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useLiveQuery} from 'dexie-react-hooks';
import {db} from '@/db/schema';
import {useAuth} from '@/contexts/AuthContext';
import StoryPlayer from '@/components/animated/StoryPlayer';
import {loadStoryCache,saveStoryCache,animatedCall,downloadBlob,exportStory,importStory,packageSize} from '@/services/animated-stories';
import {validatePackage,type StoryPackage} from '../../functions/learning-content/src/story-engine.js';
export default function AnimatedStudioPage(){const {user}=useAuth();return user&&['teacher','admin'].includes(user.role)?<Studio key={user.$id} userId={user.$id}/>:<p>Teacher account required.</p>;}
function Studio({userId}:{userId:string}){
 const [query,setQuery]=useSearchParams(),[id,setId]=useState(query.get('draft')||crypto.randomUUID()),[pack,setPack]=useState<StoryPackage|null>(null),[revision,setRevision]=useState(0),[status,setStatus]=useState('Opening studio…'),[preview,setPreview]=useState(false),[busy,setBusy]=useState(false),[classId,setClassId]=useState(''),[date,setDate]=useState(''),[published,setPublished]=useState<any>(null),[details,setDetails]=useState(false);

 const classes=useLiveQuery(()=>db.classes.where('teacherId').equals(userId).toArray(),[userId],[]),loaded=useRef(false),saving=useRef(false),latest=useRef(pack);latest.current=pack;
 const savedPack=useRef<StoryPackage|null>(null),revisionRef=useRef(revision);revisionRef.current=revision;
 const key=`animated-draft:${userId}:${id}`;
 useEffect(()=>{let alive=true;setPublished(null);loaded.current=false;savedPack.current=null;void(async()=>{try{const local=await loadStoryCache(key);if(local){const saved=local;if(alive){setPack(saved.pack);setRevision(saved.revision);setStatus('Recovered local draft');}}else if(query.get('draft')){const d=await animatedCall('animatedReadDraft',{id});if(alive){savedPack.current=d.pack;revisionRef.current=d.revision;setPack(d.pack);setRevision(d.revision);setStatus('Draft loaded');}}else{const p=await fetch(import.meta.env.BASE_URL+'stories/animated/kevin-starter.json').then(r=>r.json());if(alive){setPack({...p,format:2,title:'My episode',description:'',profile:'general',template:'neutral',assessmentMode:'quiz',script:'story 2\nlabel opening\nI: A new adventure begins.\nend'});setStatus('Your next adventure starts here');}}loaded.current=true;if(alive)setQuery({draft:id},{replace:true});}catch(e){if(alive)setStatus(String(e));}})();return()=>{alive=false;};},[id,userId]);
 useEffect(()=>{if(!pack||!loaded.current)return;void saveStoryCache(key,{pack,revision}).catch(()=>setStatus('Local storage is full. Save to your account or export a ZIP.'));},[pack]);
 const save=async()=>{
  const snapshot=latest.current;if(!snapshot||saving.current)return;
  if(savedPack.current===snapshot)return {id,revision:revisionRef.current};
  saving.current=true;setBusy(true);
  try{
   let d;
   try{d=await animatedCall('animatedSaveDraft',{id,revision:revisionRef.current,pack:snapshot});}
   catch(error){
    // An earlier save may have succeeded before its response was lost. Reconcile
    // only identical content; never overwrite a genuinely competing teacher edit.
    if(!String(error).includes('Draft changed elsewhere'))throw error;
    const remote=await animatedCall('animatedReadDraft',{id});
    if(JSON.stringify(remote.pack)!==JSON.stringify(snapshot))throw error;
    d=remote;
   }
   savedPack.current=snapshot;revisionRef.current=d.revision;setRevision(d.revision);
   await saveStoryCache(key,{pack:latest.current,revision:d.revision});
   setQuery({draft:id},{replace:true});setStatus('Draft saved to your account');return d;
  }catch(e){setStatus(String(e));return null;}finally{saving.current=false;setBusy(false);}
 };
 useEffect(()=>{if(!pack||!loaded.current||savedPack.current===pack)return;const t=setTimeout(()=>{if(navigator.onLine)void save();},3000);return()=>clearTimeout(t);},[pack,revision]);
 if(!pack)return <main className="p-6"><p role="status">{status}</p></main>;
 const validation=validatePackage(pack,{requireEnglishCornerWriting:true}),edit=(p:Partial<StoryPackage>)=>{setPublished(null);setPack({...pack,...p,...(p.script?.startsWith('story 2\n')?{format:2 as const}:{})});setPreview(false);};
 const publish=async()=>{const snapshot=latest.current;const d=await save();if(!d)return;setBusy(true);try{const v=await animatedCall('animatedPublish',{id,revision:d.revision});if(latest.current!==snapshot){setStatus('Published snapshot saved. The draft has changed; publish again before assigning.');return;}setPublished(v);setStatus('Published version '+v.version+' · ready to assign');}catch(e){setStatus(String(e));}finally{setBusy(false);}};
 return <main className="episode-studio"><div className="studio-topline"><Link to="/game">← The Game</Link><span role="status">{status}</span></div><header className="studio-heading"><p className="studio-eyebrow">EPISODE STUDIO</p><h1>Every adventure<br/>starts with an idea.</h1><p>Imagine it. Talk it through. Bring your story to life.</p></header><div className="studio-toolbar"><button disabled={busy} onClick={()=>void save()}>Save draft</button><button onClick={async()=>{const newId=crypto.randomUUID();await saveStoryCache(`animated-draft:${userId}:${newId}`,{pack:{...pack,title:pack.title+' — copy'},revision:0});setRevision(0);setId(newId);setQuery({draft:newId});}}>Duplicate</button><button onClick={()=>void exportStory(pack).then(blob=>downloadBlob(blob,'episode.zip')).catch(e=>setStatus(String(e)))}>Export ZIP</button><label>Import ZIP <input type="file" accept=".zip" onChange={e=>{const f=e.target.files?.[0];if(f)void importStory(f).then(p=>edit(p)).catch(e=>setStatus(String(e)));}}/></label><button onClick={()=>setPreview(!preview)} disabled={!!validation.errors.length}>{preview?'Close preview':'Play preview'}</button></div>
 <div hidden={preview}><EpisodeAuthoringPanel key={id} pack={pack} onChange={edit} storageKey={key}/></div>
 {preview&&<StoryPlayer key={id+revision} pack={pack} debug/>}
 <section className="studio-review"><div className="studio-review-heading"><h2>{pack.authoring?.generated?'Your adventure is ready':'Episode details'}</h2><button onClick={()=>setDetails(!details)}>{details?'Hide details':'View details'}</button></div><label>Episode title<input value={pack.title} onChange={e=>edit({title:e.target.value})}/></label>{pack.description&&<p>{pack.description}</p>}{details&&<><h3>Opening context</h3>{pack.context?.map((text,i)=><p key={i}>{text}</p>)}<h3>Knowledge questions</h3>{pack.quiz.map((q,i)=><div key={i}><p>{i+1}. {q.prompt}</p><p>{q.explanation}</p></div>)}{pack.sources?.length? <><h3>Sources to review</h3>{pack.sources.map((source,i)=><p key={i}>{source}</p>)}</>:null}<p>{(packageSize(pack)/1000000).toFixed(2)} / 5 MB</p></>}{pack.authoring?.sourceReviewRequired&&<label className="studio-check"><input type="checkbox" checked={!!pack.authoring.sourceReviewed} onChange={e=>edit({authoring:{...pack.authoring,sourceReviewed:e.target.checked}})}/>I checked the source material, historical context, and quotations.</label>}</section>
 <section className="studio-review"><h2>Preview & publish</h2>{validation.errors.length?<ul role="alert">{validation.errors.map((e,i)=><li key={i}>Line {e.line}: {e.message}</li>)}</ul>:<p>Ready for a play-through. Preview the episode before publishing.</p>}<button className="studio-primary" disabled={busy||!!validation.errors.length||packageSize(pack)>5000000} onClick={()=>void publish()}>Publish fixed version</button>{published&&<EpisodePublicSharing key={published.versionId} versionId={published.versionId}/>}{published&&<div className="flex flex-wrap gap-3"><select aria-label="Assign to class" value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Choose a class</option>{classes.map(c=><option key={c.$id} value={c.$id}>{c.courseName} {c.name}</option>)}</select><input aria-label="Teaching date" type="date" value={date} onChange={e=>setDate(e.target.value)}/><button disabled={!date||!classId||busy} onClick={()=>{setBusy(true);void animatedCall('animatedAssign',{versionId:published.versionId,classId,date}).then(()=>{invalidateAnimatedLibrary(userId);setStatus('Assigned. Students see it from the preceding Friday at 08:00 Shanghai time.');}).catch(e=>setStatus(String(e))).finally(()=>setBusy(false));}}>Assign episode</button></div>}</section></main>;
}
