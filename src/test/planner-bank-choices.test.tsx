import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { plannerBankChoices } from '@/services/planner-bank-choices';
import { PlannerResourceTray } from '@/components/planner/PlannerResourceTray';
import { preparePlannerStarters } from '@/services/planner-starters';
import { createWeeklyPlan } from '@/services/planner.service';
import { blankResource, type LessonSlot } from '@/services/unit-planning';
import type { WeeklyResource } from '@/services/planner-bank';

afterEach(cleanup);
const choice = (title: string, patch: Partial<WeeklyResource> = {}): WeeklyResource => ({id:title, title, kind:'activity', content:'', url:'', course:'ETH', minutes:10, optional:false, status:'planned', ...patch});
const unwanted = [
  choice('Check', {content:'Check weekly due list'}),
  choice('I do', {content:'Read the Apology together'}),
  choice('We do', {content:'Choose from weekly activity menu'}),
  choice('Optional presentation: Plato'),
  choice('I do optional', {content:'Presentation (optional): Plato'}),
  choice('Reserve talk', {kind:'presentation', optional:true}),
  choice('This week: Q 10/22'),
  choice('Check quiz date', {content:'This week: Q 10/22'}),
];
const keep = [choice('Apology', {kind:'text'}), choice('Quiz', {kind:'quiz'}), choice('Q 10/22'), choice('Episode', {isRoutine:true}), choice('Evidence sorting'), choice('Vocab Presentation', {kind:'presentation'})];

it('removes redundant green choices from weekly and source banks while retaining texts, routines and red quizzes', () => {
  const items = [...unwanted, ...keep];
  const resources = items.map(item => ({...blankResource(), ...item, week:'2026-10-19', date:''}));
  const before = structuredClone(items);
  const result = plannerBankChoices(items, resources);
  expect(result.items.map(item => item.title)).toEqual(keep.map(item => item.title));
  expect(result.resources.map(item => item.title)).toEqual(keep.map(item => item.title));
  expect(items).toEqual(before);
  render(<PlannerResourceTray resources={resources} items={items} lessons={[]} week="2026-10-19" onSelect={()=>{}} onAdd={()=>{}}/>);
  expect(screen.queryByText('This week: Q 10/22')).not.toBeInTheDocument();
  expect(screen.getByRole('button', {name:'All 6'})).toBeInTheDocument();
  expect(screen.getByText('Unit bank · 6')).toBeInTheDocument();
});

it('matches whole text titles and respects course boundaries', () => {
  const items = [choice('Art', {kind:'text'}), choice('Partner work'), choice('Art analysis'), choice('Art critique', {course:'AP'})];
  expect(plannerBankChoices(items, []).items.map(item => item.title)).toEqual(['Art','Partner work','Art critique']);
});

it('upgrades saved episode routines without duplicating starters or changing placement completion', () => {
  const plan = createWeeklyPlan({key:'week', header:'', calendar:'', startDate:'2026-10-19', blocks:[{code:'ETH', title:'Ethics', label:'Ethics', unit:'', std:'', goal:'', diff:'', presentationCandidates:[], textQueue:[], days:[{date:'Monday', iso:'2026-10-19', daytype:'', I:'', W:'', Y:'', C:'', due:[]}]}]}, {});
  const old = choice('Game Episode', {id:'starter:ETH:activity:Game%20Episode', isRoutine:true});
  plan.weeklyResources = [old];
  plan.lessons[0].slots = [{...old, id:'placed-episode', planningItemId:old.id, status:'completed'} as LessonSlot];
  const next = preparePlannerStarters(plan);
  expect(next.weeklyResources!.filter(item => item.title === 'Episode')).toHaveLength(1);
  expect(next.weeklyResources!.find(item => item.title === 'Student Presentations')).toMatchObject({isRoutine:true});
  expect(next.lessons[0].slots!.find(item => item.id === 'placed-episode')).toMatchObject({title:'Episode', status:'completed', planningItemId:old.id});
  expect(preparePlannerStarters(next)).toEqual(next);
});
