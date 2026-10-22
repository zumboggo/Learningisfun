import StoryKeepsake from './StoryKeepsake';
import SimulationScorecard,{simulationResult,type SimulationResult} from './SimulationScorecard';
import StoryAtmosphere from './StoryAtmosphere';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {advanceStory,initialStoryState,settleStory,validatePackage,quizScore,type StoryPackage,type StoryState} from '../../../functions/learning-content/src/story-engine.js';
import './story-player.css';
import StoryStage from './StoryStage';
import {playSceneMotion} from './scene-motion';
import {GameFullscreenButton} from '../GameFullscreenButton';
import StoryPanel from './StoryPanel';
export interface StoryProgress {steps:(string|null)[];quizzes:number[][];seed:number}
export default function StoryPlayer({pack,initial,onProgress,debug=false,endContent,cinema=false,notebook,tools,status}:{pack:StoryPackage;initial?:StoryProgress;onProgress?:(p:StoryProgress)=>void;debug?:boolean;endContent?:ReactNode;cinema?:boolean;notebook?:ReactNode;tools?:ReactNode;status?:string}){
 const [previousSimulation,setPreviousSimulation]=useState<SimulationResult|null>(null);
 const compiled=useMemo(()=>validatePackage(pack),[pack]);const story=compiled.story;
 const [accepted,setAccepted]=useState(!!initial?.steps.length),[progress,setProgress]=useState<StoryProgress>(initial||{steps:[],quizzes:[],seed:1});
 const [state,setState]=useState<StoryState>(()=>{if(!story)return null as any;let s=settleStory(story,initialStoryState(story,initial?.seed||1));for(const step of initial?.steps||[])s=advanceStory(story,s,step);return s;});
 const [answers,setAnswers]=useState<number[]>([-1,-1,-1,-1]),[showHistory,setShowHistory]=useState(false),[busy,setBusy]=useState(false),[music,setMusic]=useState(false),[jump,setJump]=useState('');
 const [reduced,setReduced]=useState(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),[speaking,setSpeaking]=useState(false),[responses,setResponses]=useState<Record<string,string>>({});
 const [panel,setPanel]=useState<'History'|'Notebook'|'Episode menu'|null>(null),[motionPaused,setMotionPaused]=useState(false);
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
 useEffect(()=>{if(reduced||motionPaused){motion.current?.abort();setResponses({});animationRoot.current?.getAnimations?.({subtree:true}).forEach(a=>a.cancel());}},[reduced,motionPaused]);
 const simulation=story?simulationResult(pack,story,state):null;
 const current=story?.nodes[state?.cursor],score=progress.quizzes.length?quizScore(pack.quiz,progress.quizzes.at(-1)!):null,passed=score!==null&&score>=75;
 const save=(p:StoryProgress)=>{setProgress(p);onProgress?.(p);};
 const cancel=()=>{generation.current++;motion.current?.abort();clearTimeout(timer.current);root.current?.getAnimations?.({subtree:true}).forEach(a=>a.cancel());setResponses({});lock.current=false;setBusy(false);};
 const animate=async(el:HTMLElement|null,frames:Keyframe[],duration=420)=>{if(reduced||motionPaused||!el?.animate)return;const animation=el.animate(frames,{duration,easing:'ease-in-out'});try{await animation.finished;}catch{/* Navigation cancels effects. */}};
 const advance=async(option:string|null)=>{if(lock.current||state.ended)return;motion.current?.abort();setResponses({});lock.current=true;setBusy(true);setSpeaking(false);const token=++generation.current;
  const next=advanceStory(story,state,option);
  // Keep departing actors mounted until their exit is complete.
  for(const id of Object.keys(state.stage.actors)){if(!next.stage.actors[id])await animate(root.current?.querySelector(`[data-actor="${id}"]`)||null,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(65px)'}]);if(token!==generation.current)return;}
  setState(next);save({...progress,steps:[...progress.steps,option]});
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  if(token!==generation.current)return;
  const controller=new AbortController();motion.current=controller;
  const cues=(next.cues||[]).map(n=>({...n,entering:n.type==='show'&&!state.stage.actors[n.actor]}));
  if(root.current)void playSceneMotion(root.current,cues,story.nodes[next.cursor],reduced||motionPaused,setResponses,controller.signal);
  if(token!==generation.current)return;lock.current=false;setBusy(false);root.current?.querySelector<HTMLButtonElement>('[data-next]')?.focus();
 };
 // Follow the current legal beat and panel state without retaining a stale callback.
 useEffect(()=>{
  if(!cinema||!accepted||panel||state?.ended||current?.type!=='choice')return;
  const choose=(event:KeyboardEvent)=>{const target=event.target instanceof Element?event.target:null;
   if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||target?.closest('input,textarea,select,[contenteditable="true"],dialog,details')||root.current?.querySelector('.cinema-sound details[open]'))return;
   const option=current.options[Number(event.key)-1];
   if(!/^[1-6]$/.test(event.key)||!option)return;
   event.preventDefault();void advance(option.id);
  };
  document.addEventListener('keydown',choose);return()=>document.removeEventListener('keydown',choose);
 });
 if(compiled.errors.length)return <div role="alert">{compiled.errors.map((e,i)=><p key={i}>Line {e.line}: {e.message}</p>)}</div>;
 const previewControls=debug&&<details><summary>Preview controls</summary><select aria-label="Jump to scene" value={jump} onChange={e=>setJump(e.target.value)}><option value="">Choose a label</option>{Object.keys(story.labels).map(l=><option key={l}>{l}</option>)}</select><button onClick={()=>{if(jump){cancel();setState(settleStory(story,{...initialStoryState(story,1),cursor:story.labels[jump],variables:state.variables}));setProgress({steps:[],quizzes:[],seed:1});}}}>Jump</button>{Object.entries(state.variables).map(([k,v])=><label key={k}>{k}<input type={typeof v==='boolean'?'checkbox':'number'} checked={typeof v==='boolean'?v:undefined} value={typeof v==='number'?v:undefined} onChange={e=>setState({...state,variables:{...state.variables,[k]:typeof v==='boolean'?e.target.checked:Number(e.target.value)}})}/></label>)}<button onClick={()=>{cancel();setState(settleStory(story,initialStoryState(story,1)));setProgress({steps:[],quizzes:[],seed:1});}}>Restart</button></details>;
 const musicControl=pack.assets.music&&<><audio ref={audio} src={pack.assets.music.src} loop/><button onClick={()=>{if(music)audio.current?.pause();else void audio.current?.play();setMusic(!music);}}>Music {music?'off':'on'}</button></>;
 const toolbar=cinema&&<header className="cinema-toolbar">
  <a className="cinema-back" href="#/game" aria-label="Back to episodes">← <span>Episodes</span></a>
  <div className="cinema-title"><h1>{pack.title}</h1>{status&&<span role="status" title={status}>{status}</span>}</div>
  <nav aria-label="Story controls">
   {notebook&&<button onClick={()=>setPanel('Notebook')}>Notebook</button>}
   {accepted&&<><button aria-label="Recall the conversation" onClick={()=>setPanel('History')}>History</button><button aria-label={motionPaused?'Resume scene motion':'Pause scene motion'} aria-pressed={motionPaused} onClick={()=>setMotionPaused(value=>!value)}>Motion <small>{motionPaused?'paused':'on'}</small></button><StoryAtmosphere compact root={root} preset={state.ended?'none':state.stage.ambience} ducked={speaking}>{musicControl}</StoryAtmosphere></>}
   {(tools||debug)&&<button onClick={()=>setPanel('Episode menu')} aria-label="Episode menu" title="Episode menu">•••</button>}
   <GameFullscreenButton/>
  </nav>
 </header>;
 const drawer=cinema&&panel&&<StoryPanel title={panel} onClose={()=>setPanel(null)}>{panel==='Notebook'?notebook:panel==='History'?<><p className="cinema-panel-hint">Your conversation so far.</p>{state.history.length?state.history.map((h,i)=><p className="cinema-history-line" key={i}><strong>{h.actor==='I'?'I':pack.assets.characters[h.actor]?.name}</strong>{h.text}</p>):<p>The conversation will appear here as you play.</p>}</>:<>{status&&<p role="status">{status}</p>}{tools}{previewControls}</>}</StoryPanel>;
 if(!accepted)return <div className={cinema?'animated-story story-cinema cinema-intro':''}>{toolbar}<section className="story-disclaimer"><p className="cinema-intro-kicker">An interactive story</p><h2>{pack.title}</h2><p>All characters are imaginative recreations of real or fictional people and may not represent their actual views or ideas. Only labelled source excerpts are authentic quotations.</p><button onClick={()=>setAccepted(true)}>Accept</button></section>{drawer}</div>;
 const lastLine=state.history.at(-1),choiceContext=current.type==='choice'&&lastLine&&lastLine.text.length<=220?lastLine:null;
 return <div className={`animated-story ${pack.format===2?'story-modern':''} ${cinema?'story-cinema':''} ${state.ended?'story-ended':''}`} ref={el=>{root.current=el;if(el)animationRoot.current=el;}}>
  {toolbar}
  {!cinema&&previewControls}
  <div className="story-content">
  <div className="story-stage-shell"><StoryStage pack={pack} state={state} current={current} speaking={speaking&&!state.ended} reduced={reduced} responses={responses} motionPaused={cinema?motionPaused:undefined} onMotionPause={cinema?setMotionPaused:undefined} hideMotionControl={cinema}/></div>
  {!cinema&&!state.ended&&<StoryAtmosphere root={root} preset={state.stage.ambience} ducked={speaking}/>}
  {pack.keepsake&&Object.hasOwn(story.labels,pack.keepsake.revealAt)&&state.cursor>=story.labels[pack.keepsake.revealAt]&&<StoryKeepsake pack={pack} story={story} progress={progress}/>}
  {simulation&&state.ended&&<SimulationScorecard result={simulation} previous={previousSimulation} complete={state.ended} onReplay={state.ended&&!onProgress?()=>{setPreviousSimulation(simulation);cancel();setState(settleStory(story,initialStoryState(story,progress.seed)));setProgress({steps:[],quizzes:[],seed:progress.seed});setAnswers([-1,-1,-1,-1]);setShowHistory(false);root.current?.scrollIntoView({block:"start",behavior:"instant"});}:undefined}/>}
  {simulation&&!state.ended&&<div className="story-meters" aria-label="Simulation score so far"><strong>Decision total: {simulation.total}/{simulation.maximum}</strong>{simulation.categories.map(c=><span key={c.variable}>{c.label}: {c.value}/{c.maximum}</span>)}</div>}
  {!simulation&&<div className="story-meters">{Object.entries(story.variables).filter(([,v]:any)=>v.visible).map(([k])=><span key={k}>{k}: {String(state.variables[k])}</span>)}</div>}
  <section className={`story-dialogue ${current?.type==='choice'?'story-choice-dialogue':''}`} aria-live="polite">{cinema&&choiceContext&&<p className="cinema-choice-context"><strong>{choiceContext.actor==='I'?'My story':pack.assets.characters[choiceContext.actor]?.name}</strong><span>{choiceContext.text}</span></p>}{!state.ended&&current.type==='say'&&<><strong>{current.beat?'On the scene':current.actor==='I'?'My story':pack.assets.characters[current.actor].name}</strong><p>{current.text}</p><button data-next disabled={busy} onClick={()=>advance(null)}>{current.beat?'Continue →':'Next →'}</button></>}{!state.ended&&current.type==='act'&&<><strong>On the scene</strong><p>{current.text}</p><button data-next disabled={busy} onClick={()=>advance(null)}>{busy?'Action playing…':'Continue →'}</button></>}{!state.ended&&current.type==='choice'&&<><h2>What do I do?</h2><div className="story-options" style={{gridTemplateColumns:cinema?`repeat(${current.options.length===4?2:Math.min(current.options.length,3)}, minmax(0, 1fr))`:undefined}}>{current.options.map((o:any,i:number)=><button key={o.id} data-choice={o.id} disabled={busy} onClick={()=>advance(o.id)}>{cinema&&<kbd aria-hidden="true">{i+1}</kbd>}<span>{o.text}</span></button>)}</div></>}
  {state.ended&&<><h2>{passed?'Home again':'Four questions before we return'}</h2>{score!==null&&<p role="status">{score}/100 · {passed?'Complete. Your story choices are separate from this knowledge score.':'Review the explanations, then try again.'}</p>}{!passed&&pack.quiz.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.prompt}</legend>{q.options.map((o,j)=><label key={j}><input type="radio" name={'question-'+i} checked={answers[i]===j} onChange={()=>setAnswers(answers.map((v,k)=>k===i?j:v))}/>{o}</label>)}{score!==null&&<p>{q.explanation}</p>}</fieldset>)}{!passed&&<button disabled={answers.includes(-1)} onClick={()=>{if(lock.current)return;lock.current=true;save({...progress,quizzes:[...progress.quizzes,answers.slice()]});setAnswers([-1,-1,-1,-1]);timer.current=setTimeout(()=>{lock.current=false;},300);}}>Check answers</button>}</>}
  </section>{state.ended&&endContent}</div>{!cinema&&<footer><button onClick={()=>setShowHistory(!showHistory)}>Recall the conversation</button>{musicControl}</footer>}
  {!cinema&&showHistory&&<aside aria-label="Conversation history">{state.history.map((h,i)=><p key={i}><strong>{h.actor==='I'?'I':pack.assets.characters[h.actor]?.name}: </strong>{h.text}</p>)}</aside>}
  {drawer}
 </div>;
}
