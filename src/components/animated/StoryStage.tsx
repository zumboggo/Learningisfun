import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {StoryPackage,StoryState} from '../../../functions/learning-content/src/story-engine.js';
import PuppetActor from './PuppetActor';
import {armGeometry} from './character-geometry';
import {ACTIONS,POSES} from '../../../functions/learning-content/src/acting-library.js';
export default function StoryStage({pack,state,current,speaking,reduced,responses={}}:{pack:StoryPackage;state:StoryState;current:any;speaking:boolean;reduced:boolean;responses?:Record<string,string>}){
 const modern=pack.format===2,actors=Object.entries(state.stage.actors),speaker=current?.type==='say'&&current.actor!=='I'?current.actor:undefined;
 const shot=current?.type==='act'?'wide':state.stage.camera?.shot||'auto';
 const resolved=shot==='auto'?(speaker&&actors.length===1?'medium':'wide'):shot;
 const focus=state.stage.camera?.actor||speaker;
 const positions:Record<string,number>={left:24,center:50,right:76};
 const scale=!modern?1:resolved==='close'?2.05:resolved==='medium'?1.42:1;
 const x=positions[state.stage.actors[focus||'']?.position]||50;
 const offset=Math.max(-(scale-1)*50,Math.min((scale-1)*50,(50-x)*scale));
 return <div className={`story-stage ${modern?'story-stage-living':''}`} data-shot={resolved} data-actions={/^act /m.test(pack.script)||undefined} data-paired={actors.length===2&&/^act /m.test(pack.script)||undefined}>
  <div className="story-camera" style={{transform:`translateX(${offset}%) scale(${scale})`,transitionDuration:reduced||current?.type==='act'?'0ms':undefined} as CSSProperties}>
   <div className="story-world" style={{backgroundImage:state.stage.background?`url("${pack.assets.backgrounds[state.stage.background]?.src}")`:undefined}}>
    {actors.map(([id,a])=>{const c=pack.assets.characters[id],asset=c.expressions[a.expression]||c.expressions.neutral;return <div data-actor={id} data-expression={a.expression} key={id} className={`story-actor position-${a.position} ${c.rig?'has-rig':''}`}>
     <div className="story-facing" style={{transform:`scaleX(${a.facing})`}}>{c.rig?<PuppetActor character={c} actorId={id} performanceKey={state.cursor} emotion={a.expression} talking={speaking&&id===speaker} gesture={id===speaker?current.gesture:undefined} rest={a.rest} prop={a.prop} response={responses[id]||current?.beatResponses?.[id]||(reduced&&current?.type==='act'?(id===current.actor?ACTIONS[current.action]?.actor:id===current.targetActor?ACTIONS[current.action]?.target:undefined):undefined)} reduced={reduced}/>:<img src={asset?.src} alt={`${c.name} — ${a.expression}`} onError={e=>{e.currentTarget.style.opacity='0';}}/>}</div>
     {!modern&&<span>{c.name}</span>}
    </div>;})}
    {current?.type==='act'&&['shoot-arrow','magic-beam'].includes(current.action)&&<Projectile key={state.cursor} state={state} current={current} reduced={reduced} active={!!responses[current.actor]}/>}
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
