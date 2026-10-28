import 'fake-indexeddb/auto';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {advanceEpisode,episodeDb,makeEpisodeAttempt,attemptsFor,validEpisodeMessage,saveEpisode} from '@/services/episodes.service';
import {availableEpisodeVersions,WORLD_LIT_CLASSES} from '../../functions/learning-content/src/episode-catalog.js';
import {journalStories} from '../../functions/learning-content/src/journal-stories.js';
import {addAssignedEpisodes} from '@/services/planner-episodes';
import type {WeeklyPlanData} from '@/services/planner.service';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {executeLearningContent} from '@/services/learning-content.service';
const e=availableEpisodeVersions(WORLD_LIT_CLASSES[0].id,true).find(e=>e.version===1)!,s=journalStories[0],choices=s.scenes.map(s=>s.choices[0].id),good=s.driverQuestions.map(q=>q.answer),bad=good.map(v=>(v+1)%3);
beforeEach(async()=>{await episodeDb.attempts.clear();});
describe('journal attempts',()=>{
 it('persists private entries and retry state without mixing accounts or sections',async()=>{let a=makeEpisodeAttempt('student',e,false);a=advanceEpisode(a,[choices[0]],[],{question:'My question'});await episodeDb.attempts.put(a);expect((await attemptsFor('student',e.classId))[0].journal?.question).toBe('My question');expect(await attemptsFor('other',e.classId)).toEqual([]);expect(await attemptsFor('student',WORLD_LIT_CLASSES[1].id)).toEqual([]);a=advanceEpisode(a,choices,[],{question:'My question',reflection:'What remains uncertain'});a=advanceEpisode(a,choices,[bad]);expect(a.status).toBe('active');a=advanceEpisode(a,choices,[bad,good]);expect(a.status).toBe('complete');expect(a.journal?.reflection).toBe('What remains uncertain');expect(()=>advanceEpisode(a,choices,[bad,good],{question:'Changed',reflection:'What remains uncertain'})).toThrow();expect(()=>advanceEpisode(a,choices,[good])).toThrow();});
 it('checks frame, origin, channel, episode, and version for personal drafts',()=>{const source={} as Window,m={protocol:'episode-v1',episode:e.id,version:1,type:'draft',channel:'c',field:'question',text:'q'};const event={source,origin:location.origin,data:m} as MessageEvent;expect(validEpisodeMessage(event,source,'c',e)).toBe(true);for(const change of [{source:{}},{origin:'https://foreign.test'},{data:{...m,channel:'wrong'}},{data:{...m,episode:'own-english'}},{data:{...m,version:2}}])expect(validEpisodeMessage({...event,...change} as MessageEvent,source,'c',e)).toBe(false);});
 it('places both animated episodes in the week bank without retired legacy episodes',()=>{
  const cls=WORLD_LIT_CLASSES[1].id;
  const data={week:{startDate:'2026-10-12'},lessons:[{id:'wednesday',classId:cls,date:'2026-10-14',classCode:'WL-B'}],courses:[],preparation:[],extras:[],flags:[],weeklyResources:[]} as unknown as WeeklyPlanData;
  const animated=[{classId:cls,id:'quixote-sidekick-animated',assignmentId:'sidekick-blue',title:'A Knight Needs a Sidekick',date:'2026-10-12'},{classId:cls,id:'quixote-inn-animated',assignmentId:'inn-blue',title:'The Castle That Served Supper',date:'2026-10-12'}];
  const first=addAssignedEpisodes(data,'https://example.test/Learningisfun/',animated);
  expect(first.weeklyResources?.filter(r=>r.activityType==='game-episode')).toHaveLength(2);
  expect(first.weeklyResources?.map(r=>r.title)).toEqual(['A Knight Needs a Sidekick','The Castle That Served Supper']);
  expect(first.weeklyResources?.every(r=>r.dueDate==='2026-10-12'&&r.publish===false)).toBe(true);
  expect(addAssignedEpisodes(first,'https://example.test/Learningisfun/',animated).weeklyResources).toHaveLength(2);
 });
});

it('offline pending attempts survive a failed upload and a stale acknowledgement cannot clear newer progress',async()=>{let a=advanceEpisode(makeEpisodeAttempt('offline-student',e,false),[choices[0]],[],{question:'Offline question'});await episodeDb.attempts.put(a);vi.mocked(executeLearningContent).mockRejectedValueOnce(new Error('Offline'));await expect(saveEpisode(a)).rejects.toThrow('Offline');expect((await episodeDb.attempts.get(a.attemptId))?.pending).toBe(true);vi.mocked(executeLearningContent).mockImplementationOnce(async()=>{const newer=advanceEpisode(a,choices.slice(0,2));await episodeDb.attempts.put(newer);return {saved:true};});await saveEpisode(a);a=(await episodeDb.attempts.get(a.attemptId))!;expect(a.revision).toBe(2);expect(a.pending).toBe(true);vi.mocked(executeLearningContent).mockResolvedValueOnce({saved:true});await saveEpisode(a);expect((await episodeDb.attempts.get(a.attemptId))?.pending).toBe(false);});

vi.mock('@/services/private-episode-content',async()=>{const content=await import('../../functions/learning-content/src/episode-content.js');const versions=await import('../../functions/learning-content/src/young-versions.js');const original=await vi.importActual<typeof import('@/services/private-episode-content')>('@/services/private-episode-content');return {...original,...content,...versions,privateEpisodeHtml:(_id:string,version:number)=>'<html>Private authenticated episode v'+version+'</html>'};});
