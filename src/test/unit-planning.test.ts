import { describe, it, expect } from 'vitest';
import { importVocabulary, precedingFriday, populateSlots, type UnitPlan } from '@/services/unit-planning';
import { createWeeklyPlan } from '@/services/planner.service';
import type { PlannerWeekSource } from '@/services/planner-parser';

const week:PlannerWeekSource={key:'Sep 7-11',header:'',startDate:'2026-09-07',calendar:'',blocks:[{code:'WL-B',title:'World Literature',label:'Blue',unit:'Unit 1',std:'Reading',goal:'Explain imagery',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'Tue 08 Sep',iso:'2026-09-08',daytype:'',I:'Model',W:'Discuss',Y:'Write',C:'Check',due:['Essay']}]}]};
describe('unit planning',()=>{
  it('releases at 17:00 China time on the previous Friday across year boundaries and holidays',()=>{
    expect(precedingFriday('2026-09-07')).toBe('2026-09-04T09:00:00.000Z');
    expect(precedingFriday('2027-01-04')).toBe('2027-01-01T09:00:00.000Z');
    expect(precedingFriday('2026-10-05')).toBe('2026-10-02T09:00:00.000Z');
  });
  it('keeps the same term in different courses and imports exact definitions without duplicate re-imports',()=>{
    const csv='front,back,tags\nclaim,A position,WL U1 W05 TERM CORE wk:Sep 7-11\nclaim,A position,AP U1 W05 TERM CORE wk:Sep 7-11';
    const units=importVocabulary(csv,[week]);
    expect(units).toHaveLength(2);
    expect(units.flatMap(unit=>unit.cards)).toHaveLength(2);
    expect(importVocabulary(csv,[week],units).flatMap(unit=>unit.cards)).toHaveLength(2);
    expect(units[0].cards[0].week).toBe('2026-09-07');
    expect(units[0].vocabularyApproved).toBe(false);
  });
  it('rejects unmatched core weeks instead of releasing them on a guessed date',()=>{
    expect(()=>importVocabulary('front,back,tags\nx,y,WL U1 W08 TERM CORE wk:Oct 5-9',[week])).toThrow('Cannot match');
  });
  it('places all due items and resources without a slot cap and preserves edits',()=>{
    const resources=Array.from({length:10},(_,i)=>({id:`r${i}`,kind:'presentation' as const,title:`Talk ${i}`,content:'',url:'',week:week.startDate,date:'2026-09-08',minutes:10,optional:false,approved:false,paragraphs:5,targets:[],skills:''}));
    const unit:UnitPlan={id:'u',course:'WL',number:'1',title:'Epic',startDate:week.startDate,endDate:'2026-10-16',knowledge:'',skills:'',essentialQuestion:'',classIds:['blue'],cards:[],resources,vocabularyApproved:false};
    const plan=populateSlots(createWeeklyPlan(week,{'WL-B':'blue'}),[unit]);
    expect(plan.lessons[0].slots).toHaveLength(15);
    expect(plan.lessons[0].slots![0].title).toBe('Essay');
    expect(plan.lessons[0].slots![0].minutes).toBe(0);
    expect(plan.lessons[0].overflow).toHaveLength(0);
    plan.lessons[0].slots![1].title='My edit';
    expect(populateSlots(plan,[]).lessons[0].slots![1].title).toBe('My edit');
    expect(plan.unitSnapshot![0].resources).toHaveLength(10);
  });
});
