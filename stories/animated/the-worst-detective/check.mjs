import assert from 'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import{validatePackage,replayStory,advanceStory,quizScore}from'../../../functions/learning-content/src/story-engine.js';
const pack=JSON.parse(await readFile(new URL('../../../public/stories/animated/the-worst-detective/episode.json',import.meta.url),'utf8'));
const {story,errors}=validatePackage(pack,{requireEnglishCornerWriting:true});assert.deepEqual(errors,[]);let routes=0,min=Infinity,max=0;const coverage=new Set(),samples=[];
function walk(steps=[],seen=[],choices=[]){let state=replayStory(story,steps,1);while(!state.ended){const n=story.nodes[state.cursor];if(n.type==='say'){if(n.actor!=='I')assert.ok(state.stage.actors[n.actor],`Unstaged speaker ${n.actor}`);seen=[...seen,n.text]}
 if(n.type==='choice'){
  if(n.id==='solve_case'){const text=seen.join(' ');for(const clue of ['There are no muddy marks inside','fresh triangular bite gaps','two fresh sunflower-seed shells'])assert.ok(text.includes(clue),`Missing fair clue ${clue}`);assert.ok(!text.includes('Two bright eyes look back'),'Solution leaked');}
  for(const o of n.options){coverage.add(n.id+':'+o.id);walk([...steps,o.id],seen,[...choices,o.id]);}return;
 }
 steps=[...steps,null];state=advanceStory(story,state,null);
 }
 assert.equal(choices.length,6);assert.deepEqual(replayStory(story,steps,1),state);const text=seen.join(' ');assert.ok(text.includes('Mei closes it and checks the catch twice'));assert.ok(text.includes('ACADEMIC SUPERVISOR'));const words=text.split(/\s+/).length;min=Math.min(min,words);max=Math.max(max,words);routes++;if(samples.length<1||choices.join(',')==='honest,ask,theory,explain,garden,choice')samples.push({choices,steps});
}
walk();assert.equal(routes,729);assert.equal(coverage.size,18);assert.equal(quizScore(pack.quiz,pack.quiz.map(q=>q.answer)),100);assert.equal(quizScore(pack.quiz,[0,0,0,0]),25);
console.log(JSON.stringify({routes,optionsCovered:coverage.size,routeWords:[min,max],quiz:'4 × 25',fairCluesBeforeEveryDeduction:true,stagedSpeakers:true,replay:true}));
if(process.env.HAMSTER_QA_SAMPLES)await writeFile(process.env.HAMSTER_QA_SAMPLES,JSON.stringify(samples));
