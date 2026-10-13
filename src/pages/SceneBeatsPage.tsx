import ChoiceWorkshop from '../components/animated/ChoiceWorkshop';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import SceneBeatLibrary from '../components/animated/SceneBeatLibrary';
import type {StoryPackage} from '../../functions/learning-content/src/story-engine.js';
export default function SceneBeatsPage(){
 const [sandbox,setSandbox]=useState<StoryPackage|null>(null);
 useEffect(()=>{let active=true;fetch(import.meta.env.BASE_URL+'stories/animated/the-measure-that-changed/episode.json').then(r=>{if(!r.ok)throw Error('Practice episode unavailable');return r.json();}).then(p=>{if(active)setSandbox(p);}).catch(()=>{});return()=>{active=false;};},[]);
 const [pack,setPack]=useState<StoryPackage|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;Promise.all(['lin','yeyul','mei','hepting','jordan'].map(async id=>{const r=await fetch(import.meta.env.BASE_URL+`stories/animated/rigs/${id}-cartoon.json`);if(!r.ok)throw Error('Could not load cast');return [id==='hepting'?'Hepting':id[0].toUpperCase()+id.slice(1),await r.json()];})).then(entries=>{if(active)setPack({format:2,title:'Scene beats',description:'',profile:'',script:'story 2\nend',assets:{backgrounds:{},characters:Object.fromEntries(entries)},quiz:[]});}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[]);
 return <main className="mx-auto max-w-5xl p-5 space-y-4"><Link to="/game/cast">← Recurring cast</Link><h1 className="text-3xl font-bold">Small moments. Meaningful changes.</h1><p>Reusable direction for conversations: preview a beat, then use its command in an episode. Available in the episode studio.</p>{error?<p role="alert">{error}</p>:pack?<SceneBeatLibrary pack={pack}/>:<p>Loading the cast…</p>}{sandbox&&<section className="space-y-3"><h2 className="text-xl font-bold">Choice workshop · practice copy</h2><p>Try the builder and compare choices from The Measure That Changed. Changes here are temporary and do not change the assigned episode. Use the episode studio to save your own draft.</p><ChoiceWorkshop pack={sandbox} onChange={p=>setSandbox({...sandbox,...p})}/><label className="block">Practice script<textarea id="story-script" className="block w-full h-48 border p-3 font-mono text-sm" value={sandbox.script} onChange={e=>setSandbox({...sandbox,script:e.target.value})}/></label></section>}</main>;
}
