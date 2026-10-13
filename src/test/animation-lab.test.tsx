import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import CartoonActor from '@/components/animated/CartoonActor';
import AnimationLabPage from '@/pages/AnimationLabPage';
const lin=JSON.parse(readFileSync('public/stories/animated/rigs/lin-cartoon.json','utf8'));
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
it('keeps illustration opt-in, uses separate gradient IDs, and falls back if artwork fails',()=>{
 const {container}=render(<><CartoonActor character={lin} experiment="current" reduced/><CartoonActor character={lin} experiment="polished" reduced/><CartoonActor character={lin} experiment="hybrid" headImage="/lin.png" reduced/></>);
 const actors=container.querySelectorAll('svg');expect(actors[0].querySelector('image')).toBeNull();expect(actors[0].querySelector('defs')).toBeNull();
 const ids=[...container.querySelectorAll('linearGradient')].map(e=>e.id);expect(new Set(ids).size).toBe(ids.length);
 expect(actors[2].querySelector('.puppet-face')).not.toBeNull();fireEvent.error(actors[2].querySelector('image')!);expect(actors[2].querySelector('image')).toBeNull();expect(actors[2].querySelector('.puppet-face')).not.toBeNull();
});
it('drives all three versions through the same four beats and finishes playback',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>lin}));
 const {container}=render(<MemoryRouter><AnimationLabPage/></MemoryRouter>);
 await waitFor(()=>expect(screen.getByRole('button',{name:/Play all four/})).toBeEnabled());
 vi.useFakeTimers();fireEvent.click(screen.getByRole('button',{name:/Play all four/}));
 for(const emotion of ['curious','happy','shocked','laughing']){expect([...container.querySelectorAll('svg')].every(e=>e.getAttribute('aria-label')?.includes(emotion))).toBe(true);act(()=>vi.advanceTimersByTime(3000));}
 expect(screen.getByRole('button',{name:/Play all four/})).toBeEnabled();
 fireEvent.click(screen.getByLabelText('Hold expression'));fireEvent.click(screen.getByRole('button',{name:'03 Shocked'}));
 expect(container.querySelectorAll('.puppet-still')).toHaveLength(3);
 fireEvent.click(screen.getByLabelText('Full figure'));expect([...container.querySelectorAll('svg')].every(e=>e.getAttribute('viewBox')==='0 0 240 600')).toBe(true);
});
it('shows an actionable loading error',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));render(<MemoryRouter><AnimationLabPage/></MemoryRouter>);
 expect(await screen.findByRole('alert')).toHaveTextContent('reload');expect(screen.getByRole('button',{name:/Play all four/})).toBeDisabled();
});
