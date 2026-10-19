import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {importStory} from '../services/animated-stories';
import SimulationScorecard,{simulationResult} from '../components/animated/SimulationScorecard';
const pack=JSON.parse(readFileSync('public/stories/animated/the-second-ship/episode.json','utf8'));
it('all 2,187 routes have seven scored decisions, fixed history, valid totals and reproducible resume',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);
 let paths=0,min=Infinity,max=-Infinity;const callbacks=new Set();
 function visit(state:any,steps:(string|null)[],count:number){
  while(!state.ended&&story.nodes[state.cursor].type!=='choice'){steps=[...steps,null];state=advanceStory(story,state,null);}
  const score=simulationResult(pack,story,state)!;expect(score.maximum).toBe(112);expect(score.total).toBe(Object.values(state.variables).reduce((a:any,b:any)=>a+b,0));
  if(state.ended){paths++;expect(count).toBe(7);expect(replayStory(story,steps,1)).toEqual(state);min=Math.min(min,score.total);max=Math.max(max,score.total);
   const text=state.history.map((h:any)=>h.text).join('\n');expect(text).toContain('second ship arrives just in time');expect(text).toContain('Athens executes men');expect(text).toContain('not an objective measure of moral goodness');
   callbacks.add(text.includes('Again and again'));callbacks.add(text.includes('Other concerns often'));return;
  }
  // Resume at the seventh decision, then take every possible final choice.
  if(count===6)expect(replayStory(story,steps,1)).toEqual(state);
  for(const option of story.nodes[state.cursor].options)visit(advanceStory(story,state,option.id),[...steps,option.id],count+1);
 }
 visit(settleStory(story,initialStoryState(story,1)),[],0);
 expect(paths).toBe(2187);expect(max).toBeGreaterThan(min);expect(max).toBeLessThan(112);expect(callbacks.has(true)).toBe(true);
 console.log('Second Ship verified routes:',paths,'attainable total:',min,'to',max);
 expect(quizScore(pack.quiz,pack.quiz.map((q:any)=>q.answer))).toBe(100);
 const answers=pack.quiz.map((q:any)=>q.answer);answers[0]=(answers[0]+1)%4;expect(quizScore(pack.quiz,answers)).toBe(75);
},60000);
it('ZIP retains simulation metadata and all source assets',async()=>{expect(await importStory(readFileSync('public/stories/animated/the-second-ship/episode.zip') as unknown as File)).toEqual(pack);});
it('scorecard compares categories, separates quiz scores and supports replay',()=>{
 const {story}=validatePackage(pack),state=settleStory(story,initialStoryState(story));state.variables={Lives:20,Security:18,Justice:22,Trust:21};const result=simulationResult(pack,story,state)!;
 let replayed=false;render(<SimulationScorecard result={result} previous={{...result,total:75}} complete onReplay={()=>{replayed=true;}}/>);
 expect(screen.getByText('81 / 112')).toBeTruthy();expect(screen.getByText(/not an objective measure/)).toBeTruthy();expect(screen.getByText(/75 → 81/)).toBeTruthy();fireEvent.click(screen.getByText('Replay for a different balance'));expect(replayed).toBe(true);cleanup();
 expect(simulationResult({...pack,simulationScore:undefined},story,state)).toBeNull();
 expect(simulationResult({...pack,simulationScore:{categories:[...pack.simulationScore.categories,pack.simulationScore.categories[0]]}},story,state)).toBeNull();
});
