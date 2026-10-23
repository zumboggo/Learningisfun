import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {importStory} from '../services/animated-stories';
import {simulationResult} from '../components/animated/SimulationScorecard';
import StoryPlayer from '../components/animated/StoryPlayer';
import {STORY_INTERLUDES} from '../services/story-interludes';
const pack=JSON.parse(readFileSync('public/stories/animated/courage-without-applause/episode.json','utf8'));
it('all 729 six-decision routes resolve safely, match their score and resume exactly',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let paths=0;const scores=new Set<number>(),outcomes=new Set<string>();
 function visit(state:any,steps:(string|null)[],count:number){
  while(!state.ended&&story.nodes[state.cursor].type!=='choice'){steps=[...steps,null];state=advanceStory(story,state,null);}
  expect(state.variables.Turns).toBe(6-count);
  if(state.ended){paths++;expect(count).toBe(6);expect(replayStory(story,steps,1)).toEqual(state);const result=simulationResult(pack,story,state)!;expect(result).toBeTruthy();expect(result.maximum).toBe(100);expect(result.total).toBeGreaterThanOrEqual(0);expect(result.total).toBeLessThanOrEqual(100);scores.add(result.total);outcomes.add(result.outcome!);
   const text=state.history.map((h:any)=>h.text).join('\n');expect(text).toContain('Father is home on this side');expect(text).toContain('The taxi brings us home');expect(text).not.toMatch(/fictional|fictionalized|imagined|simulation/i);
   if(result.total===100)expect(text).toContain('prepared rescue brings Melas back');
   if(result.total===90)expect(text).toContain('Melas returns in the boat');
   if(result.total===76)expect(text).toContain('shifting plank throws Nikias');
   if(result.total===63)expect(text).toContain('helper strains a wrist');
   if(result.total===62)expect(text).toContain('Conflicting instructions');
   if(result.total===37)expect(text).toContain('His wrist is hurt');
   return;
  }
  expect(simulationResult(pack,story,state)).toBeNull();
  if(count===5)expect(replayStory(story,steps,1)).toEqual(state);
  for(const option of story.nodes[state.cursor].options)visit(advanceStory(story,state,option.id),[...steps,option.id],count+1);
 }
 visit(settleStory(story,initialStoryState(story,1)),[],0);expect(paths).toBe(729);expect(scores.size).toBeGreaterThanOrEqual(5);expect(scores.has(100)).toBe(true);console.log({paths,scores:[...scores],outcomes:outcomes.size});
 expect(quizScore(pack.quiz,pack.quiz.map((q:any)=>q.answer))).toBe(100);
},60000);
it('ZIP retains all metadata and media',async()=>{expect(await importStory(readFileSync('public/stories/animated/courage-without-applause/episode.zip') as unknown as File)).toEqual(pack);});
it('acceptance leads to a two-paragraph crawl then the requested teaser; saved progress skips both',async()=>{
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const save=vi.fn();render(<StoryPlayer pack={pack} onProgress={save}/>);expect(screen.getByText(pack.notice)).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Accept'}));
 const context=STORY_INTERLUDES.courage_context_v1;expect(context.kind).toBe('crawl');if(context.kind==='crawl')expect(context.paragraphs).toHaveLength(2);
 expect(screen.getByText('Pause scrolling')).toBeTruthy();fireEvent.click(screen.getByText('Show full text'));fireEvent.click(screen.getByText('Continue to the story →'));
 await screen.findByText('Play opening with sound');expect(screen.getByRole('heading',{name:'What kind of person are you practising becoming?'})).toBeTruthy();await waitFor(()=>expect(screen.getByText('Continue without opening →')).not.toBeDisabled());fireEvent.click(screen.getByText('Continue without opening →'));await screen.findByText('If I do something brave and nobody notices, does it still count?');cleanup();
 render(<StoryPlayer pack={pack} initial={{steps:[null,null],quizzes:[],seed:1}}/>);expect(screen.queryByText('Accept')).toBeNull();expect(screen.queryByText('Play opening with sound')).toBeNull();expect(screen.getByText('If I do something brave and nobody notices, does it still count?')).toBeTruthy();cleanup();vi.restoreAllMocks();
});
it('malformed outcome scores fail closed',()=>{const {story}=validatePackage(pack);const state=settleStory(story,initialStoryState(story,1));state.ended=true;expect(simulationResult({...pack,simulationScore:{outcomes:[],categories:[]}},story,state)).toBeNull();});
