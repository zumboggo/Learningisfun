import type {CSSProperties} from 'react';
import type {StoryPackage,StoryState} from '../../../functions/learning-content/src/story-engine.js';
import PuppetActor from './PuppetActor';
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
     <div className="story-facing" style={{transform:`scaleX(${a.facing})`}}>{c.rig?<PuppetActor character={c} actorId={id} performanceKey={state.cursor} emotion={a.expression} talking={speaking&&id===speaker} gesture={id===speaker?current.gesture:undefined} rest={a.rest} response={responses[id]||current?.beatResponses?.[id]} reduced={reduced}/>:<img src={asset?.src} alt={`${c.name} — ${a.expression}`} onError={e=>{e.currentTarget.style.opacity='0';}}/>}</div>
     {!modern&&<span>{c.name}</span>}
    </div>;})}
   </div>
  </div>
 </div>;
}
