import 'fake-indexeddb/auto';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {executeLearningContent} from '@/services/learning-content.service';
import {STONE_CLASS_ID} from '@/services/stone.service';
import EpisodePortfolio,{EpisodeNotebook} from '@/components/ethics/EpisodePortfolio';
import {episodeNotesEntry,portfolioDb,localEntries,questionsForEpisode,secondShipQuestions,principleQuestions,type EpisodeNotesSource} from '@/services/ethics-portfolio.service';
const call=vi.mocked(executeLearningContent);
const source:EpisodeNotesSource={kind:'episode-notes',format:'stone',episode:'teaching-stone',version:1,title:'The Grain We Keep'};
const mount=()=>render(<MemoryRouter><EpisodeNotebook userId="alice" classId={STONE_CLASS_ID} source={source}/></MemoryRouter>);
beforeEach(async()=>{await portfolioDb.entries.clear();await portfolioDb.outbox.clear();call.mockReset();call.mockImplementation(async body=>body.action==='readEthicsPortfolio'?{teacher:false,settings:{open:false},entries:[]}:{saved:true});});
afterEach(async()=>{vi.useRealTimers();cleanup();vi.restoreAllMocks();await new Promise(r=>setTimeout(r,20));});
it('saves locally while typing, sends one changed snapshot each minute, and makes no idle save calls',async()=>{
 const interval=vi.spyOn(window,'setInterval');mount();await screen.findAllByRole('textbox');
 fireEvent.change(screen.getAllByRole('textbox')[0],{target:{value:'I chose to share.'}});
 await waitFor(async()=>expect((await localEntries('alice',STONE_CLASS_ID))[0]?.answers[0]).toBe('I chose to share.'));
 expect(call.mock.calls.filter(c=>c[0].action==='saveEthicsPortfolio')).toHaveLength(0);
 // Drive the explicit flush, then verify an unchanged second flush never calls the server.
 await act(async()=>{(interval.mock.calls.find(c=>c[1]===60000)![0] as ()=>void)();});
 await screen.findByText('Saved to your account.');
 expect(call.mock.calls.filter(c=>c[0].action==='saveEthicsPortfolio')).toHaveLength(1);
 await act(async()=>{(interval.mock.calls.find(c=>c[1]===60000)![0] as ()=>void)();});
 await waitFor(async()=>expect(await portfolioDb.outbox.count()).toBe(0));
 expect(call.mock.calls.filter(c=>c[0].action==='saveEthicsPortfolio')).toHaveLength(1);
});
it('keeps typing during an in-flight save and recovers the latest answers after reopening',async()=>{
 const interval=vi.spyOn(window,'setInterval');const view=mount();await screen.findAllByRole('textbox');
 let finish!:(value:unknown)=>void;
 call.mockImplementation(async body=>body.action==='saveEthicsPortfolio'?new Promise(resolve=>{finish=resolve;}):{teacher:false,settings:{open:false},entries:[]});
 fireEvent.change(screen.getAllByRole('textbox')[0],{target:{value:'First thought'}});
 await waitFor(async()=>expect((await localEntries('alice',STONE_CLASS_ID))[0]?.answers[0]).toBe('First thought'));
 await act(async()=>{(interval.mock.calls.find(c=>c[1]===60000)![0] as ()=>void)();});await waitFor(()=>expect(finish).toBeDefined());
 fireEvent.change(screen.getAllByRole('textbox')[0],{target:{value:'Revised thought'}});
 await waitFor(async()=>expect((await localEntries('alice',STONE_CLASS_ID))[0]?.answers[0]).toBe('Revised thought'));
 await act(async()=>finish({saved:true}));
 call.mockResolvedValue({saved:true});view.unmount();
 await waitFor(async()=>expect((await localEntries('alice',STONE_CLASS_ID))[0]?.revision).toBe(2));
 await waitFor(async()=>expect(await portfolioDb.outbox.count()).toBe(0));
 expect((await episodeNotesEntry('alice',STONE_CLASS_ID,{...source,version:2})).answers[0]).toBe('Revised thought');
 expect(await localEntries('bob',STONE_CLASS_ID)).toEqual([]);
});
it('automatically flushes after a minute and retains a failed save for retry',async()=>{
 const interval=vi.spyOn(window,'setInterval');mount();await screen.findAllByRole('textbox');
 fireEvent.change(screen.getAllByRole('textbox')[0],{target:{value:'Offline thought'}});
 await waitFor(async()=>expect((await localEntries('alice',STONE_CLASS_ID))[0]?.answers[0]).toBe('Offline thought'));
 call.mockRejectedValueOnce(Error('connection lost'));
 const callback=interval.mock.calls.find(c=>c[1]===60000)![0] as ()=>void;
 await act(async()=>callback());
 await screen.findByText(/Save pending.*connection lost/);
 expect(await portfolioDb.outbox.count()).toBe(1);
 call.mockResolvedValue({saved:true});await act(async()=>callback());
 await screen.findByText('Saved to your account.');expect(await portfolioDb.outbox.count()).toBe(0);
 interval.mockRestore();
});

it('does not show or load portfolio questions for other classes, including previews',()=>{
 const {container,rerender}=render(<MemoryRouter><EpisodePortfolio userId="alice" classId="ap-language" source={source}/></MemoryRouter>);
 expect(container).toBeEmptyDOMElement();
 rerender(<MemoryRouter><EpisodeNotebook userId="teacher" classId="world-literature" source={source} preview/></MemoryRouter>);
 expect(container).toBeEmptyDOMElement();expect(call).not.toHaveBeenCalled();
});

it('submits without deleting answers, stays collapsed on return, and opens them in the portfolio',async()=>{
 const view=mount();await screen.findAllByRole('textbox');
 fireEvent.change(screen.getAllByRole('textbox')[0],{target:{value:'Protect the vulnerable.'}});
 fireEvent.click(screen.getByRole('button',{name:/^Submit$/}));
 await screen.findByText('Submitted. You can read your answers in See all answers.');
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 expect(screen.getByRole('link',{name:'See all answers'})).toHaveAttribute('href',`/classes/${STONE_CLASS_ID}/principles`);
 expect((await localEntries('alice',STONE_CLASS_ID))[0]).toMatchObject({submitted:true,answers:['Protect the vulnerable.','','','','']});
 view.unmount();const reopened=mount();await screen.findByText(/Your answers have been submitted/);
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();reopened.unmount();
 render(<MemoryRouter><EpisodeNotebook userId="alice" classId={STONE_CLASS_ID} source={source} showSubmitted/></MemoryRouter>);
 expect((await screen.findAllByRole('textbox'))[0]).toHaveValue('Protect the vulnerable.');
 fireEvent.change(screen.getAllByRole('textbox')[0],{target:{value:'Protect those most at risk.'}});
 await waitFor(async()=>expect((await localEntries('alice',STONE_CLASS_ID))[0].answers[0]).toBe('Protect those most at risk.'));
});
it('keeps Second Ship questions while using the requested five prompts for other episodes',()=>{
 expect(questionsForEpisode({...source,episode:'second-ship-ethics'})).toEqual(secondShipQuestions);
 expect(questionsForEpisode(source)).toEqual(principleQuestions);
 expect(principleQuestions[0]).toBe('Choose: What should the person do? Why?');
});
