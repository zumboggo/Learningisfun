import {expect,it} from 'vitest';
import {createWeeklyPlan} from '@/services/planner.service';
import {addWeeklyLessonDefaults,populateSlots} from '@/services/unit-planning';
const fixture=()=>populateSlots(createWeeklyPlan({key:'week',header:'',startDate:'2026-09-21',calendar:'',blocks:['WL-B','WL-R','AP','ETH'].map(code=>({code,title:code,label:code,unit:'1',goal:'',std:'',diff:'',presentationCandidates:[],textQueue:[],days:['2026-09-25','2026-09-21','2026-09-23'].map(iso=>({date:iso,iso,daytype:'',I:'Model',W:'',Y:'',C:'',due:[]}))}))},{}),[]);
it('places defaults in chronological first and second lessons of every section',()=>{
 const original=fixture(),plan=addWeeklyLessonDefaults(original);
 for(const code of ['WL-B','WL-R','AP','ETH']){
   const lessons=plan.lessons.filter(l=>l.classCode===code).sort((a,b)=>a.date.localeCompare(b.date));
   expect(lessons[0].slots![0].title).toBe('Vocab Presentation');
   expect(lessons[1].slots![0].title).toBe('Quiz');
   expect(lessons[2].slots!.map(s=>s.title)).toEqual(['I do']);
   expect(lessons[0].slots!.some(s=>s.content==='Model')).toBe(true);
 }
 expect(original.lessons.every(l=>l.slots!.length===1)).toBe(true);
 expect(addWeeklyLessonDefaults(plan)).toEqual(plan);
});
it('handles a shortened week without creating extra periods',()=>{
 const plan=fixture();plan.lessons=plan.lessons.slice(0,1);
 const result=addWeeklyLessonDefaults(plan);
 expect(result.lessons).toHaveLength(1);
 expect(result.lessons[0].slots!.some(s=>s.kind==='quiz')).toBe(false);
 expect(addWeeklyLessonDefaults({...plan,lessons:[]}).lessons).toEqual([]);
});
it('reuses an existing quiz instead of adding a duplicate',()=>{
 const plan=fixture();
 const second=plan.lessons.find(l=>l.classCode==='AP'&&l.date==='2026-09-23')!;
 second.slots!.push({id:'q',title:'Weekly quiz',kind:'quiz',content:'',url:'',minutes:5,optional:false,status:'planned'});
 expect(addWeeklyLessonDefaults(plan).lessons.find(l=>l.id===second.id)!.slots!.filter(s=>s.kind==='quiz')).toHaveLength(1);
});
it('adds the AP chapter only to the first AP lesson as an ordinary text',()=>{
 const plan=addWeeklyLessonDefaults(fixture());
 const matches=plan.lessons.flatMap(lesson=>lesson.slots!.filter(s=>s.title==='Clarity and Style Chapter').map(slot=>({lesson,slot})));
 expect(matches).toHaveLength(1);
 expect(matches[0].lesson).toMatchObject({classCode:'AP',date:'2026-09-21'});
 expect(matches[0].slot).toMatchObject({kind:'text',assignedReading:false,isCopywork:false});
 expect(addWeeklyLessonDefaults(plan)).toEqual(plan);
});
