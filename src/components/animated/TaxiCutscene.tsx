import {useEffect,useRef,useState} from 'react';
import {TAXI_CLIPS,type TaxiClip} from '@/services/magical-taxi';
import './taxi-cutscene.css';

export default function TaxiCutscene({clip,onContinue,disabled=false}:{clip:TaxiClip;onContinue:()=>void;disabled?:boolean}) {
 const video=useRef<HTMLVideoElement>(null),completed=useRef(false);
 const [started,setStarted]=useState(false),[error,setError]=useState('');
 const media=TAXI_CLIPS[clip];
 useEffect(()=>{
  const element=video.current;
  const pause=()=>{if(document.hidden)element?.pause();};
  document.addEventListener('visibilitychange',pause);
  return()=>{document.removeEventListener('visibilitychange',pause);element?.pause();};
 },[]);
 const finish=()=>{if(disabled||completed.current)return;completed.current=true;video.current?.pause();onContinue();};
 const play=(muted:boolean)=>{
  const element=video.current;if(!element)return;
  setError('');setStarted(true);element.muted=muted;
  // Do not fetch either movie until the learner deliberately starts this clip.
  if(!element.getAttribute('src'))element.src=media.src;
  void element.play().catch(()=>setError('Press play in the video controls, or continue without the clip.'));
 };
 return <section className="taxi-cutscene" aria-label={media.title}>
  <div className="taxi-cutscene-heading"><h2>{media.title}</h2><span>10 seconds</span></div>
  <video ref={video} controls playsInline preload="none" poster={media.poster} aria-label={media.title} onEnded={finish} onError={()=>setError('The clip is unavailable. You can continue the story without it.')}>
   <track kind="captions" src={media.captions} srcLang="en" label="English captions" default/>
  </video>
  <p>{media.description}</p>
  {!started&&<div className="taxi-cutscene-actions"><button disabled={disabled} onClick={()=>play(false)}>Play with sound</button><button disabled={disabled} onClick={()=>play(true)}>Play silently</button></div>}
  {error&&<p role="status">{error}</p>}
  <button className="taxi-cutscene-skip" disabled={disabled} onClick={finish}>Continue without video →</button>
 </section>;
}
