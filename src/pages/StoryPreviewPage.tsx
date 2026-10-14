import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import StoryPlayer from '../components/animated/StoryPlayer';
import type {StoryPackage} from '../../functions/learning-content/src/story-engine.js';
export default function StoryPreviewPage(){
 const {slug}=useParams();const [pack,setPack]=useState<StoryPackage|null>(null),[zip,setZip]=useState(''),[error,setError]=useState(''),[run,setRun]=useState(0);
 useEffect(()=>{let active=true;setPack(null);setError('');void(async()=>{const catalog=await fetch(import.meta.env.BASE_URL+'stories/animated/previews.json',{cache:'no-store'});if(!catalog.ok)throw Error('Preview catalog unavailable');const entries=await catalog.json();const entry=entries.find((e:{id:string})=>e.id===slug);if(!entry)throw Error('Preview not found');const response=await fetch(import.meta.env.BASE_URL+entry.package);if(!response.ok)throw Error('Episode unavailable');const result=await response.json();if(active){setPack(result);setZip(import.meta.env.BASE_URL+entry.zip);}})().catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[slug]);
 return <main className="mx-auto max-w-5xl space-y-4 p-4"><Link to="/game">← The Game</Link>{error?<p role="alert">{error}</p>:pack?<><h1 className="text-3xl font-bold">{pack.title}</h1><p>{pack.description}</p><p>Unassigned preview · progress and quiz results are not saved.</p><div className="flex gap-4"><a className="underline" href={zip} download>Download episode ZIP</a><button onClick={()=>setRun(r=>r+1)}>Restart preview</button></div><StoryPlayer key={`${slug}-${run}`} pack={pack} debug/><details><summary>Sources and teaching notes</summary>{pack.sources?.map((s,i)=><p className="my-3" key={i}>{s}</p>)}</details></>:<p>Loading episode…</p>}</main>;
}
