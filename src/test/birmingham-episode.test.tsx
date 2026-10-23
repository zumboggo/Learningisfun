import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {advanceStory,initialStoryState,replayStory,settleStory,validatePackage,quizScore,type StoryState,type StoryPackage} from '../../functions/learning-content/src/story-engine.js';
import {packageContentBytes} from '../../functions/learning-content/src/acting-library.js';
import {storyInterludeCursors,STORY_INTERLUDES} from '@/services/story-interludes';
import {taxiCutsceneCursors} from '@/services/magical-taxi';
import StoryInterlude from '@/components/animated/StoryInterlude';
import StoryPlayer from '@/components/animated/StoryPlayer';
const pack:StoryPackage=JSON.parse(readFileSync('public/stories/animated/the-people-who-told-him-to-wait/episode.json','utf8'));
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('validates every route, preserves both callbacks and replays legal progress',()=>{
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);expect(packageContentBytes(pack)).toBeLessThan(5000000);
 const interludes=storyInterludeCursors(story),taxi=taxiCutsceneCursors(story);let routes=0;
 const visit=(state:StoryState,steps:(string|null)[],events:string[])=>{
  if(state.ended){routes++;expect(replayStory(story,steps,13)).toEqual(state);expect(events).toEqual(['video','arrival','departure','crawl']);const text=state.history.map(h=>h.text).join(' ');expect(text).toContain('I can finally answer');expect(text).toContain('if someone understands');expect(text.includes('We both began')).toBe(state.variables.StartedWithWait);expect(text.includes('risk you raised stays')).toBe(state.variables.AskedAboutRisk);return;}
  const node=story.nodes[state.cursor],nextEvents=[...events];if(interludes[state.cursor])nextEvents.push(interludes[state.cursor].kind);if(taxi[state.cursor])nextEvents.push(taxi[state.cursor]!);
  for(const option of node.type==='choice'?node.options.map((o:{id:string})=>o.id):[null])visit(advanceStory(story,state,option),[...steps,option],nextEvents);
 };
 visit(settleStory(story,initialStoryState(story,13)),[],[]);expect(routes).toBe(729);expect(quizScore(pack.quiz,pack.quiz.map(q=>q.answer))).toBe(100);
});
it('opens with archive media only after deliberate playback, with one advance on end/skip',()=>{
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();const next=vi.fn();
 render(<StoryInterlude media={STORY_INTERLUDES.birmingham_opening_v1} onContinue={next}/>);
 const video=screen.getByLabelText('King’s archival quotation with illustrated reconstruction');expect(video).not.toHaveAttribute('src');
 fireEvent.click(screen.getByRole('button',{name:'Play opening with King’s voice'}));expect(play).toHaveBeenCalledOnce();expect(video).toHaveAttribute('src');fireEvent.ended(video);fireEvent.click(screen.getByText('Continue without opening →'));expect(next).toHaveBeenCalledOnce();
});
it('keeps the quotation available on media failure and pauses on hiding',()=>{
 const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});const next=vi.fn();render(<StoryInterlude media={STORY_INTERLUDES.birmingham_opening_v1} onContinue={next}/>);
 const video=screen.getByLabelText('King’s archival quotation with illustrated reconstruction');fireEvent.error(video);expect(screen.getByRole('status')).toHaveTextContent('unavailable');expect(screen.getByText(/Justice too long delayed/)).toBeInTheDocument();
 vi.spyOn(document,'hidden','get').mockReturnValue(true);fireEvent(document,new Event('visibilitychange'));expect(pause).toHaveBeenCalled();fireEvent.click(screen.getByText('Continue without opening →'));expect(next).toHaveBeenCalledOnce();
});
it('provides readable reduced-motion context and pause/still controls otherwise',()=>{
 const {unmount}=render(<StoryInterlude media={STORY_INTERLUDES.birmingham_context_v1} reduced onContinue={()=>{}}/>);expect(document.querySelector('.crawl-static')).not.toBeNull();expect(screen.queryByText('Pause scrolling')).not.toBeInTheDocument();expect(screen.getByText(/Arrested on April 12/)).toBeVisible();unmount();
 render(<StoryInterlude media={STORY_INTERLUDES.birmingham_context_v1} onContinue={()=>{}}/>);fireEvent.click(screen.getByText('Pause scrolling'));expect(screen.getByRole('button',{name:'Resume scrolling'})).toHaveAttribute('aria-pressed','true');fireEvent.click(screen.getByText('Read as still text'));expect(document.querySelector('.crawl-static')).not.toBeNull();
});
it('saves the opening as a normal beat and resumes after it without replaying',async()=>{
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});const save=vi.fn();const {unmount}=render(<StoryPlayer pack={pack} onProgress={save}/>);fireEvent.click(screen.getByText('Accept'));fireEvent.click(screen.getByText('Continue without opening →'));await screen.findByText(/My notebook has a neat heading/);await waitFor(()=>expect(save).toHaveBeenCalledOnce());expect(save.mock.calls[0][0].steps).toEqual([null]);unmount();
 render(<StoryPlayer pack={pack} initial={{steps:[null],quizzes:[],seed:1}}/>);expect(screen.queryByText('Play opening with King’s voice')).not.toBeInTheDocument();expect(screen.getByText(/My notebook has a neat heading/)).toBeInTheDocument();
});
