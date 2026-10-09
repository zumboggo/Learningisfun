import {useCallback,useEffect,useRef,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {db} from '@/db/schema';
import {STONE_CLASS_ID,stoneDb,newAttempt,extendAttempt,localAttempts,readStone,syncStone,validStoneMessage,type StoneAttempt,type StoneRank} from '@/services/stone.service';
import {assess} from '../../functions/learning-content/src/stone-engine.js';
import EpisodeSound from '@/components/EpisodeSound';
import stoneBuild from '../../stories/teaching-stone/build.json';
const storyUrl=import.meta.env.BASE_URL+'stories/teaching-stone/v1/index.html?build='+stoneBuild.sourceSha256.slice(0,12);
const assets=['index.html','village-pixel.webp','scribe-pixel.webp','household-pixel.webp','worker-pixel.webp','landholder-pixel.webp'];
export default function TeachingStonePage({teacherPreview=false}:{teacherPreview?:boolean}){
 const {classId=''}=useParams(),{user}=useAuth();
 const [allowed,setAllowed]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('Checking class access…');
 const [attempt,setAttempt]=useState<StoneAttempt|null>(null),[history,setHistory]=useState<StoneAttempt[]>([]),[board,setBoard]=useState<StoneRank[]>([]);
 const [playing,setPlaying]=useState(false),[frameKey,setFrameKey]=useState(0),[cacheStatus,setCacheStatus]=useState('');
 const frame=useRef<HTMLIFrameElement>(null),current=useRef<StoneAttempt|null>(null),channel=useRef(crypto.randomUUID()),busy=useRef(false),chain=useRef(Promise.resolve());
 const retryAfter=useRef(0),failures=useRef(0);
 const identity=useRef(user?.$id);identity.current=user?.$id;
 const select=useCallback((a:StoneAttempt)=>{current.current=a;setAttempt(a);channel.current=crypto.randomUUID();setFrameKey(k=>k+1);},[]);
 const refreshHistory=useCallback(async()=>{if(user)setHistory(await localAttempts(user.$id,classId));},[user,classId]);
 const synchronize=useCallback(async(refreshResults=false)=>{
  if(!user||busy.current||current.current?.preview||(!refreshResults&&Date.now()<retryAfter.current))return;busy.current=true;const owner=user.$id;
  try{const data=await syncStone(owner,classId,refreshResults);if(identity.current!==owner)return;failures.current=0;retryAfter.current=0;if(data)setBoard(data.leaderboard);const remaining=(await localAttempts(owner,classId)).some(a=>a.pending);setStatus(remaining?'Saved on this device · sync pending':'Saved to your account');await refreshHistory();
   // If a conflicting save forked this device’s attempt, select that preserved branch.
   if(current.current&&!await stoneDb.attempts.get(current.current.attemptId)){const rows=await localAttempts(owner,classId);const fork=rows.find(a=>JSON.stringify(a.choices)===JSON.stringify(current.current?.choices));if(fork)select(fork);}
  }catch(e){retryAfter.current=Date.now()+Math.min(15*60_000,30_000*2**Math.min(failures.current++,5));if(identity.current===owner)setStatus('Saved on this device · sync pending'+(navigator.onLine?' — '+(e instanceof Error?e.message:'connection unavailable'):''));}
  finally{busy.current=false;}
 },[user,classId,refreshHistory,select]);
 useEffect(()=>{
  let cancelled=false;setAllowed(false);setPlaying(false);setError('');setAttempt(null);current.current=null;setBoard([]);setHistory([]);
  if(!user||(!teacherPreview&&classId!==STONE_CLASS_ID)){setError('This episode is available only in Ethics and Leadership.');return;}
  void(async()=>{
   try{
    const cls=await db.classes.get(classId),members=await db.class_members.where('[classId+userId]').equals([classId,user.$id]).toArray();
    let preview=cls?.teacherId===user.$id&&['teacher','admin'].includes(user.role);
    if(teacherPreview&&!preview)throw new Error('Only this class’s teacher can open its teacher library.');
    let access=preview||(user.role==='student'&&members.some(m=>m.role==='student'));
    if(navigator.onLine&&!teacherPreview){const data=await readStone(classId);preview=data.preview;access=true;if(!cancelled)setBoard(data.leaderboard);
     for(const remote of data.attempts){const existing=await stoneDb.attempts.get(remote.attemptId);if(!existing)await stoneDb.attempts.put({...remote,userId:user.$id,classId,preview:false,pending:false,createdAt:remote.createdAt||new Date().toISOString(),updatedAt:remote.updatedAt||new Date().toISOString()});}
    }
    if(!access)throw new Error('Join Ethics and Leadership to play this episode.');
    if(cancelled)return;setAllowed(true);setStatus(preview?'Teacher preview · not ranked':navigator.onLine?'Ready to play':'Offline · progress stays on this device');
    const rows=await localAttempts(user.$id,classId);if(cancelled)return;setHistory(rows);const active=rows.find(a=>a.status==='active'&&a.preview===preview)||newAttempt(user.$id,classId,preview);await stoneDb.attempts.put(active);if(!cancelled)select(active);
   }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Could not check class access');}
  })();return()=>{cancelled=true;};
 },[user?.$id,user?.role,classId,teacherPreview,select]);
 const initialize=useCallback(()=>{const a=current.current;if(a)frame.current?.contentWindow?.postMessage({protocol:'teaching-stone-v1',type:'init',channel:channel.current,choices:a.choices},window.location.origin);},[]);
 useEffect(()=>{
  if(!allowed||!user)return;const owner=user.$id;
  const handle=(event:MessageEvent)=>{
   if(!validStoneMessage(event,frame.current?.contentWindow||null,channel.current))return;
   if(event.data.type==='ready'){initialize();return;}
   const message=event.data;
   chain.current=chain.current.then(async()=>{
    if(identity.current!==owner||!current.current)return;
    if(message.type==='replay'){
     const a=newAttempt(owner,classId,current.current.preview);await stoneDb.attempts.put(a);select(a);await refreshHistory();return;
    }
    if(message.type==='next')return;
    if(!Array.isArray(message.choices)||message.choices.length>10)return;
    const next=extendAttempt(current.current,message.choices);await stoneDb.attempts.put(next);current.current=next;setAttempt(next);setStatus(next.preview?'Teacher preview · saved on this device':'Saved on this device · sync pending');await refreshHistory();void synchronize(next.status==='complete');
   }).catch(e=>setError('Could not save this choice: '+(e instanceof Error?e.message:'storage unavailable')));
  };
  const onOnline=()=>void synchronize();
  window.addEventListener('message',handle);window.addEventListener('online',onOnline);
  const timer=window.setInterval(()=>{void localAttempts(owner,classId).then(rows=>{if(rows.some(a=>a.pending&&!a.preview))void synchronize();});},15000);
  return()=>{window.removeEventListener('message',handle);window.removeEventListener('online',onOnline);window.clearInterval(timer);};
 },[allowed,user?.$id,classId,initialize,select,refreshHistory,synchronize]);
 const start=async()=>{
  setPlaying(true);
  if('caches' in window){try{const cache=await caches.open('teaching-stone-v1');await cache.addAll(assets.map(a=>a==='index.html'?storyUrl:import.meta.env.BASE_URL+'stories/teaching-stone/v1/'+a));setCacheStatus('Episode saved for offline play');}catch{setCacheStatus('Offline download incomplete; text and choices still work while connected.');}}
 };
 if(!user)return null;
 return <main className="mx-auto max-w-5xl p-3 sm:p-6">
  <Link to={`/classes/${classId}/game`} className="text-sm text-teal-800">← The Game</Link>
  <div className="my-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-teal-800">The Teaching Stone</p><h1 className="text-2xl font-bold">The Grain We Keep</h1></div><p role="status" className="max-w-md text-xs text-gray-600">{status}</p></div>
  {error&&<p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-900">{error}</p>}
  {allowed&&attempt&&!playing&&<section className="rounded-2xl bg-[#f4efdf] p-6 sm:p-10"><p className="text-xs uppercase tracking-widest text-teal-800">Episode 01 · Egypt · Historical fiction</p><h2 className="my-4 font-serif text-4xl">A village needs more<br/>than good intentions.</h2><p className="max-w-xl text-gray-700">A new body. A borrowed seal. Food for today—or seed for tomorrow? Meet the people who will live with your choices.</p><p className="my-4 text-sm">10–15 minutes · Ten decisions · No timer · Unlimited replays</p><button onClick={()=>void start()} className="rounded-lg bg-teal-900 px-6 py-3 font-semibold text-white">{attempt.choices.length?'Continue this life':'Begin a new life'}</button><p className="mt-4 text-xs text-gray-600">The opening includes a brief, non-graphic traffic accident. The stone assesses decisions, not your worth as a person.</p></section>}
  {allowed&&playing&&<EpisodeSound key={`${user.$id}:${classId}`} trackUrl={import.meta.env.BASE_URL+'stories/teaching-stone/v1/egypt-loop-v1.mp3'} iframeRef={frame} frameKey={frameKey}/>}
  {allowed&&playing&&<iframe key={frameKey} ref={frame} src={storyUrl} onLoad={initialize} title="The Teaching Stone: interactive story" sandbox="allow-scripts allow-same-origin allow-popups" className="h-[82dvh] min-h-[560px] w-full rounded-xl border border-stone-200 bg-[#efe8d9]"/>}
  {allowed&&playing&&<details className="mt-3 text-xs text-gray-600"><summary className="cursor-pointer">About the soundtrack</summary><p className="mt-2">An imagined ancient-Egyptian-inspired game soundtrack, generated with MusicGen-Looper. It is not a reconstruction of ancient music. Sound is optional; every part of the story works silently.</p></details>}
  {cacheStatus&&<p className="my-2 text-xs text-gray-500">{cacheStatus}</p>}
  {allowed&&<details className="mt-6 rounded-xl border border-stone-200 p-4"><summary className="cursor-pointer font-semibold">{teacherPreview?'Your teacher preview attempts':'Your lives & this episode’s leaderboard'}</summary><p className="my-3 text-sm text-gray-600">Best completed replay counts. Ties share a rank. No speed bonus. Teacher previews are not ranked.</p><button disabled={attempt?.preview} onClick={()=>void synchronize(true)} className="mb-4 rounded border px-3 py-2 text-sm">Refresh saved results</button>
   <div className="grid gap-6 sm:grid-cols-2"><section><h2 className="font-semibold">Your attempts</h2>{history.length===0&&<p>No completed attempts yet.</p>}{history.map((a,i)=><div key={a.attemptId} className="my-2 flex items-center justify-between gap-2 text-sm"><span>Life {history.length-i} · {a.status==='complete'?assess(a.choices).total+'/100':a.choices.length+'/10 choices'}{a.pending?' · pending sync':''}{a.preview?' · preview':''}</span><button className="rounded border px-2 py-1" onClick={()=>{select(a);setPlaying(true);}}>Open</button></div>)}</section><section><h2 className="font-semibold">{teacherPreview?'Practice freely':'Long-term flourishing'}</h2>{teacherPreview?<p className="mt-2 text-sm text-gray-600">Your previews stay on this device. They do not create student scores or access another class’s rankings.</p>:board.length===0?<p className="mt-2 text-sm text-gray-600">No ranked results yet.</p>:<ol>{board.map((r,i)=><li key={i} className="my-2 flex justify-between text-sm"><span>{r.rank}. {r.nickname}{r.mine?' (you)':''}</span><strong>{r.score}/100</strong></li>)}</ol>}</section></div></details>}
 </main>;
}
