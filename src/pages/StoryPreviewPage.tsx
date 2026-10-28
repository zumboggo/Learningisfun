import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import StoryPlayer from '../components/animated/StoryPlayer';
import type {StoryPackage} from '../../functions/learning-content/src/story-engine.js';
import {animatedCall,downloadBlob,exportStory} from '../services/animated-stories';
import {useAuth} from '../contexts/AuthContext';
import {GameDisplay} from '../components/GameDisplay';

export default function StoryPreviewPage(){
 const {slug}=useParams();
 return <PrivatePreview key={slug} slug={slug}/>;
}
function PrivatePreview({slug}:{slug?:string}){
 const {user}=useAuth();
 const [pack,setPack]=useState<StoryPackage|null>(null);
 const [mediaUrls,setMediaUrls]=useState<Record<string,string>>({});
 const [error,setError]=useState(''),[run,setRun]=useState(0);
 useEffect(()=>{
  let active=true;
  void animatedCall<{pack:StoryPackage;mediaUrls:Record<string,string>}>('readPrivateAnimatedPreview',{slug})
   .then(result=>{if(active){setPack(result.pack);setMediaUrls(result.mediaUrls);}})
   .catch(e=>{if(active)setError(String(e));});
  return()=>{active=false;};
 },[slug]);
 return <GameDisplay cinema userId={user?.$id||'guest'}>
  {error?<div className="cinema-loading"><p role="alert">{error}</p><Link to="/game">← Episodes</Link></div>:pack?
   <StoryPlayer cinema key={`${slug}-${run}`} pack={pack} mediaUrls={mediaUrls} status="Unassigned preview · progress not saved" debug={!pack.simulationScore&&!pack.keepsake} tools={<>
    <p>{pack.description}</p>
    {pack.simulationScore&&<p>Replay comparisons last while this page stays open.</p>}
    <button onClick={()=>void exportStory(pack).then(blob=>downloadBlob(blob,slug+'.zip')).catch(e=>setError(e.message))}>Download episode ZIP</button>
    {!pack.simulationScore&&<button onClick={()=>setRun(r=>r+1)}>Restart preview</button>}
    <details><summary>Sources and teaching notes</summary>{pack.sources?.map((s,i)=><p key={i}>{s}</p>)}</details>
   </>}/>:<p className="cinema-loading">Loading episode…</p>}
 </GameDisplay>;
}
