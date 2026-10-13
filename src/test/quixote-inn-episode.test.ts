import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../../functions/learning-content/src/animated-episodes.js';
import {importStory} from '../services/animated-stories';
const pack=JSON.parse(readFileSync('public/stories/animated/the-castle-that-served-supper/episode.json','utf8'));
it('all 64 local routes retain canonical action order and resume identical state',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let paths=0;const endings=new Set();
 function visit(state:any,steps:(string|null)[],choices:number,actions:string[]){
  while(!state.ended&&['say','act'].includes(story!.nodes[state.cursor].type)){
   const n=story!.nodes[state.cursor];if(n.type==='act')actions=[...actions,n.actor+':'+n.action+':'+(n.targetActor||'')];
   steps=[...steps,null];state=advanceStory(story!,state,null);
  }
  expect(replayStory(story!,steps,state.seed)).toEqual(state);
  expect(state.variables.practical).toBeGreaterThanOrEqual(0);expect(state.variables.practical).toBeLessThanOrEqual(3);
  if(state.ended){expect(choices).toBe(6);expect(actions).toEqual(['Quixote:bow:','Quixote:attack:Carrier','Quixote:attack:CarrierTwo','Quixote:bow:','Quixote:bow:']);expect(state.events).toEqual([]);endings.add(state.variables.warned+':'+(state.variables.practical>=2));paths++;return;}
  for(const option of story!.nodes[state.cursor].options!)visit(advanceStory(story!,state,option.id),[...steps,option.id],choices+1,actions);
 }
 visit(settleStory(story!,initialStoryState(story!,42)),[],0,[]);expect(paths).toBe(64);expect(endings.size).toBe(4);
 const answers=pack.quiz.map((q:any)=>q.answer);expect(quizScore(pack.quiz,answers)).toBe(100);expect(quizScore(pack.quiz,[...answers.slice(0,3),(answers[3]+1)%4])).toBe(75);
 expect(packageBytes(pack)).toBeLessThan(5000000);
},30000);
it('the new inn episode imports unchanged in the teacher editor',async()=>{
 expect(await importStory(readFileSync('public/stories/animated/the-castle-that-served-supper/episode.zip') as unknown as File)).toEqual(pack);
});
