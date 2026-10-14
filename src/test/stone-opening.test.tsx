import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import PublicStonePlayer,{STONE_INVITATION,stoneArrival} from '../components/animated/PublicStonePlayer';
import {replayStory,validatePackage} from '../../functions/learning-content/src/story-engine.js';
const pack=JSON.parse(readFileSync('public/stories/public-ethics/the-grain-we-keep/episode.json','utf8'));
beforeEach(()=>{
 vi.useFakeTimers();
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 Element.prototype.scrollIntoView=vi.fn();
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
const open=()=>render(<MemoryRouter initialEntries={['/play']}><Routes><Route path="/play" element={<PublicStonePlayer pack={pack}/>}/><Route path="/ethics" element={<h1>Adventure library</h1>}/></Routes></MemoryRouter>);
it('keeps scenery absent during typing, allows declining and leaving without a quiz',()=>{
 open();fireEvent.click(screen.getByRole('button',{name:'Accept and begin'}));
 expect(document.querySelector('.story-stage')).toBeNull();expect(screen.queryByText('Yes, pick it up')).not.toBeInTheDocument();
 act(()=>vi.advanceTimersByTime(27));expect(document.querySelector('.stone-typed')?.textContent).toContain('Y');
 fireEvent.click(screen.getByRole('button',{name:'Show full text'}));expect(screen.getByLabelText(STONE_INVITATION)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'No, leave it alone'}));expect(document.querySelector('.story-stage')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Leave the stone alone'}));expect(screen.getByText('Adventure library')).toBeInTheDocument();
});
it('reveals the actual arrival once, blocks input during the reveal, and restarts at a clean invitation',()=>{
 const view=open();fireEvent.click(screen.getByRole('button',{name:'Accept and begin'}));fireEvent.click(screen.getByRole('button',{name:'Show full text'}));fireEvent.click(screen.getByRole('button',{name:'Yes, pick it up'}));
 expect(document.querySelector('dialog')).toBeNull();expect(document.querySelector('.stone-entering .story-stage')).not.toBeNull();expect(document.querySelector('[inert]')).not.toBeNull();
 expect(screen.getByText(/Are you the adviser/)).toBeInTheDocument();
 act(()=>vi.advanceTimersByTime(2400));expect(document.querySelector('[inert]')).toBeNull();expect(document.querySelector('.stone-entering')).toBeNull();expect(screen.getByRole('button',{name:'Next →'})).toHaveFocus();
 view.unmount();open();expect(screen.getByRole('button',{name:'Accept and begin'})).toBeInTheDocument();expect(document.querySelector('.story-stage')).toBeNull();
});
it('shows complete text and skips the reveal delay with reduced motion',()=>{
 vi.mocked(window.matchMedia).mockReturnValue({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()} as any);
 open();fireEvent.click(screen.getByRole('button',{name:'Accept and begin'}));expect(screen.queryByText('Show full text')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Yes, pick it up'}));act(()=>vi.advanceTimersByTime(0));expect(document.querySelector('.stone-entering')).toBeNull();
});
it('both public arrivals use a legal replay and retain the story resources',()=>{
 for(const slug of ['the-grain-we-keep','the-measure-that-changed']){
  const p=JSON.parse(readFileSync(`public/stories/public-ethics/${slug}/episode.json`,'utf8'));
  const progress=stoneArrival(p),{story}=validatePackage(p),state=replayStory(story!,progress.steps,progress.seed);
  expect(state.stage.background).toBe('village');expect(state.ended).toBe(false);expect(progress.quizzes).toEqual([]);
  if(slug==='the-grain-we-keep')expect(state.variables.food).toBe(60);
 }
});
