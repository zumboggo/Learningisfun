import {executeLearningContent as call} from './learning-content.service';
export type TeachingDefaults={ageRange:string;audienceNotes:string;wordTarget:number|null};
export type DefaultsResponse={value:TeachingDefaults|null;effective:TeachingDefaults|null;revision:number};
export const readTeachingDefaults=(classId?:string)=>call<DefaultsResponse>({action:'readTeachingDefaults',classId});
export const audienceFrom=(v:TeachingDefaults|null)=>v?[v.ageRange&&'Ages '+v.ageRange,v.audienceNotes].filter(Boolean).join(' · '):'';
export async function draftDefaults(classId?:string){const {effective}=await readTeachingDefaults(classId);return {audience:audienceFrom(effective),...(effective?.wordTarget?{length:'custom',customWords:effective.wordTarget}:{})};}
