import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {ACTIONS} from '../../functions/learning-content/src/acting-library.js';
import {compileStory,validatePackage,initialStoryState,settleStory,advanceStory,replayStory} from '../../functions/learning-content/src/story-engine.js';
import StoryPlayer from '../components/animated/StoryPlayer';
import {actionFrames} from '../components/animated/action-motion';
const pack=JSON.parse(readFileSync('public/stories/animated/action-rehearsal/episode.json','utf8'));
const script=(action='attack')=>'story 2\nshow Quixote determined left\nshow Carrier worried right\nI: Before.\nact Quixote '+action+' Carrier "The attack happens."\nI: After.\nend';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('validates every curated action and refuses missing, absent, overlapping or self targets',()=>{
 for(const [id,a]of Object.entries(ACTIONS))expect(compileStory(`story 2\nshow Quixote neutral left\nshow Carrier neutral right\nact Quixote ${id}${a.paired?' Carrier':''} "Action."\nend`,pack.assets).errors).toEqual([]);
 for(const s of [script('explode'),script().replace('attack Carrier','attack'),script().replace('attack Carrier','attack Quixote'),script().replace('show Carrier worried right','show Carrier worried left'),script().replace('show Carrier worried right',''),script().replace('show Carrier worried right','move Carrier right'),script().replace('act Quixote','move Carrier exit\nact Quixote'),script().replace('act Quixote','scene courtyard\nact Quixote')])expect(compileStory(s,pack.assets).errors.length).toBeGreaterThan(0);
 const branching='story 2\nshow Quixote neutral left\nchoice c\noption a "A" -> a\noption b "B" -> b\nlabel a\nshow Carrier neutral right\ngoto join\nlabel b\nI: No carrier.\ngoto join\nlabel join\nact Quixote attack Carrier "Action."\nend';
 expect(compileStory(branching,pack.assets).errors.some(e=>e.message.includes('every path'))).toBe(true);
});
it('an action is a saved blocking beat with deterministic facing, history, and no invented score',()=>{
 const {story}=compileStory(script(),pack.assets);const s=advanceStory(story,settleStory(story,initialStoryState(story,4)),null);
 expect(story.nodes[s.cursor].type).toBe('act');expect(s.stage.actors.Carrier.facing).toBe(-1);expect(s.stage.actors.Quixote.facing).toBe(1);
 expect(replayStory(story,[null],4)).toEqual(s);expect(s.variables).toEqual({});expect(s.events).toEqual([]);
 expect(()=>advanceStory(story,s,'attack')).toThrow('dialogue');
 expect(advanceStory(story,s,null).history.at(-1)).toEqual({actor:'I',text:'The attack happens.'});
});
it('both student asides reconverge on the same source action sequence',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);const sequences=[];
 for(const option of ['practical','theatrical']){let s=settleStory(story,initialStoryState(story,1));const steps:(string|null)[]=[],actions:string[]=[];
 while(!s.ended){const n=story.nodes[s.cursor];if(n.type==='act')actions.push(n.action);const next=n.type==='choice'?option:null;steps.push(next);s=advanceStory(story,s,next);expect(replayStory(story,steps,1)).toEqual(s);}sequences.push(actions);}
 expect(sequences).toEqual([['attack','cower','bow'],['attack','cower','bow']]);
});
it('restoring an action shows both characters and its caption without replaying motion',()=>{
 const animate=vi.fn();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}}));
 const old=HTMLElement.prototype.animate;HTMLElement.prototype.animate=animate;
 try{const {container}=render(<StoryPlayer pack={{...pack,script:script()}} initial={{steps:[null],quizzes:[],seed:1}}/>);expect(screen.getByText('The attack happens.')).toBeInTheDocument();expect(container.querySelectorAll('[data-actor]')).toHaveLength(2);expect(container.querySelector('[data-shot]')).toHaveAttribute('data-shot','wide');expect(animate).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Continue →'})).toBeEnabled();}finally{HTMLElement.prototype.animate=old;vi.unstubAllGlobals();}
});
it('rapid clicks cannot skip an active action, and restart cancels both actors',async()=>{
 const old=HTMLElement.prototype.animate,oldGet=HTMLElement.prototype.getAnimations;
 const animations:{finished:Promise<void>;cancel:()=>void}[]=[];
 HTMLElement.prototype.animate=vi.fn(()=>{let finish!:()=>void;const a={finished:new Promise<void>(r=>{finish=r;}),cancel:vi.fn(()=>finish())};animations.push(a);return a as unknown as Animation;});
 HTMLElement.prototype.getAnimations=()=>animations as unknown as Animation[];
 try{const save=vi.fn();render(<StoryPlayer pack={{...pack,script:script()}} initial={{steps:[],quizzes:[],seed:1}} debug onProgress={save}/>);fireEvent.click(screen.getByRole('button',{name:'Accept'}));fireEvent.click(screen.getByRole('button',{name:'Next →'}));
 await waitFor(()=>expect(animations.length).toBe(2));const button=screen.getByRole('button',{name:'Action playing…'});expect(button).toBeDisabled();fireEvent.click(button);expect(save).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('button',{name:'Restart'}));await act(async()=>{await Promise.resolve();});expect(animations.every(a=>(a.cancel as any).mock.calls.length)).toBe(true);expect(screen.getByText('Before.')).toBeInTheDocument();expect(save).toHaveBeenCalledTimes(1);
 }finally{cleanup();HTMLElement.prototype.animate=old;HTMLElement.prototype.getAnimations=oldGet;}
});
it('reduced motion keeps the action caption and skips all animation',async()=>{
 vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener(){},removeEventListener(){}}));const old=HTMLElement.prototype.animate;const animate=vi.fn();HTMLElement.prototype.animate=animate;
 try{render(<StoryPlayer pack={{...pack,script:script()}}/>);fireEvent.click(screen.getByRole('button',{name:'Accept'}));fireEvent.click(screen.getByRole('button',{name:'Next →'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Continue →'})).toBeEnabled());expect(screen.getByText('The attack happens.')).toBeInTheDocument();expect(animate).not.toHaveBeenCalled();}finally{cleanup();HTMLElement.prototype.animate=old;vi.unstubAllGlobals();}
});
it('mirrors paired movement and settles to the original marks at every viewport size',()=>{
 for(const width of [25,120,360])for(const action of Object.keys(ACTIONS)){const left=actionFrames(action,1,width),right=actionFrames(action,-1,width);expect(left.actor.at(-1)?.transform).toMatch(/\(0\)/);expect(right.target.at(-1)?.transform).toBe('translateX(0)');if(action.startsWith('attack')){expect(left.actor[2].transform).toContain(`translateX(${width}px)`);expect(right.actor[2].transform).toContain(`translateX(${-width}px)`);}}
});
it('action packages round-trip through the teacher ZIP importer',async()=>{
 const {importStory}=await import('../services/animated-stories');
 expect(await importStory(readFileSync('public/stories/animated/action-rehearsal/episode.zip') as unknown as File)).toEqual(pack);
});
it('finishing the pair enables exactly one continuation and records its caption once',async()=>{
 const old=HTMLElement.prototype.animate,oldGet=HTMLElement.prototype.getAnimations;const finishers:(()=>void)[]=[];
 HTMLElement.prototype.animate=vi.fn(()=>({finished:new Promise<void>(r=>finishers.push(r)),cancel(){}} as unknown as Animation));
 HTMLElement.prototype.getAnimations=()=>[];
 try{const save=vi.fn();render(<StoryPlayer pack={{...pack,script:script()}} onProgress={save}/>);fireEvent.click(screen.getByRole('button',{name:'Accept'}));fireEvent.click(screen.getByRole('button',{name:'Next →'}));await waitFor(()=>expect(finishers.length).toBe(2));
 await act(async()=>{finishers.forEach(f=>f());});const next=screen.getByRole('button',{name:'Continue →'});expect(next).toBeEnabled();fireEvent.click(next);fireEvent.click(next);await waitFor(()=>expect(screen.getByText('After.')).toBeInTheDocument());expect(save).toHaveBeenCalledTimes(2);expect(save.mock.lastCall?.[0].steps).toEqual([null,null]);
 }finally{cleanup();HTMLElement.prototype.animate=old;HTMLElement.prototype.getAnimations=oldGet;}
});
