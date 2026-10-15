import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {fitCamera,unionBoxes} from '../components/animated/camera-framing';
import {compileStory,replayStory,advanceStory} from '../../functions/learning-content/src/story-engine.js';
import {SceneSound} from '../components/animated/scene-sound';
import {playSceneMotion} from '../components/animated/scene-motion';
const pack=JSON.parse(readFileSync('public/stories/own-english/animated/episode.json','utf8'));
it('fits faces at phone/desktop aspect ratios without exposing background edges',()=>{
 for(const [w,h] of [[393,310],[1000,620],[800,300]])for(const fraction of [.24,.5,.76]){
  const box={x:w*fraction-25,y:30,width:50,height:100},f=fitCamera(w,h,box);
  expect(f.scale).toBeGreaterThan(1);expect(f.x).toBeLessThanOrEqual(0);expect(f.y).toBeLessThanOrEqual(0);
  expect(w*f.scale+f.x).toBeGreaterThanOrEqual(w);expect(h*f.scale+f.y).toBeGreaterThanOrEqual(h);
  expect(box.x*f.scale+f.x).toBeGreaterThanOrEqual(0);expect((box.x+box.width)*f.scale+f.x).toBeLessThanOrEqual(w);
  expect(box.y*f.scale+f.y).toBeGreaterThanOrEqual(0);expect((box.y+box.height)*f.scale+f.y).toBeLessThanOrEqual(h);
 }
 const both=unionBoxes([{x:40,y:20,width:100,height:260},{x:240,y:20,width:100,height:260}]);
 expect(both).toEqual({x:40,y:20,width:300,height:260});expect(fitCamera(393,310,both,1.6).scale).toBeLessThan(1.2);
});
it('camera timing, ambience and environment replay persistently, sounds remain transient',()=>{
 const script='story 2\nshow Lin neutral left\nshow Hepting neutral right\ncamera two Lin Hepting over 0.8\nambience hall\nenvironment dust\nsound chime\nI: First\nI: Second\nscene classroom\nI: Third\nend';
 const assets={...pack.assets,backgrounds:{...pack.assets.backgrounds,classroom:{}}};const {story,errors}=compileStory(script,assets);expect(errors).toEqual([]);
 const first=replayStory(story,[],1);expect(first.stage.camera).toMatchObject({otherActor:'Hepting',duration:.8});expect(first.cues?.filter(n=>n.type==='sound')).toHaveLength(1);
 const next=advanceStory(story,first,null);expect(next.stage.ambience).toBe('hall');expect(next.stage.environment).toBe('dust');expect(next.cues).toEqual([]);
 expect(advanceStory(story,next,null).stage.ambience).toBeUndefined();expect(replayStory(story,[null],1)).toEqual(next);
 for(const line of ['camera two Lin','camera listener','camera close Lin over 9','camera two Lin Lin','sound explosion','ambience downloaded-url','environment snow'])expect(compileStory('story 2\n'+line+'\nI: Hi\nend',assets).errors.length).toBeGreaterThan(0);
});
it('audio stays off until activated, ducks and cancels on visibility/navigation/disposal',async()=>{
 const param=()=>({value:0,setValueAtTime:vi.fn(),setTargetAtTime:vi.fn(),cancelScheduledValues:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()});
 const gains:any[]=[],sources:any[]=[];
 const node=()=>({connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),gain:param(),frequency:param(),Q:param(),delayTime:param(),onended:null});
 const context={state:'running',sampleRate:100,currentTime:0,resume:vi.fn(async()=>{}),close:vi.fn(async()=>{}),destination:{},createGain:()=>{const n=node();gains.push(n);return n;},createBuffer:()=>({getChannelData:()=>new Float32Array(400)}),createBufferSource:()=>{const n=node();sources.push(n);return n;},createBiquadFilter:node,createDelay:node,createOscillator:()=>{const n=node();sources.push(n);return n;}};
 const factory=vi.fn(()=>context as unknown as AudioContext),sound=new SceneSound(factory),settings={ambience:true,effects:true,ambienceVolume:.3,effectsVolume:.45};
 sound.play('chime');expect(factory).not.toHaveBeenCalled();sound.configure(settings,'hall',false);await sound.activate();expect(sources).toHaveLength(1);
 sound.configure(settings,'hall',true);expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.3*.12*.22,0,.06);
 sound.play('straw');expect(sources).toHaveLength(2);sound.stopEffects();expect(sources[1].stop).toHaveBeenCalled();
 sound.configure(settings,'hall',false,true);expect(sources[0].stop).toHaveBeenCalled();const count=sources.length;sound.play('chime');expect(sources).toHaveLength(count);
 sound.dispose();expect(context.close).toHaveBeenCalled();
});
it('reduced motion retains explicit sound cues, but cancelled sequences emit nothing',async()=>{
 const root=document.createElement('div'),heard:string[]=[];root.addEventListener('story-sound',e=>heard.push((e as CustomEvent).detail));
 await playSceneMotion(root,[{type:'sound',preset:'chime'}],{},true,()=>{},new AbortController().signal);expect(heard).toEqual(['chime']);
 const controller=new AbortController();controller.abort();await playSceneMotion(root,[{type:'sound',preset:'thud'}],{},false,()=>{},controller.signal);expect(heard).toEqual(['chime']);
});
