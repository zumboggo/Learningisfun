import type {TextDraft} from '../../../../src/services/text-authoring';
export const LENGTHS:Record<string,[number,number]>;
export function lengthRange(brief:TextDraft['brief']):[number,number];
export function proseWords(content:string):number;
export function newTextDraft():TextDraft;
export function readingParagraphs(v:TextDraft,textId:string,resolve?:(fileId:string)=>string):string[];
