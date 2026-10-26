import type {CharacterView} from '../../../functions/learning-content/src/character-builder.js';
export interface AngleRig {preset?:string;finish?:string;appearance?:Record<string,string>;palette?:Record<string,string>;views?:Partial<Record<'three-quarter'|'profile',CharacterView>>}
export interface AngleCharacter {name:string;rig:AngleRig}
export type CharacterOrientation='auto'|'front'|'three-quarter'|'profile';
export function characterAngle(rig:AngleRig|undefined,orientation:CharacterOrientation='auto',turn=0,occupied=false){
 let angle=orientation==='auto'?(turn?'three-quarter':'front'):orientation;
 if(occupied||rig?.preset!=='cartoon-v1')angle='front';
 // Old hybrid packages retain their approved artwork until given matching views.
 if(rig?.finish==='hybrid'&&angle!=='front'&&!rig.views?.[angle])angle='front';
 return {angle,direction:orientation==='auto'&&turn<0?-1:1,amount:angle==='profile'?1:angle==='three-quarter'?.55:0};
}
/** Project shoulder anchors while preserving segment lengths and elbow joins. */
export function shoulderOffset(side:'left'|'right',amount:number,direction:number){return (side==='left'?1:-1)*amount*12+direction*amount*5;}
