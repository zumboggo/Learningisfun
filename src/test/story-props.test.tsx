import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {compileStory,initialStoryState,settleStory,advanceStory,replayStory} from '../../functions/learning-content/src/story-engine.js';
import {POSES} from '../../functions/learning-content/src/acting-library.js';
import {armGeometry} from '../components/animated/character-geometry';
const pack=JSON.parse(readFileSync('public/stories/animated/action-rehearsal/episode.json','utf8'));
it('persists equipped objects through dialogue and replay, and clears them deliberately',()=>{
 const {story,errors}=compileStory('story 2\nshow Quixote neutral left\nshow Carrier neutral right\nprop Quixote phone\nQuixote [neutral, phone-talk]: Hello.\nI: Listening.\nprop Quixote none\nact Quixote shoot-arrow Carrier "Release."\nI: After.\nshow Quixote neutral left\nI: New entrance.\nend',pack.assets);
 expect(errors).toEqual([]);let s=settleStory(story,initialStoryState(story));expect(s.stage.actors.Quixote.prop).toBe('phone');
 s=advanceStory(story,s,null);expect(s.stage.actors.Quixote.prop).toBe('phone');
 s=advanceStory(story,s,null);expect(s.stage.actors.Quixote.prop).toBe('bow');expect(replayStory(story,[null,null],1)).toEqual(s);
 s=advanceStory(story,s,null);expect(s.stage.actors.Quixote.prop).toBe('bow');
 s=advanceStory(story,s,null);expect(s.stage.actors.Quixote.prop).toBeUndefined();
});
it('rejects unknown props, unsupported rigs and equipping an absent actor',()=>{
 for(const script of ['story 2\nprop Quixote phone\nend','story 2\nshow Quixote neutral left\nprop Quixote tank\nend'])expect(compileStory(script,pack.assets).errors.length).toBeGreaterThan(0);
 const assets=structuredClone(pack.assets);delete assets.characters.Quixote.rig;
 expect(compileStory('story 2\nshow Quixote neutral center\nprop Quixote phone\nend',assets).errors.length).toBeGreaterThan(0);
});
it('positions the phone hand at the cheek, not at the chest',()=>{
 const p=POSES['phone-hold'],hand=armGeometry('right',p.rightUpperArm,p.rightForearm);
 expect(hand.wx).toBeGreaterThan(145);expect(hand.wx).toBeLessThan(165);expect(hand.wy).toBeGreaterThan(145);expect(hand.wy).toBeLessThan(175);
});
