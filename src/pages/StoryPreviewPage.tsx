import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import StoryPlayer from '../components/animated/StoryPlayer';
import type {StoryPackage} from '../../functions/learning-content/src/story-engine.js';
import {GameDisplay} from '../components/GameDisplay';
export default function StoryPreviewPage(){
 const {slug}=useParams();const [pack,setPack]=useState<StoryPackage|null>(null),[zip,setZip]=useState(''),[error,setError]=useState(''),[run,setRun]=useState(0);
 useEffect(()=>{let active=true;setPack(null);setError('');void(async()=>{const catalog=await fetch(import.meta.env.BASE_URL+'stories/animated/previews.json',{cache:'no-store'});if(!catalog.ok)throw Error('Preview catalog unavailable');const entries=await catalog.json();const entry=entries.find((e:{id:string})=>e.id===slug);if(!entry)throw Error('Preview not found');const response=await fetch(import.meta.env.BASE_URL+entry.package);if(!response.ok)throw Error('Episode unavailable');const result=await response.json();if(active){setPack(result);setZip(import.meta.env.BASE_URL+entry.zip);}})().catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[slug]);
 return <GameDisplay cinema userId="story-preview">{error?<div className="cinema-loading"><p role="alert">{error}</p><Link to="/game">← Episodes</Link></div>:pack?<StoryPlayer cinema key={`${slug}-${run}`} pack={pack} status="Unassigned preview · progress not saved" debug={!pack.simulationScore&&!pack.keepsake} tools={<><p>{pack.description}</p>{pack.simulationScore&&<p>Replay comparisons last while this page stays open.</p>}<a href={zip} download>Download episode ZIP</a>{!pack.simulationScore&&<button onClick={()=>setRun(r=>r+1)}>Restart preview</button>}<details><summary>Sources and teaching notes</summary>{pack.sources?.map((s,i)=><p key={i}>{s}</p>)}</details></>}/>:<p className="cinema-loading">Loading episode…</p>}</GameDisplay>;
}
