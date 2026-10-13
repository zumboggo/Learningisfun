import {describe,it,expect} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {SCENE_BEATS,sceneBeatCommand} from '../../functions/learning-content/src/scene-beats.js';
import {compileStory,initialStoryState,settleStory,advanceStory,replayStory} from '../../functions/learning-content/src/story-engine.js';
import {createCharacter} from '../../functions/learning-content/src/character-builder.js';
import SceneBeatLibrary from '../components/animated/SceneBeatLibrary';
import StoryPlayer from '../components/animated/StoryPlayer';
const assets={backgrounds:{room:{src:''}},characters:Object.fromEntries(['Lin','Yeyul','Mei'].map(id=>[id,createCharacter({id,name:id})]))};
const quiz=Array.from({length:4},()=>({prompt:'Question',options:['a','b','c','d'],answer:0,explanation:'Because'}));
const script='story 2\nscene room\nshow Mei neutral center\nbeat private-confession Lin Yeyul "I wait."\nLin [worried]: It was me.\nend';
describe('scene beats',()=>{
 it('all presets stage a distinct pair, retain location, hold one readable caption and replay deterministically',()=>{
  for(const preset of Object.keys(SCENE_BEATS)){
   const {story,errors}=compileStory(script.replace('private-confession',preset),assets);expect(errors).toEqual([]);
   const state=settleStory(story,initialStoryState(story,9));expect(state.stage.background).toBe('room');expect(Object.keys(state.stage.actors)).toEqual(['Lin','Yeyul']);expect(state.stage.actors.Yeyul.facing).toBe(-1);expect(story.nodes[state.cursor].text).toBe('I wait.');
   const next=advanceStory(story,state,null);expect(story.nodes[next.cursor].text).toBe('It was me.');expect(story.nodes[next.cursor].beatResponses).toBeUndefined();expect(replayStory(story,[null],9)).toEqual(next);
  }
 });
 it('rejects unknown presets, duplicate/missing actors and Story 1 syntax with original source line',()=>{
  for(const command of ['beat missing Lin Yeyul "Wait"','beat revelation Lin Lin "Wait"','beat revelation Lin Missing "Wait"'])expect(compileStory('story 2\n'+command+'\nend',assets).errors[0].line).toBe(2);
  expect(compileStory(script.replace('story 2','story 1'),assets).errors.length).toBeGreaterThan(0);
  expect(()=>sceneBeatCommand('revelation','Lin','Yeyul','bad\ncaption')).toThrow();
 });
 it('supports branch callbacks and subsequent paired actions without changing variables',()=>{
  const source='story 2\nvariable trust = false hidden\nchoice decision\noption yes "Defend her" -> helped ; trust = true\noption no "Stay quiet" -> silent\nlabel helped\nbeat reassurance Lin Yeyul "He remembers."\ngoto reunion\nlabel silent\nbeat quiet-aftermath Lin Yeyul "He waits."\nlabel reunion\nact Lin give Yeyul "I return the notebook."\nend';
  const {story,errors}=compileStory(source,assets);expect(errors).toEqual([]);
  for(const choice of ['yes','no']){const state=replayStory(story,[choice,null],1);expect(story.nodes[state.cursor].type).toBe('act');expect(state.variables.trust).toBe(choice==='yes');}
 });
 it('previews a beat and holds its player caption until the reader continues',()=>{
  const pack={format:2 as const,title:'Test',description:'',profile:'',script,assets,quiz};
  const view=render(<SceneBeatLibrary pack={pack}/>);expect(screen.getByText(/beat private-confession Lin Yeyul/)).toBeTruthy();fireEvent.change(screen.getByLabelText('Scene beat'),{target:{value:'revelation'}});expect(view.container.querySelector('[data-expression="shocked"]')).toBeTruthy();fireEvent.click(screen.getByLabelText('Reduced motion'));view.unmount();
  render(<StoryPlayer pack={pack}/>);fireEvent.click(screen.getByText('Accept'));expect(screen.getByText('I wait.')).toBeTruthy();expect(screen.getByText('Continue →')).toBeTruthy();
 });
});
