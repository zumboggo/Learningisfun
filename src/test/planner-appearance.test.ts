import { describe, expect, it } from 'vitest';
import { isCopywork, isAssignedReading, resourceCategory, resourceColor, resourcePriority, resourceTitle } from '@/services/planner-appearance';
import { routineNames, routineSlot } from '@/services/planner-routines';
import { editWeeklyResource, prepareWeeklyBank } from '@/services/planner-bank';
import type { LessonSlot } from '@/services/unit-planning';
import { createWeeklyPlan, type WeeklyPlanData } from '@/services/planner.service';

const slot=(patch:Partial<LessonSlot>={}):LessonSlot=>({id:'s',kind:'text',title:'Passage',content:'Notes',url:'',minutes:0,optional:false,status:'planned',...patch});
describe('planner resource distinctions',()=>{
  it('labels quizzes simply and sorts them first with a distinct accent',()=>{
    const quiz=slot({kind:'quiz',title:'Closing quiz',content:'15 questions'});
    expect(resourceTitle(quiz)).toBe('Quiz');
    expect(resourceCategory(quiz)).toBe('activity');
    expect(resourcePriority(quiz)).toBeLessThan(resourcePriority(slot({kind:'activity'})));
    expect(resourceColor(quiz)).toContain('rose');
  });
  it('keeps legacy copywork out of Activities and removes it from routine templates',()=>{
    expect(resourceCategory(slot({kind:'activity',title:'We do',content:'Commonplace copywork today'}))).toBe('text');
    expect(resourceTitle(slot({kind:'activity',title:'We do',content:'Copywork'}))).toBe('Copywork');
    expect(resourceCategory(slot({kind:'copywork'}))).toBe('text');
    expect(routineNames).not.toContain('Copywork');
    expect(resourceCategory(routineSlot('TQE'))).toBe('routine');
    expect(resourceColor(routineSlot('TQE'))).toContain('amber');
  });
  it('supports copywork and assigned reading together, including explicit label changes',()=>{
    const text=slot({existingTextId:'original',isCopywork:true});
    expect(isAssignedReading(text)).toBe(true);
    expect(isCopywork(text)).toBe(true);
    expect(resourceColor(text)).toContain('bg-blue-800');
    expect(isAssignedReading({...text,assignedReading:false})).toBe(false);
    expect(isCopywork({...text,isCopywork:false})).toBe(false);
    expect(resourceColor(slot())).toContain('bg-blue-50');
  });
  it('propagates the two reading labels into all linked lessons',()=>{
    const data=createWeeklyPlan({key:'week',startDate:'2026-09-07',header:'',calendar:'',blocks:[]},{});
    data.lessons=[{id:'l',classCode:'WL-B',slots:[slot()]}] as WeeklyPlanData['lessons'];
    const bank=prepareWeeklyBank(data),id=bank.weeklyResources![0].id;
    const next=prepareWeeklyBank(editWeeklyResource(bank,id,{assignedReading:true,isCopywork:true}));
    expect(next.lessons[0].slots![0]).toMatchObject({assignedReading:true,isCopywork:true});
  });
});
