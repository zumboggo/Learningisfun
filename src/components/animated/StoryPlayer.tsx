import StoryAtmosphere from './StoryAtmosphere';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {advanceStory,initialStoryState,settleStory,validatePackage,quizScore,type StoryPackage,type StoryState} from '../../../functions/learning-content/src/story-engine.js';
import './story-player.css';
import StoryStage from './StoryStage';
import {playSceneMotion} from './scene-motion';
export interface StoryProgress {steps:(string|null)[];quizzes:number[][];seed:number}
export default function StoryPlayer({pack,initial,onProgress,debug=false,endContent}:{pack:StoryPackage;initial?:StoryProgress;onProgress?:(p:StoryProgress)=>void;debug?:boolean;endContent?:ReactNode}){
 const compiled=useMemo(()=>validatePackage(pack),[pack]);const story=compiled.story;
 const [accepted,setAccepted]=useState(!!initial?.steps.length),[progress,setProgress]=useState<StoryProgress>(initial||{steps:[],quizzes:[],seed:1});
 const [state,setState]=useState<StoryState>(()=>{if(!story)return null as any;let s=settleStory(story,initialStoryState(story,initial?.seed||1));for(const step of initial?.steps||[])s=advanceStory(story,s,step);return s;});
 const [answers,setAnswers]=useState<number[]>([-1,-1,-1,-1]),[showHistory,setShowHistory]=useState(false),[busy,setBusy]=useState(false),[music,setMusic]=useState(false),[jump,setJump]=useState('');
 const [reduced,setReduced]=useState(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),[speaking,setSpeaking]=useState(false),[responses,setResponses]=useState<Record<string,string>>({});
 const motion=useRef<AbortController|null>(null);
 const generation=useRef(0),animationRoot=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{const m=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!m)return;const change=()=>setReduced(m.matches);m.addEventListener?.('change',change);return()=>m.removeEventListener?.('change',change);},[]);
 useEffect(()=>{const n=story?.nodes[state?.cursor];setSpeaking(accepted&&n?.type==='say'&&n.actor!=='I');const t=setTimeout(()=>setSpeaking(false),Math.min(7000,Math.max(1600,(n?.text?.length||0)*40)));return()=>clearTimeout(t);},[state?.cursor,accepted,story]);
 const lock=useRef(false),root=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),audio=useRef<HTMLAudioElement>(null);
 useEffect(()=>()=>{generation.current++;motion.current?.abort();clearTimeout(timer.current);animationRoot.current?.getAnimations?.({subtree:true}).forEach(a=>a.cancel());},[]);
 useEffect(()=>{if(!accepted||initial?.steps.length||!root.current)return;const controller=new AbortController();motion.current=controller;void playSceneMotion(root.current,state?.cues||[],story?.nodes[state?.cursor],reduced,setResponses,controller.signal);return()=>controller.abort();
 // Opening only; later cues are dispatched by advance, and saved motion is not replayed.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[accepted]);
 useEffect(()=>{if(reduced){motion.current?.abort();setResponses({});}},[reduced]);
 if(compiled.errors.length)return <div role="alert">{compiled.errors.map((e,i)=><p key={i}>Line {e.line}: {e.message}</p>)}</div>;
 const current=story.nodes[state.cursor],score=progress.quizzes.length?quizScore(pack.quiz,progress.quizzes.at(-1)!):null,passed=score!==null&&score>=75;
 const save=(p:StoryProgress)=>{setProgress(p);onProgress?.(p);};
 const cancel=()=>{generation.current++;motion.current?.abort();clearTimeout(timer.current);root.current?.getAnimations?.({subtree:true}).forEach(a=>a.cancel());setResponses({});lock.current=false;setBusy(false);};
 const animate=async(el:HTMLElement|null,frames:Keyframe[],duration=420)=>{if(reduced||!el?.animate)return;const animation=el.animate(frames,{duration,easing:'ease-in-out'});try{await animation.finished;}catch{/* Navigation cancels effects. */}};
 const advance=async(option:string|null)=>{if(lock.current||state.ended)return;motion.current?.abort();setResponses({});lock.current=true;setBusy(true);setSpeaking(false);const token=++generation.current;
  const next=advanceStory(story,state,option);
  // Keep departing actors mounted until their exit is complete.
  for(const id of Object.keys(state.stage.actors)){if(!next.stage.actors[id])await animate(root.current?.querySelector(`[data-actor="${id}"]`)||null,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(65px)'}]);if(token!==generation.current)return;}
  setState(next);save({...progress,steps:[...progress.steps,option]});
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  if(token!==generation.current)return;
  const controller=new AbortController();motion.current=controller;
  const cues=(next.cues||[]).map(n=>({...n,entering:n.type==='show'&&!state.stage.actors[n.actor]}));
  if(root.current)void playSceneMotion(root.current,cues,story.nodes[next.cursor],reduced,setResponses,controller.signal);
  if(token!==generation.current)return;lock.current=false;setBusy(false);root.current?.querySelector<HTMLButtonElement>('[data-next]')?.focus();
 };
 if(!accepted)return <section className="story-disclaimer"><h2>{pack.title}</h2><p>All characters are imaginative recreations of real or fictional people and may not represent their actual views or ideas. Only labelled source excerpts are authentic quotations.</p><button onClick={()=>setAccepted(true)}>Accept</button></section>;
 return <div className={`animated-story ${pack.format===2?"story-modern":""}`} ref={el=>{root.current=el;if(el)animationRoot.current=el;}}>
  {debug&&<details><summary>Preview controls</summary><select aria-label="Jump to scene" value={jump} onChange={e=>setJump(e.target.value)}><option value="">Choose a label</option>{Object.keys(story.labels).map(l=><option key={l}>{l}</option>)}</select><button onClick={()=>{if(jump){cancel();setState(settleStory(story,{...initialStoryState(story,1),cursor:story.labels[jump],variables:state.variables}));setProgress({steps:[],quizzes:[],seed:1});}}}>Jump</button>{Object.entries(state.variables).map(([k,v])=><label key={k}>{k}<input type={typeof v==='boolean'?'checkbox':'number'} checked={typeof v==='boolean'?v:undefined} value={typeof v==='number'?v:undefined} onChange={e=>setState({...state,variables:{...state.variables,[k]:typeof v==='boolean'?e.target.checked:Number(e.target.value)}})}/></label>)}<button onClick={()=>{cancel();setState(settleStory(story,initialStoryState(story,1)));setProgress({steps:[],quizzes:[],seed:1});}}>Restart</button></details>}
  <StoryStage pack={pack} state={state} current={current} speaking={speaking&&!state.ended} reduced={reduced} responses={responses}/>
  {!state.ended&&<StoryAtmosphere root={root} preset={state.ended?'none':state.stage.ambience} ducked={speaking}/>}
  <div className="story-meters">{Object.entries(story.variables).filter(([,v]:any)=>v.visible).map(([k])=><span key={k}>{k}: {String(state.variables[k])}</span>)}</div>
  <section className="story-dialogue" aria-live="polite">{!state.ended&&current.type==='say'&&<><strong>{current.beat?'On the scene':current.actor==='I'?'My story':pack.assets.characters[current.actor].name}</strong><p>{current.text}</p><button data-next disabled={busy} onClick={()=>advance(null)}>{current.beat?'Continue →':'Next →'}</button></>}{!state.ended&&current.type==='act'&&<><strong>On the scene</strong><p>{current.text}</p><button data-next disabled={busy} onClick={()=>advance(null)}>{busy?'Action playing…':'Continue →'}</button></>}{!state.ended&&current.type==='choice'&&<><h2>What do I do?</h2>{current.options.map((o:any)=><button key={o.id} disabled={busy} onClick={()=>advance(o.id)}>{o.text}</button>)}</>}
  {state.ended&&<><h2>{passed?'Home again':'Four questions before we return'}</h2>{score!==null&&<p role="status">{score}/100 · {passed?'Complete. Your story choices are separate from this knowledge score.':'Review the explanations, then try again.'}</p>}{!passed&&pack.quiz.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.prompt}</legend>{q.options.map((o,j)=><label key={j}><input type="radio" name={'question-'+i} checked={answers[i]===j} onChange={()=>setAnswers(answers.map((v,k)=>k===i?j:v))}/>{o}</label>)}{score!==null&&<p>{q.explanation}</p>}</fieldset>)}{!passed&&<button disabled={answers.includes(-1)} onClick={()=>{if(lock.current)return;lock.current=true;save({...progress,quizzes:[...progress.quizzes,answers.slice()]});setAnswers([-1,-1,-1,-1]);timer.current=setTimeout(()=>{lock.current=false;},300);}}>Check answers</button>}</>}
  </section>{state.ended&&endContent}<footer><button onClick={()=>setShowHistory(!showHistory)}>Recall the conversation</button>{pack.assets.music&&<><audio ref={audio} src={pack.assets.music.src} loop/><button onClick={()=>{if(music)audio.current?.pause();else void audio.current?.play();setMusic(!music);}}>Music {music?'off':'on'}</button></>}</footer>
  {showHistory&&<aside aria-label="Conversation history">{state.history.map((h,i)=><p key={i}><strong>{h.actor==='I'?'I':pack.assets.characters[h.actor]?.name}: </strong>{h.text}</p>)}</aside>}
 </div>;
}
