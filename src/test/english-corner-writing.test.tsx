import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import StoryPlayer from '../components/animated/StoryPlayer';
import {validatePackage,replayStory,advanceStory,type StoryPackage} from '../../functions/learning-content/src/story-engine.js';
vi.mock('../components/animated/StoryStage',()=>({default:()=>null}));
vi.mock('../components/animated/scene-motion',()=>({playSceneMotion:async()=>{}}));
const real=JSON.parse(readFileSync('public/stories/animated/the-joke-i-couldnt-tell/episode.json','utf8')) as StoryPackage;
const tiny={...real,script:'story 2\nI: Start.\nchoice test\noption a "Try it" -> reply\noption b "Ask for help" -> reply\nlabel reply\nI: Response.\nend'};
afterEach(()=>{cleanup();vi.useRealTimers()});
it('all 243 routes finish with five choices and replay exactly',()=>{
 const {story,errors}=validatePackage(real);expect(errors).toEqual([]);let count=0;
 function walk(steps:(string|null)[]){let state=replayStory(story,steps,1);while(!state.ended){const n=story.nodes[state.cursor];if(n.type==='choice'){for(const o of n.options)walk([...steps,o.id]);return;}steps=[...steps,null];state=advanceStory(story,state,null);}expect(steps.filter(x=>x!==null)).toHaveLength(5);expect(replayStory(story,steps,1)).toEqual(state);count++;}
 walk([]);expect(count).toBe(243);
});
it('rejects missing or duplicate English Corner prompts and permits legacy single prompts',()=>{
 expect(validatePackage({...real,writing:undefined},{requireEnglishCornerWriting:true}).errors.length).toBeGreaterThan(0);
 expect(validatePackage({...real,writing:{prompts:['a','a','b']}}).errors.length).toBeGreaterThan(0);
 expect(validatePackage({...real,writing:undefined}).errors).toEqual([]);
 expect(validatePackage({...real,profile:'legacy',writing:{prompts:['One prompt']}}).errors).toEqual([]);
});
it('holds the response for two seconds despite rapid clicks, back and keyboard repeat',async()=>{
 vi.useFakeTimers();vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{cb(0);return 1});
 const save=vi.fn();render(<StoryPlayer cinema pack={tiny} initial={{steps:[null],quizzes:[],seed:1}} onProgress={save}/>);
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:/Try it/})));
 expect(screen.getByText('Response.')).toBeVisible();const next=screen.getByRole('button',{name:/Next/});expect(next).toBeDisabled();
 fireEvent.click(next);fireEvent.keyDown(document,{key:'ArrowLeft'});fireEvent.keyDown(document,{key:'ArrowRight',repeat:true});expect(save).toHaveBeenCalledTimes(1);
 await act(async()=>{vi.advanceTimersByTime(1999)});expect(next).toBeDisabled();await act(async()=>{vi.advanceTimersByTime(1)});expect(next).toBeEnabled();vi.unstubAllGlobals();
});
it.each([0,1,2])('saves prompt %i, rejects blank writing and restores the submitted review',(index)=>{
 let saved:any;const initial={steps:[null,'a',null],quizzes:[[1,2,0,3]],seed:1};const view=render(<StoryPlayer pack={tiny} initial={initial} studentName="Kevin" onProgress={p=>saved=p}/>);
 const prompts=screen.getByRole('group',{name:'Choose your question'});fireEvent.click(prompts.querySelectorAll('input')[index]);
 const submit=screen.getByRole('button',{name:'Submit paragraph for teacher review'});expect(submit).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Your paragraph'),{target:{value:'   '}});expect(submit).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Your paragraph'),{target:{value:'Kevin learns to wait. He lets Nia find her word, which helps her tell her story.'}});expect(saved.writing.question).toBe(index);
 view.unmount();const restored=render(<StoryPlayer pack={tiny} initial={saved} studentName="Kevin" onProgress={p=>saved=p}/>);expect(screen.getByLabelText('Your paragraph')).toHaveValue(saved.writing.text);
 fireEvent.click(screen.getByRole('button',{name:'Submit paragraph for teacher review'}));expect(saved.writing.submitted).toBe(true);restored.unmount();
 render(<StoryPlayer pack={tiny} initial={saved} studentName="Kevin"/>);expect(screen.getByText(real.writing!.prompts[index])).toBeVisible();expect(screen.getByText('Keep this tab open. Show your quiz score and paragraph to the English Corner teacher before closing it.')).toBeVisible();expect(screen.queryByRole('textbox')).toBeNull();
});
it('allows a paragraph after a failed quiz while keeping the score and retry visible',()=>{
 render(<StoryPlayer pack={tiny} initial={{steps:[null,'a',null],quizzes:[[0,0,0,0]],seed:1}}/>);
 expect(screen.getByText(/1\/4 correct/)).toBeVisible();expect(screen.getByRole('group',{name:'Choose your question'})).toBeVisible();expect(screen.getByRole('button',{name:'Check answers'})).toBeVisible();
});
it('preserves a final-choice pause across resume',async()=>{
 vi.useFakeTimers();const endChoice={...tiny,script:'story 2\nI: Start.\nchoice test\noption a "Try it" -> done\noption b "Ask" -> done\nlabel done\nend'};
 render(<StoryPlayer pack={endChoice} initial={{steps:[null,'a'],quizzes:[],seed:1,choicePauseUntil:Date.now()+2000}}/>);
 for(const field of screen.getAllByRole('group')){const radio=field.querySelector('input');if(radio)fireEvent.click(radio);}
 const submit=screen.getByRole('button',{name:'Check answers'});expect(submit).toBeDisabled();
 await act(async()=>{vi.advanceTimersByTime(2000)});expect(submit).toBeEnabled();
});
