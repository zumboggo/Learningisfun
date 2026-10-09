export const YOUNG_ID:string;
export const YOUNG_VERSION:number;
export const sourceUrl:string;
export const sourceNotes:{id:string;title:string;quote?:string;url?:string;note:string}[];
export const assignmentPrompt:string;
export const rubric:string[];
export interface YoungAssessment {complete:boolean;scores:number[];total:number;indicators:number[];ending:{title:string;paragraphs:string[]}|null;}
export function assessYoung(choices:string[],attemptId?:string):YoungAssessment;
export const scenes: {title:string;choices:{id:string;label:string;response:string;points:number[];reactions:string[];delta:number[]}[]}[];

export const driverQuestions: {prompt:string;options:string[];answer:number;note:string}[];
export function assessDriver(attempts?:number[][]):{passed:boolean;score:number};

export function publicationEvent(attemptId?:string):number;
export function ending(choices:string[],attemptId?:string):{title:string;paragraphs:string[]};
