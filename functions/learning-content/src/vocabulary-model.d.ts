export type VocabularyCard={id:string;front:string;back:string};
export type VocabularySchedule={name:string;classId:string;firstWeek:string;wordsPerWeek:number;skipWeeks:string[];cards:VocabularyCard[];active:boolean;released?:string[]};
export function monday(value:string):string;
export function batches(value:VocabularySchedule):{week:string;releaseAt:string;cards:VocabularyCard[]}[];
export function parseVocabularyCsv(content:string):{cards:VocabularyCard[];errors:string[]};
