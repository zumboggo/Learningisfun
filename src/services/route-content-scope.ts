import type {ContentDomain} from './class-material-refresh.service';
const all:ContentDomain[]=['sessions','flashcards','quizzes','writing','texts','presentations'];
// Global feature lists span enrolled/owned classes; a class page spans only itself.
export function routeContentScope(path:string,classIds:string[]):{classIds:string[];domains:ContentDomain[]}{
 const selected=/^\/classes\/([^/]+)/.exec(path)?.[1];
 if(selected)return {classIds:classIds.filter(id=>id===selected),domains:all};
 const feature=path.split('/')[1];
 const domains:Record<string,ContentDomain[]>={decks:['flashcards'],quizzes:['quizzes'],texts:['texts'],writing:['writing','sessions'],presentations:['presentations','sessions'],discussions:['sessions','texts'],lessons:['sessions'],dashboard:all};
 return {classIds,domains:domains[feature]||[]};
}
