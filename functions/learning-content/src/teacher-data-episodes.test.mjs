import {test,expect,vi} from 'vitest';
import {teacherEpisodeRows} from './teacher-data-episodes.js';
const assignment={$id:'a',dataJson:JSON.stringify({title:'Test story',date:'2026-10-20',fileId:'f'})};
const record=(id,revision,quizzes,score,date,extra={})=>({$id:id,userId:'s',$createdAt:date,dataJson:JSON.stringify({type:'animated-attempt',id:'play',assignmentId:'a',revision,quizzes,score,...extra})});
const wrong=[1,1,0,0],right=[0,0,0,0];
const base={assignments:[assignment],students:new Set(['s']),inRange:()=>true};
test('retains low first score after passing and deduplicates immutable snapshots',async()=>{
 const records=[record('start',0,[],0,'2026-10-20'),record('first',1,[wrong],50,'2026-10-21'),record('retry',2,[wrong,right],100,'2026-10-22',{complete:true}),record('writing',3,[wrong,right],100,'2026-10-23',{complete:true})];
 const rows=await teacherEpisodeRows({...base,records});
 expect(rows[0]).toMatchObject({firstScore:50,latestScore:100,bestScore:100,quizTries:2,plays:1,complete:true});
});
test('replays preserve original first score; previews, other students and unknown assignments excluded',async()=>{
 const a=record('first',1,[wrong],50,'2026-10-21');
 const replay=record('replay',1,[right],100,'2026-10-23',{id:'replay',complete:true});
 const rows=await teacherEpisodeRows({...base,records:[a,replay,{...a,userId:'other'},record('preview',1,[right],100,'2026-10-24',{preview:true}),record('foreign',1,[right],100,'2026-10-25',{assignmentId:'foreign'})]});
 expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({firstScore:50,latestScore:100,plays:2,quizTries:2});
});
test('batched offline quiz retries reconstruct first score using immutable assignment quiz',async()=>{
 const storage={getFileDownload:vi.fn(async()=>({format:1,quiz:Array.from({length:4},()=>({answer:0}))}))};
 const rows=await teacherEpisodeRows({...base,storage,records:[record('batch',2,[wrong,right],100,'2026-10-23',{complete:true})]});
 expect(rows[0]).toMatchObject({firstScore:50,latestScore:100,quizTries:2});expect(storage.getFileDownload).toHaveBeenCalledTimes(1);
});
test('no quiz is not a zero score, and period filters activity rather than erasing first scores',async()=>{
 expect((await teacherEpisodeRows({...base,records:[record('start',0,[],0,'2026-10-20')]}))[0]).toMatchObject({firstScore:null,latestScore:null,quizTries:0});
 const records=[record('first',1,[wrong],50,'2026-09-01'),record('pass',2,[wrong,right],100,'2026-10-23',{complete:true})];
 expect((await teacherEpisodeRows({...base,records,inRange:d=>d>'2026-10-01'}))[0].firstScore).toBe(50);
 expect(await teacherEpisodeRows({...base,records,inRange:d=>d>'2026-11-01'})).toEqual([]);
});
