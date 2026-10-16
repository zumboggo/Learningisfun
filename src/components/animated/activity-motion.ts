import {useEffect,useRef,useState} from 'react';
import type {StoryActivity} from '../../../functions/learning-content/src/story-engine.js';
import {performAction} from './action-motion';

/** A gait clock belongs to the activity, never the dialogue cursor. Pause retains phase. */
export function useWalkClock(active:boolean){
 const elapsed=useRef(0),[time,setTime]=useState(0);
 useEffect(()=>{if(!active)return;let frame=0,last:number|undefined,published=0;
  const tick=(now:number)=>{if(last!==undefined)elapsed.current+=Math.min(80,now-last);last=now;if(now-published>=32){setTime(elapsed.current);published=now;}frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[active]);return time;
}
export function walkingPose(ms:number,pace:string){
 const period=pace==='slow'?1800:pace==='brisk'?1050:1400,phase=ms/period*Math.PI*2,s=Math.sin(phase),lift=7;
 return {bodyDrop:3+Math.cos(phase*2),leftFootX:24*s,rightFootX:-24*s,leftFootLift:Math.max(0,s)*lift,rightFootLift:Math.max(0,-s)*lift,leftUpperArm:-11*s,rightUpperArm:11*s,leftForearm:-8,rightForearm:-8,torso:1.5*s,head:-s};
}
/** Pausable recovery; cancellation cannot leave a pending timer or sound. */
export function activityWait(ms:number,signal:AbortSignal){return new Promise<void>(resolve=>{
 if(signal.aborted){resolve();return;}const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();};const timer=setTimeout(done,ms);signal.addEventListener('abort',done,{once:true});
});}
export async function trainContinuously(root:HTMLElement,actor:string,activity:StoryActivity,publish:(r:Record<string,string>)=>void,signal:AbortSignal){
 let strokes=0;
 while(!signal.aborted){
  await performAction(root,{action:'sword-strike',actor,targetActor:activity.targetActor},false,publish,()=>!signal.aborted,signal);
  if(signal.aborted)break;
  strokes++;
  // A short recovery on every stroke, plus a longer breath after a small set.
  await activityWait(activity.pace==='tiring'?(strokes%3===0?1900:750):450,signal);
 }
}
