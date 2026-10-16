import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {compileStory,replayStory,advanceStory} from '../../functions/learning-content/src/story-engine.js';
import StoryStage from '../components/animated/StoryStage';
import {activityWait,walkingPose} from '../components/animated/activity-motion';
const original=JSON.parse(readFileSync('public/stories/own-english/animated/episode.json','utf8'));
const assets=structuredClone(original.assets);
assets.characters.Hepting.impact='anchored';
assets.backgrounds.road={...Object.values(assets.backgrounds)[0] as object,loop:'mirror'};
const prefix='story 2\nscene road\nshow Lin neutral left\nshow Hepting neutral right\n';
function build(body:string){const script=prefix+body+'\nend';const result=compileStory(script,assets);expect(result.errors).toEqual([]);return {story:result.story,pack:{...original,assets,script}};}
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
it('replays persistent walking, explicit pauses, resume, stop and scene cleanup',()=>{
 const {story}=build('activity Lin walk right steady\nscroll Lin\nI: One.\nI: Two.\nactivity Lin pause\nI: Pause.\nactivity Lin resume\nI: Again.\nactivity Lin stop\nI: Still.\nscene road\nI: New.');
 let state=replayStory(story,[],5);expect(state.stage.scroll).toBe('Lin');
 for(let i=0;i<2;i++){expect(state.stage.actors.Lin.activity).toMatchObject({kind:'walk',paused:false});state=advanceStory(story,state,null);}
 expect(state.stage.actors.Lin.activity?.paused).toBe(true);state=advanceStory(story,state,null);expect(state.stage.actors.Lin.activity?.paused).toBe(false);
 expect(replayStory(story,[null,null,null],5)).toEqual(state);
 state=advanceStory(story,state,null);expect(state.stage.actors.Lin.activity).toBeUndefined();
 state=advanceStory(story,state,null);expect(state.stage.scroll).toBeUndefined();expect(state.stage.actors).toEqual({});
});
it('rejects unsafe scenery, unsupported rigs, unstaged targets and invalid commands',()=>{
 for(const body of ['activity Lin walk up steady','activity Lin train Lin steady','activity Lin train Missing steady','scroll Hepting']){
 const a=structuredClone(assets);delete a.backgrounds.road.loop;expect(compileStory(prefix+body+'\nI: Hi\nend',a).errors.length).toBeGreaterThan(0);
 }
 const a=structuredClone(assets);delete a.characters.Lin.rig;
 expect(compileStory(prefix+'activity Lin walk right steady\nI: Hi\nend',a).errors.length).toBeGreaterThan(0);
 expect(compileStory('story 2\nactivity Lin train Hepting steady\nI: Hi\nend',assets).errors.length).toBeGreaterThan(0);
});
it('training equips a sword and stops when the target exits or is replaced',()=>{
 for(const change of ['move Hepting exit','show Hepting neutral right']){
 const {story}=build('activity Lin train Hepting tiring\nI: Work.\n'+change+'\nI: Done.');
 const state=replayStory(story,[],1);expect(state.stage.actors.Lin).toMatchObject({prop:'sword',activity:{kind:'train',targetActor:'Hepting'}});
 expect(advanceStory(story,state,null).stage.actors.Lin.activity).toBeUndefined();
 }
});
it('walking survives dialogue and can be paused by the reader, reaction, choice or reduced motion',()=>{
 vi.useFakeTimers();const {story,pack}=build('activity Lin walk right steady\nscroll Lin\nI: One.\nI: Two.\nreact Lin shock\nI: Wait.');
 const state=replayStory(story,[],1),props={pack,state,current:story.nodes[state.cursor],speaking:false,reduced:false};
 const {container,rerender}=render(<StoryStage {...props}/>);
 expect(container.querySelector('[data-scroll]')).toHaveAttribute('data-scroll','running');
 const next=advanceStory(story,state,null);rerender(<StoryStage {...props} state={next} current={story.nodes[next.cursor]}/>);
 expect(container.querySelector('[data-scroll]')).toHaveAttribute('data-scroll','running');
 fireEvent.click(container.querySelector('button')!);expect(container.querySelector('[data-scroll]')).toHaveAttribute('data-scroll','paused');
 fireEvent.click(container.querySelector('button')!);
 rerender(<StoryStage {...props} current={{type:'choice'}}/>);expect(container.querySelector('[data-scroll]')).toHaveAttribute('data-scroll','paused');
 const reaction=advanceStory(story,next,null);rerender(<StoryStage {...props} state={reaction} current={story.nodes[reaction.cursor]}/>);expect(container.querySelector('[data-scroll]')).toHaveAttribute('data-scroll','paused');
 rerender(<StoryStage {...props} reduced/>);expect(container.querySelector('[data-scroll]')).toHaveAttribute('data-scroll','paused');
});
it('gait is periodic with alternating lifted feet, and abort cancels recovery timers',async()=>{
 expect(walkingPose(350,'steady').leftFootLift).toBeGreaterThan(6.5);
 expect(walkingPose(1050,'steady').rightFootLift).toBeGreaterThan(6.5);
 expect(walkingPose(1400,'steady').bodyDrop).toBeCloseTo(walkingPose(0,'steady').bodyDrop);
 vi.useFakeTimers();const controller=new AbortController();const job=activityWait(1000,controller.signal);controller.abort();await job;expect(vi.getTimerCount()).toBe(0);
});
it('training does not restart on Continue and cancels both bodies when paused',async()=>{
 vi.useFakeTimers();const animations:any[]=[];
 vi.stubGlobal('ResizeObserver',class{observe(){} disconnect(){}});
 const animate=vi.fn(function(this:Element){if(!this.matches('[data-actor]'))return {cancel:vi.fn(),finished:Promise.resolve()} as unknown as Animation;let finish!:()=>void;const animation={finished:new Promise<void>(r=>{finish=r;}),cancel:vi.fn(()=>finish())};animations.push(animation);return animation as unknown as Animation;});
 Object.defineProperty(Element.prototype,'animate',{configurable:true,value:animate});
 const {story,pack}=build('activity Lin train Hepting steady\nI: One.\nI: Two.');const state=replayStory(story,[],1);
 const {container,rerender}=render(<StoryStage pack={pack} state={state} current={story.nodes[state.cursor]} speaking={false} reduced={false}/>);
 expect(animations).toHaveLength(2);
 const next=advanceStory(story,state,null);rerender(<StoryStage pack={pack} state={next} current={story.nodes[next.cursor]} speaking={false} reduced={false}/>);
 expect(animations).toHaveLength(2);
 await act(async()=>{fireEvent.click(container.querySelector('button')!);await Promise.resolve();});
 expect(animations.every(a=>a.cancel.mock.calls.length===1)).toBe(true);
 await act(async()=>{vi.advanceTimersByTime(10000);});expect(animations).toHaveLength(2);
 delete (Element.prototype as any).animate;vi.unstubAllGlobals();
});
it('eating clears equipment, replays across dialogue, and stops on explicit prop change',()=>{
 const {story}=build('prop Lin sword\nactivity Lin eat eager\nI: Lunch.\nI: Still eating.\nactivity Lin pause\nI: A question.\nactivity Lin resume\nI: Another bite.\nprop Lin sword\nI: Done.');
 const state=replayStory(story,[],1);expect(state.stage.actors.Lin).toMatchObject({prop:'none',activity:{kind:'eat',pace:'eager',paused:false}});
 expect(replayStory(story,[null],1).stage.actors.Lin.activity?.kind).toBe('eat');expect(replayStory(story,[null,null],1).stage.actors.Lin.activity?.paused).toBe(true);
 expect(replayStory(story,[null,null,null],1).stage.actors.Lin.activity?.paused).toBe(false);expect(replayStory(story,[null,null,null,null],1).stage.actors.Lin.activity).toBeUndefined();
});
it('the meal has attached utensils and holds its spoon while the eater speaks',()=>{
 vi.useFakeTimers();const {story,pack}=build('activity Lin eat eager\nLin: Lunch.');const state=replayStory(story,[],1);const props={pack,state,current:story.nodes[state.cursor],reduced:false};
 const {container,rerender}=render(<StoryStage {...props} speaking={false}/>);
 act(()=>vi.advanceTimersByTime(800));const before=container.querySelector('[data-spoon]')!.innerHTML;
 expect(container.querySelector('[data-bowl]')).toBeTruthy();rerender(<StoryStage {...props} speaking/>);
 act(()=>vi.advanceTimersByTime(800));expect(container.querySelector('[data-spoon]')!.innerHTML).toBe(before);
 rerender(<StoryStage {...props} speaking={false}/>);act(()=>vi.advanceTimersByTime(400));expect(container.querySelector('[data-spoon]')!.innerHTML).not.toBe(before);
});
