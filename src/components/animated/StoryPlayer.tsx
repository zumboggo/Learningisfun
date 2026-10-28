import StoryInterlude from './StoryInterlude';
import {storyInterludeCursors} from '@/services/story-interludes';
import TaxiCutscene from './TaxiCutscene';
import {taxiCutsceneCursors,taxiWording} from '@/services/magical-taxi';
import StoryKeepsake from './StoryKeepsake';
import SimulationScorecard,{simulationResult,type SimulationResult} from './SimulationScorecard';
import StoryAtmosphere from './StoryAtmosphere';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {advanceStory,replayStory,initialStoryState,settleStory,validatePackage,quizScore,type StoryPackage,type StoryState} from '../../../functions/learning-content/src/story-engine.js';
import './story-player.css';
import StoryStage from './StoryStage';
import {playSceneMotion} from './scene-motion';
import {GameFullscreenButton} from '../GameFullscreenButton';
import StoryPanel from './StoryPanel';
export interface StoryWriting {question:number;text:string;submitted:boolean;revision:number}
export interface StoryProgress {writing?:StoryWriting;choicePauseUntil?:number;steps:(string|null)[];quizzes:number[][];seed:number}
export default function StoryPlayer({pack,mediaUrls,initial,onProgress,onReplay,debug=false,studentName,endContent,cinema=false,notebook,tools,status}:{pack:StoryPackage;mediaUrls?:Record<string,string>;initial?:StoryProgress;onProgress?:(p:StoryProgress)=>void;onReplay?:()=>void;debug?:boolean;studentName?:string;endContent?:ReactNode;cinema?:boolean;notebook?:ReactNode;tools?:ReactNode;status?:string}){
 const displayPack=useMemo(()=>({...pack,assets:{...pack.assets,characters:Object.fromEntries(Object.entries(pack.assets.characters).map(([id,actor])=>[id,{...actor,name:taxiWording(actor.name)}]))}}),[pack]);
 const [previousSimulation,setPreviousSimulation]=useState<SimulationResult|null>(null);
 const compiled=useMemo(()=>validatePackage(pack),[pack]);const story=compiled.story;
 const [contextRead,setContextRead]=useState(false);
 const [accepted,setAccepted]=useState(!!initial?.steps.length),[progress,setProgress]=useState<StoryProgress>(initial||{steps:[],quizzes:[],seed:1});
 const [state,setState]=useState<StoryState>(()=>{if(!story)return null as any;let s=settleStory(story,initialStoryState(story,initial?.seed||1));for(const step of initial?.steps||[])s=advanceStory(story,s,step);return s;});
 const [viewStep,setViewStep]=useState(initial?.steps.length||0);
 const [answers,setAnswers]=useState<number[]>([-1,-1,-1,-1]),[showHistory,setShowHistory]=useState(false),[busy,setBusy]=useState(false),[music,setMusic]=useState(false),[jump,setJump]=useState('');
 const [reduced,setReduced]=useState(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),[speaking,setSpeaking]=useState(false),[responses,setResponses]=useState<Record<string,string>>({});
 const [panel,setPanel]=useState<'History'|'Notebook'|'Episode menu'|null>(null),[motionPaused,setMotionPaused]=useState(false);
 const choicePause=useRef(initial?.choicePauseUntil||0),[pauseTick,setPauseTick]=useState(0);
 useEffect(()=>{const left=choicePause.current-Date.now();if(left>0){const t=setTimeout(()=>setPauseTick(v=>v+1),left);return()=>clearTimeout(t);}},[pauseTick,progress.choicePauseUntil]);
 const choiceBlocked=choicePause.current>Date.now();
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
 const current=story?.nodes[state?.cursor],score=progress.quizzes.length?quizScore(pack.quiz,progress.quizzes.at(-1)!):null,passed=pack.assessmentMode==='none'||score!==null&&score>=75;
 const taxiCursors=useMemo(()=>pack.template&&pack.taxiClips!==true?{}:taxiCutsceneCursors(story),[story,pack.template,pack.taxiClips]);
 const interludeCursors=useMemo(()=>storyInterludeCursors(story,mediaUrls),[story,mediaUrls]);
 const interlude=accepted&&!state?.ended?interludeCursors[state?.cursor]:undefined;
 const taxiClip=accepted&&!state?.ended?taxiCursors[state?.cursor]:undefined;
 useEffect(()=>{if(taxiClip||interlude){motion.current?.abort();setResponses({});audio.current?.pause();setMusic(false);}},[taxiClip,interlude]);
 const save=(p:StoryProgress)=>{setProgress(p);onProgress?.(p);};
 const cancel=()=>{generation.current++;motion.current?.abort();clearTimeout(timer.current);root.current?.getAnimations?.({subtree:true}).forEach(a=>a.cancel());setResponses({});lock.current=false;setBusy(false);};
 const replay=()=>{if(onReplay){onReplay();return;}if(onProgress)return;setPreviousSimulation(simulation);cancel();setState(settleStory(story,initialStoryState(story,progress.seed)));setProgress({steps:[],quizzes:[],seed:progress.seed});setAnswers([-1,-1,-1,-1]);setShowHistory(false);setPanel(null);root.current?.scrollIntoView?.({block:'start',behavior:'instant'});};
 const back=()=>{
  const position=onProgress?viewStep:progress.steps.length;
  if(!story||!position||choicePause.current>Date.now())return;
  cancel();setSpeaking(false);setAnswers([-1,-1,-1,-1]);
  const p={...progress,steps:progress.steps.slice(0,position-1)};
  setState(replayStory(story,p.steps,p.seed));setViewStep(position-1);
  if(!onProgress)save(p);
 };
 const history=<>{state.history.map((h,i)=>h.choice?<section className="story-history-choice" key={i} aria-label="Decision"><p><strong>{taxiWording(h.choice.prompt)}</strong></p><p><strong>What do I do?</strong></p><ol>{h.choice.options.map(o=><li key={o.id} className={o.id===h.choice!.selected?'story-history-picked':undefined}>{taxiWording(o.text)}{o.id===h.choice!.selected&&<strong className="story-history-badge"> ✓ You chose</strong>}</li>)}</ol></section>:<p className="cinema-history-line" key={i}><strong>{h.actor==='I'?'I':displayPack.assets.characters[h.actor]?.name}</strong>{taxiWording(h.text)}</p>)}</>;
 const animate=async(el:HTMLElement|null,frames:Keyframe[],duration=420)=>{if(reduced||motionPaused||!el?.animate)return;const animation=el.animate(frames,{duration,easing:'ease-in-out'});try{await animation.finished;}catch{/* Navigation cancels effects. */}};
 const reviewing=!!onProgress&&viewStep<progress.steps.length;
 const advance=async(option:string|null)=>{if(lock.current||state.ended||choicePause.current>Date.now())return;
  if(reviewing){
   if(option!==progress.steps[viewStep])return;
   cancel();setViewStep(viewStep+1);setState(replayStory(story,progress.steps.slice(0,viewStep+1),progress.seed));return;
  }motion.current?.abort();setResponses({});lock.current=true;setBusy(true);setSpeaking(false);const token=++generation.current;
  const next=advanceStory(story,state,option);
  if(current?.type==='choice'&&pack.profile==='english-corner')choicePause.current=Date.now()+2000;
  // Keep departing actors mounted until their exit is complete.
  for(const id of Object.keys(state.stage.actors)){if(!next.stage.actors[id])await animate(root.current?.querySelector(`[data-actor="${id}"]`)||null,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(65px)'}]);if(token!==generation.current)return;}
  setState(next);setViewStep(progress.steps.length+1);save({...progress,steps:[...progress.steps,option],...(pack.profile==='english-corner'?{choicePauseUntil:choicePause.current}:{})});
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  if(token!==generation.current)return;
  const controller=new AbortController();motion.current=controller;
  const cues=(next.cues||[]).map(n=>({...n,entering:n.type==='show'&&!state.stage.actors[n.actor]}));
  if(root.current)void playSceneMotion(root.current,cues,story.nodes[next.cursor],reduced||motionPaused,setResponses,controller.signal);
  if(token!==generation.current)return;lock.current=false;setBusy(false);root.current?.querySelector<HTMLButtonElement>('[data-next]')?.focus();
 };
 // Follow the current legal beat and panel state without retaining a stale callback.
 useEffect(()=>{
  if(!accepted||panel)return;
  const choose=(event:KeyboardEvent)=>{const target=event.target instanceof Element?event.target:null;
   if(event.defaultPrevented||event.repeat||event.ctrlKey||event.metaKey||event.altKey||target?.closest('input,textarea,select,[contenteditable="true"],dialog,details')||root.current?.querySelector('.cinema-sound details[open]'))return;
   if(event.key==='ArrowLeft'){event.preventDefault();back();return;}
   if(state?.ended)return;
   if(event.key==='ArrowRight'&&reviewing){event.preventDefault();void advance(progress.steps[viewStep]);return;}
   if(event.key==='ArrowRight'&&!taxiClip&&!interlude&&['say','act'].includes(current?.type)){event.preventDefault();void advance(null);return;}
   if(!cinema||current?.type!=='choice')return;
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
   {accepted&&!taxiClip&&!interlude&&<><button aria-label="Recall the conversation" onClick={()=>setPanel('History')}>History</button><button aria-label={motionPaused?'Resume scene motion':'Pause scene motion'} aria-pressed={motionPaused} onClick={()=>setMotionPaused(value=>!value)}>Motion <small>{motionPaused?'paused':'on'}</small></button><StoryAtmosphere compact root={root} preset={state.ended?'none':state.stage.ambience} ducked={speaking}>{musicControl}</StoryAtmosphere></>}
   {(tools||debug)&&<button onClick={()=>setPanel('Episode menu')} aria-label="Episode menu" title="Episode menu">•••</button>}
   <GameFullscreenButton/>
  </nav>
 </header>;
 const drawer=cinema&&panel&&<StoryPanel title={panel} onClose={()=>setPanel(null)}>{panel==='Notebook'?notebook:panel==='History'?<><p className="cinema-panel-hint">Your conversation so far.</p>{state.history.length?history:<p>The conversation will appear here as you play.</p>}</>:<>{status&&<p role="status">{status}</p>}{tools}{previewControls}</>}</StoryPanel>;
 if(!accepted)return <div className={cinema?'animated-story story-cinema cinema-intro':''}>{toolbar}<section className="story-disclaimer"><p className="cinema-intro-kicker">An interactive story</p><h2>{pack.title}</h2><p>{pack.notice||'All characters are imaginative recreations of real or fictional people and may not represent their actual views or ideas. Only labelled source excerpts are authentic quotations.'}</p><button onClick={()=>setAccepted(true)}>Accept</button></section>{drawer}</div>;
 if(pack.context?.length===2&&!contextRead&&progress.steps.length===0)return <StoryInterlude media={{kind:'crawl',title:pack.title,kicker:'Before the story',paragraphs:pack.context,seconds:24}} reduced={reduced} onContinue={()=>setContextRead(true)}/>;
 if(interlude)return <div className={`animated-story ${cinema?'story-cinema':''}`}>{toolbar}<StoryInterlude key={state.cursor} media={interlude} reduced={reduced} disabled={busy||choiceBlocked} onContinue={()=>void advance(null)}/>{drawer}</div>;
 if(taxiClip)return <div className={`animated-story taxi-playing ${cinema?'story-cinema':''}`}>{toolbar}<TaxiCutscene key={state.cursor} clip={taxiClip} disabled={busy||choiceBlocked} onContinue={()=>void advance(null)}/>{drawer}</div>;
 const lastLine=state.history.at(-1),choiceContext=current.type==='choice'&&lastLine&&lastLine.text.length<=220?lastLine:null;
 return <div className={`animated-story ${pack.format===2?'story-modern':''} ${cinema?'story-cinema':''} ${state.ended?'story-ended':''}`} ref={el=>{root.current=el;if(el)animationRoot.current=el;}}>
  {toolbar}
  {!cinema&&previewControls}
  <div className="story-content">
  <div className="story-stage-shell"><StoryStage pack={displayPack} state={state} current={current} speaking={speaking&&!state.ended} reduced={reduced} responses={responses} motionPaused={cinema?motionPaused:undefined} onMotionPause={cinema?setMotionPaused:undefined} hideMotionControl={cinema}/></div>
  {!cinema&&!state.ended&&<StoryAtmosphere root={root} preset={state.stage.ambience} ducked={speaking}/>}
  {pack.keepsake&&Object.hasOwn(story.labels,pack.keepsake.revealAt)&&state.cursor>=story.labels[pack.keepsake.revealAt]&&<StoryKeepsake pack={pack} story={story} progress={progress}/>}
  {simulation&&state.ended&&<SimulationScorecard result={simulation} previous={previousSimulation} complete={state.ended}/>}
  {simulation&&!state.ended&&<div className="story-meters" aria-label="Simulation score so far"><strong>Decision total: {simulation.total}/{simulation.maximum}</strong>{simulation.categories.map(c=><span key={c.variable}>{c.label}: {c.value}/{c.maximum}</span>)}</div>}
  {!simulation&&<div className="story-meters">{Object.entries(story.variables).filter(([,v]:any)=>v.visible).map(([k])=><span key={k}>{k}: {String(state.variables[k])}</span>)}</div>}
  <section className={`story-dialogue ${current?.type==='choice'?'story-choice-dialogue':''}`} aria-live="polite">{cinema&&choiceContext&&<p className="cinema-choice-context"><strong>{choiceContext.actor==='I'?'My story':displayPack.assets.characters[choiceContext.actor]?.name}</strong><span>{taxiWording(choiceContext.text)}</span></p>}{!state.ended&&current.type==='say'&&<><strong>{current.beat?'On the scene':current.actor==='I'?'My story':displayPack.assets.characters[current.actor].name}</strong><p>{taxiWording(current.text)}</p><button data-next disabled={busy||choiceBlocked} onClick={()=>advance(null)}>{current.beat?'Continue →':'Next →'}</button></>}{!state.ended&&current.type==='act'&&<><strong>On the scene</strong><p>{taxiWording(current.text)}</p><button data-next disabled={busy||choiceBlocked} onClick={()=>advance(null)}>{busy?'Action playing…':'Continue →'}</button></>}{!state.ended&&current.type==='choice'&&<><h2>What do I do?</h2>{reviewing&&<p>Reviewing your recorded choice. Press → or select it to continue.</p>}<div className="story-options" style={{gridTemplateColumns:cinema?`repeat(${current.options.length===4?2:Math.min(current.options.length,3)}, minmax(0, 1fr))`:undefined}}>{current.options.map((o:any,i:number)=><button key={o.id} data-choice={o.id} disabled={busy||choiceBlocked||(reviewing&&o.id!==progress.steps[viewStep])} onClick={()=>advance(o.id)}>{cinema&&<kbd aria-hidden="true">{i+1}</kbd>}<span>{o.text}</span></button>)}</div></>}
  {choiceBlocked&&<p role="status">Take a moment to read the response…</p>}
  {state.ended&&<>{(onReplay||!onProgress)&&<button onClick={replay}>Replay episode</button>}<h2>{pack.assessmentMode==='none'?'Story complete':passed?'Home again':'Four questions before we return'}</h2>{pack.assessmentMode==='none'&&<p>Completed · no knowledge quiz</p>}{score!==null&&<p role="status">{score/25}/4 correct · {score}/100 · {passed?(pack.writing?(progress.writing?.submitted?'Quiz passed. Your paragraph is ready for teacher review.':'Quiz passed. Complete your paragraph below.'):'Complete. Your story choices are separate from this knowledge score.'):'Review the explanations, then try again.'}</p>}{!passed&&pack.quiz.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.prompt}</legend>{q.options.map((o,j)=><label key={j}><input type="radio" name={'question-'+i} checked={answers[i]===j} onChange={()=>setAnswers(answers.map((v,k)=>k===i?j:v))}/>{o}</label>)}{score!==null&&<p>{q.explanation}</p>}</fieldset>)}{!passed&&<button disabled={answers.includes(-1)||choiceBlocked} onClick={()=>{if(lock.current||choicePause.current>Date.now())return;lock.current=true;save({...progress,quizzes:[...progress.quizzes,answers.slice()]});setAnswers([-1,-1,-1,-1]);timer.current=setTimeout(()=>{lock.current=false;},300);}}>Check answers</button>}</>}
  {state.ended&&(score!==null||pack.assessmentMode==='none')&&pack.writing&&<section className="story-writing" aria-label="Writing response">
   <h2>{progress.writing?.submitted?'Ready for teacher review':'Choose one question · write one paragraph'}</h2>
   {progress.writing?.submitted?<><p><strong>{pack.title}</strong>{studentName&&<> · Student: {studentName}</>}</p>{score!==null&&<p>{score/25}/4 correct · {score}/100</p>}<p><strong>{pack.writing.prompts[progress.writing.question]}</strong></p><p style={{whiteSpace:'pre-wrap'}}>{progress.writing.text}</p><p role="status"><strong>Keep this tab open. Show your quiz score and paragraph to the English Corner teacher before closing it.</strong></p></>:<>
    <p>Answer one question in one paragraph in English. Include a specific episode detail and explain how it supports your answer.</p>
    <fieldset><legend>Choose your question</legend>{pack.writing.prompts.map((prompt,i)=><label key={i} style={{display:'block',marginBlock:12}}><input type="radio" name="writing-question" checked={progress.writing?.question===i} onChange={()=>save({...progress,writing:{question:i,text:progress.writing?.text||'',submitted:false,revision:(progress.writing?.revision||0)+1}})}/>{prompt}</label>)}</fieldset>
    <label>Your paragraph<textarea rows={7} maxLength={4000} value={progress.writing?.text||''} disabled={!progress.writing} onChange={e=>save({...progress,writing:{...progress.writing!,text:e.target.value,revision:progress.writing!.revision+1}})} /></label>
    <button disabled={!progress.writing?.text.trim()||choiceBlocked} onClick={()=>{if(!progress.writing?.text.trim()||choicePause.current>Date.now())return;save({...progress,writing:{...progress.writing,submitted:true,revision:progress.writing.revision+1}});}}>Submit paragraph for teacher review</button>
   </>}
  </section>}
  </section>{state.ended&&endContent}</div>{!cinema&&<footer><button onClick={()=>setShowHistory(!showHistory)}>Recall the conversation</button>{musicControl}</footer>}
  {!cinema&&showHistory&&<aside aria-label="Conversation history">{history}</aside>}
  {drawer}
 </div>;
}
