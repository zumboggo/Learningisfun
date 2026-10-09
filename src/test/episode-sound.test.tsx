import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
const mocks=vi.hoisted(()=>({enable:vi.fn(async()=>true),mute:vi.fn(),dispose:vi.fn(),setVolume:vi.fn(),click:vi.fn()}));
vi.mock('@/services/episode-audio',()=>({EpisodeAudio:class {enable=mocks.enable;mute=mocks.mute;dispose=mocks.dispose;setVolume=mocks.setVolume;click=mocks.click;}}));
import EpisodeSound from '@/components/EpisodeSound';
beforeEach(()=>{vi.clearAllMocks();mocks.enable.mockResolvedValue(true);Object.defineProperty(document,'hidden',{configurable:true,value:false});});
afterEach(cleanup);
it('defaults off, controls volume and both sounds, mutes on hidden, and disposes on exit',async()=>{
 const frame=document.createElement('iframe');document.body.append(frame);frame.contentDocument!.body.innerHTML='<button>Next</button><button disabled>No</button>';
 const view=render(<EpisodeSound trackUrl="/loop.mp3" iframeRef={{current:frame}} frameKey={0}/>);
 expect(screen.getByRole('button',{name:'Sound off'})).toHaveAttribute('aria-pressed','false');expect(mocks.enable).not.toHaveBeenCalled();
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Sound off'})));expect(screen.getByRole('button',{name:'Sound on'})).toHaveAttribute('aria-pressed','true');
 frame.contentDocument!.querySelector('button')!.click();expect(mocks.click).toHaveBeenCalledOnce();
 fireEvent.change(screen.getByRole('slider'),{target:{value:'15'}});expect(mocks.setVolume).toHaveBeenLastCalledWith(.15);
 Object.defineProperty(document,'hidden',{configurable:true,value:true});fireEvent(document,new Event('visibilitychange'));expect(screen.getByRole('button',{name:'Sound off'})).toBeInTheDocument();expect(mocks.mute).toHaveBeenCalled();
 view.unmount();expect(mocks.dispose).toHaveBeenCalledOnce();frame.remove();
});
it('keeps the controls usable when playback fails',async()=>{
 mocks.enable.mockRejectedValueOnce(new Error('offline'));render(<EpisodeSound trackUrl="/loop.mp3" iframeRef={{current:null}} frameKey={0}/>);
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Sound off'})));expect(screen.getByRole('status')).toHaveTextContent('Keep playing silently');expect(screen.getByRole('button',{name:'Sound off'})).toBeInTheDocument();
});
