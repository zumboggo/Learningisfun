import Dexie,{type EntityTable} from 'dexie';
import {executeLearningContent} from './learning-content.service';
import egypt from '../../functions/learning-content/src/ethics-egypt-context.json';
import type {StoneAttempt} from './stone.service';
export type Source={kind:'reading';title:string;url:string;passage:string}|{kind:'episode';episode:string;version:number;attemptId:string;choices:string[];index:number;title?:string;passage?:string;label?:string;outcome?:string;options?:string[][];aside?:string};
export interface Entry {id:string;source:Source;answers:string[];submitted:boolean;submittedAt?:string|null;reconsideration:string;reconsideredAt?:string|null;revision:number;updatedAt:string;userId:string;classId:string;key:string;dirty?:boolean;studentName?:string;preview?:boolean;}
interface Pending {key:string;userId:string;classId:string;entry:Entry;}
export interface PortfolioData {teacher:boolean;settings:{open:boolean;deadline:string|null};entries:Entry[];}
export const portfolioDb=new Dexie('LearningIsFunEthicsPortfolio') as Dexie&{entries:EntityTable<Entry,'key'>;outbox:EntityTable<Pending,'key'>};
portfolioDb.version(1).stores({entries:'key,[userId+classId],updatedAt',outbox:'key,[userId+classId]'});
export const entryKey=(userId:string,classId:string,id:string)=>JSON.stringify([userId,classId,id]);
export const textOnly=(s:string)=>s.replace(/<[^>]*>/g,'');
export function decisionSource(a:StoneAttempt,index:number):Source {const s=egypt.scenes[index],choice=a.choices[index];return {kind:'episode',episode:a.episode,version:a.version,attemptId:a.attemptId,choices:a.choices.slice(),index,title:s.title,passage:s.text.map(textOnly).join('\n\n'),aside:textOnly(s.aside),options:s.choices,label:s.choices.find(c=>c[0]===choice)?.[1]||choice,outcome:s.responses[choice as keyof typeof s.responses]||''};}
export function newEntry(userId:string,classId:string,source:Source,preview=false):Entry{const id=crypto.randomUUID();return {id,key:entryKey(userId,classId,id),userId,classId,source,answers:['','',''],submitted:false,reconsideration:'',revision:0,updatedAt:new Date().toISOString(),preview};}
export async function localEntries(userId:string,classId:string){return (await portfolioDb.entries.where('[userId+classId]').equals([userId,classId]).toArray()).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
export async function saveDraft(entry:Entry){await portfolioDb.entries.put({...entry,dirty:true,updatedAt:new Date().toISOString()});}
export async function queueEntry(entry:Entry){
 const next={...entry,revision:entry.revision+1,dirty:false,updatedAt:new Date().toISOString()};
 await portfolioDb.transaction('rw',portfolioDb.entries,portfolioDb.outbox,async()=>{
  const current=await portfolioDb.entries.get(entry.key);if(current&&current.revision!==entry.revision)throw Error('This entry changed in another tab. Your writing is still visible; export it before reopening.');
  await portfolioDb.entries.put(next);if(!next.preview)await portfolioDb.outbox.put({key:next.key+':'+next.revision,userId:next.userId,classId:next.classId,entry:next});
 });return next;
}
const syncing=new Map<string,Promise<void>>();
export function syncPortfolio(userId:string,classId:string){const scope=entryKey(userId,classId,'sync');const running=syncing.get(scope);if(running)return running;
 const job=(async()=>{const pending=await portfolioDb.outbox.where('[userId+classId]').equals([userId,classId]).toArray();pending.sort((a,b)=>a.entry.revision-b.entry.revision);for(const item of pending){await executeLearningContent({action:'saveEthicsPortfolio',classId,entry:item.entry});await portfolioDb.outbox.delete(item.key);}})().finally(()=>syncing.delete(scope));syncing.set(scope,job);return job;
}
export async function readPortfolio(userId:string,classId:string){const data=await executeLearningContent<PortfolioData>({action:'readEthicsPortfolio',classId});if(!data.teacher){for(const e of data.entries){const key=entryKey(userId,classId,e.id),local=await portfolioDb.entries.get(key);const pending=await portfolioDb.outbox.where('[userId+classId]').equals([userId,classId]).filter(r=>r.entry.id===e.id).count();if(!pending&&!local?.dirty&&(!local||e.revision>local.revision))await portfolioDb.entries.put({...e,userId,classId,key});}}return data;}
export const setPortfolioStage=(classId:string,open:boolean,deadline:string|null)=>executeLearningContent<{settings:PortfolioData['settings']}>({action:'setEthicsPortfolioStage',classId,open,deadline});
export function exportEntries(entries:Entry[]){const text=entries.map(e=>{const s=e.source;return [`# ${s.title||'Episode decision'}`,`Source: ${s.kind==='reading'?s.url:`${s.episode} · version ${s.version} · life ${s.attemptId} · decision ${s.index+1}`}`,textOnly(s.passage||''),s.kind==='episode'?`Choice: ${s.label}\nOutcome: ${s.outcome}`:'',...e.answers.map((a,i)=>`## ${['Idea or choice','Reasons and difficulty','Original judgment'][i]}\n${a}`),`Original submitted: ${e.submittedAt||'Draft'}`,`## Reconsideration\n${e.reconsideration||'Not yet added'}\n${e.reconsideredAt||''}`].join('\n\n');}).join('\n\n---\n\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='principles-portfolio.txt';a.click();URL.revokeObjectURL(url);}
