import {useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from 'react-router-dom';
import {advanceStory,initialStoryState,settleStory,validatePackage,type StoryPackage} from '../../../functions/learning-content/src/story-engine.js';
import StoryPlayer,{type StoryProgress} from './StoryPlayer';
import './stone-opening.css';

export const STONE_INVITATION='You are going about your day and find a small strange stone with markings on it. Do you pick it up?';

// Replay the public package's existing prologue so the normal player starts at
// arrival, with valid history and variables. Never jump a cursor or skip a choice.
export function stoneArrival(pack:StoryPackage):StoryProgress {
 const {story,errors}=validatePackage(pack);
 if(errors.length||!story)throw Error('This adventure could not be opened.');
 let state=settleStory(story,initialStoryState(story,1));
 const steps:(string|null)[]=[];
 while(state.stage.background!=='village'){
  if(state.ended||story.nodes[state.cursor].type!=='say'||steps.length>=20)throw Error('This adventure’s arrival could not be found.');
  steps.push(null);state=advanceStory(story,state,null);
 }
 return {steps,quizzes:[],seed:1};
}

export default function PublicStonePlayer({pack}:{pack:StoryPackage}){
 const navigate=useNavigate();
 const [phase,setPhase]=useState<'notice'|'invitation'|'declined'|'entering'|'playing'>('notice');
 const [count,setCount]=useState(0);
 const [reduced,setReduced]=useState(()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
 const dialog=useRef<HTMLDialogElement>(null),stage=useRef<HTMLDivElement>(null);
 const arrival=useMemo(()=>{try{return {progress:stoneArrival(pack),error:''};}catch(e){return {progress:undefined,error:(e as Error).message};}},[pack]);
 const opening=phase==='notice'||phase==='invitation'||phase==='declined';
 useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');const update=()=>setReduced(!!media?.matches);media?.addEventListener?.('change',update);return()=>media?.removeEventListener?.('change',update);},[]);
 useEffect(()=>{if(!opening)return;const element=dialog.current;element?.showModal();return()=>element?.close();},[opening]);
 useEffect(()=>{if(phase!=='invitation'||reduced||count>=STONE_INVITATION.length)return;const timer=setTimeout(()=>setCount(n=>n+1),27);return()=>clearTimeout(timer);},[phase,reduced,count]);
 useEffect(()=>{if(phase!=='entering')return;stage.current?.scrollIntoView({block:'start',behavior:'instant'});const timer=setTimeout(()=>setPhase('playing'),reduced?0:2400);return()=>clearTimeout(timer);},[phase,reduced]);
 useEffect(()=>{if(phase==='playing')stage.current?.querySelector<HTMLButtonElement>('[data-next]')?.focus({preventScroll:true});},[phase]);
 const done=reduced||count>=STONE_INVITATION.length;
 if(arrival.error)return <p role="alert">{arrival.error}</p>;
 if(opening)return createPortal(<dialog className="stone-opening" ref={dialog} aria-label="The strange stone" onCancel={event=>{event.preventDefault();navigate('/ethics');}}>
  <button className="stone-exit" onClick={()=>navigate('/ethics')}>← Leave adventure</button>
  <div className="stone-opening-content">
   {phase==='notice'?<><p className="stone-kicker">Before the adventure</p><h2>{pack.title}</h2><p className="stone-notice">This is a fictional historical adventure. Characters and events are imagined; only labelled source excerpts are authentic quotations.</p><button className="stone-choice stone-primary" onClick={()=>setPhase('invitation')}>Accept and begin</button></>:phase==='declined'?<><p className="stone-typed">You leave the stone where it is and carry on with your day.<br/><br/>For now, its markings remain a mystery.</p><div className="stone-choices"><button className="stone-choice stone-primary" onClick={()=>setPhase('entering')}>On second thought, pick it up</button><button className="stone-choice" onClick={()=>navigate('/ethics')}>Leave the stone alone</button></div></>:<>
    <p className="stone-typed" aria-label={STONE_INVITATION}><span aria-hidden="true">{reduced?STONE_INVITATION:STONE_INVITATION.slice(0,count)}{!done&&<span className="stone-cursor">▍</span>}</span></p>
    {done?<div className="stone-choices"><button className="stone-choice stone-primary" onClick={()=>setPhase('entering')}>Yes, pick it up</button><button className="stone-choice" onClick={()=>setPhase('declined')}>No, leave it alone</button></div>:<button className="stone-skip" onClick={()=>setCount(STONE_INVITATION.length)}>Show full text</button>}
   </>}
  </div>
 </dialog>,document.body);
 return <div ref={stage} className={phase==='entering'?'stone-arrival stone-entering':'stone-arrival'} aria-busy={phase==='entering'}>
  {phase==='entering'&&<p className="stone-transition-status" role="status">The markings warm beneath your fingers. A new world opens around you.</p>}
  <div inert={phase==='entering'}><StoryPlayer pack={pack} initial={arrival.progress}/></div>
 </div>;
}
