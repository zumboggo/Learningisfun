import {ACTIONS,ACTION_DURATION} from '../../../functions/learning-content/src/acting-library.js';
/** Finite, paired choreography. Coordinates use the actual stage, including phone layouts. */
export function actionFrames(action:string,direction:number,distance:number,reactionScale=1){
 const d=direction,r=Math.max(0,Math.min(1,reactionScale)),step=Math.max(0,distance)*d;
 const keys=(values:string[])=>values.map((transform,i)=>({transform,offset:[0,.15,.34,.48,.72,1][i]}));
 const actor=action==='mounted-charge'?keys(['translateX(0)',`translateX(${-d*4}px)`,`translateX(${step*.5}px)`,`translateX(${step}px)`,`translateX(${step}px)`,'translateX(0)']):(action.startsWith('attack')||action.startsWith('sword-'))?keys(['translateX(0)',`translateX(${-d*8}px) rotate(${-d*3}deg)`,`translateX(${step}px) rotate(${d*5}deg)`,`translateX(${step}px) rotate(${d*3}deg)`,`translateX(${step*.45}px)`,'translateX(0)']):
 action==='stumble'?keys(['translateX(0)','rotate(-4deg)','translateX(14px) rotate(10deg)','translateX(18px) rotate(5deg)','translateX(6px) rotate(-3deg)','translateX(0)']):
 action==='bow'?keys(['rotate(0)','rotate(2deg)','rotate(8deg)','rotate(8deg)','rotate(3deg)','rotate(0)']):
 action==='cheer'?keys(['translateY(0)','translateY(3px)','translateY(-12px)','translateY(-6px)','translateY(0)','translateY(0)']):
 keys(['translateX(0)','translateX(0)',`translateX(${['give','steady'].includes(action)?step*.6:0}px)`,`translateX(${['give','steady'].includes(action)?step*.6:0}px)`,'translateX(0)','translateX(0)']);
 const target=keys(['translateX(0)','translateX(0)','translateX(0)',`translateX(${d*r*(['attack-dodged','sword-dodged'].includes(action)?32:['attack','sword-strike','shoot-arrow','magic-beam'].includes(action)?18:4)}px) rotate(${d*r*(action==='attack-dodged'?12:action==='attack'?7:0)}deg)`,`translateX(${d*r*4}px)`,'translateX(0)']);
 return {actor,target};
}
export async function performAction(root:HTMLElement,node:any,reduced:boolean,setResponses:(r:Record<string,string>)=>void,valid:()=>boolean){
 const cue=ACTIONS[node.action];if(!cue||reduced||!valid())return;
 const actor=root.querySelector<HTMLElement>(`[data-actor="${node.actor}"]`),target=node.targetActor?root.querySelector<HTMLElement>(`[data-actor="${node.targetActor}"]`):null;
 if(!actor)return;
 const a=actor.getBoundingClientRect(),b=target?.getBoundingClientRect();const direction=b?(b.x<a.x?-1:1):(actor.querySelector<HTMLElement>('.story-facing')?.style.transform.includes('-1')?-1:1);
 // Close most of the gap, retaining room for the arm; never travel off the stage.
 const gap=b?Math.abs((b.x+b.width/2)-(a.x+a.width/2)):0;
 const stage=root.querySelector('.story-stage')?.getBoundingClientRect();
 const room=b&&stage?(direction>0?stage.right-(b.x+b.width/2):(b.x+b.width/2)-stage.left)-b.height*.12:1000;
 const reactionScale=b?Math.min(1,Math.max(0,room)/(32+b.height*.21)):1;
 const soloRoom=stage?Math.max(0,direction>0?stage.right-a.right:a.left-stage.left):0;
 const travel=node.action==='mounted-charge'?Math.min(a.width*.28,soloRoom):Math.max(0,gap-a.height*.19);
 const frames=actionFrames(node.action,direction,travel,reactionScale);
 setResponses({[node.actor]:cue.actor,...(node.targetActor&&cue.target?{[node.targetActor]:cue.target}:{})});
 const animations=[actor.animate?.(frames.actor,{duration:ACTION_DURATION,easing:'ease-in-out'}),target?.animate?.(frames.target,{duration:ACTION_DURATION,easing:'ease-in-out'})].filter(Boolean) as Animation[];
 try{await Promise.all(animations.map(a=>a.finished));}catch{/* Navigation cancels all stage animations. */}
 if(valid())setResponses({});
}
