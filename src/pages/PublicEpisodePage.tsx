import {useEffect,useState} from 'react';
import {useParams} from 'react-router-dom';
import {functions} from '@/lib/appwrite';
import {GameDisplay} from '@/components/GameDisplay';
import StoryPlayer from '@/components/animated/StoryPlayer';
import type {StoryPackage} from '../../functions/learning-content/src/story-engine.js';
export default function PublicEpisodePage(){const {shareId=''}=useParams();return <PublicPlayer key={shareId} shareId={shareId}/>;}
function PublicPlayer({shareId}:{shareId:string}){
 const [mediaUrls,setMediaUrls]=useState<Record<string,string>>({});const [pack,setPack]=useState<StoryPackage|null>(null),[error,setError]=useState(''),[run,setRun]=useState(0);
 useEffect(()=>{let active=true;void(async()=>{const execution=await functions.createExecution('public-reading',JSON.stringify({action:'readEpisode',shareId}));const result=JSON.parse(execution.responseBody||'{}');if(execution.status==='failed'||execution.responseStatusCode>=400||result.error||!result.pack)throw Error(result.error||'This episode is unavailable.');if(active){setPack(result.pack);setMediaUrls(result.mediaUrls||{})};})().catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[shareId]);
 return <GameDisplay cinema userId="public-episode">{error?<div className="cinema-loading"><p role="alert">{error}</p><p>Ask the teacher for an active public link.</p></div>:pack?<StoryPlayer cinema key={shareId+run} pack={pack} mediaUrls={mediaUrls} status="Public play · no account required · results not submitted" onReplay={()=>setRun(r=>r+1)} tools={<><p>Progress lasts while this page stays open. Reloading starts again.</p><button onClick={()=>setRun(r=>r+1)}>Restart episode</button></>}/>:<p className="cinema-loading">Loading episode…</p>}</GameDisplay>;
}
