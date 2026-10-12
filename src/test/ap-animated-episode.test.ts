import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {importStory} from '../services/animated-stories';
const pack=JSON.parse(readFileSync('public/stories/own-english/animated/episode.json','utf8'));
it('every AP choice route finishes with seven choices and stable reloads across both chance outcomes',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);const endings=new Set(),events=new Set();let paths=0;
 function visit(state:any,steps:(string|null)[],count:number){
  while(!state.ended&&story!.nodes[state.cursor].type==='say'){steps=[...steps,null];state=advanceStory(story!,state,null);}
  if(state.ended){expect(count).toBe(7);expect(replayStory(story!,steps,state.seed)).toEqual(state);events.add(state.events[0].yes);endings.add(JSON.stringify(state.variables));paths++;return;}
  for(const option of story!.nodes[state.cursor].options!)visit(advanceStory(story!,state,option.id),[...steps,option.id],count+1);
 }
 for(const seed of [1,2,3,4])visit(settleStory(story!,initialStoryState(story!,seed)),[],0);
 expect(paths).toBe(512);expect(events.size).toBe(2);expect(endings.size).toBeGreaterThan(8);
 expect(quizScore(pack.quiz,pack.quiz.map((q:any)=>q.answer))).toBe(100);
 expect(quizScore(pack.quiz,pack.quiz.map((q:any)=>(q.answer+1)%4))).toBe(0);
// Exhaustive replay of 512 complete routes needs more than the default 5s on CI.
},30000);
it('the downloadable Codex ZIP imports unchanged through the teacher editor',async()=>{
 const zip=readFileSync('public/stories/own-english/animated/the-last-chair.zip');
 const imported=await importStory(zip as unknown as File);expect(imported).toEqual(pack);
});
