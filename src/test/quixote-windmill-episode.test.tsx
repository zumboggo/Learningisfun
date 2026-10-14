import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {validatePackage,compileStory,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../../functions/learning-content/src/animated-episodes.js';
import {importStory} from '../services/animated-stories';
import StoryPlayer from '../components/animated/StoryPlayer';
import MountedActor from '../components/animated/MountedActor';
import {performAction,actionFrames} from '../components/animated/action-motion';
const pack=JSON.parse(readFileSync('public/stories/animated/the-giants-that-were-mills/episode.json','utf8'));
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('all 64 routes preserve the windmill defeat, care, unbroken belief, and finale boundary',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let paths=0;const endings=new Set();
 function visit(state:any,steps:(string|null)[],choices:number,actions:string[],lines:string[]){
  while(!state.ended&&['say','act'].includes(story!.nodes[state.cursor].type)){
   const n=story!.nodes[state.cursor];lines=[...lines,n.text];
   if(n.type==='act')actions=[...actions,n.actor+':'+n.action+':'+(n.targetActor||'')];
   if(n.type==='act'&&n.action==='mounted-charge')expect(state.stage.actors.Quixote.prop).toBe('lance');
   if(actions.some(a=>a.includes('kneel'))&&state.stage.actors.Quixote)expect(state.stage.actors.Quixote.prop||'none').toBe('none');
   steps=[...steps,null];state=advanceStory(story!,state,null);
  }
  expect(replayStory(story!,steps,state.seed)).toEqual(state);
  if(state.ended){expect(choices).toBe(6);expect(actions).toEqual(['Quixote:mounted-charge:','Sancho:kneel:','Sancho:steady:Quixote','Quixote:wince:']);expect(state.events).toEqual([]);
   const text=lines.join(' '),fixed=['thirty or forty windmills','Those are windmills','Quixote spurs Rocinante','A breeze rises','Briareus','calls on Dulcinea','Rocinante gallops','shatters the lance','unable to move','Fristón, the very sage','Sancho helps Quixote rise','Diego Pérez de Vargas','must not complain','Complain whenever','opens his saddlebags','My visit to their story ends here.'];
   let last=-1;for(const event of fixed){const at=text.indexOf(event);expect(at,event).toBeGreaterThan(last);last=at;}
   expect(text.includes('I tried to name the evidence.')).toBe(state.variables.evidence);
   expect(text.includes('I also tried to make room')).toBe(state.variables.care);
   expect(text.includes('Speaking honestly did not require')).toBe(state.variables.honest);
   expect(text).not.toMatch(/Benedictine|Biscayan|Basque|night among/i);
   endings.add(JSON.stringify(state.variables));paths++;return;}
  for(const option of story!.nodes[state.cursor].options!)visit(advanceStory(story!,state,option.id),[...steps,option.id],choices+1,actions,lines);
 }
 visit(settleStory(story!,initialStoryState(story!,42)),[],0,[],[]);expect(paths).toBe(64);expect(endings.size).toBe(6);
 const answers=pack.quiz.map((q:any)=>q.answer);expect(quizScore(pack.quiz,answers)).toBe(100);expect(quizScore(pack.quiz,[...answers.slice(0,3),(answers[3]+1)%4])).toBe(75);expect(quizScore(pack.quiz,answers.map((a:number)=>(a+1)%4))).toBe(0);
 expect(packageBytes(pack)).toBeLessThan(5000000);
},30000);
it('imports ZIP unchanged and keeps all returning cast identities',async()=>{
 expect(await importStory(readFileSync('public/stories/animated/the-giants-that-were-mills/episode.zip') as unknown as File)).toEqual(pack);
 const prior=JSON.parse(readFileSync('public/stories/animated/the-door-that-disappeared/episode.json','utf8'));
 for(const id of ['Hepting','Quixote','Sancho'])expect(pack.assets.characters[id]).toEqual(prior.assets.characters[id]);
});
it('restores the mounted caption without replaying the gallop, then removes the horse on Continue',()=>{
 const old=HTMLElement.prototype.animate,animate=vi.fn();HTMLElement.prototype.animate=animate;
 try{const script='story 2\nshow Quixote determined left\nI: Before.\nact Quixote mounted-charge "Charge."\nscene mills\nI: The lance breaks.\nend';
 const {story}=compileStory(script,pack.assets),state=advanceStory(story,settleStory(story,initialStoryState(story)),null);expect(replayStory(story,[null],1)).toEqual(state);
 const {container,rerender}=render(<StoryPlayer pack={{...pack,script}} initial={{steps:[null],quizzes:[],seed:1}}/>);
 expect(screen.getByRole('img',{name:'Don Quixote — mounted lance charge'})).toBeInTheDocument();expect(container.querySelector('.galloping')).toBeNull();expect(animate).not.toHaveBeenCalled();
 rerender(<StoryPlayer key="after" pack={{...pack,script}} initial={{steps:[null,null],quizzes:[],seed:1}}/>);expect(container.querySelector('.mounted-actor')).toBeNull();expect(screen.getByText('The lance breaks.')).toBeInTheDocument();
 }finally{HTMLElement.prototype.animate=old;}
});
it('keeps the lance level and attached, and reduced motion disables the horse cycle',()=>{
 const {container,rerender}=render(<MountedActor character={pack.assets.characters.Quixote} emotion="determined" active reduced performanceKey={1}/>);
 expect(container.querySelector('.galloping')).toBeNull();const grip=container.querySelector('[data-prop="lance"]')!;
 expect(grip.parentElement).toHaveAttribute('data-arm','right');expect(grip.getAttribute('transform')).toContain('rotate(90)');
 rerender(<MountedActor character={pack.assets.characters.Quixote} emotion="determined" active reduced={false} performanceKey={1}/>);expect(container.querySelector('.galloping')).not.toBeNull();
});
it('bounds a mounted charge to available stage space and honours leftward facing',async()=>{
 const root=document.createElement('div');root.innerHTML='<div class="story-stage"><div data-actor="Quixote"><div class="story-facing" style="transform:scaleX(-1)"></div></div></div>';
 const stage=root.querySelector('.story-stage')!,actor=root.querySelector('[data-actor]')!;
 stage.getBoundingClientRect=()=>({left:0,right:390,width:390} as DOMRect);actor.getBoundingClientRect=()=>({left:15,right:288,width:273,height:300} as DOMRect);
 let frames:Keyframe[]=[];(actor as HTMLElement).animate=((f:Keyframe[])=>{frames=f;return {finished:Promise.resolve()} as unknown as Animation;}) as typeof actor.animate;
 const response=vi.fn();await performAction(root,{actor:'Quixote',action:'mounted-charge'},false,response,()=>true);
 expect(frames[3].transform).toBe('translateX(-15px)');expect(frames.at(-1)?.transform).toBe('translateX(0)');
 expect(response).toHaveBeenLastCalledWith({});response.mockClear();await performAction(root,{actor:'Quixote',action:'mounted-charge'},true,response,()=>true);expect(response).not.toHaveBeenCalled();
 expect(actionFrames('steady',1,100).actor[2].transform).toBe('translateX(60px)');
});
