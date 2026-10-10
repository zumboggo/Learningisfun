import {useSearchParams} from 'react-router-dom';
import {useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {useAuth} from '@/contexts/AuthContext';
import {db} from '@/db/schema';
import {STONE_CLASS_ID} from '@/services/stone.service';
import {assignedEpisodes} from '../../functions/learning-content/src/episode-catalog.js';
import {EpisodeLibrary} from './ClassGamePage';
import {prefersGameFullscreen,saveGameDisplay} from '@/services/game-display';
export default function GamePage(){const {user}=useAuth();return user?<Library key={user.$id} userId={user.$id} role={user.role}/>:null;}
function Library({userId,role}:{userId:string;role:string}) {
  const [query,setQuery]=useSearchParams();
  const selectedClass=query.get('class');
  const teacher=['teacher','admin'].includes(role);
  const [fullscreen,setFullscreen]=useState(()=>prefersGameFullscreen(userId));
  const classes=useLiveQuery(async()=>{
    if(teacher)return db.classes.where('teacherId').equals(userId).toArray();
    if(role!=='student')return [];
    const memberships=await db.class_members.where('userId').equals(userId).toArray();
    const ids=[...new Set(memberships.filter(m=>m.role==='student'&&(!m.expiresAt||Date.parse(m.expiresAt)>Date.now())).map(m=>m.classId))];
    return ids.length?db.classes.where('$id').anyOf(ids).toArray():[];
  },[userId,role,teacher]);
  if(!teacher&&role!=='student')return <p role="alert" className="p-6">The Game is available to students and class teachers.</p>;
  const stoneClass=classes?.find(c=>c.$id===STONE_CLASS_ID)?.$id;
  const visible=classes?.filter(c=>teacher||c.$id===stoneClass||assignedEpisodes(c.$id,teacher).length);
  const selected=teacher?classes?.find(c=>c.$id===selectedClass):undefined;
  return <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
    <header><h1 className="text-3xl font-bold">The Game</h1><p className="mt-2 text-gray-600">{teacher?'Play and test episodes across your classes. Teacher previews never enter student rankings.':'Your released episodes, highest scores, and past adventures—all here for unlimited replay.'}</p></header>
    <label className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4"><input type="checkbox" checked={fullscreen} onChange={e=>{setFullscreen(e.target.checked);saveGameDisplay(userId,e.target.checked);}} className="h-5 w-5"/><span><span className="font-semibold">Open episodes in full screen</span><span className="mt-1 block text-xs text-gray-600">Uncheck to play inside the browser window. Your choice is remembered on this device. Unsupported browsers use a full-window view.</span></span></label>
    {!classes?<p>Opening your episode library…</p>:!visible?.length?<p className="rounded-xl border border-orange-200 p-5">No episodes are available for your classes yet. New episodes will also appear in your weekly class materials.</p>:teacher?<>{selected?<><button className="rounded border px-4 py-2" onClick={()=>setQuery({})}>← All classes</button><section aria-label="Class episode list" tabIndex={0} className="max-h-[70dvh] overflow-y-auto rounded-xl border border-orange-200"><EpisodeLibrary classId={selected.$id} userId={userId} role={role} embedded showStone={selected.$id===stoneClass}/></section></>:<section aria-label="Choose a class" className="grid gap-3 sm:grid-cols-2">{visible.map(c=><button key={c.$id} aria-label={`${c.courseName} ${c.name} View episodes`} onClick={()=>setQuery({class:c.$id})} className="rounded-xl border border-orange-300 bg-orange-50 p-5 text-left"><span className="block text-lg font-bold">{c.courseName}</span><span className="mt-1 block">{c.name}</span><span className="mt-3 block text-sm text-orange-900">View episodes →</span></button>)}</section>}</>:visible.map(c=><EpisodeLibrary key={c.$id} classId={c.$id} userId={userId} role={role} embedded showStone={c.$id===stoneClass}/>)}
  </main>;
}
