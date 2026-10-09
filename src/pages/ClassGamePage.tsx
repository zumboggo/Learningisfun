import {GameLaunchLink} from '@/components/GameLaunchLink';
import {EpisodeCards} from '@/components/EpisodeCards';
import {assignedEpisodes} from '../../functions/learning-content/src/episode-catalog.js';
import {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {useLiveQuery} from 'dexie-react-hooks';
import {useAuth} from '@/contexts/AuthContext';
import {db} from '@/db/schema';
import {localAttempts, readStone, stoneDb, STONE_CLASS_ID} from '@/services/stone.service';
import {assess} from '../../functions/learning-content/src/stone-engine.js';

export default function ClassGamePage() {
  const {classId=''}=useParams();
  const {user}=useAuth();
  return user ? <EpisodeLibrary key={`${user.$id}:${classId}`} classId={classId} userId={user.$id} role={user.role}/> : null;
}
export function EpisodeLibrary({classId,userId,role,embedded=false,showStone=true}:{classId:string;userId:string;role:string;embedded?:boolean;showStone?:boolean}) {
  const access=useLiveQuery(async()=>{
    const cls=await db.classes.get(classId);
    const members=await db.class_members.where('[classId+userId]').equals([classId,userId]).toArray();
    const preview=!!cls&&cls.teacherId===userId&&['teacher','admin'].includes(role);
    const allowed=preview||(role==='student'&&members.some(m=>m.role==='student'&&(!m.expiresAt||Date.parse(m.expiresAt)>Date.now())));
    return {cls,preview,allowed};
  },[classId,userId,role]);
  const attempts=useLiveQuery(()=>localAttempts(userId,classId),[userId,classId],[]);
  const [status,setStatus]=useState('Showing results saved on this device.');
  // Only the existing assigned episode needs a server read. Empty course libraries cost no reads.
  useEffect(()=>{
    if(!access?.allowed||access.preview||classId!==STONE_CLASS_ID||!navigator.onLine)return;
    let active=true;
    void readStone(classId).then(async data=>{
      for(const remote of data.attempts){
        const existing=await stoneDb.attempts.get(remote.attemptId);
        if(!existing||(!existing.pending&&remote.revision>existing.revision))await stoneDb.attempts.put({...remote,userId,classId,preview:false,pending:false});
      }
      if(active)setStatus('Account results updated.');
    }).catch(()=>{if(active)setStatus('Account results unavailable. Showing saved results; pending progress is safe on this device.');});
    return()=>{active=false;};
  },[access?.allowed,access?.preview,classId,userId]);
  if(!access)return <p className="p-6">Opening your class…</p>;
  if(!access.allowed)return <p role="alert" className="p-6">Sign in with this class’s student or teacher account to view its episodes.</p>;
  const completed=attempts.filter(a=>a.status==='complete'&&!a.preview);
  const best=completed.length?Math.max(...completed.map(a=>assess(a.choices).total)):null;
  return <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
    {!embedded&&<nav aria-label="Class sections" className="flex gap-2 border-b pb-3"><Link className="rounded-lg px-4 py-3" to={`/classes/${classId}`}>Class materials</Link><span aria-current="page" className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 font-semibold text-orange-950">The Game</span></nav>}
    <header><p className="text-sm text-gray-600">{access.cls?.courseName} · {access.cls?.name}</p>{!embedded&&<h1 className="mt-2 text-3xl font-bold">The Game</h1>}<p className="mt-2">{embedded?'':access.preview?'Teacher library · All available episodes, including those not assigned to this class.':'Your assigned episodes stay here for unlimited replay.'}</p></header>
    {showStone&&(access.preview||classId===STONE_CLASS_ID)?<article className="rounded-2xl border border-orange-300 bg-orange-50 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">Game episode · Ethics and Leadership · The Teaching Stone · 01</p>
      <h2 className="mt-2 font-serif text-3xl">The Grain We Keep</h2>
      <p className="my-3">A new life in ancient Egypt. Decide how a village survives a grain shortage—and what it will have left for tomorrow.</p>
      <p className="text-sm">10–15 minutes · Ten decisions · Unlimited replays</p>
      <p className="my-4 font-semibold">{access.preview?'Teacher preview · excluded from rankings':best===null?'No completed attempt yet':`Your highest score: ${best}/100`}</p>
      <GameLaunchLink className="inline-flex min-h-11 items-center rounded-lg bg-orange-900 px-5 py-3 font-semibold text-white" to={access.preview?`/classes/${classId}/game/preview/teaching-stone`:`/classes/${classId}/teaching-stone`}>{access.preview?'Play teacher preview':attempts.length?'Play / replay':'Begin episode'}</GameLaunchLink>
      {!access.preview&&<p role="status" className="mt-3 text-xs text-gray-600">{status}{attempts.some(a=>a.pending)?' Progress pending synchronization.':''}</p>}
    </article>:assignedEpisodes(classId,access.preview).length?null:<section className="rounded-2xl border border-orange-200 bg-orange-50 p-6"><h2 className="font-semibold">Your next story is still being written.</h2><p className="mt-2 text-sm">No episodes have been assigned to this class yet. They will appear here when published.</p></section>}
    {classId===STONE_CLASS_ID&&<Link to={`/classes/${classId}/principles`} className="block rounded-xl border border-teal-200 bg-teal-50 p-5 font-semibold text-teal-900">Principles Portfolio · Ideas under examination →</Link>}
    <EpisodeCards classId={classId} userId={userId} preview={access.preview}/>
    <p className="text-sm text-gray-600">Each episode keeps its own highest completed score. Replaying preserves your earlier results.</p>
  </main>;
}
