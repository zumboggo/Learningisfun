import {useEffect,useState} from 'react';
import type {StoryPackage,StoryState} from '../../../functions/learning-content/src/story-engine.js';
import StoryStage from './StoryStage';
const beats=[
 {emotion:'curious',gesture:'question',shot:'wide',actor:'Kevin',text:'Wait—did we just park a taxi inside the classroom?'},
 {emotion:'curious',shot:'medium',actor:'I',text:'Technically, Mr. Hepting parked it. We survived.'},
 {emotion:'happy',gesture:'celebrate',shot:'medium',actor:'Kevin',text:'Good. I was worried we would miss lunch.'},
 {emotion:'worried',gesture:'hesitant',shot:'close',actor:'Kevin',text:'But… is my opening really that hard to understand?'},
 {emotion:'relieved',gesture:'reassure',shot:'medium',actor:'Kevin',text:'Okay. Let’s keep my voice and help the reader.'},
];
export default function ActingRehearsal({pack}:{pack:StoryPackage}){const [beat,setBeat]=useState(0),[playing,setPlaying]=useState(false),[run,setRun]=useState(0),[reduced,setReduced]=useState(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const m=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!m)return;const change=()=>setReduced(m.matches);m.addEventListener?.('change',change);return()=>m.removeEventListener?.('change',change);},[]);useEffect(()=>{if(!playing)return;const t=setTimeout(()=>{if(beat===beats.length-1)setPlaying(false);else setBeat(beat+1);},4000);return()=>clearTimeout(t);},[playing,beat,run]);const b=beats[beat],state:StoryState={cursor:run*10+beat,variables:{},stage:{background:'classroom',camera:{shot:b.shot,actor:'Kevin'},actors:{Kevin:{expression:b.emotion,position:'center',facing:1}}},history:[],events:[],seed:1,ended:false};return <div className="animated-story story-modern"><StoryStage pack={pack} state={state} current={{type:'say',...b}} speaking={playing&&b.actor==='Kevin'} reduced={reduced}/><section className="story-dialogue" aria-live="polite"><strong>{b.actor==='I'?'My story':'Kevin'}</strong><p>{b.text}</p><button onClick={()=>{if(playing)setPlaying(false);else{setBeat(0);setRun(run+1);setPlaying(true);}}}>{playing?'Stop rehearsal':'Play 20-second rehearsal'}</button></section></div>;}
