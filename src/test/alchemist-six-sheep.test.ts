import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../../functions/learning-content/src/animated-episodes.js';
import {importStory} from '../services/animated-stories';
const pack=JSON.parse(readFileSync('public/stories/animated/six-sheep-for-a-dream/episode.json','utf8'));
it('all 64 conversations preserve source events, callbacks and saved-state replay',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let paths=0;const lengths:number[]=[];
 function visit(state:any,steps:(string|null)[],choices:number,lines:string[]){
  while(!state.ended&&['say','act'].includes(story!.nodes[state.cursor].type)){
   const n=story!.nodes[state.cursor];if(n.type==='say')lines=[...lines,n.text];
   steps=[...steps,null];state=advanceStory(story!,state,null);
  }
  expect(replayStory(story!,steps,state.seed)).toEqual(state);
  if(state.ended){
   expect(choices).toBe(6);const text=lines.join(' ');let last=-1;
   for(const event of ['a tenth of whatever treasure','Give me a tenth of your sheep','parents\' names','toward the bakery','climbs the fort','I am going to find out','returns with six sheep','friend has bought all the others','one is lame','revealing a golden breastplate','Black means yes','two drops of oil','watching a small ship leave port']){const at=text.indexOf(event);expect(at,event).toBeGreaterThan(last);last=at;}
   expect(text.includes('You asked about their care.')).toBe(state.variables.care);
   expect(text.includes('You kept asking what we actually knew.')).toBe(state.variables.evidence);
   expect(text.includes('We talked about the cost.')).toBe(state.variables.cost);
   expect((text.match(/I write my one question:/g)||[]).length).toBe(1);
   expect(text.includes('My question returns: What makes a dream')).toBe(state.variables.entry===1);
   expect(text).not.toMatch(/Fatima|crystal merchant|sycamore|robbed/i);
   lengths.push(text.split(/\s+/).length);paths++;return;
  }
  for(const option of story!.nodes[state.cursor].options!)visit(advanceStory(story!,state,option.id),[...steps,option.id],choices+1,lines);
 }
 visit(settleStory(story!,initialStoryState(story!,42)),[],0,[]);expect(paths).toBe(64);
 const answers=pack.quiz.map((q:any)=>q.answer);expect(quizScore(pack.quiz,answers)).toBe(100);expect(quizScore(pack.quiz,[...answers.slice(0,3),(answers[3]+1)%4])).toBe(75);
 expect(packageBytes(pack)).toBeLessThan(5000000);console.log('Route words:',Math.min(...lengths),Math.max(...lengths));
},30000);
it('ZIP round-trip preserves the complete validated package',async()=>{
 expect(await importStory(readFileSync('public/stories/animated/six-sheep-for-a-dream/episode.zip') as unknown as File)).toEqual(pack);
});
