import 'fake-indexeddb/auto';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {db} from '@/db/schema';
import {episodeDb,makeEpisodeAttempt} from '@/services/episodes.service';
import {AP_CLASS_ID,availableEpisodeVersions} from '../../functions/learning-content/src/episode-catalog.js';
import EpisodePage from '@/pages/EpisodePage';

vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'teacher',role:'teacher'}})}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn(async({action}:{action:string})=>{
 if(action==='readEpisodeText')return {revision:0,patches:{}};
 if(action==='episodeWriting')return {writing:[]};
 throw new Error('Local teacher preview');
})}));

beforeEach(async()=>{
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 await db.classes.clear();await db.class_members.clear();await episodeDb.attempts.clear();await episodeDb.writing.clear();
 await db.classes.put({$id:AP_CLASS_ID,name:'AP Language',teacherId:'teacher'} as any);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function open(version:number){
 render(<MemoryRouter initialEntries={[`/classes/${AP_CLASS_ID}/episodes/own-english?version=${version}`]}><Routes><Route path="/classes/:classId/episodes/:episodeId" element={<EpisodePage/>}/></Routes></MemoryRouter>);
}
it.each([1,2,3,4])('adds both approved clips to a fresh archived version %i without writing story choices',async version=>{
 open(version);
 fireEvent.click(await screen.findByRole('button',{name:'Board the magical taxi'}));
 expect(screen.getByRole('region',{name:'The magical taxi arrives'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Continue without video →'}));
 expect(screen.getByRole('region',{name:'Through the vortex'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Continue without video →'}));
 expect(screen.getByTitle('The Ride That Wouldn’t Autocorrect')).toHaveAttribute('srcdoc',expect.stringContaining(`episode v${version}`));
 const attempts=await episodeDb.attempts.toArray();expect(attempts).toHaveLength(1);expect(attempts[0].choices).toEqual([]);expect(attempts[0].revision).toBe(0);
});
it('continues an existing archived attempt without replaying the boarding clips',async()=>{
 const episode=availableEpisodeVersions(AP_CLASS_ID,true).find(e=>e.id==='own-english'&&e.version===4)!;
 const attempt={...makeEpisodeAttempt('teacher',episode,true),choices:['voice'],revision:1};await episodeDb.attempts.put(attempt);
 open(4);fireEvent.click(await screen.findByRole('button',{name:'Continue episode'}));
 expect(screen.queryByRole('button',{name:'Play with sound'})).not.toBeInTheDocument();
 expect(screen.getByTitle('The Ride That Wouldn’t Autocorrect')).toBeInTheDocument();
 expect((await episodeDb.attempts.get(attempt.attemptId))?.choices).toEqual(['voice']);
});

vi.mock('@/services/private-episode-content',async()=>{const content=await import('../../functions/learning-content/src/episode-content.js');const versions=await import('../../functions/learning-content/src/young-versions.js');const original=await vi.importActual<typeof import('@/services/private-episode-content')>('@/services/private-episode-content');return {...original,...content,...versions,privateEpisodeHtml:(_id:string,version:number)=>'<html>Private authenticated episode v'+version+'</html>'};});
