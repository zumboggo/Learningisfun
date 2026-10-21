import {expect,it} from 'vitest';
import {createWeeklyPlan} from '@/services/planner.service';
import {normalizePlan} from '@/services/planner-layout';
import {preparePlannerStarters} from '@/services/planner-starters';
import type {PlannerDeadline} from '@/services/planner-parser';
const start='2026-12-28';
const deadline=(classCode:string,date:string,title='Copywork Analysis'):PlannerDeadline=>({classCode,date,title,time:'23:59',url:''});
function fixture(deadlines?:PlannerDeadline[]){
 return createWeeklyPlan({key:start,header:'',calendar:'',startDate:start,...(deadlines===undefined?{}:{deadlines}),blocks:['WL-B','WL-R','AP','ETH'].map(code=>({code,title:code,label:code,unit:'',goal:'',std:'',diff:'',presentationCandidates:[],textQueue:[],days:[{date:start,iso:start,daytype:'',I:'',W:'',Y:'',C:'',due:code==='AP'?['Copywork Analysis']:[]}]}))},{});
}
it('adds shared World Lit and separate AP/Ethics episode preparation every teaching week',()=>{
 const plan=fixture([]);
 expect(plan.preparation.filter(t=>t.id.startsWith('prepare-episode-')).map(t=>t.label)).toEqual(['Create Episode · World Lit','Create Episode · AP Lang','Create Episode · Ethics']);
 expect(plan.preparation.filter(t=>t.id.startsWith('prepare-copywork-text-'))).toEqual([]);
});
it('uses only this week including Sunday and year boundaries, deduplicating World Lit sections',()=>{
 const plan=fixture([deadline('WL-R','2026-12-29'),deadline('WL-B','2026-12-30'),deadline('AP','2027-01-03','Copywork & Analysis'),deadline('ETH','2026-12-30')]);
 expect(plan.preparation.filter(t=>t.id.startsWith('prepare-copywork-text-')).map(t=>t.label)).toEqual(['Create Copywork Text · World Lit','Create Copywork Text · AP Lang']);
 expect(fixture([deadline('AP','2027-01-04'),deadline('WL-B','2026-12-27')]).preparation.filter(t=>t.id.startsWith('prepare-copywork-text-'))).toEqual([]);
});
it('upgrades saved plans, preserves checks and manual work, and is idempotent',()=>{
 const plan=fixture([deadline('WL-B',start)]);
 plan.preparation.find(t=>t.id==='prepare-copywork-text-WL')!.status='ready';
 plan.preparation.find(t=>t.id==='prepare-episode-AP')!.status='ready';
 plan.preparation.push({id:'manual',label:'Print handout',kind:'handout',status:'ready'});
 const next=normalizePlan(plan);
 expect(next).toEqual(plan);expect(normalizePlan(next)).toEqual(next);
 expect(next.lessons).toEqual(plan.lessons);
});
it('supports legacy lesson dues and uses current source deadlines before generating tasks',()=>{
 const plan=fixture();
 expect(plan.preparation.some(t=>t.id==='prepare-copywork-text-AP')).toBe(true);
 const source={...plan.week,deadlines:[deadline('WL-R',start)]};
 const next=preparePlannerStarters(plan,source);
 expect(next.preparation.filter(t=>t.id.startsWith('prepare-copywork-text-')).map(t=>t.classCode)).toEqual(['WL']);
 expect(preparePlannerStarters(next,source)).toEqual(next);
 expect(preparePlannerStarters(next,{...source,deadlines:[]}).preparation.some(t=>t.id.startsWith('prepare-copywork-text-'))).toBe(false);
});
