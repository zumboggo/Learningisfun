import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../../functions/learning-content/src/animated-episodes.js';
import {importStory} from '../services/animated-stories';
const pack=JSON.parse(readFileSync('public/stories/animated/the-door-that-disappeared/episode.json','utf8'));
it('all 128 routes preserve the library verdicts, concealment, recruitment and secret departure',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let paths=0;const endings=new Set();
 function visit(state:any,steps:(string|null)[],choices:number,actions:string[],lines:string[]){
  while(!state.ended&&['say','act'].includes(story!.nodes[state.cursor].type)){
   const n=story!.nodes[state.cursor];if(n.type==='act')actions=[...actions,n.actor+':'+n.action+':'+(n.targetActor||'')];
   if(n.type==='say')lines=[...lines,n.text];
   steps=[...steps,null];state=advanceStory(story!,state,null);
  }
  expect(replayStory(story!,steps,state.seed)).toEqual(state);
  if(state.ended){expect(choices).toBe(7);expect(actions).toEqual(['Barber:give:Priest','Quixote:reach:','Quixote:cross-arms:']);expect(state.events).toEqual([]);
   const text=lines.join(' '),fixed=['Spare it for the present.','A father\'s merit is not his son\'s.','Tirant lo Blanc','Galatea, by Miguel de Cervantes','Some books never receive a hearing.','That night the housekeeper burns','library entrance walled up','Two days later','Fristón. That is who it must have been.','For fifteen days','Sancho agrees to leave','One night they leave unseen','By daylight'];
   let last=-1;for(const event of fixed){const at=text.indexOf(event);expect(at,event).toBeGreaterThan(last);last=at;}
   expect(text.includes('I kept asking what supported a judgement')).toBe(state.variables.questioned);
   expect(text.includes('Listening to those wants helped me')).toBe(state.variables.family);
   expect(text.includes('Physical things were easier to check')).toBe(state.variables.practical>=1);
   expect(text).not.toMatch(/windmill|sword fight/i);
   endings.add(state.variables.questioned+':'+state.variables.family+':'+(state.variables.practical>=1));paths++;return;}
  for(const option of story!.nodes[state.cursor].options!)visit(advanceStory(story!,state,option.id),[...steps,option.id],choices+1,actions,lines);
 }
 visit(settleStory(story!,initialStoryState(story!,42)),[],0,[],[]);expect(paths).toBe(128);expect(endings.size).toBe(6);
 const answers=pack.quiz.map((q:any)=>q.answer);expect(quizScore(pack.quiz,answers)).toBe(100);expect(quizScore(pack.quiz,[...answers.slice(0,3),(answers[3]+1)%4])).toBe(75);
 expect(packageBytes(pack)).toBeLessThan(5000000);
},30000);
it('imports the ZIP unchanged and preserves returning characters',async()=>{
 expect(await importStory(readFileSync('public/stories/animated/the-door-that-disappeared/episode.zip') as unknown as File)).toEqual(pack);
 const prior=JSON.parse(readFileSync('public/stories/animated/the-promise-left-behind/episode.json','utf8'));
 for(const id of ['Hepting','Quixote','Niece'])expect(pack.assets.characters[id]).toEqual(prior.assets.characters[id]);
});
