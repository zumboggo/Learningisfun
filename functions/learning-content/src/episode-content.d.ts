import {contentForVersion} from './young-versions.js';
import {journalContent} from './journal-engine.js';
export function contentForEpisode(id:string,version:number):ReturnType<typeof contentForVersion>|ReturnType<typeof journalContent>;
