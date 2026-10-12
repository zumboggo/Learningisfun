import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
export function newEpisode({id,unitId,title,output}){
 if(!/^[a-z][a-z0-9-]*$/.test(id)||!title?.trim())throw new Error('Supply --id slug --unit unit-id --title title');
 const units=JSON.parse(readFileSync('stories/episode-units.json')),unit=units[unitId];if(!unit)throw new Error('Use a verified unit from stories/episode-units.json');
 const template=JSON.parse(readFileSync('stories/templates/journal.json'));
 const story={...template,id,title,unitId,edition:unit.edition,sourceUrl:unit.sourceUrl,presentation:unit.presentation,concepts:unit.concepts};
 const path=resolve(output||'stories/drafts/'+id+'.json');mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(story,null,2)+'\n',{flag:'wx'});return path;
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i].replace(/^--/,'')]=process.argv[i+1];console.log(newEpisode({id:flags.id,unitId:flags.unit,title:flags.title,output:flags.output}));console.log('Draft only. Read sources, replace scaffold text, set draft:false, and rename to .episode.json before building. Assign separately in episode-assignments.json.');}
