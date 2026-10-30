import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import JSZip from 'jszip';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../../functions/learning-content/src/story-engine.js';
const pack=JSON.parse(await readFile(new URL('../../../public/stories/animated/everything-i-owned/episode.json',import.meta.url),'utf8'));
const {story,errors}=validatePackage(pack);assert.deepEqual(errors,[]);
let routes=0,resumes=0,minWords=Infinity,maxWords=0;const pairs=new Set(),options=new Set();
function visit(state,steps,decisions){
 while(!state.ended&&['say','act'].includes(story.nodes[state.cursor].type)){
  state=advanceStory(story,state,null);steps=[...steps,null];
 }
 assert.deepEqual(replayStory(story,steps,42),state);resumes++;
 if(state.ended){
  assert.equal(decisions,8);const text=state.history.map(h=>h.text).join(' ');
  let last=-1;for(const event of ['Twice I have dreamed','king of Salem','My parents\' names','A ticket across','At noon I bring six sheep','Black means yes','I cross the strait','Tangier, Morocco','I show him the money','He takes the money','When I turn, he is gone','With nobody left to watch me','both stones fall','a candy seller assemble','several languages are spoken','I can clean the glasses','He looks at me without answering']){const at=text.indexOf(event);assert(at>last,event);last=at;}
  assert.equal((text.match(/I write one question/g)||[]).length,1);
  assert(!/Fatima|sycamore|Mecca|commission|tea in crystal/i.test(text));
  const {before,after,basis,judgment}=state.variables;pairs.add(`${before}:${after}`);
  assert.equal(text.includes('I wanted security before I left'),before===0&&after===0);
  assert.equal(text.includes('Before leaving, I chose security'),before===0&&after!==0);
  assert.equal(text.includes('I chose freedom before'),before===1&&after===1);
  assert.equal(text.includes('Before leaving, I chose freedom'),before===1&&after!==1);
  assert.equal(text.includes('I chose connection before'),before===2&&after===2);
  assert.equal(text.includes('Before leaving, I chose connection'),before===2&&after!==2);
  assert.equal(text.includes('Asking was useful'),basis===0);
  assert.equal(text.includes('His Spanish was the bridge'),basis===1);
  assert.equal(text.includes('I wanted a practical answer'),basis===2);
  assert.equal(text.includes('Now I need to say what made each'),judgment===1);
  const count=text.split(/\s+/).length;minWords=Math.min(minWords,count);maxWords=Math.max(maxWords,count);routes++;return;
 }
 const node=story.nodes[state.cursor];assert.equal(node.type,'choice');
 for(const option of node.options){options.add(node.id+':'+option.id);visit(advanceStory(story,state,option.id),[...steps,option.id],decisions+1);}
}
visit(settleStory(story,initialStoryState(story,42)),[],0);
assert.equal(routes,2916);assert.equal(pairs.size,9);assert.equal(options.size,22);
assert.equal(quizScore(pack.quiz,pack.quiz.map(q=>q.answer)),100);
const answers=pack.quiz.map(q=>q.answer);answers[3]=(answers[3]+1)%4;assert.equal(quizScore(pack.quiz,answers),75);
const zip=await JSZip.loadAsync(await readFile(new URL('../../../public/stories/animated/everything-i-owned/episode.zip',import.meta.url)));
const json=JSON.parse(await zip.file('episode.json').async('string'));assert.equal(await zip.file('episode.story').async('string'),pack.script);
assert.equal(json.title,pack.title);assert.deepEqual(json.keepsake,pack.keepsake);
console.log(JSON.stringify({routes,resumes,valuePairs:pairs.size,distinctOptions:options.size,words:[minWords,maxWords],quiz:'100/75 verified',zip:'verified'}));
