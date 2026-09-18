import {expect,it} from 'vitest';
import {createWeeklyPlan} from '@/services/planner.service';
import {togglePlannerLesson} from '@/services/planner-days';
import {normalizePlan} from '@/services/planner-layout';
import {projectCardMaterials} from '@/services/planner-editor';
it('cancels and restores a lesson with all notes and cards intact',()=>{
 const plan=createWeeklyPlan({key:'week',header:'',calendar:'',startDate:'2026-09-21',blocks:[{code:'AP',title:'AP',label:'AP',unit:'',goal:'',std:'',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'Tuesday',iso:'2026-09-22',daytype:'',I:'Teach',W:'Discuss',Y:'Write',C:'Check',due:['Essay']}]}]},{AP:'class'});
 plan.lessons[0].privateNotes='Keep this note';
 const original=structuredClone(plan.lessons[0]),cancelled=togglePlannerLesson(plan,original.id);
 expect(cancelled.lessons).toEqual([]);
 expect(cancelled.cancelledLessons).toEqual([original]);
 expect(projectCardMaterials(cancelled).lessons).toEqual([]);
 expect(normalizePlan(cancelled).cancelledLessons).toEqual([original]);
 expect(togglePlannerLesson(cancelled,original.id).lessons).toEqual([original]);
 expect(plan.lessons).toEqual([original]);
});
it('drops obsolete automatic flashcard tasks but preserves manual preparation',()=>{
 const plan={week:{key:'week',header:'',calendar:'',startDate:'2026-09-21',blocks:[]},flags:[],weekNote:'',extras:[],publishAgenda:false,includeIntentionsInPrint:false,courses:[],lessons:[],preparation:[{id:'flashcards-updated',label:'Flashcards Updated',kind:'other',status:'todo'},{id:'manual',label:'Print handout',kind:'other',status:'ready'}]} as Parameters<typeof normalizePlan>[0];
 expect(normalizePlan(plan).preparation.map(t=>t.id)).toEqual(['manual']);
});
