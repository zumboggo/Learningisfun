import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {importStory} from '../services/animated-stories';
const pack=JSON.parse(readFileSync('public/stories/animated/the-grain-we-keep/episode.json','utf8'));
it('all animated Ethics routes preserve seven choices, bounded variables and stable outcomes on reload',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);const events=new Set(),costs=new Set();let paths=0;
 function visit(state:any,steps:(string|null)[],count:number){
  while(!state.ended&&story!.nodes[state.cursor].type==='say'){steps=[...steps,null];state=advanceStory(story!,state,null);}
  // Check the actual mid-story resume contract at each decision as well as endings.
  expect(replayStory(story!,steps,state.seed)).toEqual(state);
  expect(state.variables.food).toBeGreaterThanOrEqual(0);expect(state.variables.food).toBeLessThanOrEqual(100);
  if(state.ended){expect(count).toBe(7);events.add(state.events[0].yes);costs.add(state.history.filter((h:any)=>/deep repair holds|patch holds|side channel breaks|unfinished base gives way/.test(h.text)).map((h:any)=>h.text).join(''));paths++;return;}
  for(const option of story!.nodes[state.cursor].options!)visit(advanceStory(story!,state,option.id),[...steps,option.id],count+1);
 }
 for(const seed of [1,2,3,4])visit(settleStory(story!,initialStoryState(story!,seed)),[],0);
 expect(paths).toBe(1152);expect(events.size).toBe(2);expect(costs.size).toBe(4);
 const right=pack.quiz.map((q:any)=>q.answer),wrong=pack.quiz.map((q:any)=>(q.answer+1)%4);
 expect(quizScore(pack.quiz,right)).toBe(100);expect(quizScore(pack.quiz,wrong)).toBe(0);
 expect(quizScore(pack.quiz,[...right.slice(0,3),wrong[3]])).toBe(75);
 expect(quizScore(pack.quiz,[...right.slice(0,2),...wrong.slice(2)])).toBe(50);
},30000);
it('the Ethics animated ZIP round-trips through the same teacher import path',async()=>{
 const zip=readFileSync('public/stories/animated/the-grain-we-keep/episode.zip');
 expect(await importStory(zip as unknown as File)).toEqual(pack);
});
