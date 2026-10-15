import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {compileStory,replayStory,advanceStory} from '../../functions/learning-content/src/story-engine.js';
import PuppetActor from '../components/animated/PuppetActor';
import StoryStage from '../components/animated/StoryStage';
import {playSceneMotion} from '../components/animated/scene-motion';
const pack=JSON.parse(readFileSync('public/stories/own-english/animated/episode.json','utf8'));
const script=`story 2
show Lin neutral left
show Hepting neutral right
prop Lin sword
rest Lin attentive
move Lin turn
express Lin embarrassed
look Lin down
I: Listen.
look Lin Hepting
perform Lin sword-strike Hepting repeat 3 tiring
I: Keep going.
I: Finished.
end`;
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
it('expression and attention preserve props, rest and facing, and performances add no saved step',()=>{
 const {story,errors}=compileStory(script,pack.assets);expect(errors).toEqual([]);
 const first=replayStory(story,[],1);expect(first.stage.actors.Lin).toMatchObject({expression:'embarrassed',gaze:'down',prop:'sword',rest:'attentive',facing:-1});
 const second=advanceStory(story,first,null);expect(story.nodes[second.cursor].text).toBe('Keep going.');expect(second.cues?.find(c=>c.type==='perform')).toMatchObject({repeat:3,pace:'tiring'});
 expect(replayStory(story,[null],1)).toEqual(second);expect(advanceStory(story,second,null).cues).toEqual([]);
});
it('rejects missing targets, unstaged gaze and unbounded repeats',()=>{
 for(const change of ['perform Lin sword-strike Hepting repeat 0','perform Lin sword-strike Hepting repeat 7','perform Lin sword-strike Lin repeat 3','look Lin Missing','express Lin furious'])expect(compileStory(script.replace('perform Lin sword-strike Hepting repeat 3 tiring',change),pack.assets).errors.length).toBeGreaterThan(0);
 expect(compileStory('story 2\nlook Lin Hepting\nI: Hi\nend',pack.assets).errors.length).toBeGreaterThan(0);
});
it('an unrelated cursor change does not repeat an emotional gesture',()=>{
 vi.useFakeTimers();const c=pack.assets.characters.Lin;
 const {container,rerender}=render(<PuppetActor character={c} emotion="shocked" performanceKey={1}/>);
 act(()=>vi.advanceTimersByTime(2400));const settled=container.querySelector('[data-arm="left"]')!.innerHTML;
 rerender(<PuppetActor character={c} emotion="shocked" performanceKey={2}/>);
 act(()=>vi.advanceTimersByTime(800));expect(container.querySelector('[data-arm="left"]')!.innerHTML).toBe(settled);
});
it('listener gaze uses stage position and accounts for mirrored facing',()=>{
 const {story}=compileStory(script,pack.assets);const state=replayStory(story,[null],1);
 const {container,rerender}=render(<StoryStage pack={pack} state={state} current={story.nodes[state.cursor]} speaking={false} reduced/>);
 expect(container.querySelector('[data-actor="Lin"] [data-gaze-pupil]')).toHaveStyle({transform:'translate(2.5px, 0px)'});
 state.stage.actors.Lin.facing=-1;
 rerender(<StoryStage pack={pack} state={state} current={story.nodes[state.cursor]} speaking={false} reduced/>);
 expect(container.querySelector('[data-actor="Lin"] [data-gaze-pupil]')).toHaveStyle({transform:'translate(-2.5px, 0px)'});
});
it('cancellation stops both bodies and prevents another strike or stale response update',async()=>{
 const root=document.createElement('div');root.innerHTML='<div class="story-stage"><div data-actor="Lin"></div><div data-actor="Hepting" data-impact="anchored"></div></div>';
 const animations:any[]=[];
 for(const element of root.querySelectorAll<HTMLElement>('[data-actor]'))element.animate=vi.fn(()=>{let finish!:()=>void;const a={finished:new Promise<void>(r=>{finish=r;}),cancel:vi.fn(()=>finish())};animations.push(a);return a as unknown as Animation;});
 const responses=vi.fn(),controller=new AbortController();
 const job=playSceneMotion(root,[{type:'perform',actor:'Lin',targetActor:'Hepting',action:'sword-strike',repeat:3}],{type:'say'},false,responses,controller.signal);
 await Promise.resolve();await Promise.resolve();await Promise.resolve();expect(animations).toHaveLength(2);
 controller.abort();const calls=responses.mock.calls.length;await job;
 expect(animations.every(a=>a.cancel.mock.calls.length===1)).toBe(true);expect(responses).toHaveBeenCalledTimes(calls);expect(animations).toHaveLength(2);
 const still=vi.fn();await playSceneMotion(root,[{type:'react',actor:'Lin',action:'shock'}],{},true,still,new AbortController().signal);expect(still).not.toHaveBeenCalled();
});
