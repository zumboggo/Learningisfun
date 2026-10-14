import {expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import StoryPlayer from '../components/animated/StoryPlayer';
import {readFileSync} from 'node:fs';
import {validatePackage,initialStoryState,settleStory,advanceStory,replayStory} from '../../functions/learning-content/src/story-engine.js';
const pack=JSON.parse(readFileSync('public/stories/public-quixote/a-knight-needs-a-witness/revisions/2/episode.json','utf8'));
it('all revised routes preserve chapter 1 sequence, staged acting and earned callbacks',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let paths=0;
 function walk(state:any,steps:(string|null)[],lines:string[],choices:number){
  while(!state.ended&&['say','act'].includes(story!.nodes[state.cursor].type)){
   const n=story!.nodes[state.cursor];lines=[...lines,n.text];
   if(n.type==='act'){
    expect(state.stage.actors[n.actor]).toBeDefined();
    if(n.targetActor)expect(state.stage.actors[n.actor].position).not.toBe(state.stage.actors[n.targetActor].position);
    expect(replayStory(story!,steps,state.seed)).toEqual(state);
   }
   if(n.text.includes('ask whether he will test this one too'))expect(state.variables.honest).toBe(true);
   if(n.text.includes('I wait for him to pick up the sword'))expect(state.variables.honest).toBe(false);
   if(n.text.includes('He slashes at the helmet')||n.text.includes('He completes the second slash'))expect(state.stage.actors.Quixote.prop).toBe('sword');
   if(n.text.includes('folds his arms')){expect(state.stage.actors.Quixote.prop||'none').toBe('none');}
   steps=[...steps,null];state=advanceStory(story!,state,null);
  }
  if(state.ended){
   paths++;expect(choices).toBe(7);expect(state.events).toEqual([]);expect(replayStory(story!,steps,state.seed)).toEqual(state);
   const text=lines.join(' ');let last=-1;
   for(const event of ['sold farmland','decided to become one','great-grandfather','layers of paper','first blow destroys','second slash','fixing iron bars','without another test','For four days','Eight more days','Don Quixote of La Mancha.','Aldonza Lorenzo','return-door']){const at=text.indexOf(event);expect(at,event).toBeGreaterThan(last);last=at;}
   expect(text).not.toMatch(/muddy ditch|book cart|chance wheel/);
   return;
  }
  const node=story!.nodes[state.cursor];expect(node.type).toBe('choice');
  for(const o of node.options!)walk(advanceStory(story!,state,o.id),[...steps,o.id],lines,choices+1);
 }
 walk(settleStory(story!,initialStoryState(story!,7)),[],[],0);expect(paths).toBe(192);
});

it('restores the helmet-test sword and readable caption with reduced motion',()=>{
 const {story}=validatePackage(pack);let state=settleStory(story!,initialStoryState(story!,7));const steps:(string|null)[]=[];
 while(!story!.nodes[state.cursor].text?.includes('He slashes at the helmet')){
  const n=story!.nodes[state.cursor],step=n.type==='choice'?n.options![0].id:null;
  steps.push(step);state=advanceStory(story!,state,step);expect(steps.length).toBeLessThan(100);
 }
 vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:()=>{},removeEventListener:()=>{}}));
 const animate=vi.fn(),old=HTMLElement.prototype.animate;HTMLElement.prototype.animate=animate;
 try{
  const {container}=render(<StoryPlayer pack={pack} initial={{steps,quizzes:[],seed:7}}/>);
  expect(screen.getByText(/He slashes at the helmet/)).toBeInTheDocument();
  expect(container.querySelector('[data-prop="sword"]')).not.toBeNull();
  expect(screen.getByRole('button',{name:'Next →'})).toBeEnabled();expect(animate).not.toHaveBeenCalled();
 }finally{cleanup();HTMLElement.prototype.animate=old;vi.unstubAllGlobals();}
});
