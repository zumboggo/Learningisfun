import {advanceStory,initialStoryState,settleStory,type StoryPackage} from '../../../functions/learning-content/src/story-engine.js';
import {downloadBlob} from '../../services/animated-stories';
import type {StoryProgress} from './StoryPlayer';
export function selectedStoryLines(pack:StoryPackage,story:any,progress:StoryProgress){
 const wanted=pack.keepsake?.choices;if(!Array.isArray(wanted)||wanted.length>20)return [];
 let state=settleStory(story,initialStoryState(story,progress.seed));const selected=new Map<string,string>();
 for(const step of progress.steps){const node=story.nodes[state.cursor];if(node?.type==='choice'&&wanted.some(w=>w.id===node.id)){const option=node.options.find((o:any)=>o.id===step);if(option)selected.set(node.id,option.text);}state=advanceStory(story,state,step);}
 return wanted.flatMap(w=>selected.has(w.id)?[{id:w.id,label:w.label,text:selected.get(w.id)!}]:[]);
}
export default function StoryKeepsake({pack,story,progress}:{pack:StoryPackage;story:any;progress:StoryProgress}){
 const lines=selectedStoryLines(pack,story,progress);if(!lines.length)return null;
 const title=pack.keepsake!.title;
 return <section className="story-keepsake" aria-label={title}><h2>{title}</h2><p>{pack.keepsake?.description||'Your seven favourites, in performance order. Taste was never marked right or wrong.'}</p><ol>{lines.map(line=><li key={line.id}>{line.text}<small>{line.label}</small></li>)}</ol><button onClick={()=>downloadBlob(new Blob([title+'\n\n'+lines.map(l=>l.text+'\n'+l.label).join('\n\n')],{type:'text/plain;charset=utf-8'}),pack.keepsake?.filename||'my-comeback-lyrics.txt')}>{pack.keepsake?.downloadLabel||'Save my lyric sheet'}</button></section>;
}
