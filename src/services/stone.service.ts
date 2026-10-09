import Dexie, {type EntityTable} from 'dexie';
import {executeLearningContent} from './learning-content.service';
export {STONE_CLASS_ID} from '../../functions/learning-content/src/stone-engine.js';
import {EPISODE,VERSION,assess} from '../../functions/learning-content/src/stone-engine.js';
export interface StoneAttempt {attemptId:string;userId:string;classId:string;episode:string;version:number;choices:string[];revision:number;updatedAt:string;createdAt:string;pending:boolean;status:'active'|'complete';preview:boolean;}
export interface StoneRank {nickname:string;score:number;rank:number;mine:boolean;}
export interface StoneRemote {preview:boolean;attempts:StoneAttempt[];leaderboard:StoneRank[];}
export const stoneDb=new Dexie('LearningIsFunTeachingStone') as Dexie & {attempts:EntityTable<StoneAttempt,'attemptId'>};
stoneDb.version(1).stores({attempts:'attemptId,userId,[userId+classId],updatedAt'});
export function newAttempt(userId:string,classId:string,preview:boolean):StoneAttempt{return {attemptId:crypto.randomUUID(),userId,classId,episode:EPISODE,version:VERSION,choices:[],revision:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),pending:!preview,status:'active',preview};}
export function extendAttempt(attempt:StoneAttempt,choices:string[]):StoneAttempt {
 assess(choices);
 if(choices.length<attempt.choices.length||!attempt.choices.every((c,i)=>c===choices[i]))throw new Error('A choice cannot rewrite this attempt; start a replay instead.');
 return {...attempt,choices:choices.slice(),revision:choices.length,status:choices.length===10?'complete':'active',updatedAt:new Date().toISOString(),pending:!attempt.preview};
}
export async function localAttempts(userId:string,classId:string){return (await stoneDb.attempts.where('[userId+classId]').equals([userId,classId]).toArray()).filter(a=>a.episode===EPISODE&&a.version===VERSION).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
export async function readStone(classId:string){return executeLearningContent<StoneRemote>({action:'readStone',classId});}
export async function syncStone(userId:string,classId:string,refreshResults=true){
 for(const attempt of await localAttempts(userId,classId)){
  if(!attempt.pending||attempt.preview)continue;
  try{
   await executeLearningContent({action:'saveStone',classId,attempt});
   await stoneDb.transaction('rw',stoneDb.attempts,async()=>{const current=await stoneDb.attempts.get(attempt.attemptId);if(current&&current.revision===attempt.revision)await stoneDb.attempts.update(attempt.attemptId,{pending:false});});
  }catch(error){
   if(error instanceof Error&&error.message.includes('another device')){
    // Preserve both histories; do not overwrite the remote branch.
    await stoneDb.transaction('rw',stoneDb.attempts,async()=>{const current=await stoneDb.attempts.get(attempt.attemptId);if(current){await stoneDb.attempts.put({...current,attemptId:crypto.randomUUID(),pending:true});await stoneDb.attempts.delete(attempt.attemptId);}});
   }else throw error;
  }
 }
 if(!refreshResults)return null;
 const result=await readStone(classId);
 for(const remote of result.attempts){
  const existing=await stoneDb.attempts.get(remote.attemptId);
  if(!existing||(!existing.pending&&remote.choices.length>existing.choices.length))await stoneDb.attempts.put({...remote,userId,classId,preview:false,pending:false,createdAt:remote.createdAt||new Date().toISOString(),updatedAt:remote.updatedAt||new Date().toISOString()});
 }
 return result;
}
export function validStoneMessage(event:MessageEvent,source:Window|null,channel:string){
 const m=event.data;
 return event.source===source&&event.origin===window.location.origin&&m&&m.protocol==='teaching-stone-v1'&&(m.type==='ready'||(m.channel===channel&&['save','complete','replay','next'].includes(m.type)));
}
