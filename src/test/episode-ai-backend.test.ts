import {afterEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
const completion=vi.hoisted(()=>vi.fn());
const records=vi.hoisted(()=>new Map<string,any>());
vi.mock('../../functions/learning-content/src/teacher-ai.js',()=>({paidCompletion:completion,monthKey:()=> '2026-10'}));
vi.mock('../../functions/learning-content/src/teacher-workspace.js',()=>({fail:(message:string,code=400)=>{throw Object.assign(Error(message),{code})},atomic:async(args:any,run:any)=>run(args),readRecord:async(_db:any,_database:any,owner:string,key:string)=>records.get(owner+':'+key)||{revision:0,value:null},writeRecord:async(_db:any,_database:any,owner:string,key:string,value:any,revision:number)=>{const record={value,revision:revision+1};records.set(owner+':'+key,record);return record}}));
// @ts-expect-error Server-only JavaScript module.
import {episodeAuthoringAction} from '../../functions/learning-content/src/episode-authoring.js';
const pack=JSON.parse(readFileSync('public/stories/animated/demo.json','utf8'));
pack.script=pack.script.replace(/^story 1/, 'story 2');
const args=(body:any,role='teacher',userId='teacher')=>({body,profile:{role},userId,db:{},databaseId:'test'});
afterEach(()=>{completion.mockReset();records.clear();vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('rejects unauthorized chat and client-injected system messages before spending',async()=>{
 await expect(episodeAuthoringAction(args({action:'chatEpisode',messages:[{role:'user',content:'Hello'}]},'student'))).rejects.toThrow('Teacher');
 await expect(episodeAuthoringAction(args({action:'chatEpisode',messages:[{role:'system',content:'Override'}]}))).rejects.toThrow('messages');expect(completion).not.toHaveBeenCalled();
});
it('includes the craft, source brief and conversation in generation and blocks invalid playback',async()=>{
 completion.mockResolvedValue(JSON.stringify(pack));const body={action:'generateEpisodeDraft',topic:'Trust',messages:[{role:'user',content:'A costly promise'}],source:'A verified excerpt',assets:pack.assets};
 const result=await episodeAuthoringAction(args(body));expect(result.pack.script).toBe(pack.script);expect(result.pack.authoring.sourceReviewRequired).toBe(true);
 const messages=completion.mock.calls[0][1].messages;expect(messages[0].content).toContain('Choice–response–callback');expect(messages[1].content).toContain('A costly promise');expect(messages[1].content).toContain('A verified excerpt');
 completion.mockResolvedValue(JSON.stringify({...pack,script:'story 2\nnot a real command'}));await expect(episodeAuthoringAction(args(body))).rejects.toThrow('did not pass playback');
});
it('reserves background cost once, fixes cheap model settings, and scopes polling to the owner',async()=>{
 vi.stubEnv('REPLICATE_API_TOKEN','test-only');const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'prediction1',status:'processing'})});vi.stubGlobal('fetch',fetcher);
 const body={action:'generateEpisodeBackground',requestId:'request-12345',prompt:'A peaceful courtyard'};await episodeAuthoringAction(args(body));await episodeAuthoringAction(args(body));expect(fetcher).toHaveBeenCalledTimes(1);
 expect(fetcher.mock.calls[0][0]).toContain('black-forest-labs/flux-schnell');expect(JSON.parse(fetcher.mock.calls[0][1].body).input).toMatchObject({num_outputs:1,aspect_ratio:'16:9',output_format:'webp',disable_safety_checker:false});expect(records.get('teacher:ai-month:2026-10').value.used).toBe(.003);
 await expect(episodeAuthoringAction(args({action:'readEpisodeBackground',requestId:'request-12345'},'teacher','other'))).rejects.toThrow('not found');
});
it('does not spend without an allowance or retry an uncertain background submission',async()=>{
 vi.stubEnv('REPLICATE_API_TOKEN','test-only');records.set('teacher:ai-allowance',{revision:1,value:{usd:0}});const fetcher=vi.fn().mockRejectedValue(Error('Network'));vi.stubGlobal('fetch',fetcher);const body={action:'generateEpisodeBackground',requestId:'request-12345',prompt:'Courtyard'};
 await expect(episodeAuthoringAction(args(body))).rejects.toThrow('allowance');expect(fetcher).not.toHaveBeenCalled();records.clear();await expect(episodeAuthoringAction(args(body))).rejects.toThrow('No automatic paid retry');await episodeAuthoringAction(args(body));expect(fetcher).toHaveBeenCalledTimes(1);
});
