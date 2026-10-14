import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {validatePackage,initialStoryState,settleStory,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {importStory,packageSize} from '../services/animated-stories';
for(const slug of ['the-grain-we-keep','the-measure-that-changed']){
 const path=`public/stories/public-ethics/${slug}/`,pack=JSON.parse(readFileSync(path+'episode.json','utf8'));
 it(`${slug}: anonymous portable edition and every route reaches the knowledge check`,async()=>{
  expect(JSON.stringify(pack)).not.toMatch(/hepting|\bdavid\b|\bCDIS\b|lifeplus|instructure|school|classroom|wake up|waking up|reincarnat/i);
  expect(pack.script).toContain('I pick it up');expect(pack.script).toBe(readFileSync(`stories/public-ethics/${slug}.story`,'utf8'));
  expect(packageSize(pack)).toBeLessThan(5000000);
  expect(await importStory(readFileSync(path+'episode.zip') as unknown as File)).toEqual(pack);
  const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let routes=0;
  function walk(state:any,steps:(string|null)[]){
   expect(steps.length).toBeLessThan(200);
   if(state.ended){routes++;expect(replayStory(story!,steps,state.seed)).toEqual(state);return;}
   const node=story!.nodes[state.cursor];
   if(node.type==='choice')for(const option of node.options!)walk(advanceStory(story!,state,option.id),[...steps,option.id]);
   else walk(advanceStory(story!,state,null),[...steps,null]);
  }
  for(const seed of [1,2])walk(settleStory(story!,initialStoryState(story!,seed)),[]);
  expect(routes).toBeGreaterThan(100);expect(quizScore(pack.quiz,pack.quiz.map((q:any)=>q.answer))).toBe(100);
 },30000);
}
