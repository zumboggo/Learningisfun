import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import {validatePackage,initialStoryState,settleStory,advanceStory,replayStory,quizScore} from '../../functions/learning-content/src/story-engine.js';
import {importStory,packageSize} from '../services/animated-stories';
import catalog from '../../stories/public-quixote/catalog.json';
import PublicQuixotePage from '../pages/PublicQuixotePage';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
for(const entry of catalog.filter(e=>e.available)){
 const folder=`public/stories/public-quixote/${entry.id}/`,pack=JSON.parse(readFileSync(folder+'episode.json','utf8'));
 it(`${entry.id}: anonymous, portable and all narrative routes finish`,async()=>{
  expect(JSON.stringify(pack)).not.toMatch(/hepting|\bdavid\b|\bcdis\b|lifeplus|instructure|CORE_VOCAB|\/Users\//i);
  expect(pack.assets.characters.Hepting).toBeUndefined();expect(pack.assets.backgrounds.classroom).toBeUndefined();
  if(pack.assets.characters.Teacher){expect(pack.assets.characters.Teacher.name).toBe('My English teacher');expect(pack.assets.characters.Teacher.rig.finish).toBe('polished');}
  expect(pack.script).toContain('airport');expect(pack.script).toContain('marmalade');expect(pack.script).toBe(readFileSync(`stories/public-quixote/${entry.id}.story`,'utf8'));
  const original=JSON.parse(readFileSync(`public/stories/animated/${entry.id}/episode.json`,'utf8'));
  expect(pack.quiz).toEqual(original.quiz);expect(packageSize(pack)).toBeLessThan(5000000);
  expect(await importStory(readFileSync(folder+'episode.zip') as unknown as File)).toEqual(pack);
  const {story,errors}=validatePackage(pack);expect(errors).toEqual([]);let routes=0;
  function walk(state:any,steps:(string|null)[]){
   expect(steps.length).toBeLessThan(240);
   if(state.ended){routes++;expect(replayStory(story!,steps,state.seed)).toEqual(state);return;}
   const node=story!.nodes[state.cursor];
   if(node.type==='choice')for(const option of node.options!)walk(advanceStory(story!,state,option.id),[...steps,option.id]);
   else walk(advanceStory(story!,state,null),[...steps,null]);
  }
  walk(settleStory(story!,initialStoryState(story!,7)),[]);expect(routes).toBeGreaterThan(30);
  const right=pack.quiz.map((q:any)=>q.answer);expect(quizScore(pack.quiz,right)).toBe(100);expect(quizScore(pack.quiz,right.map((a:number,i:number)=>i===0?(a+1)%4:a))).toBe(75);
 },30000);
}
it('public collection offers exactly four playable episodes and an honest finale placeholder',()=>{
 render(<MemoryRouter initialEntries={['/quixote']}><Routes><Route path="/quixote" element={<PublicQuixotePage/>}/></Routes></MemoryRouter>);
 expect(screen.getAllByRole('link',{name:'Play adventure'})).toHaveLength(4);
 expect(screen.getByText('Coming later · Not yet playable')).toBeInTheDocument();
 expect(screen.queryByRole('link',{name:/Windmills/})).not.toBeInTheDocument();
});
it('a direct finale link never loads an unpublished package',()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 render(<MemoryRouter initialEntries={['/quixote/windmills']}><Routes><Route path="/quixote/:slug" element={<PublicQuixotePage/>}/></Routes></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'The windmills are on the horizon.'})).toBeInTheDocument();expect(fetcher).not.toHaveBeenCalled();
});
