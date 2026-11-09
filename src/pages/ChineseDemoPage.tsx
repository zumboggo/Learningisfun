import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import StoryPlayer,{type StoryProgress} from '@/components/animated/StoryPlayer';
import type {ChineseSupport} from '@/components/animated/ChineseReading';
import {validatePackage,replayStory,type StoryPackage} from '../../functions/learning-content/src/story-engine.js';
const CHINESE_DEMOS=['today-youre-the-teacher','a-message-from-tomorrow'];
export default function ChineseDemoPage({episodeId}:{episodeId?:string}){
 const {slug}=useParams(),{user}=useAuth();const id=episodeId||slug||'';
 return <>{episodeId&&<p className="my-3"><Link className="font-semibold text-teal-800 underline" to={'/game/chinese/'+id}>Open full-window story →</Link></p>}<Demo key={id+user?.$id} id={id} userId={user?.$id||'guest'} cinema={!episodeId}/></>;
}
function Demo({id,userId,cinema}:{id:string;userId:string;cinema:boolean}){
 const [data,setData]=useState<{pack:StoryPackage&{chinese:ChineseSupport};progress?:StoryProgress}>(),[error,setError]=useState(''),[run,setRun]=useState(0);
 const key=`mandarin-demo:v1:${userId}:${id}`;
 useEffect(()=>{let active=true;if(!CHINESE_DEMOS.includes(id))return;
  fetch(import.meta.env.BASE_URL+`stories/shared/chinese-demos/${id}/episode.json`).then(async r=>{if(!r.ok)throw Error('Could not load this episode. Please try again.');return r.json();}).then(pack=>{
   const compiled=validatePackage(pack);if(compiled.errors.length||!pack.chinese)throw Error('The episode could not be read.');
   let progress:StoryProgress|undefined;try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&Array.isArray(saved.steps)&&Number.isInteger(saved.seed)){replayStory(compiled.story,saved.steps,saved.seed);progress={steps:saved.steps,seed:saved.seed,quizzes:[]};}}catch{/* Ignore unavailable storage or stale progress. */}
   if(active)setData({pack,progress});
  }).catch(e=>{if(active)setError(String(e.message||e));});return()=>{active=false;};
 },[id,key,run]);
 if(!CHINESE_DEMOS.includes(id))return <p role="alert">This Mandarin demo was not found.</p>;
 if(error)return <p role="alert">{error}</p>;if(!data)return <p role="status">Opening Mandarin story…</p>;
 return <StoryPlayer key={run} pack={data.pack} initial={data.progress} cinema={cinema} status="Mandarin demo · progress on this device" onProgress={p=>{try{localStorage.setItem(key,JSON.stringify(p));}catch{/* Reading remains available without storage. */}}} onReplay={()=>{try{localStorage.removeItem(key);}catch{/* Storage may be disabled. */}setData(undefined);setRun(v=>v+1);}}/>;
}
