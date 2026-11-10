import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import JSZip from 'jszip';
import {validatePackage,replayStory,advanceStory,quizScore} from '../../../functions/learning-content/src/story-engine.js';
const p=JSON.parse(await readFile(new URL('../../../public/stories/animated/the-institution-protects-its-own/episode.json',import.meta.url),'utf8'));
const {story,errors}=validatePackage(p);assert.deepEqual(errors,[]);assert.equal(p.context.length,2);assert.equal(p.profile,'ethics');assert(!p.simulationScore);
const q=JSON.parse(await readFile(new URL('../../../functions/learning-content/src/ethics-notebook-questions.json',import.meta.url),'utf8'));
assert.equal(new Set(q.options['the-institution-protects-its-own']).size,3);
let routes=0,min=Infinity,max=0,replays=0;const edges=new Set(),outcomes=new Set(),samples=[];
function walk(steps=[],choices=[]){let state=replayStory(story,steps,42);while(!state.ended){const n=story.nodes[state.cursor];if(n.type==='say'&&n.actor!=='I')assert(state.stage.actors[n.actor],'Unstaged speaker '+n.actor);if(n.type==='choice'){assert.deepEqual(replayStory(story,steps,42),state);replays++;for(const o of n.options){edges.add(n.id+':'+o.id);walk([...steps,o.id],[...choices,o.id]);}return;}steps=[...steps,null];state=advanceStory(story,state,null);}
assert.deepEqual(replayStory(story,steps,42),state);replays++;assert.equal(choices.length,6);const text=state.history.map(h=>h.text||'').join(' ');
assert(text.includes('Rafi receives the twentieth award'));assert(text.includes('has not made its renewal decision'));assert(text.includes('taken me off award decisions'));assert(text.includes('safely home'));assert(!/fictional|simulation|imagined|invented/i.test(text));
assert.equal(text.includes('your own people checked your own people'),state.variables.route===0);
assert.equal(text.includes('wider review is still underway'),state.variables.route===1);
assert.equal(text.includes('Someone has already called Aya a cheat'),state.variables.route===2);
assert.equal(text.includes('I tried to turn that room'),state.variables.first===0);
assert.equal(text.includes('wanted your check mark'),state.variables.first===1);
assert.equal(text.includes('write down the emergency-fund deadline'),state.variables.aid===0);
assert.equal(text.includes('write down the questions Aya'),state.variables.aid===1);
outcomes.add(state.variables.route+':'+state.variables.aid);const words=text.split(/\s+/).length;min=Math.min(min,words);max=Math.max(max,words);routes++;if(routes===1||routes===48||routes===96)samples.push({choices,steps});}
walk();assert.equal(routes,96);assert.equal(edges.size,13);assert.equal(outcomes.size,6);
assert.equal(quizScore(p.quiz,p.quiz.map(q=>q.answer)),100);const answers=p.quiz.map(q=>q.answer);answers[0]=0;assert.equal(quizScore(p.quiz,answers),75);
const zip=await JSZip.loadAsync(await readFile(new URL('../../../public/stories/animated/the-institution-protects-its-own/episode.zip',import.meta.url)));assert.equal(await zip.file('episode.story').async('string'),p.script);
const report={routes,choiceEdges:edges.size,replayChecks:replays,words:[min,max],stagedSpeakers:true,allCommitmentsHaveCallbacks:true,quiz:'100/75',zipScriptMatches:true};
await writeFile(new URL('route-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');await writeFile('/tmp/institution-qa-samples.json',JSON.stringify(samples));console.log(JSON.stringify(report));
