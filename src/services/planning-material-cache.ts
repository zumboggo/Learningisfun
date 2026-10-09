import {executeLearningContent} from './learning-content.service';
// Account and class scoped; never reuse another account's planning response.
const cache=new Map<string,{at:number;value:unknown}>();
const pending=new Map<string,Promise<unknown>>();
export async function cachedPlanningMaterials<T>(userId:string,classId?:string):Promise<T> {
  const key=JSON.stringify([userId,classId||'all']);
  const entry=cache.get(key);
  if(entry&&Date.now()-entry.at<15*60_000)return entry.value as T;
  const running=pending.get(key);if(running)return running as Promise<T>;
  const request=executeLearningContent<T>({action:'readPlanningMaterials',classId,kind:'copywork',includeCards:false}).then(value=>{cache.set(key,{at:Date.now(),value});return value;}).finally(()=>pending.delete(key));
  pending.set(key,request);return request;
}
