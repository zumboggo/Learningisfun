export interface WritingAssessment {rubricVersion:number;criteria:{key:string;title:string;points:number;max:number;reason:string}[];writingPoints:number;choicePoints:number;total:number;}
export const writingRubric:{key:string;title:string;max:number;description:string}[];
export const writingScoringInstruction:string;
export function parseWritingAssessment(raw:string,choices:string[],version?:number):{assessment:WritingAssessment;answer:string};
export function episodeScore(attempt:{status:string;version:number;attemptId:string;choices:string[]},writing?:{attemptId:string;mode:string;state:string;assessment?:WritingAssessment}[]):number|null;
