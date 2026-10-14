import {afterEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {act,cleanup,render} from '@testing-library/react';
import {validatePackage,compileStory,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../../functions/learning-content/src/animated-episodes.js';
import {POSES} from '../../functions/learning-content/src/acting-library.js';
import {armGeometry,heldPropPose} from '../components/animated/character-geometry';
import CartoonActor from '../components/animated/CartoonActor';
import {importStory} from '../services/animated-stories';
const pack=JSON.parse(readFileSync('public/stories/animated/the-promise-left-behind/episode.json','utf8'));
afterEach(()=>{cleanup();vi.useRealTimers();});
it('all 128 conversation routes preserve source events, callbacks and replay',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let paths=0;const endings=new Set();
 function visit(state:any,steps:(string|null)[],choices:number,actions:string[],lines:string[]){
  while(!state.ended&&['say','act'].includes(story!.nodes[state.cursor].type)){
   const n=story!.nodes[state.cursor];if(n.type==='act')actions=[...actions,n.actor+':'+n.action+':'+(n.targetActor||'')];
   if(n.type==='say')lines=[...lines,n.text];
   if(n.type==='act'&&n.action==='lance-threat')expect(state.stage.actors.Quixote.prop).toBe('lance');
   steps=[...steps,null];state=advanceStory(story!,state,null);
  }
  expect(replayStory(story!,steps,state.seed)).toEqual(state);
  if(state.ended){expect(choices).toBe(7);expect(actions).toEqual(['Quixote:lance-threat:Juan','Juan:cross-arms:','Quixote:stumble:','Muleteer:cross-arms:','Pedro:kneel:']);expect(state.events).toEqual([]);
   const text=lines.join(' ');expect(text).toContain('No wages.');expect(text).toContain('The merchant is unhurt.');expect(text).toContain('They give him both.');
   expect(text.includes('Andrés told me the important part at once')).toBe(state.variables.listened);
   expect(text.includes('When I asked why the merchants could not look')).toBe(state.variables.evidence);
   expect(text.includes('Helping Pedro was smaller work')).toBe(state.variables.care>=1);
   endings.add(state.variables.listened+':'+state.variables.evidence+':'+(state.variables.care>=1));paths++;return;}
  for(const option of story!.nodes[state.cursor].options!)visit(advanceStory(story!,state,option.id),[...steps,option.id],choices+1,actions,lines);
 }
 visit(settleStory(story!,initialStoryState(story!,42)),[],0,[],[]);expect(paths).toBe(128);expect(endings.size).toBe(8);
 const answers=pack.quiz.map((q:any)=>q.answer);expect(quizScore(pack.quiz,answers)).toBe(100);expect(quizScore(pack.quiz,[...answers.slice(0,3),(answers[3]+1)%4])).toBe(75);
 expect(packageBytes(pack)).toBeLessThan(5000000);
},30000);
it('imports the complete unassigned ZIP unchanged',async()=>{expect(await importStory(readFileSync('public/stories/animated/the-promise-left-behind/episode.zip') as unknown as File)).toEqual(pack);});
it('crosses wrists over the chest and holds both arms through angry speech',()=>{
 const p=POSES['arms-crossed'],l=armGeometry('left',p.leftUpperArm,p.leftForearm),r=armGeometry('right',p.rightUpperArm,p.rightForearm);
 expect(l.wx).toBeGreaterThan(140);expect(r.wx).toBeLessThan(105);for(const w of [l,r]){expect(w.wy).toBeGreaterThan(210);expect(w.wy).toBeLessThan(245);}
 vi.useFakeTimers();const {container,rerender}=render(<CartoonActor character={pack.assets.characters.Juan} emotion="angry" rest="arms-crossed" reduced/>);
 const arms=Array.from(container.querySelectorAll('[data-arm]')).map(a=>a.innerHTML);
 rerender(<CartoonActor character={pack.assets.characters.Juan} emotion="angry" rest="arms-crossed" talking reduced/>);
 expect(Array.from(container.querySelectorAll('[data-arm]')).map(a=>a.innerHTML)).toEqual(arms);
 rerender(<CartoonActor character={pack.assets.characters.Juan} emotion="angry" rest="arms-crossed" talking/>);
 act(()=>vi.advanceTimersByTime(2400));expect(Array.from(container.querySelectorAll('[data-arm]')).map(a=>a.innerHTML)).toEqual(arms);
});
it('lance attaches to the right hand and the folded rest survives replay after it is put away',()=>{
 expect(heldPropPose('lance')).toBe('lance-hold');const {container}=render(<CartoonActor character={pack.assets.characters.Quixote} prop="lance" reduced/>);
 expect(container.querySelector('[data-arm="right"] [data-prop="lance"] [data-lance]')).not.toBeNull();
 const angry=render(<CartoonActor character={pack.assets.characters.Quixote} prop="lance" emotion="angry" talking reduced/>);
 expect(angry.container.querySelector('[data-prop="lance"]')?.getAttribute('transform')).toBe(container.querySelector('[data-prop="lance"]')?.getAttribute('transform'));
 const {story,errors}=compileStory('story 2\nshow Quixote angry left\nshow Juan worried right\nact Quixote lance-threat Juan "Stand back."\nI: Listening.\nact Quixote cross-arms "He folds his arms."\nrest Quixote arms-crossed\nQuixote [angry]: Enough.\nchoice answer\noption wait "Wait." -> done\noption leave "Remain silent." -> done\nlabel done\nQuixote [angry]: Still waiting.\nend',pack.assets);expect(errors).toEqual([]);
 let state=settleStory(story,initialStoryState(story));expect(state.stage.actors.Quixote.prop).toBe('lance');
 state=advanceStory(story,state,null);expect(state.stage.actors.Quixote.prop).toBe('lance');
 state=advanceStory(story,state,null);expect(state.stage.actors.Quixote.prop).toBe('none');
 state=advanceStory(story,state,null);expect(state.stage.actors.Quixote.rest).toBe('arms-crossed');
 state=advanceStory(story,state,null);state=advanceStory(story,state,'wait');expect(state.stage.actors.Quixote.rest).toBe('arms-crossed');expect(replayStory(story,[null,null,null,null,'wait'],1)).toEqual(state);
});
