import {replayStory,validatePackage} from '../../functions/learning-content/src/story-engine.js';
import {invalidateAnimatedLibrary} from '@/services/use-animated-library';
import {useEffect,useRef,useState} from 'react';
import {useParams} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {GameDisplay} from '@/components/GameDisplay';
import {EpisodeNotebook} from '@/components/ethics/EpisodePortfolio';
import {STONE_CLASS_ID} from '@/services/stone.service';
import StoryPlayer,{type StoryProgress} from '@/components/animated/StoryPlayer';
import {animatedCall,loadStoryCache,saveStoryCache} from '@/services/animated-stories';
export default function AnimatedEpisodePage(){const {user}=useAuth(),{assignmentId=''}=useParams();return user?<Player key={user.$id+assignmentId} userId={user.$id} assignmentId={assignmentId}/>:null;}
function Player({userId,assignmentId}:{userId:string;assignmentId:string}){
 const [data,setData]=useState<any>(null),[attempt,setAttempt]=useState<any>(null),[status,setStatus]=useState('Opening episode…'),[ready,setReady]=useState(false),chain=useRef(Promise.resolve()),alive=useRef(true),current=useRef<any>(null),retryAfter=useRef(0);
 const key=`animated-play:${userId}:${assignmentId}`;
 const cache=()=>{void saveStoryCache(key,{data,current:current.current}).catch(()=>setStatus('Device storage full. Keep this page open until account sync succeeds.'));};
 const sync=async()=>{const a=current.current;if(!a||data?.preview||!navigator.onLine||Date.now()<retryAfter.current)return;try{const remote=await animatedCall('animatedSaveAttempt',{assignmentId,attemptId:a.id,steps:a.steps,quizzes:a.quizzes});if(alive.current){retryAfter.current=0;if(remote.complete)invalidateAnimatedLibrary(userId);if(current.current?.id===a.id&&current.current.steps.length===a.steps.length&&current.current.quizzes.length===a.quizzes.length){current.current={...current.current,...remote};cache();}setStatus(remote.complete?`Complete · ${remote.score}/100 · saved`:'Saved to your account');}}catch(e){retryAfter.current=Date.now()+60000;if(alive.current)setStatus('Saved on this device · '+String(e));}};
 useEffect(()=>{alive.current=true;void(async()=>{try{const result=await animatedCall('animatedRead',{assignmentId});if(!alive.current)return;setData(result);const local=await loadStoryCache(key);
const {story,errors}=validatePackage(result.pack);if(errors.length)throw Error('This episode could not be opened. Please contact your teacher.');
const valid=(a:StoryProgress|undefined)=>{if(!a||!Array.isArray(a.steps)||!Array.isArray(a.quizzes))return false;try{replayStory(story,a.steps,a.seed);return true;}catch{return false;}};
const oldVersion=local?.data?.assignment?.versionId??local?.data?.assignment?.version;
const newVersion=result.assignment?.versionId??result.assignment?.version;
const changed=oldVersion!==undefined&&newVersion!==undefined&&oldVersion!==newVersion||local?.data?.pack?.script!==undefined&&local.data.pack.script!==result.pack.script;
const restoreLocal=local?.current&&!changed&&valid(local.current);
if(local?.current&&!restoreLocal)await saveStoryCache(`${key}:preserved:${oldVersion??'unknown'}:${local.current.id??Date.now()}`,local);
let a=restoreLocal?local.current:(result.attempts||[]).filter((a:StoryProgress&{complete?:boolean})=>!a.complete&&valid(a)).at(-1);if(!a){a={id:crypto.randomUUID(),steps:[],quizzes:[],seed:1};if(!result.preview)a=await animatedCall('animatedSaveAttempt',{assignmentId,attemptId:a.id,steps:[],quizzes:[]});}if(!alive.current)return;current.current=a;setAttempt(a);setReady(true);setStatus(local?.current&&!restoreLocal?'Updated episode · earlier device progress preserved':result.preview?'Teacher preview · no ranking':'Progress restored');await saveStoryCache(key,{data:result,current:a});}catch(e){const cached=await loadStoryCache(key);if(alive.current&&cached&&!navigator.onLine){setData(cached.data);current.current=cached.current;setAttempt(cached.current);setReady(true);setStatus('Offline · continuing the episode saved on this device');}else if(alive.current)setStatus(String(e));}})();return()=>{alive.current=false;};},[assignmentId,userId]);
 useEffect(()=>{const online=()=>{retryAfter.current=0;void sync();};window.addEventListener('online',online);return()=>window.removeEventListener('online',online);},[data]);
 const progress=(p:StoryProgress)=>{current.current={...current.current,...p};cache();setStatus(data.preview?'Teacher preview':'Saved on this device · sync pending');chain.current=chain.current.then(sync);};
 const replaying=useRef(false);
 const replay=async()=>{if(replaying.current)return;replaying.current=true;try{await chain.current;await sync();const previous=current.current;let a={id:crypto.randomUUID(),steps:[],quizzes:[],seed:1};if(!data.preview)a=await animatedCall('animatedSaveAttempt',{assignmentId,attemptId:a.id,steps:[],quizzes:[]});const updated={...data,attempts:[...(data.attempts||[]).filter((row:{id:string})=>row.id!==previous.id),previous]};setData(updated);current.current=a;setAttempt(a);await saveStoryCache(key,{data:updated,current:a});setStatus(data.preview?'Teacher preview · replay':'New replay · previous attempt preserved');}catch(e){setStatus(String(e));}finally{replaying.current=false;}};
 return <GameDisplay cinema userId={userId}>{ready&&data&&attempt?<StoryPlayer cinema key={attempt.id} pack={data.pack} initial={attempt} onProgress={progress} onReplay={()=>void replay()} status={status}
  notebook={data.assignment.classId===STONE_CLASS_ID?<EpisodeNotebook userId={userId} classId={data.assignment.classId} preview={data.preview} source={{kind:'episode-notes',format:'animated',episode:data.assignment.id,assignmentId,version:data.assignment.version,title:data.pack.title}}/>:undefined}
  tools={<><button onClick={()=>void replay()}>Start a separate replay</button><button onClick={()=>{retryAfter.current=0;void sync();}}>Retry synchronization</button>{data.attempts?.length>0&&<details><summary>Previous attempts</summary>{data.attempts.map((a:any)=><p key={a.id}>{a.complete?`${a.score}/100 · complete`:'In progress'} <button onClick={()=>{current.current=a;setAttempt(a);cache();}}>Open attempt</button></p>)}</details>}</>}/>:<div className="cinema-loading"><p role="status">{status}</p><a href="#/game">← Episodes</a></div>}</GameDisplay>;
}
