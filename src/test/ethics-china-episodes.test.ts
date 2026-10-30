import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {advanceStory,initialStoryState,settleStory,replayStory,quizScore,validatePackage} from '../../functions/learning-content/src/story-engine.js';
import questions from '../../functions/learning-content/src/ethics-notebook-questions.json';
import {importStory} from '@/services/animated-stories';
for(const id of ['the-welcome-nobody-wanted','the-sheep-behind-our-house']){
 const pack=JSON.parse(readFileSync(`public/stories/animated/${id}/episode.json`,'utf8'));
 describe(id,()=>{
  it('reaches a source-bounded resolution on every route and exposes distinct replies and callbacks',()=>{
   const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);expect(pack.context).toHaveLength(2);expect(pack.profile).toBe('ethics');expect(pack.simulationScore).toBeUndefined();expect(pack.quiz).toHaveLength(4);
   const opts=questions.options[id as keyof typeof questions.options];expect(opts).toHaveLength(3);expect(new Set(opts).size).toBe(3);
   const edges=new Set(),outcomes=new Set();let paths=0;
   function visit(state:any,count:number){
    while(!state.ended&&story.nodes[state.cursor].type!=='choice')state=advanceStory(story,state,null);
    if(state.ended){paths++;expect(count).toBe(6);const text=state.history.map((h:any)=>h.text).join('\n');expect(text).not.toMatch(/fictional|fictionalized|imagined|simulation/i);expect(text).toContain('safely');
     if(id==='the-welcome-nobody-wanted'){expect(text).toContain(['helped with Auntie','rain still reached',"stool wasn't untidy"][state.variables.attention]||'__');outcomes.add(state.variables.plan+':'+state.variables.response);}
     else{expect(text).toContain('Shen has her sheep');expect(text).toContain(['kept a private path','clerk wrote my name','may decide to report'][state.variables.route]);outcomes.add(state.variables.route+':'+state.variables.repair);}return;
    }
    const node=story.nodes[state.cursor];expect(node.options).toHaveLength(3);for(const option of node.options){edges.add(node.id+':'+option.id);visit(advanceStory(story,state,option.id),count+1);}
   }
   visit(settleStory(story,initialStoryState(story,1)),0);expect(paths).toBe(729);expect(edges.size).toBe(18);expect(outcomes.size).toBe(9);
  },60000);
  it('restores held stage state and legal choice history without replaying a different story',()=>{
   const {story}=validatePackage(pack);for(const n of [0,1,2]){let state=settleStory(story,initialStoryState(story,31));const steps:(string|null)[]=[];while(!state.ended){const node=story.nodes[state.cursor],step=node.type==='choice'?node.options[n].id:null;steps.push(step);state=advanceStory(story,state,step);if(steps.length%17===0)expect(replayStory(story,steps,31)).toEqual(state);}expect(replayStory(story,steps,31)).toEqual(state);}
   expect(quizScore(pack.quiz,pack.quiz.map((q:any)=>q.answer))).toBe(100);const answers=pack.quiz.map((q:any)=>q.answer);answers[0]=(answers[0]+1)%4;expect(quizScore(pack.quiz,answers)).toBe(75);
  });
  it('roundtrips the actual ZIP without changing script, cast or quiz',async()=>{expect(await importStory(readFileSync(`public/stories/animated/${id}/episode.zip`) as unknown as File)).toEqual(pack);});
 });
}
