import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import EpisodePublicSharing from '@/components/animated/EpisodePublicSharing';
import PublicEpisodePage from '@/pages/PublicEpisodePage';
const api=vi.hoisted(()=>({animatedCall:vi.fn(),createExecution:vi.fn()}));
vi.mock('@/services/animated-stories',()=>({animatedCall:api.animatedCall}));
vi.mock('@/lib/appwrite',()=>({functions:{createExecution:api.createExecution}}));
vi.mock('@/components/animated/StoryPlayer',()=>({default:({pack}:{pack:{title:string}})=><p>{pack.title}</p>}));
afterEach(()=>{cleanup();vi.resetAllMocks();});
it('teacher enables sharing, copies correct public URL, and disables sharing',async()=>{
 api.animatedCall.mockResolvedValueOnce({enabled:false,shareId:'abc'}).mockResolvedValueOnce({enabled:true,shareId:'abc'}).mockResolvedValueOnce({enabled:false,shareId:'abc'});
 const writeText=vi.fn(async()=>{});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});
 render(<EpisodePublicSharing versionId="v1"/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Make public'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Make public'}));fireEvent.click(await screen.findByRole('button',{name:'Copy public link'}));expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#/game/public/abc'));await screen.findByText('Public link copied.');fireEvent.click(screen.getByRole('button',{name:'Turn off public link'}));await waitFor(()=>expect(screen.queryByRole('button',{name:'Copy public link'})).not.toBeInTheDocument());expect(api.animatedCall).toHaveBeenLastCalledWith('setEpisodePublicSharing',{versionId:'v1',enabled:false});
});
it('guest page loads without auth and only calls the public reader',async()=>{
 api.createExecution.mockResolvedValue({status:'completed',responseStatusCode:200,responseBody:JSON.stringify({pack:{title:'Guest adventure'}})});
 render(<MemoryRouter initialEntries={['/game/public/abc']}><Routes><Route path="/game/public/:shareId" element={<PublicEpisodePage/>}/></Routes></MemoryRouter>);expect(await screen.findByText('Guest adventure')).toBeVisible();expect(api.createExecution).toHaveBeenCalledWith('public-reading',JSON.stringify({action:'readEpisode',shareId:'abc'}));expect(api.animatedCall).not.toHaveBeenCalled();
});
