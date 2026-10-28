import {executeLearningContent} from './learning-content.service';
export interface GeneratedCard {front:string;back:string;hint:string;tags:string[]}
export interface QuizQuestion {
  type: 'mc' | 'cloze';
  questionText: string;
  options?: string[];
  correctIndex?: number;
  clozeAnswer?: string;
  explanation: string;
}

export async function generateFlashcardsFromNotes(notes:string):Promise<GeneratedCard[]>{return (await executeLearningContent<{output:GeneratedCard[]}>({action:'generateTeacherAI',feature:'flashcards',notes})).output;}
export async function generateQuizFromSources(notes:string,flashcardFronts:string[],questionCount:number,weights:{notes:number;flashcards:number}):Promise<QuizQuestion[]>{return (await executeLearningContent<{output:QuizQuestion[]}>({action:'generateTeacherAI',feature:'quiz',notes,flashcardFronts,questionCount,weights})).output;}
