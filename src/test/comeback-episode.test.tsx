import {afterEach,expect,it} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {validatePackage,settleStory,initialStoryState,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {packageContentBytes,PROPS} from '../../functions/learning-content/src/acting-library.js';
import {importStory} from '../services/animated-stories';
import {selectedStoryLines} from '../components/animated/StoryKeepsake';
import StoryStage from '../components/animated/StoryStage';
import PuppetActor from '../components/animated/PuppetActor';
const pack=JSON.parse(readFileSync('public/stories/animated/comeback-or-else/episode.json','utf8'));
const rounds=JSON.parse(readFileSync('stories/animated/comeback-or-else/rounds.json','utf8'));
const {story,errors}=validatePackage(pack);
afterEach(cleanup);
function route(overrides:Record<string,string>={},inspect=false){
 let state=settleStory(story,initialStoryState(story,19));const steps:(string|null)[]=[],seen=new Set<string>();let memories=0,previousMemory=false,choices=0;
 while(!state.ended){if(steps.length>450)throw Error('Route did not terminate');const node=story.nodes[state.cursor];
  if(inspect){const positions=Object.values(state.stage.actors).map((a:any)=>a.position);expect(new Set(positions).size).toBe(positions.length);}
  if(state.stage.background==='memory'&&!previousMemory)memories++;previousMemory=state.stage.background==='memory';
  let choice:string|null=null;
  if(node.type==='choice'){choices++;choice=overrides[node.id]??(node.id.startsWith('lyric_')?'line1':node.id==='press_response'?'concession':node.id.startsWith('recover_')?'grounded':'right');if(!node.options.some((o:any)=>o.id===choice))throw Error('Missing option '+node.id+':'+choice);seen.add(node.id+':'+choice);}
  steps.push(choice);state=advanceStory(story,state,choice);
 }
 return {state,steps,seen,memories,choices};
}
it('every authored choice edge is reachable; taste, feedback and bounded correction reconverge safely',()=>{
 expect(errors).toEqual([]);const covered=new Set<string>();let runs=0;
 const check=(overrides:Record<string,string>)=>{const r=route(overrides,true);r.seen.forEach(x=>covered.add(x));expect(r.memories).toBe(7);expect(r.choices).toBeGreaterThanOrEqual(22);expect(r.choices).toBeLessThanOrEqual(29);expect(r.state.history.at(-1)?.text).toContain('entirely literal');runs++;return r;};
 check({});
 for(const r of rounds)for(let li=0;li<3;li++){
  const p=r.id+'_'+li,base={['lyric_'+r.id]:'line'+(li+1)};
  for(const id of ['right','other0','other1'])check({...base,['identify_'+p]:id});
  for(const id of ['right','overclaim','vague'])for(const recovery of ['grounded','insist'])check({...base,['explain_'+p]:id,['recover_'+p]:recovery});
 }
 for(const id of ['concession','attack','certainty'])check({press_response:id});
 const edges=story.nodes.filter((n:any)=>n.type==='choice').flatMap((n:any)=>n.options.map((o:any)=>n.id+':'+o.id));expect([...covered].sort()).toEqual(edges.sort());
 console.log('COMEBACK routes:',runs,'all choice edges:',edges.length);
},60000);
it('saved preferences reconstruct all seven exact chosen lines after resume, independently of analysis results',()=>{
 const overrides:Record<string,string>={};rounds.forEach((r:any,i:number)=>{const li=i%3;overrides['lyric_'+r.id]='line'+(li+1);overrides['identify_'+r.id+'_'+li]='other0';overrides['explain_'+r.id+'_'+li]='vague';});
 const run=route(overrides);expect(replayStory(story,run.steps,19)).toEqual(run.state);
 const lines=selectedStoryLines(pack,story,{steps:run.steps,seed:19,quizzes:[]});expect(lines.map(l=>l.text)).toEqual(rounds.map((r:any,i:number)=>r.lyrics[i%3].text));expect(run.state.variables.Recognised).toBe(0);expect(run.state.variables.Explained).toBe(0);expect(run.state.variables.Recovered).toBe(7);
 let mid=settleStory(story,initialStoryState(story,19));let count=0;while(mid.stage.background!=='memory'){mid=advanceStory(story,mid,run.steps[count++]);}expect(replayStory(story,run.steps.slice(0,count),19)).toEqual(mid);
 const fresh=route();expect(fresh.state.variables.Explained).toBe(7);expect(fresh.state.history.some(h=>h.text.includes('Your explanations gave us'))).toBe(true);expect(run.state.history.some(h=>h.text.includes('We needed a few clues'))).toBe(true);
});
it('props and memory haze remain visible with reduced motion and clear on scene changes',()=>{
 for(const prop of ['rubber-duck','pool-noodle']){expect(PROPS).toContain(prop);const {container,unmount}=render(<PuppetActor character={pack.assets.characters.Vex} actorId="Vex" prop={prop} reduced response="reach"/>);expect(container.querySelector(`[data-comic-prop="${prop}"]`)).not.toBeNull();expect(container.innerHTML).not.toMatch(/NaN|Infinity/);unmount();}
 const run=route();let state=settleStory(story,initialStoryState(story,19)),i=0;while(state.stage.background!=='memory')state=advanceStory(story,state,run.steps[i++]);
 const {container,rerender}=render(<StoryStage pack={pack} state={state} current={story.nodes[state.cursor]} speaking reduced/>);expect(container.querySelector('.story-memory-haze')).not.toBeNull();
 while(state.stage.background==='memory')state=advanceStory(story,state,run.steps[i++]);rerender(<StoryStage pack={pack} state={state} current={story.nodes[state.cursor]} speaking={false} reduced/>);expect(container.querySelector('.story-memory-haze')).toBeNull();
});
it('package round trip preserves the lyric sheet, flashback metadata and four-question fare',async()=>{
 expect(packageContentBytes(pack)).toBeLessThan(5000000);expect(await importStory(readFileSync('public/stories/animated/comeback-or-else/episode.zip') as unknown as File)).toEqual(pack);
 const answers=pack.quiz.map((q:any)=>q.answer);expect(quizScore(pack.quiz,answers)).toBe(100);answers[0]=(answers[0]+1)%4;expect(quizScore(pack.quiz,answers)).toBe(75);
});
