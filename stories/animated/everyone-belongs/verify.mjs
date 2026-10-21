import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {validatePackage,initialStoryState,settleStory,advanceStory,replayStory,quizScore} from '../../../functions/learning-content/src/story-engine.js';
const pack=JSON.parse(await readFile(new URL('../../../public/stories/animated/everyone-belongs/episode.json',import.meta.url)));
const {story,errors}=validatePackage(pack);assert.deepEqual(errors,[]);
let routes=0;const endings=new Set(),seen=new Set(),ranges={};
function visit(state,steps,choices){
 while(!state.ended){const n=story.nodes[state.cursor];seen.add(state.cursor);if(n.type==='choice'){for(const o of n.options)visit(advanceStory(story,state,o.id),[...steps,o.id],[...choices,n.id]);return;}
 for(const [actor,a]of Object.entries(state.stage.actors)){assert.ok(pack.assets.characters[actor]);assert.ok(['left','center','right'].includes(a.position));}
 steps=[...steps,null];state=advanceStory(story,state,null);
 }
 assert.equal(choices.length,7);assert.deepEqual(choices,['plan','presenter','director','joke','take','last_shot','submit']);
 assert.deepEqual(replayStory(story,steps,7),state);
 for(const key of ['Friendship','Inclusion','Film']){const v=state.variables[key];ranges[key]??=[v,v];ranges[key]=[Math.min(ranges[key][0],v),Math.max(ranges[key][1],v)];}
 for(const label of ['combined_ready','combined_rushed','combined_confused','polished_full','polished_short','behind_yes','behind_no','friends_warm','friends_cool','jordan_warm','jordan_cool','promise_paid'])if(state.history.some(h=>story.nodes.slice(story.labels[label]).find(n=>['say','choice','act'].includes(n.type))?.text===h.text))endings.add(label);
 routes++;
}
visit(settleStory(story,initialStoryState(story,7)),[],[]);
assert.equal(routes,2187);assert.equal(quizScore(pack.quiz,pack.quiz.map(q=>q.answer)),100);
for(const label of ['combined_ready','combined_rushed','combined_confused','polished_full','polished_short','behind_yes','behind_no','friends_warm','friends_cool','jordan_warm','jordan_cool','promise_paid'])assert.ok(endings.has(label),'Unreached outcome: '+label);
const report={routes,decisionsPerRoute:7,allReplayResumeChecksPassed:true,ranges,outcomes:[...endings],bytes:Buffer.byteLength(JSON.stringify(pack))};
await writeFile(new URL('verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
