import {actorBounds,fitCamera,unionBoxes} from './camera-framing';
import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {StoryPackage,StoryState} from '../../../functions/learning-content/src/story-engine.js';
import PuppetActor from './PuppetActor';
import MountedActor from './MountedActor';
import {armGeometry} from './character-geometry';
import {ACTIONS,POSES} from '../../../functions/learning-content/src/acting-library.js';
export default function StoryStage({pack,state,current,speaking,reduced,responses={}}:{pack:StoryPackage;state:StoryState;current:any;speaking:boolean;reduced:boolean;responses?:Record<string,string>}){
 const modern=pack.format===2,actors=Object.entries(state.stage.actors),speaker=current?.type==='say'&&current.actor!=='I'?current.actor:undefined;
 const performance=current?.type==='act'?current:state.cues?.find(n=>n.type==='perform');
 const camera=state.stage.camera,requested=camera?.shot||'auto';
 const shot=performance?(requested==='action'?'action':'wide'):requested;
 const resolved=shot==='auto'?(speaker&&actors.length===1?'medium':'wide'):shot;
 const focus=camera?.actor||speaker||actors[0]?.[0];
 const positions:Record<string,number>={left:24,center:50,right:76};
 const stageRef=useRef<HTMLDivElement>(null),worldRef=useRef<HTMLDivElement>(null);
 const [frame,setFrame]=useState({scale:1,x:0,y:0});
 const targetKey=actors.map(([id,a])=>`${id}:${a.position}:${a.rest}`).join('|');
 useLayoutEffect(()=>{
  const stage=stageRef.current,world=worldRef.current;if(!stage||!world)return;
  const update=()=>{
   const pair=['two','action'].includes(resolved);
   const ids=pair?[camera?.actor||performance?.actor||focus,camera?.otherActor||performance?.targetActor||actors.find(([id])=>id!==focus)?.[0]]:[focus];
   const boxes=ids.filter(Boolean).flatMap(id=>{const el=world.querySelector<HTMLElement>(`[data-actor="${id}"]`);return el?[actorBounds(el,resolved,POSES[state.stage.actors[id!]?.rest||'']?.bodyDrop||0)]:[];});
   const next=fitCamera(stage.clientWidth,stage.clientHeight,!modern||resolved==='wide'?null:unionBoxes(boxes),resolved==='action'?1.6:resolved==='medium'||resolved==='two'?2.2:3.4);
   setFrame(old=>old.scale===next.scale&&old.x===next.x&&old.y===next.y?old:next);
  };
  update();if(typeof ResizeObserver==='undefined')return;
  const observer=new ResizeObserver(update);observer.observe(stage);return()=>observer.disconnect();
 // Measure stable SVG geometry and stage layout, not animated screen rectangles.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[resolved,focus,camera?.otherActor,targetKey,modern,performance?.actor,performance?.targetActor]);
 const duration=reduced||performance?0:camera?.duration??.65;
 return <div ref={stageRef} className={`story-stage ${modern?'story-stage-living':''}`} data-shot={resolved} data-camera-scale={frame.scale.toFixed(3)} data-actions={/^(act|perform) /m.test(pack.script)||undefined} data-paired={actors.length===2&&/^(act|perform) /m.test(pack.script)||undefined}>
  <div className="story-camera" style={{transform:`translate(${frame.x}px, ${frame.y}px) scale(${frame.scale})`,transformOrigin:'0 0',transitionDuration:`${duration}s`} as CSSProperties}>
   <div ref={worldRef} className="story-world" style={{backgroundImage:state.stage.background?`url("${pack.assets.backgrounds[state.stage.background]?.src}")`:undefined}}>
    {!reduced&&['dust','rain'].includes(state.stage.environment||'')&&<div className={`story-environment environment-${state.stage.environment}`} aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${(i*37+11)%100}%`,top:`${(i*23)%100}%`,animationDelay:`-${i*.71}s`,animationDuration:`${state.stage.environment==='rain'?1.4+(i%3)*.3:12+(i%5)*2}s`}}/>)}</div>}

    {actors.map(([id,a])=>{const c=pack.assets.characters[id],asset=c.expressions[a.expression]||c.expressions.neutral;
     const target=a.gaze&&!['auto','away','down','front'].includes(a.gaze)?a.gaze:(performance?.actor===id?performance.targetActor:speaker&&speaker!==id?speaker:actors.find(([other])=>other!==id)?.[0]);
     const targetPosition=state.stage.actors[target||'']?.position;
     const direction=targetPosition?Math.sign(positions[targetPosition]-positions[a.position]):0;
     const gazeX=a.gaze==='front'||a.gaze==='down'?0:(a.gaze==='away'?-(direction||1):direction)*a.facing*2.5;
     const gazeY=a.gaze==='down'||(!a.gaze&&a.expression==='embarrassed')?2:0;
     return <div data-actor={id} data-expression={a.expression} data-gaze={a.gaze||'auto'} data-impact={c.impact} style={{zIndex:performance?.actor===id?2:undefined}} key={id} className={`story-actor position-${a.position} ${c.rig?'has-rig':''} ${performance?.action==='mounted-charge'&&performance.actor===id?'is-mounted':''}`}>
     <div className="story-facing" style={{transform:`scaleX(${a.facing})`}}>{performance?.action==='mounted-charge'&&performance.actor===id?<MountedActor character={c} emotion={a.expression} reduced={reduced} active={!!responses[id]} performanceKey={state.cursor}/>:c.rig?<PuppetActor gazeX={gazeX} gazeY={gazeY} character={c} actorId={id} performanceKey={state.cursor} emotion={a.expression} talking={speaking&&id===speaker} gesture={id===speaker?current.gesture:undefined} rest={a.rest} prop={a.prop} response={responses[id]||current?.beatResponses?.[id]||(reduced&&current?.type==='act'?(id===current.actor?ACTIONS[current.action]?.actor:id===current.targetActor?ACTIONS[current.action]?.target:undefined):undefined)} reduced={reduced}/>:<img src={asset?.src} alt={`${c.name} — ${a.expression}`} onError={e=>{e.currentTarget.style.opacity='0';}}/>}</div>
     {!modern&&<span>{c.name}</span>}
    </div>;})}
    {performance&&['shoot-arrow','magic-beam'].includes(performance.action)&&<Projectile key={`${state.cursor}-${!!responses[performance.actor]}`} state={state} current={performance} reduced={reduced} active={!!responses[performance.actor]}/>}
   </div>
  </div>
 </div>;
}

function Projectile({state,current,reduced,active}:{state:StoryState;current:any;reduced:boolean;active:boolean}){
 const ref=useRef<SVGSVGElement>(null),[size,setSize]=useState({width:1000,height:600,actorX:240,actorY:30,actorHeight:576,targetX:760});
 useEffect(()=>{const parent=ref.current?.parentElement;if(!parent)return;const update=()=>{const actor=parent.querySelector<HTMLElement>(`[data-actor="${current.actor}"]`),target=parent.querySelector<HTMLElement>(`[data-actor="${current.targetActor}"]`);setSize({width:parent.clientWidth,height:parent.clientHeight,actorX:actor?actor.offsetLeft+actor.offsetWidth/2:0,actorY:actor?.offsetTop||0,actorHeight:actor?.offsetHeight||0,targetX:target?target.offsetLeft+target.offsetWidth/2:0});};update();const observer=new ResizeObserver(update);observer.observe(parent);return()=>observer.disconnect();},[]);
 const a=state.stage.actors[current.actor],b=state.stage.actors[current.targetActor];
 if(!a||!b)return null;
 const pose=POSES[ACTIONS[current.action].actor],hand=armGeometry('right',pose.rightUpperArm||0,pose.rightForearm||0),scale=size.actorHeight/600,d=a.facing;
 const x=size.actorX+(hand.wx-120)*scale*d,y=size.actorY+hand.wy*scale;
 const distance=Math.max(0,(size.targetX-x)*d-size.height*.06);
 return <svg ref={ref} className={`story-projectile ${reduced?'still':active?'active':'settled'}`} viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-label={current.action==='shoot-arrow'?'Arrow flight':'Magic beam'} role="img">
 <g transform={`translate(${x} ${y}) scale(${d} 1)`}>
 {current.action==='shoot-arrow'?<g className="story-arrow" style={{'--flight':`${Math.max(0,distance-32)}px`} as CSSProperties}><path d="M -20 0 H 32 M 32 0 L 24 -4 M 32 0 L 24 4 M -14 0 L -20 -4 M -14 0 L -20 4" fill="none" stroke="#463e32" strokeWidth="2"/></g>:<g className="story-beam"><path d={`M 0 0 H ${distance}`} stroke="#66d8e8" strokeWidth="14" strokeLinecap="round" opacity=".65"/><path d={`M 0 0 H ${distance}`} stroke="#edffff" strokeWidth="4" strokeLinecap="round"/><circle r="12" fill="#bafaff" opacity=".85"/></g>}
 </g></svg>;
}
