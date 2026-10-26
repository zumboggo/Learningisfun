import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import type {ReactNode} from 'react';
import AnimatedEpisodePage from '@/pages/AnimatedEpisodePage';
const api=vi.hoisted(()=>({animatedCall:vi.fn(),loadStoryCache:vi.fn(),saveStoryCache:vi.fn()}));
vi.mock('@/services/animated-stories',()=>api);
vi.mock('@/services/use-animated-library',()=>({invalidateAnimatedLibrary:vi.fn()}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'teacher'}})}));
vi.mock('@/components/GameDisplay',()=>({GameDisplay:({children}:{children:ReactNode})=><>{children}</>}));
const pack=JSON.parse(readFileSync('public/stories/animated/the-people-who-told-him-to-wait/episode.json','utf8'));
const result={pack,assignment:{versionId:'v2',classId:'ap'},preview:true,attempts:[]};
afterEach(()=>{cleanup();vi.clearAllMocks();});
function open(local:unknown){api.animatedCall.mockResolvedValue(result);api.loadStoryCache.mockResolvedValue(local);api.saveStoryCache.mockResolvedValue(undefined);render(<MemoryRouter initialEntries={['/game/play/assigned']}><Routes><Route path="/game/play/:assignmentId" element={<AnimatedEpisodePage/>}/></Routes></MemoryRouter>);}
it('preserves old-version preview progress and opens the new episode without replaying incompatible steps',async()=>{
 const local={data:{...result,assignment:{versionId:'v1'}},current:{id:'old',steps:[null,'wait'],quizzes:[],seed:1}};open(local);
 expect(await screen.findByRole('button',{name:'Accept'})).toBeVisible();await waitFor(()=>expect(api.saveStoryCache).toHaveBeenCalledWith('animated-play:teacher:assigned:preserved:v1:old',local));
 expect(api.saveStoryCache.mock.lastCall?.[1].current.steps).toEqual([]);
});
it('also recovers invalid saved steps without deleting their backup',async()=>{
 const local={data:result,current:{id:'broken',steps:['missing-choice'],quizzes:[],seed:1}};open(local);
 expect(await screen.findByRole('button',{name:'Accept'})).toBeVisible();expect(api.saveStoryCache).toHaveBeenCalledWith('animated-play:teacher:assigned:preserved:v2:broken',local);
});
it('continues valid current-version progress normally',async()=>{
 const current={id:'valid',steps:[null],quizzes:[],seed:1};open({data:result,current});
 expect(await screen.findByText(/My notebook has a neat heading/)).toBeVisible();expect(screen.queryByRole('button',{name:'Accept'})).not.toBeInTheDocument();await waitFor(()=>expect(api.saveStoryCache.mock.lastCall?.[1].current).toEqual(current));
});
