import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import CartoonActor from '@/components/animated/CartoonActor';
import '@/components/animated/story-player.css';
import './animation-lab.css';

const beats=[
 {name:'Listen',emotion:'curious',talking:false,line:'“I think your taxi is waiting outside.”',note:'Compare the silhouette, eyes and sense of attention.'},
 {name:'Speak',emotion:'happy',talking:true,line:'“Excellent. I was beginning to think we would have to walk.”',note:'Watch the mouth and eyebrows. All three use the same facial animation.'},
 {name:'Shocked',emotion:'shocked',talking:false,line:'“Wait. Is that taxi inside the classroom?”',note:'Watch both hands meet the cheeks, and the mouth open.'},
 {name:'Laugh',emotion:'laughing',talking:false,line:'“At least we won’t get wet on the way out!”',note:'Compare the face during the backward lean and belly-holding laugh.'},
];
const variants=[
 {id:'current',letter:'A',name:'Current SVG',tag:'The baseline',description:'The character already used in episodes. Flat colours, clean paths, fully animated face.'},
 {id:'polished',letter:'B',name:'Polished SVG',tag:'More depth, same system',description:'Shaded skin and clothing, richer hair and finer facial details. Everything remains vector artwork.'},
 {id:'hybrid',letter:'C',name:'Illustrated hybrid',tag:'Painted head · animated face',description:'An imagegen hair-and-skin layer over the same shaded SVG body. Eyes, brows and mouth remain animated SVG.'},
] as const;
export default function AnimationLabPage(){
 const [character,setCharacter]=useState<any>(null),[error,setError]=useState('');
 const [beat,setBeat]=useState(0),[run,setRun]=useState(0),[playing,setPlaying]=useState(false),[held,setHeld]=useState(false),[portrait,setPortrait]=useState(true),[selected,setSelected]=useState('current');
 const [systemReduced,setSystemReduced]=useState(()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const controller=new AbortController();fetch(import.meta.env.BASE_URL+'stories/animated/rigs/lin-cartoon.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Lin could not load. Please reload to try again.');return r.json();}).then(setCharacter).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>controller.abort();},[]);
 useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;const update=()=>setSystemReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>{if(beat===beats.length-1)setPlaying(false);else{setBeat(b=>b+1);setRun(r=>r+1);}},3000);return()=>clearTimeout(timer);},[playing,beat,run]);
 const chooseBeat=(index:number)=>{setPlaying(false);setBeat(index);setRun(r=>r+1);};
 const b=beats[beat],still=held||systemReduced;
 return <main className="animation-lab">
  <header className="lab-header"><Link to="/game/acting-demo">← Acting library</Link><span className="lab-kicker">ONE CHARACTER / THREE DIRECTIONS</span><h1>A little more life.</h1><p>Meet three versions of Lin. Same performance, same scale, different artwork. Which one feels most at home in the story?</p></header>
  <section className="lab-controls" aria-label="Comparison controls">
   <div className="lab-play-row"><button className="lab-play" disabled={!character} onClick={()=>{if(playing){setPlaying(false);setHeld(true);}else{setHeld(false);setBeat(0);setRun(r=>r+1);setPlaying(true);}}}>{playing?'Stop & hold pose':'▶ Play all four · 12 seconds'}</button><label><input type="checkbox" checked={held} disabled={systemReduced} onChange={e=>{setHeld(e.target.checked);setPlaying(false);setRun(r=>r+1);}}/> Hold expression</label><label><input type="checkbox" checked={!portrait} onChange={e=>setPortrait(!e.target.checked)}/> Full figure</label></div>
   <div className="lab-beats" aria-label="Choose performance">{beats.map((item,index)=><button key={item.name} aria-pressed={index===beat} onClick={()=>chooseBeat(index)}><span>0{index+1}</span> {item.name}</button>)}</div>
   {systemReduced&&<p className="lab-motion-note">Your reduced-motion setting is on. Expressions are shown as still poses.</p>}
  </section>
  <div className="lab-mobile-switch" aria-label="Choose version">{variants.map(v=><button key={v.id} aria-pressed={selected===v.id} onClick={()=>setSelected(v.id)}>{v.letter} · {v.name}</button>)}</div>
  {error&&<p role="alert">{error}</p>}
  {!character&&!error&&<p role="status">Loading Lin…</p>}
  <section className="lab-grid" aria-label="Three character styles">{variants.map(v=><article key={v.id} className={`lab-card ${selected===v.id?'lab-selected':''}`} aria-label={v.name}>
   <header><span className="lab-letter">{v.letter}</span><div><h2>{v.name}</h2><p>{v.tag}</p></div></header>
   <div className={`lab-stage ${portrait?'lab-portrait':''}`}>
    <div className="lab-stage-line"/>
    {character&&<CartoonActor character={character} actorId="Lin-comparison" emotion={b.emotion} talking={b.talking} reduced={still} performanceKey={run} portrait={portrait} experiment={v.id} headImage={v.id==='hybrid'?import.meta.env.BASE_URL+'stories/animated/experiments/lin/head-base.png':undefined}/>}
    <span className="lab-stage-caption">LIN · {b.name.toUpperCase()}</span>
   </div>
   <p className="lab-description">{v.description}</p>
  </article>)}</section>
  <section className="lab-dialogue" aria-live="polite"><span>{b.name}</span><p>{b.line}</p><small>{b.note}</small></section>
  <footer className="lab-footer"><p><strong>Made once. Reused in every episode.</strong> Each version uses the same emotion cues. The hybrid’s illustrated layer is prepared once per character; no new images are needed for each line or episode.</p><p>This is a visual prototype. Existing episode characters are unchanged. The hybrid adds an approximately 1.2 MB image; missing artwork falls back to SVG. It tests a painted head with animated features, not a fully deformable illustrated face.</p></footer>
 </main>;
}
