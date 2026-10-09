import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {EpisodeAudio} from '@/services/episode-audio';
let contexts:any[];
const ramp=()=>({value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()});
beforeEach(()=>{
 contexts=[];vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,clone:()=>({}),arrayBuffer:async()=>new ArrayBuffer(8)})));
 Object.defineProperty(document,'hidden',{configurable:true,value:false});
 vi.stubGlobal('AudioContext',class{
  state='running';currentTime=0;destination={};sources:any[]=[];tones:any[]=[];
  constructor(){contexts.push(this);}
  resume=vi.fn(async()=>{this.state='running';});suspend=vi.fn(async()=>{this.state='suspended';});close=vi.fn(async()=>{});
  decodeAudioData=vi.fn(async()=>({duration:12}));
  createGain=()=>({gain:ramp(),connect:vi.fn(),disconnect:vi.fn()});
  createBufferSource=()=>{const s={start:vi.fn(),stop:vi.fn(),connect:vi.fn(),disconnect:vi.fn(),loop:false};this.sources.push(s);return s;};
  createOscillator=()=>{const s={frequency:ramp(),start:vi.fn(),stop:vi.fn(),connect:vi.fn(),disconnect:vi.fn()};this.tones.push(s);return s;};
 });
});
afterEach(()=>vi.unstubAllGlobals());
it('starts without downloading; enables a loop and neutral effects, then mutes and reuses decoded audio',async()=>{
 const audio=new EpisodeAudio('/loop.mp3');audio.click();expect(fetch).not.toHaveBeenCalled();expect(contexts).toHaveLength(0);
 expect(await audio.enable()).toBe(true);expect(fetch).toHaveBeenCalledTimes(1);expect(contexts[0].sources[0].loop).toBe(true);
 audio.click();expect(contexts[0].tones).toHaveLength(1);audio.mute();audio.click();expect(contexts[0].sources[0].stop).toHaveBeenCalledOnce();expect(contexts[0].tones).toHaveLength(1);
 await audio.enable();expect(fetch).toHaveBeenCalledTimes(1);audio.dispose();expect(contexts[0].close).toHaveBeenCalledOnce();
});
it('cannot start after mute during a pending download',async()=>{
 let resolve:any;vi.mocked(fetch).mockImplementation(()=>new Promise(r=>{resolve=r;}));
 const audio=new EpisodeAudio('/loop.mp3');const pending=audio.enable();await vi.waitFor(()=>expect(fetch).toHaveBeenCalled());audio.mute();
 resolve({ok:true,clone:()=>({}),arrayBuffer:async()=>new ArrayBuffer(8)});expect(await pending).toBe(false);expect(contexts[0].sources).toHaveLength(0);audio.dispose();
});
it('uses the downloaded cache offline and does not make a request',async()=>{
 const match=vi.fn(async()=>({arrayBuffer:async()=>new ArrayBuffer(8)}));vi.stubGlobal('caches',{open:vi.fn(async()=>({match}))});
 const audio=new EpisodeAudio('/loop.mp3');await audio.enable();expect(fetch).not.toHaveBeenCalled();audio.dispose();
});
it('does not play after hidden-tab activation and fails safely on a missing file',async()=>{
 Object.defineProperty(document,'hidden',{configurable:true,value:true});const audio=new EpisodeAudio('/loop.mp3');expect(await audio.enable()).toBe(false);expect(contexts[0].sources).toHaveLength(0);audio.dispose();
 vi.mocked(fetch).mockResolvedValue({ok:false} as Response);const broken=new EpisodeAudio('/missing.mp3');await expect(broken.enable()).rejects.toThrow('could not be loaded');broken.dispose();
});
