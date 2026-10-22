import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {compileStory,replayStory,advanceStory} from '../../functions/learning-content/src/story-engine.js';
import StoryStage from '../components/animated/StoryStage';
const pack=JSON.parse(readFileSync('public/stories/own-english/animated/episode.json','utf8'));
afterEach(cleanup);
const setup=(extra='')=>{const {story,errors}=compileStory(`story 2\nshow Lin neutral left\nshow Hepting skeptical right\n${extra}\nLin: Will you listen?\nHepting: I am listening.\nlook Lin front\nI: A private thought.\nend`,pack.assets);expect(errors).toEqual([]);return {story,state:replayStory(story,[],1)}};
it('turns toward partners and assigns a quiet listener even with audio off; narration can face front',()=>{
 const {story,state}=setup();const {container,rerender}=render(<StoryStage pack={pack} state={state} current={story.nodes[state.cursor]} speaking={false} reduced/>);
 const actor=(name:string)=>container.querySelector(`[data-actor="${name}"] .cartoon-actor`)!;
 expect(actor('Lin')).toHaveAttribute('data-turn','1');expect(actor('Hepting')).toHaveAttribute('data-turn','-1');
 expect(actor('Hepting')).toHaveAttribute('data-listening','guarded');expect(actor('Lin')).not.toHaveAttribute('data-listening');
 state.stage.actors.Lin.facing=-1;rerender(<StoryStage pack={pack} state={state} current={story.nodes[state.cursor]} speaking={false} reduced/>);
 expect(actor('Lin')).toHaveAttribute('data-turn','-1');
 const next=advanceStory(story,state,null);rerender(<StoryStage pack={pack} state={next} current={story.nodes[next.cursor]} speaking={false} reduced/>);expect(actor('Lin')).toHaveAttribute('data-listening','attentive');
 const thought=advanceStory(story,next,null);rerender(<StoryStage pack={pack} state={thought} current={story.nodes[thought.cursor]} speaking={false} reduced/>);expect(actor('Lin')).toHaveAttribute('data-turn','0');expect(actor('Lin')).not.toHaveAttribute('data-listening');
});
it('preserves explicit held poses, prop geometry, and replay orientation',()=>{
 const {story,state}=setup('rest Hepting guarded\nprop Lin sword');const props={pack,current:story.nodes[state.cursor],speaking:false,reduced:true};const {container,rerender}=render(<StoryStage {...props} state={state}/>);
 expect([...container.querySelectorAll('.cartoon-actor')].map(a=>a.getAttribute('data-turn'))).toEqual(['0','0']);
 expect(container.querySelector('[data-prop="sword"]')).not.toBeNull();
 const next=advanceStory(story,state,null);rerender(<StoryStage {...props} state={replayStory(story,[null],1)} current={story.nodes[next.cursor]}/>);
 expect([...container.querySelectorAll('.cartoon-actor')].map(a=>a.getAttribute('data-turn'))).toEqual(['0','0']);
});
it('offers scene pause for conversations, freezes idle motion, and keeps reduced-motion poses',()=>{
 const {story,state}=setup();const props={pack,state,current:story.nodes[state.cursor],speaking:false};const {container,getByRole,rerender}=render(<StoryStage {...props} reduced={false}/>);
 expect(container.querySelector('.story-stage')).not.toHaveAttribute('data-idle-paused');fireEvent.click(getByRole('button',{name:'Pause scene motion'}));expect(container.querySelector('.story-stage')).toHaveAttribute('data-idle-paused','true');
 fireEvent.click(getByRole('button',{name:'Resume scene motion'}));rerender(<StoryStage {...props} reduced/>);expect(container.querySelector('.story-stage')).toHaveAttribute('data-idle-paused','true');expect(container.querySelector('[data-actor="Lin"] .cartoon-actor')).toHaveAttribute('data-turn','1');
});
