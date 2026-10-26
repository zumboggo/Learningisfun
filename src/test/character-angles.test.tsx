import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {createCharacter} from '../../functions/learning-content/src/character-builder.js';
import {compileStory,replayStory,advanceStory} from '../../functions/learning-content/src/story-engine.js';
import {validateRig,packageAssetEntries,packageContentBytes} from '../../functions/learning-content/src/acting-library.js';
import {packageBytes} from '../../functions/learning-content/src/animated-episodes.js';
import {characterAngle} from '../components/animated/character-angles';
import {ACTING_PROFILES,performanceEnvelope,performanceDuration,performancePose} from '../components/animated/acting-motion';
import CartoonActor from '../components/animated/CartoonActor';
const kevin=JSON.parse(readFileSync('public/stories/animated/rigs/kevin-cartoon.json','utf8'));
const hepting=JSON.parse(readFileSync('public/stories/animated/rigs/hepting-cartoon.json','utf8'));
const assets={characters:{Kevin:kevin,Hepting:hepting},backgrounds:{}};
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks()});
it('validates orientation, staging and saved route replay',()=>{
 const {story,errors}=compileStory('story 2\nshow Kevin neutral left\nshow Hepting neutral right\norient Kevin profile\nlook Kevin Hepting\nKevin: Hello.\nmove Kevin turn\nKevin: Again.\norient Kevin auto\nKevin: Done.\nend',assets);expect(errors).toEqual([]);let state=replayStory(story,[],1);expect(state.stage.actors.Kevin).toMatchObject({orientation:'profile',gaze:'Hepting',facing:1});state=advanceStory(story,state,null);expect(state.stage.actors.Kevin.facing).toBe(-1);expect(replayStory(story,[null],1).stage).toEqual(state.stage);state=advanceStory(story,state,null);expect(state.stage.actors.Kevin.orientation).toBe('auto');
 for(const line of ['orient Kevin rear','orient Missing front','orient Kevin profile'])expect(compileStory('story 2\n'+line+'\nKevin: Hello.\nend',assets).errors.length).toBeGreaterThan(0);
});
it('supports new vectors and safely degrades old hybrid and legacy rigs',()=>{
 const c=createCharacter({id:'New',name:'New'});expect(characterAngle(c.rig,'profile').angle).toBe('profile');expect(characterAngle(c.rig,'auto',-1)).toMatchObject({angle:'three-quarter',direction:-1});expect(characterAngle(c.rig,'profile',1,true).angle).toBe('front');expect(characterAngle({preset:'teen-v1'},'profile').angle).toBe('front');expect(characterAngle({...hepting.rig,views:undefined},'profile').angle).toBe('front');
});
it('counts embedded angle images and validates bounded anchors',()=>{
 expect(validateRig(hepting.rig)).toBeNull();const p={...JSON.parse(readFileSync('public/stories/animated/kevin-starter.json','utf8')),assets:{characters:{Hepting:hepting},backgrounds:{}}};expect(packageAssetEntries(p)).toContain(hepting.rig.views.profile);expect(packageContentBytes(p)).toBe(packageBytes(p));
 for(const anchors of [null,{nearEye:[Infinity,10],mouth:[120,150]},{nearEye:[120,120],mouth:[120,150],unknown:[1,2]}]){const rig=structuredClone(hepting.rig);rig.views.profile.anchors=anchors;expect(validateRig(rig)).not.toBeNull()}
 const rig=structuredClone(hepting.rig);rig.views.profile.src='https://example.com/head.webp';expect(validateRig(rig)).not.toBeNull();
});
it('renders a one-eye profile with glasses/beard, mirror and contact fallback',()=>{
 const {container,rerender}=render(<CartoonActor character={hepting} orientation="profile" reduced/>);expect(container.querySelectorAll('[data-angle-eye]')).toHaveLength(1);expect(container.querySelector('[data-angle-glasses]')).not.toBeNull();expect(container.querySelector('[data-angle-beard]')).not.toBeNull();expect(container.querySelector('[data-angle-artwork]')).not.toBeNull();
 rerender(<CartoonActor character={kevin} turn={-1} reduced/>);expect(container.querySelector('[data-angle-face]')).toHaveAttribute('transform','translate(240 0) scale(-1 1)');expect(container.querySelectorAll('[data-angle-eye]')).toHaveLength(2);
 rerender(<CartoonActor character={kevin} orientation="profile" prop="sword" reduced/>);expect(container.querySelector('.cartoon-actor')).toHaveAttribute('data-angle','front');expect(container.querySelector('[data-prop="sword"]')).not.toBeNull();
});
it('all twelve performances start continuously and settle deterministically',()=>{
 expect(Object.keys(ACTING_PROFILES)).toHaveLength(12);const rest={head:3,torso:1,rightForearm:-8},from={head:10,torso:-2,rightForearm:-30},target={head:14,torso:8,rightForearm:-65};
 for(const cue of Object.keys(ACTING_PROFILES)){
  expect(performanceEnvelope(cue,0)).toBe(0);expect(performanceEnvelope(cue,10000)).toBe(0);
  expect(performancePose(cue,0,from,rest,target,42)).toMatchObject(from);
  expect(performancePose(cue,performanceDuration(cue)*1.1,from,rest,target,42)).toMatchObject(rest);
  expect(performancePose(cue,800,from,rest,target,42)).toEqual(performancePose(cue,800,from,rest,target,42));
 }
 expect(new Set(Object.keys(ACTING_PROFILES).map(c=>performanceEnvelope(c,450))).size).toBeGreaterThan(8);
});

it('pauses a performance without losing its pose and blends on interruption',()=>{
 vi.useFakeTimers();const {container,rerender}=render(<CartoonActor character={kevin} response="explain" performanceKey={1}/>);
 act(()=>vi.advanceTimersByTime(450));const arm=()=>container.querySelector('[data-arm="right"]')!.innerHTML;const before=arm();
 rerender(<CartoonActor character={kevin} response="explain" performanceKey={1} idlePaused/>);
 act(()=>vi.advanceTimersByTime(1000));expect(arm()).toBe(before);
 rerender(<CartoonActor character={kevin} response="explain" performanceKey={1}/>);
 act(()=>vi.advanceTimersByTime(160));expect(arm()).not.toBe(before);const midway=arm();
 rerender(<CartoonActor character={kevin} response="reassure" performanceKey={2}/>);
 act(()=>vi.advanceTimersByTime(16));expect(arm()).toBe(midway);
 act(()=>vi.advanceTimersByTime(4000));expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
});
it('round-trips angle artwork and anchors through the normal ZIP exporter',async()=>{
 const {exportStory,importStory}=await import('../services/animated-stories');
 const pack=JSON.parse(readFileSync('public/stories/animated/kevin-starter.json','utf8'));pack.assets.characters.Hepting=hepting;
 const blob=await exportStory(pack);const imported=await importStory(blob as File);expect(imported).toEqual(pack);expect(packageContentBytes(imported)).toBeLessThan(5000000);
});
