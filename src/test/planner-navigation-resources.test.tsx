import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PlannerResourceTray } from '@/components/planner/PlannerResourceTray';
import { PlannerWeekNavigation } from '@/components/planner/PlannerWeekNavigation';
import { plannerMonday, recallPlannerChoice, rememberPlannerChoice, nearestPlannerWeek } from '@/services/planner-navigation';
import { createWeeklyPlan } from '@/services/planner.service';
import { blankResource, populateSlots } from '@/services/unit-planning';
import { placePlannerCard, undoPlannerPlacement } from '@/services/planner-cards';
import type { PlannerWeekSource } from '@/services/planner-parser';

afterEach(()=>{cleanup();localStorage.clear();vi.useRealTimers();});
const weeks:PlannerWeekSource[]=['2026-09-07','2026-09-14'].map(startDate=>({key:startDate,startDate,header:'',calendar:'',blocks:[]}));
describe('planner navigation and resource discovery',()=>{
  it('uses China calendar weeks and validates remembered choices',()=>{
    expect(plannerMonday(new Date('2026-09-06T17:00:00Z'))).toBe('2026-09-07');
    expect(plannerMonday(new Date('2026-12-31T17:00:00Z'),1)).toBe('2027-01-04');
    expect(nearestPlannerWeek(weeks,'2026-12-01')?.key).toBe('2026-09-14');
    rememberPlannerChoice('teacher-a','AP');
    expect(recallPlannerChoice('teacher-a',['AP','WL-B'],'WL-B')).toBe('AP');
    expect(recallPlannerChoice('teacher-b',['AP','WL-B'],'WL-B')).toBe('WL-B');
    expect(recallPlannerChoice('teacher-a',['WL-B'],'WL-B')).toBe('WL-B');
  });
  it('offers direct week shortcuts and disables boundary arrows',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-09T00:00:00Z'));
    const onChange=vi.fn(); render(<PlannerWeekNavigation weeks={weeks} selected={weeks[0].key} onChange={onChange}/>);
    expect(screen.getByLabelText('Previous planning week')).toBeDisabled();
    fireEvent.click(screen.getByText('Next week'));expect(onChange).toHaveBeenCalledWith('2026-09-14');
    fireEvent.click(screen.getByText('This week'));expect(onChange).toHaveBeenLastCalledWith('2026-09-07');
  });
  it('filters the bank without hiding weekly suggestions and keeps placed items reusable',()=>{
    const resource={...blankResource(),id:'poem',title:'Imagery',content:'Study sensory language',week:weeks[0].startDate};
    const onSelect=vi.fn();render(<PlannerResourceTray resources={[resource,{...blankResource(),id:'debate',title:'Debate'}]} week={weeks[0].startDate} lessons={[]} onSelect={onSelect} onAdd={()=>{}}/>);
    fireEvent.click(screen.getByText('Unit bank · 2'));
    const bank=screen.getByLabelText('Search resource bank').parentElement!;
    fireEvent.change(screen.getByLabelText('Search resource bank'),{target:{value:'sensory'}});
    expect(within(bank).queryByText('Debate')).not.toBeInTheDocument();
    fireEvent.click(within(bank).getByText('Imagery'));expect(onSelect).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Search resource bank'),{target:{value:'no match'}});
    expect(within(bank).getByText('No matching resources.')).toBeInTheDocument();
    expect(screen.getByText('Imagery')).toBeInTheDocument();
  });
  it('undoes a copy while preserving subsequent text edits and weekly notes',()=>{
    const data=populateSlots(createWeeklyPlan({...weeks[0],blocks:[{code:'AP',label:'AP',title:'AP',unit:'',std:'',goal:'',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'Tue',iso:'2026-09-08',daytype:'',I:'Model',W:'Discuss',Y:'',C:'',due:[]}]}]},{}),[]);
    const lesson=data.lessons[0];
    const copied=placePlannerCard(data,{slot:lesson.slots![0]},lesson.id,2);
    copied.lessons[0].slots![0].content='Newly edited explanation';copied.weekNote='Keep this note';
    const undone=undoPlannerPlacement(copied,data);
    expect(undone.lessons[0].slots).toHaveLength(2);
    expect(undone.lessons[0].slots![0].content).toBe('Newly edited explanation');
    expect(undone.weekNote).toBe('Keep this note');
    const removed=structuredClone(data);removed.lessons[0].slots!.splice(0,1);
    expect(undoPlannerPlacement(removed,data).lessons[0].slots![0]).toEqual(lesson.slots![0]);
  });
});
