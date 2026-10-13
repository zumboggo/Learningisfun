import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {validatePackage,initialStoryState,settleStory,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {packageSize,importStory} from '../services/animated-stories';
const pack=JSON.parse(readFileSync('public/stories/animated/the-measure-that-changed/episode.json','utf8'));
it('all 96 choice routes finish with six choices, preserved callbacks and deterministic resume',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let routes=0;const lengths:number[]=[];
 const walk=(state:any,steps:(string|null)[],choices:number,words:number)=>{
  if(state.ended){routes++;expect(choices).toBe(6);expect(replayStory(story,steps,7)).toEqual(state);lengths.push(words);return;}
  const node=story.nodes[state.cursor];expect(steps.length).toBeLessThan(160);
  if(node.type==='choice')for(const option of node.options)walk(advanceStory(story,state,option.id),[...steps,option.id],choices+1,words+option.text.split(/\s+/).length);
  else walk(advanceStory(story,state,null),[...steps,null],choices,words+node.text.split(/\s+/).length);
 };
 walk(settleStory(story,initialStoryState(story,7)),[],0,0);expect(routes).toBe(96);expect(Math.min(...lengths)).toBeGreaterThan(1100);expect(Math.max(...lengths)).toBeLessThan(2400);
 expect(quizScore(pack.quiz,pack.quiz.map((q:any)=>q.answer))).toBe(100);expect(quizScore(pack.quiz,pack.quiz.map((q:any,i:number)=>i===0?(q.answer+1)%4:q.answer))).toBe(75);
});
it('ships a portable, source-matched package within budget with polished new characters',async()=>{
 expect(pack.script).toBe(readFileSync('stories/animated/the-measure-that-changed/episode.story','utf8'));expect(packageSize(pack)).toBeLessThan(5000000);
 for(const id of ['Seneb','Iset','Kha'])expect(pack.assets.characters[id].rig.finish).toBe('polished');
 const zip=readFileSync('public/stories/animated/the-measure-that-changed/episode.zip');const imported=await importStory(new File([zip], 'episode.zip'));expect(imported).toEqual(pack);
});
