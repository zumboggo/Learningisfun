import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {validatePackage,initialStoryState,settleStory,advanceStory,replayStory,quizScore} from '../../../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../../../functions/learning-content/src/animated-episodes.js';
const pack=JSON.parse(await readFile(new URL('../../../public/stories/animated/dinner-with-the-tyrant/episode.json',import.meta.url),'utf8'));
const {story,errors}=validatePackage(pack);assert.deepEqual(errors,[]);assert.equal(Object.keys(story.variables).length,3);assert.ok(packageBytes(pack)<1_000_000);
let completed=0,minWords=Infinity,maxWords=0;const seenOptions=new Set(),mealStates=new Set();
function visit(start,decisions=0){
 let state=start;
 while(!state.ended){
  const node=story.nodes[state.cursor];
  if(node.type==='say'&&node.actor!=='I')assert.ok(state.stage.actors[node.actor],`Speaker ${node.actor} is absent at ${state.cursor}`);
  if(state.stage.actors.Aristippus?.activity)mealStates.add(JSON.stringify(state.stage.actors.Aristippus.activity));
  if(node.type==='choice'){for(const option of node.options){seenOptions.add(node.id+':'+option.id);visit(advanceStory(story,state,option.id),decisions+1);}return;}
  state=advanceStory(story,state,null);
 }
 assert.equal(decisions,7);assert.equal(state.stage.background,'classroom');assert.ok(state.history.some(h=>h.text.includes('Niko tucks away the receipt.')));
 const text=state.history.map(h=>h.text).join(' ');assert.ok(text.includes('The fee remains in place tonight.'));assert.ok(text.includes('tomorrow'));
 const words=text.split(/\s+/).length;minWords=Math.min(minWords,words);maxWords=Math.max(maxWords,words);completed++;
}
visit(settleStory(story,initialStoryState(story,27)));
assert.equal(completed,3**7);assert.equal(seenOptions.size,21);assert.ok(mealStates.size>=2);
const routes=[['hunger','leave','join','specific','clarify','introduction','adaptable'],['cloak','need','outside','silence','refuse','registry','simple'],['taste','courier','terms','praise','accept','public','conditional']];
for(const choices of routes){let state=settleStory(story,initialStoryState(story,17)),index=0;const steps=[];
 while(!state.ended){const node=story.nodes[state.cursor],step=node.type==='choice'?choices[index++]:null;state=advanceStory(story,state,step);steps.push(step);if(steps.length%23===0){const saved=JSON.parse(JSON.stringify({steps,seed:17}));assert.deepEqual(replayStory(story,saved.steps,saved.seed),state);}}
 assert.equal(index,7);assert.deepEqual(replayStory(story,steps,17),state);
}
assert.equal(quizScore(pack.quiz,pack.quiz.map(q=>q.answer)),100);
assert.equal(quizScore(pack.quiz,pack.quiz.map((q,i)=>i===0?(q.answer+1)%4:q.answer)),75);
assert.equal(quizScore(pack.quiz,pack.quiz.map(q=>(q.answer+1)%4)),0);
const result={routes:completed,choiceOptions:seenOptions.size,decisionsPerRoute:7,minRouteWords:minWords,maxRouteWords:maxWords,bytes:packageBytes(pack),contrastingResumeRoutes:3,quiz:'100/75/0 scoring verified',sourceBoundary:'Anecdote/paraphrase and invented banquet distinguished; no canonical result changed',visualReview:'See QA record in qa.txt for manual checks and limits'};
await writeFile(new URL('verification.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
