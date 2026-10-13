import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import SceneBeatLibrary from '../components/animated/SceneBeatLibrary';
import type {StoryPackage} from '../../functions/learning-content/src/story-engine.js';
export default function SceneBeatsPage(){
 const [pack,setPack]=useState<StoryPackage|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;Promise.all(['lin','yeyul','mei','hepting','jordan'].map(async id=>{const r=await fetch(import.meta.env.BASE_URL+`stories/animated/rigs/${id}-cartoon.json`);if(!r.ok)throw Error('Could not load cast');return [id==='hepting'?'Hepting':id[0].toUpperCase()+id.slice(1),await r.json()];})).then(entries=>{if(active)setPack({format:2,title:'Scene beats',description:'',profile:'',script:'story 2\nend',assets:{backgrounds:{},characters:Object.fromEntries(entries)},quiz:[]});}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[]);
 return <main className="mx-auto max-w-5xl p-5 space-y-4"><Link to="/game/cast">← Recurring cast</Link><h1 className="text-3xl font-bold">Small moments. Meaningful changes.</h1><p>Reusable direction for conversations: preview a beat, then use its command in an episode. Available in the episode studio.</p>{error?<p role="alert">{error}</p>:pack?<SceneBeatLibrary pack={pack}/>:<p>Loading the cast…</p>}</main>;
}
