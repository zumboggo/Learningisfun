import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {importStory} from '../services/animated-stories';
import {questionsForEpisode,principleQuestions} from '../services/ethics-portfolio.service';
const pack=JSON.parse(readFileSync('public/stories/animated/the-king-who-would-not-listen/episode.json','utf8'));
it('all 2187 routes preserve history, seven decisions, remembered commitments and resumable state',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let paths=0;const edges=new Set();
 function visit(state:any,steps:(string|null)[],count:number){
  while(!state.ended&&story.nodes[state.cursor].type!=='choice'){
   const positions=Object.values(state.stage.actors).map((a:any)=>a.position);expect(new Set(positions).size).toBe(positions.length);
   steps=[...steps,null];state=advanceStory(story,state,null);
  }
  if(state.ended){paths++;expect(count).toBe(7);expect(replayStory(story,steps,1)).toEqual(state);
   const text=state.history.map((h:any)=>h.text).join('\n');
   expect(text).toContain('Dionysius has Dion sent into exile');expect(text).toContain('Plato is able to leave Sicily');expect(text).toContain('Its authorship is debated');expect(text).toContain('not a modern defender of unrestricted expression');
   expect(text).toContain(['You supported a temporary ban','You separated criticism','You refused new restrictions'][state.variables.Speech]);
   expect(text).toContain(['You advised remaining useful','You asked for conditions','You advised departure'][state.variables.Counsel]);
   expect(text).toContain(['You chose education','You chose laws','You chose shared'][state.variables.Limits]);return;
  }
  if(count===5)expect(replayStory(story,steps,1)).toEqual(state);
  const node=story.nodes[state.cursor];for(const option of node.options){edges.add(node.id+':'+option.id);visit(advanceStory(story,state,option.id),[...steps,option.id],count+1);}
 }
 visit(settleStory(story,initialStoryState(story,1)),[],0);expect(paths).toBe(2187);expect(edges.size).toBe(21);
 expect(pack.simulationScore).toBeUndefined();expect(quizScore(pack.quiz,pack.quiz.map((q:any)=>q.answer))).toBe(100);
 const answers=pack.quiz.map((q:any)=>q.answer);answers[0]=(answers[0]+1)%4;expect(quizScore(pack.quiz,answers)).toBe(75);
 expect(questionsForEpisode({kind:'episode-notes',format:'animated',episode:'king-would-not-listen-ethics',version:1,title:pack.title})).toEqual(principleQuestions);
},60000);
it('ZIP roundtrip preserves all story content and assets',async()=>{expect(await importStory(readFileSync('public/stories/animated/the-king-who-would-not-listen/episode.zip') as unknown as File)).toEqual(pack);});
