export interface Resource {id:string;kind:'routine'|'activity'|'text'|'link'|'episode';title:string;minutes:number;instructions?:string;materials?:string;textId?:string;versionId?:string;url?:string;resourceId?:string}
export interface Lesson {id:string;date:string;blockId:string;title:string;notes:string;completed:boolean;items:Resource[]}
export interface GeneralPlan {schemaVersion:1;goals?:string;calendar:{start:string;end:string;teachingDays:number[];holidays:string[];makeupDays:string[];terms:{name:string;start:string;end:string}[];rotation:boolean;cycleLength:number;overrides:Record<string,number>};subjects:{id:string;name:string;classId:string}[];timetable:{id:string;day:number;title:string;subjectId:string;startTime:string;minutes:number}[];resources:Resource[];lessons:Lesson[]}
export function emptyPlanner():GeneralPlan;
export function validDate(date:string):boolean;
export function dayDates(start:string,end:string):string[];
export function teachingDates(calendar:GeneralPlan['calendar']):string[];
export function scheduleForDate(plan:GeneralPlan,date:string):GeneralPlan['timetable'];
export function validatePlanner(plan:unknown):string[];
export function importPreview(current:GeneralPlan,incoming:GeneralPlan,replaceIds?:string[]):{errors:string[];plan:GeneralPlan;added:number;replaced:number};
export function annualPrompt(plan:GeneralPlan,goals:string):string;
