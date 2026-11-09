import {readFile,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {validatePackage,initialStoryState,settleStory,advanceStory,replayStory} from '../../functions/learning-content/src/story-engine.js';
for(const slug of ['today-youre-the-teacher','a-message-from-tomorrow']){
 const p=JSON.parse(await readFile(new URL('../../public/stories/shared/chinese-demos/'+slug+'/episode.json',import.meta.url),'utf8'));
 const {story,errors}=validatePackage(p);assert.deepEqual(errors,[]);assert.equal(p.quiz.length,0);assert.equal(p.assessmentMode,'none');
 let routes=0;const seen=new Set(),options=new Set();
 const walk=(s,steps,choices)=>{
  assert.deepEqual(replayStory(story,steps,1).stage,s.stage,'resume preserves acting');
  if(s.ended){assert.equal(choices,5);routes++;return;}
  const n=story.nodes[s.cursor];seen.add(s.cursor);
  if(n.type==='say'&&n.actor!=='I')assert.ok(s.stage.actors[n.actor],`speaker ${n.actor} must be present`);
  if(n.type==='choice'){for(const o of n.options){options.add(o.id);walk(advanceStory(story,s,o.id),[...steps,o.id],choices+1);}}
  else walk(advanceStory(story,s,null),[...steps,null],choices);
 };
 walk(settleStory(story,initialStoryState(story,1)),[],0);assert.equal(routes,32);assert.equal(options.size,10);
 for(const n of story.nodes){if(n.type!=='say'&&n.type!=='choice')continue;for(const [text,actor] of n.type==='say'?[[n.text,n.actor]]:n.options.map(o=>[o.text,'I'])){
  const l=p.chinese.lines[text];assert.ok(l,text);assert.equal(l.interlinear.map(c=>c.chinese).join(''),text);assert.ok(l.interlinear.every(c=>c.pinyin&&c.gloss));
  const audio=p.chinese.audio[actor+'|'+text];assert.ok(audio,text);assert.ok((await stat(new URL('../../public/'+audio,import.meta.url))).size>500);
 }}
 console.log(slug,`${routes} complete routes; all 10 options, annotations, audio and resume checked`);
}
