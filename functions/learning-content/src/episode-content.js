import {contentForVersion} from './young-versions.js';
import {journalContent} from './journal-engine.js';
import {journalStories} from './journal-stories.js';
const journals=new Map(journalStories.map(s=>[s.id+':'+s.version,journalContent(s)]));
export function contentForEpisode(id,version){
 if(id==='own-english'&&[1,2,3,4].includes(version))return contentForVersion(version);
 const content=journals.get(id+':'+version);if(!content)throw new Error('Unsupported episode version');return content;
}
