import {describe,it,expect} from 'vitest';
import {compileStory,initialStoryState,settleStory,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
const assets={backgrounds:{room:{}},characters:{Mei:{expressions:{neutral:{}}}}};
const source=`story 1
variable trust = 0 range 0 2 visible
variable found = false hidden
scene room
show Mei neutral center
Mei: Help me find the evidence.
choice search
option look "Look" -> found ; found = true, trust += 5
option wait "Wait" -> found
label found
if found == true -> lucky else unlucky
label lucky
chance weather 50 -> sunny else unlucky
label sunny
I: The evidence survived.
goto done
label unlucky
I: The evidence is wet.
goto done
label done
end`;
describe('shared animated story engine',()=>{
 it('compiles and replays legal choices with bounded state and stable chance',()=>{const r=compileStory(source,assets);expect(r.errors).toEqual([]);let s=settleStory(r.story,initialStoryState(r.story,77));expect(s.stage.actors.Mei.position).toBe('center');s=advanceStory(r.story,s,null);s=advanceStory(r.story,s,'look');expect(s.variables).toEqual({trust:2,found:true});expect(replayStory(r.story,[null,'look'],77)).toEqual(s);s=advanceStory(r.story,s,null);expect(s.ended).toBe(true);expect(()=>advanceStory(r.story,s,null)).toThrow();});
 it('rejects invalid options, destinations, variables, loops and unreachable content',()=>{const r=compileStory(source,assets);expect(()=>replayStory(r.story,[null,'invented'],77)).toThrow();expect(compileStory(source.replace('-> found','-> missing'),assets).errors[0].message).toContain('Missing label');expect(compileStory(source.replace('trust += 5','unknown += 1'),assets).errors[0].message).toContain('Unknown variable');expect(compileStory('story 1\nlabel loop\ngoto loop',assets).errors[0].message).toContain('Loops');expect(compileStory('story 1\nend\nI: Unreachable',assets).errors[0].message).toContain('Unreachable');});
 it('keeps quiz credit separate from story outcomes',()=>{const quiz=[0,1,2,3].map(answer=>({answer,prompt:'Q',options:['a','b','c','d'],explanation:'E'}));expect(quizScore(quiz,[0,1,2,0])).toBe(75);expect(quizScore(quiz,[0,1,0,0])).toBe(50);expect(()=>quizScore(quiz,[0])).toThrow();});
});

import {readFileSync} from 'node:fs';
import {validatePackage} from '../../functions/learning-content/src/story-engine.js';
it('every demonstration route ends and each saved prefix resumes identically',()=>{const pack=JSON.parse(readFileSync('public/stories/animated/demo.json','utf8'));const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let endings=0;const walk=(s:any,steps:(string|null)[],seed:number)=>{expect(replayStory(story,steps,seed)).toEqual(s);if(s.ended){endings++;return;}const n=story.nodes[s.cursor];for(const option of n.type==='choice'?n.options.map((o:any)=>o.id):[null])walk(advanceStory(story,s,option),[...steps,option],seed);};for(const seed of [1,777])walk(settleStory(story,initialStoryState(story,seed)),[],seed);expect(endings).toBeGreaterThan(20);});
