import {useEffect,useRef,useState} from 'react';
import type {StoryInterlude as Interlude} from '@/services/story-interludes';
import './story-interlude.css';

export default function StoryInterlude({media,onContinue,disabled=false,reduced=false}:{media:Interlude;onContinue:()=>void;disabled?:boolean;reduced?:boolean}){
 const video=useRef<HTMLVideoElement>(null),done=useRef(false);
 const [started,setStarted]=useState(false),[error,setError]=useState(''),[staticText,setStaticText]=useState(reduced),[paused,setPaused]=useState(false),[hidden,setHidden]=useState(document.hidden),[finished,setFinished]=useState(false);
 useEffect(()=>{const change=()=>{setHidden(document.hidden);if(document.hidden)video.current?.pause();};document.addEventListener('visibilitychange',change);const element=video.current;return()=>{document.removeEventListener('visibilitychange',change);element?.pause();};},[]);
 const finish=()=>{if(done.current||disabled)return;done.current=true;video.current?.pause();onContinue();};
 const play=(muted:boolean)=>{const element=video.current;if(!element)return;setStarted(true);setError('');element.muted=muted;if(!element.getAttribute('src')&&media.kind==='video')element.src=media.src;void element.play().catch(()=>setError('Use the video controls to play, or continue without the clip.'));};
 const still=staticText||reduced;
 return <section className={`story-interlude interlude-${media.kind}`} aria-label={media.title}>
  {media.kind==='photo'?<>
   <h2>{media.title}</h2>
   {!error?<figure className="interlude-archive"><img src={media.src} alt={media.alt} onError={()=>setError('The photograph is unavailable. Its description and archive link remain below.')}/><figcaption>{media.caption}</figcaption></figure>:<><p role="status">{error}</p><p>{media.alt}</p><p>{media.caption}</p></>}
   <p className="interlude-description">{media.question}</p><p className="archive-credit">{media.credit}</p>
   <a href={media.source} target="_blank" rel="noreferrer">View the photograph’s archive record</a>
   <button disabled={disabled} onClick={finish}>Continue to the story →</button>
  </>:media.kind==='video'?<>
   <div className="interlude-film"><video ref={video} controls playsInline preload="none" poster={media.poster} aria-label={media.ariaLabel||media.title} onEnded={finish} onError={()=>setError('The opening is unavailable. The quotation is below; you can continue.')}><track kind="captions" src={media.captions} srcLang="en" label="English captions" default/></video>{(media.credit??'Illustrated reconstruction · authentic later reading')&&<span className="interlude-credit">{media.credit??'Illustrated reconstruction · authentic later reading'}</span>}</div>
   <h2>{media.title}</h2><p className="interlude-description">{media.description}</p><a href={media.source} target="_blank" rel="noreferrer">{media.sourceLabel}</a>
   {!started&&<div className="interlude-actions"><button disabled={disabled} onClick={()=>play(false)}>{media.playLabel||'Play opening with King’s voice'}</button><button disabled={disabled} onClick={()=>play(true)}>Play silently</button></div>}
   {error&&<p role="status">{error}</p>}
   <button disabled={disabled} onClick={finish}>Continue without opening →</button>
  </>:<>
   <div className={`crawl-viewport ${still||finished?'crawl-static':''}`}>
    <div className="crawl-text" style={{animationDuration:`${media.seconds}s`,animationPlayState:paused||hidden?'paused':'running'}} onAnimationEnd={()=>{setFinished(true);}}>
     <p className="crawl-kicker">{media.kicker}</p><h2>{media.title}</h2>{media.paragraphs.map(p=><p key={p}>{p}</p>)}
    </div>
   </div>
   <div className="interlude-actions">
    {!still&&!finished&&<button aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused?'Resume scrolling':'Pause scrolling'}</button>}
    {!reduced&&<button onClick={()=>{setStaticText(v=>!v);setFinished(false);}}>{still?'Watch scrolling introduction':(media.fullTextLabel||'Read as still text')}</button>}
    <button disabled={disabled} onClick={finish}>Continue to the story →</button>
   </div>
  </>}
 </section>;
}
