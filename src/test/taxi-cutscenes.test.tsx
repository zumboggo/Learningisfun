import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {advanceStory,initialStoryState,replayStory,settleStory,validatePackage} from '../../functions/learning-content/src/story-engine.js';
import {taxiCutsceneCursors,taxiWording,TAXI_CLIPS} from '@/services/magical-taxi';
import TaxiCutscene from '@/components/animated/TaxiCutscene';
import StoryPlayer from '@/components/animated/StoryPlayer';

afterEach(()=>{cleanup();vi.restoreAllMocks();});

it.each(['public/stories/own-english/animated/episode.json','public/stories/animated/comeback-or-else/episode.json'])('finds both outbound travel beats in the released %s without altering replay',path=>{
 const pack=JSON.parse(readFileSync(path,'utf8'));
 const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);
 const clips=taxiCutsceneCursors(story);expect(Object.values(clips)).toEqual(['arrival','departure']);
 let state=settleStory(story,initialStoryState(story,19));const steps:(string|null)[]=[];const seen:string[]=[];
 while(!state.ended){
  if(clips[state.cursor])seen.push(clips[state.cursor]!);
  const node=story.nodes[state.cursor];const step=node.type==='choice'?node.options[0].id:null;
  steps.push(step);state=advanceStory(story,state,step);
 }
 expect(seen).toEqual(['arrival','departure']);
 expect(replayStory(story,steps,19)).toEqual(state);
});

it('keeps other class journeys unchanged and supports labelled future taxi episodes',()=>{
 for(const path of ['the-second-ship','the-promise-left-behind','everyone-belongs']){
  const pack=JSON.parse(readFileSync(`public/stories/animated/${path}/episode.json`,'utf8'));
  expect(taxiCutsceneCursors(validatePackage(pack).story)).toEqual({});
 }
 const story={labels:{taxi_arrival:0,taxi_departure:3},nodes:[{type:'label'},{type:'scene'},{type:'say',text:'Our transport is here.'},{type:'label'},{type:'say',text:'We set off.'},{type:'say',text:'We return home in the taxi.'}]};
 expect(taxiCutsceneCursors(story)).toEqual({2:'arrival',4:'departure'});
 expect(taxiWording('The magical DiDi waits. The Didi driver nods.')).toBe('The magical taxi waits. The taxi driver nods.');
});

it('loads a clip only on deliberate playback and advances once on end or skip',async()=>{
 const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const next=vi.fn();render(<TaxiCutscene clip="arrival" onContinue={next}/>);
 const video=screen.getByLabelText(TAXI_CLIPS.arrival.title,{selector:'video'}) as HTMLVideoElement;
 expect(video).not.toHaveAttribute('src');expect(video).not.toHaveAttribute('autoplay');
 expect(video.querySelector('track')).toHaveAttribute('kind','captions');
 fireEvent.click(screen.getByRole('button',{name:'Play with sound'}));
 expect(video).toHaveAttribute('src',TAXI_CLIPS.arrival.src);expect(video.muted).toBe(false);expect(play).toHaveBeenCalledOnce();
 fireEvent.ended(video);fireEvent.click(screen.getByRole('button',{name:'Continue without video →'}));
 expect(next).toHaveBeenCalledOnce();
});

it('offers silent playback, pauses on hiding, and never blocks progress on failed media',()=>{
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const next=vi.fn();const {unmount}=render(<TaxiCutscene clip="departure" onContinue={next}/>);
 const video=screen.getByLabelText(TAXI_CLIPS.departure.title,{selector:'video'}) as HTMLVideoElement;
 fireEvent.click(screen.getByRole('button',{name:'Play silently'}));expect(video.muted).toBe(true);
 vi.spyOn(document,'hidden','get').mockReturnValue(true);fireEvent(document,new Event('visibilitychange'));expect(pause).toHaveBeenCalled();
 fireEvent.error(video);expect(screen.getByRole('status')).toHaveTextContent('unavailable');
 fireEvent.click(screen.getByRole('button',{name:'Continue without video →'}));expect(next).toHaveBeenCalledOnce();
 unmount();expect(pause).toHaveBeenCalled();
});

it('places videos on native story beats, preserves legal saved steps and resumes after them',async()=>{
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const pack=JSON.parse(readFileSync('public/stories/own-english/animated/episode.json','utf8'));
 pack.script='story 2\nscene classroom\nI: A taxi passes through the classroom wall.\nI: We fly over the soccer field.\nI: Chicago, 2011. Our task begins.\nend';
 const save=vi.fn();const {unmount}=render(<StoryPlayer pack={pack} onProgress={save}/>);
 fireEvent.click(screen.getByRole('button',{name:'Accept'}));
 expect(screen.getByRole('region',{name:TAXI_CLIPS.arrival.title})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Continue without video →'}));
 await screen.findByRole('region',{name:TAXI_CLIPS.departure.title});
 await waitFor(()=>expect(screen.getByRole('button',{name:'Continue without video →'})).toBeEnabled());
 expect(save).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Continue without video →'}));
 await screen.findByText('Chicago, 2011. Our task begins.');
 expect(save.mock.calls.at(-1)![0].steps).toEqual([null,null]);
 unmount();render(<StoryPlayer pack={pack} initial={{steps:[null,null],quizzes:[],seed:1}}/>);
 expect(screen.queryByRole('button',{name:'Play with sound'})).not.toBeInTheDocument();
 expect(screen.getByText('Chicago, 2011. Our task begins.')).toBeInTheDocument();
});
