import 'fake-indexeddb/auto';
import {beforeEach,describe,expect,it} from 'vitest';
import {advanceEpisode,episodeDb,makeEpisodeAttempt,attemptsFor,validEpisodeMessage} from '@/services/episodes.service';
import {episodes} from '../../functions/learning-content/src/episode-catalog.js';
import {isGameEpisode,resourceCategory,resourceColor} from '@/services/planner-appearance';
const e=episodes[0];
beforeEach(async()=>{await episodeDb.attempts.clear();await episodeDb.writing.clear();});
describe('episode persistence and isolation',()=>{
 it('keeps accounts separate, first completion and independent replay',async()=>{const a=makeEpisodeAttempt('one',e,false),b=makeEpisodeAttempt('two',e,false);const done=advanceEpisode(a,['voice','clarify','test','mix','power','assess','bridge','check','preserve','revisit']);await episodeDb.attempts.bulkPut([done,b,makeEpisodeAttempt('one',e,false)]);expect((await attemptsFor('one',e.classId))).toHaveLength(2);expect((await attemptsFor('two',e.classId))).toHaveLength(1);expect((await episodeDb.attempts.get(a.attemptId))?.status).toBe('complete');expect(()=>advanceEpisode(done,['reach'])).toThrow();});
 it('validates origin, frame, channel, version and episode',()=>{const source={} as Window,m={source,origin:location.origin,data:{protocol:'episode-v1',episode:e.id,version:1,channel:'channel',type:'save'}} as MessageEvent;expect(validEpisodeMessage(m,source,'channel',e)).toBe(true);for(const changed of [{origin:'https://foreign.invalid'},{source:{}},{data:{...m.data,channel:'other'}},{data:{...m.data,version:2}},{data:{...m.data,episode:'other'}}])expect(validEpisodeMessage({...m,...changed} as MessageEvent,source,'channel',e)).toBe(false);});
 it('marks game resources orange under Texts',()=>{const slot={id:'episode',title:'The ride',content:'',kind:'text' as const,url:'https://example.test/#/classes/id/episodes/own-english',minutes:20,optional:false,status:'planned' as const};expect(isGameEpisode(slot)).toBe(true);expect(resourceCategory(slot)).toBe('text');expect(resourceColor(slot)).toContain('orange');});
});
