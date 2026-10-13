import {compileStory,initialStoryState,settleStory,advanceStory,type StoryPackage} from '../../../functions/learning-content/src/story-engine.js';
export type ChoiceOption={text:string;emotion:string;response:string;callback:string};
export function insertScript(script:string,fragment:string,cursor=script.length){
 const start=script.lastIndexOf('\n',Math.max(0,cursor-1))+1,end=script.indexOf('\n',cursor),lineEnd=end<0?script.length:end;
 const position=script.slice(start,lineEnd).trim()==='end'?start:lineEnd;
 return (script.slice(0,position)+'\n'+fragment+'\n'+script.slice(position)).replace(/^story 1\b/,'story 2');
}
export function buildChoice(pack:StoryPackage,id:string,actor:string,options:ChoiceOption[],remember:boolean){
 if(!/^[a-zA-Z][\w-]*$/.test(id))throw Error('Use a choice name beginning with a letter, with no spaces.');
 if(!pack.assets.characters[actor])throw Error('Choose a character in this episode.');
 if(options.length<2||options.length>3)throw Error('Choose two or three options.');
 for(const o of options)for(const text of [o.text,o.response,...(remember?[o.callback]:[])])if(!text.trim()||/[\r\n"]/.test(text))throw Error('Fill each field with one line without double quotes.');
 const names=[id,`${id}_memory`,`${id}_join`,`${id}_after_callback`,`${id}_test0`,`${id}_test1`,...options.flatMap((_,i)=>[`${id}_branch${i}`,`${id}_callback${i}`])];
 const existing=compileStory(pack.script,pack.assets);if(existing.errors.length)throw Error('Fix the current script errors before inserting a choice.');
 const used=new Set([...Object.keys(existing.story.variables),...existing.story.nodes.map((n:any)=>n.id).filter(Boolean)]);
 if(names.some(n=>used.has(n)))throw Error('That name overlaps existing story IDs. Choose another name.');
 if(remember&&Object.keys(existing.story.variables).length>=4)throw Error('This episode already uses four variables. Turn off the later callback or reuse a variable manually.');
 const choice=[`choice ${id}`,...options.map((o,i)=>`option option${i} "${o.text.trim()}" -> ${id}_branch${i}${remember?` ; ${id}_memory = ${i}`:''}`),...options.flatMap((o,i)=>[`label ${id}_branch${i}`,`show ${actor} ${o.emotion} center`,`camera medium ${actor}`,`${actor} [${o.emotion}]: ${o.response.trim()}`,`goto ${id}_join`]),`label ${id}_join`,`camera auto`].join('\n');
 const callback=remember?[...options.slice(0,-1).flatMap((_,i)=>[`label ${id}_test${i}`,`if ${id}_memory == ${i} -> ${id}_callback${i} else ${i===options.length-2?`${id}_callback${options.length-1}`:`${id}_test${i+1}`}`]),...options.flatMap((o,i)=>[`label ${id}_callback${i}`,`show ${actor} ${o.emotion} center`,`camera medium ${actor}`,`${actor}: ${o.callback.trim()}`,`goto ${id}_after_callback`]),`label ${id}_after_callback`,`camera auto`].join('\n'):'';
 return {choice,callback,declaration:remember?`variable ${id}_memory = 0 range 0 ${options.length-1} hidden\n`:''};
}
/** A bounded real route, not a jump with an invented stage or variable state. */
export function routeToChoice(pack:StoryPackage,id:string){
 const {story,errors}=compileStory(pack.script,pack.assets);if(errors.length)throw Error('Fix script errors to preview choices.');
 const queue=[{state:settleStory(story,initialStoryState(story,1)),steps:[] as (string|null)[],decisions:[] as string[]}],seen=new Set<string>();
 for(let i=0;i<queue.length&&i<20000;i++){
  const item=queue[i],n=story.nodes[item.state.cursor];if(item.state.ended)continue;
  if(n.type==='choice'&&n.id===id)return {...item,story,node:n};
  const key=JSON.stringify([item.state.cursor,item.state.variables,item.state.stage]);if(seen.has(key))continue;seen.add(key);
  for(const option of n.type==='choice'?n.options:[null]){const value=option?.id??null;queue.push({state:advanceStory(story,item.state,value),steps:[...item.steps,value],decisions:option?[...item.decisions,option.text]:item.decisions});}
 }
 throw Error('No route found within the preview limit with seed 1. Use the full episode preview for chance-dependent paths.');
}
