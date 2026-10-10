import type {YoungAssessment} from './young-content.js';
export interface JournalWriting {question?:string;reflection?:string}
export interface JournalStory {id:string;version:number;title:string;chapter:string;boundary:string;concepts:string[];sourceUrl:string;edition:string;checked:string;notes:string;sources:{id:string;title:string;quote:string;note:string;url:string}[];scenes:{title:string;speaker:string;cast:string[];text:string[];kind:string;source:string|null;margin:{text:string;followups:{q:string;a:string}[]}|null;choices:{id:string;label:string;response:string;points:number[]}[]}[];driverQuestions:{prompt:string;options:string[];answer:number;note:string}[]}
export function journalContent(story:JournalStory):JournalStory & {assessYoung(choices:string[]):YoungAssessment;assessDriver(attempts?:number[][]):{passed:boolean;score:number};sourceNotes:JournalStory['sources'];assignmentPrompt:string;rubric:string[]};
export const notebookDomains:string[];
export function validateJournal(journal:JournalWriting|undefined,choices:string[],sceneCount:number):JournalWriting;
export function journalProgress(a:{choices:string[];driverAttempts?:number[][];journal?:JournalWriting},sceneCount:number):string[];
