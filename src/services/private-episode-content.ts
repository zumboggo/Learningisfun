import {executeLearningContent} from './learning-content.service';
import {loadStoryCache,saveStoryCache} from './animated-stories';
type Content=ReturnType<typeof import('../../functions/learning-content/src/episode-content.js')['contentForEpisode']>;
const content=new Map<string,Content>(),envelopes=new Map<string,{html:string;entry:string;audio?:string}>();
let activeOwner='';
export async function loadPrivateEpisode(userId:string,classId:string,episode:string,version:number){if(activeOwner!==userId){content.clear();envelopes.clear();activeOwner=userId;}const key=episode+':'+version,cacheKey='private-episode:'+userId+':'+classId+':'+key;let envelope:{html:string;entry:string;logic:string;audio?:string};
 if(navigator.onLine){envelope=await executeLearningContent({action:'readPrivateEpisode',classId,episode,version});await saveStoryCache(cacheKey,envelope);}else{envelope=await loadStoryCache(cacheKey);if(!envelope)throw Error('Connect once to open this episode with your class account.');}
 const url=URL.createObjectURL(new Blob([envelope.logic],{type:'text/javascript'}));try{const module=await import(/* @vite-ignore */ url);if(module.content)content.set(key,module.content);}finally{URL.revokeObjectURL(url)}
 envelopes.set(key,envelope);
}
export function contentForEpisode(id:string,version:number):Content{const value=content.get(id+':'+version);if(!value)throw Error('Open this episode through your class account first.');return value;}
export const contentForVersion=(version:number)=>contentForEpisode('own-english',version);
export function privateEpisodeHtml(id:string,version:number){const envelope=envelopes.get(id+':'+version);if(!envelope)return '';const base=new URL(import.meta.env.BASE_URL+envelope.entry,window.location.origin).href;return envelope.html.replace('<head>','<head><base href="'+base+'">');}
export const privateEpisodeAudio=(id:string,version:number)=>envelopes.get(id+':'+version)?.audio||'';
export function clearPrivateEpisodeMemory(){activeOwner='';content.clear();envelopes.clear()}
export function episodeScore(attempt:{status:string;version:number;choices:string[];attemptId:string},writing:{attemptId:string;mode?:string;state?:string;assessment?:{rubricVersion?:number;total:number}}[]=[]):number|null{if(attempt.status!=='complete')return null;if(attempt.version===1)return contentForVersion(attempt.version).assessYoung(attempt.choices).total;const scores=writing.filter(r=>r.attemptId===attempt.attemptId&&r.mode==='feedback'&&r.state==='complete'&&r.assessment?.rubricVersion===2).map(r=>r.assessment!.total);return scores.length?Math.max(...scores):null;}
export const writingRubric=[{key:'understanding',title:'Attention to the ideas',max:20,description:'Represent the source accurately with precise evidence.'},{key:'task',title:'Answering the prompt',max:20,description:'Address the task and consider objections.'},{key:'reasoning',title:'Supported independent thinking',max:20,description:'Explain your reasoning using evidence.'}];
