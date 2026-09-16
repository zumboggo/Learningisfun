import { functions } from '@/lib/appwrite';
import type { LearningText, TextParagraph } from '@/types';
export interface PublicReading {text:LearningText;paragraphs:TextParagraph[]}
export async function publicReadingRequest<T>(textId:string,action='read',download=false):Promise<T> {
  const execution=await functions.createExecution('public-reading',JSON.stringify({textId,action,download}));
  const result=JSON.parse(execution.responseBody||'{}');
  if(execution.status==='failed'||execution.responseStatusCode>=400||result.error)throw new Error(result.error||'Could not load the shared text.');
  return result;
}
