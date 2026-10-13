import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import CartoonActor from '@/components/animated/CartoonActor';
import {EMOTIONS,AUTO_ACTING,ACTING_DESCRIPTIONS} from '../../functions/learning-content/src/acting-library.js';
import '@/components/animated/story-player.css';
import './animation-lab.css';
const castIds=['Lin','Hepting','Mei','Yeyul','Jordan'];
export default function CastGalleryPage(){
 const [cast,setCast]=useState<any[]>([]),[error,setError]=useState(''),[emotion,setEmotion]=useState('happy'),[run,setRun]=useState(0),[still,setStill]=useState(false),[speaking,setSpeaking]=useState(false),[portrait,setPortrait]=useState(true);
 const [reduced,setReduced]=useState(()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const controller=new AbortController();Promise.all(castIds.map(async id=>{const r=await fetch(import.meta.env.BASE_URL+`stories/animated/rigs/${id.toLowerCase()}-cartoon.json`,{signal:controller.signal});if(!r.ok)throw Error('Could not load the cast. Reload to try again.');return {id,...await r.json()};})).then(setCast).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>controller.abort();},[]);
 useEffect(()=>{const m=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!m)return;const update=()=>setReduced(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update);},[]);
 useEffect(()=>{if(!speaking)return;const t=setTimeout(()=>setSpeaking(false),2200);return()=>clearTimeout(t);},[speaking,run]);
 return <main className="animation-lab cast-gallery"><header className="lab-header"><Link to="/game/acting-demo">← Acting library</Link><span className="lab-kicker">THE RECURRING CAST</span><h1>Familiar faces. More life.</h1><p>Illustrated heads, expressive faces and polished bodies. Choose an emotion to see everyone perform it.</p></header>
 <section className="lab-controls" aria-label="Cast controls"><div className="lab-play-row"><label>Emotion<select aria-label="Emotion" value={emotion} onChange={e=>{setEmotion(e.target.value);setSpeaking(false);setRun(r=>r+1);}}>{EMOTIONS.map(e=><option key={e}>{e}</option>)}</select></label><button className="lab-play" onClick={()=>{setSpeaking(true);setRun(r=>r+1);}}>Replay performance</button><label><input type="checkbox" checked={still||reduced} disabled={reduced} onChange={e=>setStill(e.target.checked)}/> Hold expression</label><label><input type="checkbox" checked={!portrait} onChange={e=>setPortrait(!e.target.checked)}/> Full figure</label></div><p className="lab-motion-note">{ACTING_DESCRIPTIONS[AUTO_ACTING[emotion].talk]}{reduced?' Reduced motion is on.':''}</p></section>
 {error&&<p role="alert">{error}</p>}{!cast.length&&!error&&<p role="status">Loading the cast…</p>}
 <section className="cast-grid" aria-label="Recurring characters">{cast.map(c=><article key={c.id} className="lab-card lab-selected"><header><div><h2>{c.name}</h2><p>Hybrid · character pack v{c.version}</p></div></header><div className="lab-stage"><CartoonActor character={c} actorId={c.id} emotion={emotion} talking={speaking} reduced={still||reduced} performanceKey={run} portrait={portrait}/></div></article>)}</section>
 <p><Link className="underline" to="/game/scene-beats">Try reusable scene beats →</Link></p><footer className="lab-footer"><p><strong>Ready for your next episode.</strong> In the episode studio, choose a name in Reusable cast, then Add / update. Each pack includes its illustrated head and all shared expressions.</p><p>New characters from the builder use polished SVG by default. Existing published episode snapshots keep their original cast. <Link className="underline" to="/game/animation-lab">Revisit the three-style experiment →</Link></p></footer></main>;
}
