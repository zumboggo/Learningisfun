import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { WeeklySlots } from '@/components/planner/WeeklySlots';
import { prepareWeeklyBank, editWeeklyResource, shortWords } from '@/services/planner-bank';
import { createWeeklyPlan, type WeeklyPlanData } from '@/services/planner.service';
import { blankResource, populateSlots, type UnitPlan } from '@/services/unit-planning';
import { placePlannerCard, undoPlannerPlacement } from '@/services/planner-cards';
import { groupWeeklyVocabulary } from '@/services/weekly-vocabulary';
import type { FlashcardCard } from '@/types';

const fixture=()=>populateSlots(createWeeklyPlan({key:'week',startDate:'2026-09-07',header:'',calendar:'',blocks:['WL-B','WL-R','AP'].map(code=>({code,label:code,title:code,unit:'',std:'',goal:'',diff:'',presentationCandidates:['Proposed presentation'],textQueue:[],days:[{date:'Tuesday',iso:'2026-09-08',daytype:'',I:'Explain imagery',W:'',Y:'',C:'',due:[]}]}))},{}),[]);
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe('central weekly resource bank',()=>{
  it('adds through the lesson picker without scrolling and keeps links across sections',()=>{
    let latest:WeeklyPlanData;
    function Harness(){const[data,setData]=useState(fixture);latest=data;return <WeeklySlots data={data} units={[]} onChange={setData}/>;}
    render(<Harness/>);
    fireEvent.click(screen.getByLabelText('Add I do to a lesson'));
    const picker=within(screen.getByRole('dialog'));
    expect(picker.queryByText('AP Lang')).not.toBeInTheDocument();
    expect(picker.getByText('World Lit Blue')).toBeInTheDocument();
    fireEvent.click(picker.getByText('World Lit Red'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(latest!.lessons[1].slots).toHaveLength(2);
    expect(latest!.lessons[1].slots![1].planningItemId).toBe(latest!.lessons[0].slots![0].planningItemId);
    fireEvent.click(picker.getByText('World Lit Blue'));
    expect(latest!.lessons[0].slots).toHaveLength(2);
    fireEvent.click(picker.getByLabelText('Remove I do from World Lit Red · 2026-09-08'));
    expect(latest!.lessons[1].slots).toHaveLength(0);
    expect(latest!.lessons[0].slots).toHaveLength(2);
    expect(latest!.weeklyResources!.some(item=>item.title==='I do')).toBe(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(picker.queryByLabelText('Remove I do from World Lit Red · 2026-09-08')).not.toBeInTheDocument();
    fireEvent.click(picker.getByText('World Lit Red'));
    fireEvent.click(picker.getByText('World Lit Red'));
    fireEvent.click(picker.getByText('Done'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(latest!.lessons[1].slots).toHaveLength(2);
  });
  it('confirms resource deletion and removes linked placements only after approval',()=>{
    let latest:WeeklyPlanData;
    function Harness(){const[data,setData]=useState(fixture);latest=data;return <WeeklySlots data={data} units={[]} onChange={setData}/>;}
    const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
    render(<Harness/>);
    expect(screen.getByLabelText('Edit resource I do')).toHaveTextContent('✎');
    expect(screen.getByLabelText('Edit resource I do')).not.toHaveTextContent('Edit');
    fireEvent.click(screen.getByLabelText('Delete resource I do'));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('every lesson in this week'));
    expect(latest!.lessons[0].slots).toHaveLength(1);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByLabelText('Delete resource I do'));
    expect(latest!.lessons[0].slots).toHaveLength(0);
    expect(latest!.lessons[1].slots).toHaveLength(0);
    expect(latest!.lessons[2].slots).toHaveLength(1);
    expect(screen.queryByLabelText('Delete resource I do')).not.toBeInTheDocument();
  });
  it('migrates matching World Lit items once, without merging other courses or divergent edits',()=>{
    const original=fixture(), next=prepareWeeklyBank(original);
    expect(next.weeklyResources).toHaveLength(2);
    expect(next.lessons[0].slots![0].planningItemId).toBe(next.lessons[1].slots![0].planningItemId);
    expect(prepareWeeklyBank(next)).toEqual(next);
    expect(original.weeklyResources).toBeUndefined();
    original.lessons[1].slots![0].content='A different activity';
    expect(prepareWeeklyBank(original).weeklyResources).toHaveLength(3);
  });
  it('updates linked copies, preserves placement identity and completion, and survives undo',()=>{
    const data=prepareWeeklyBank(fixture()), slot=data.lessons[0].slots![0];
    data.lessons[0].slots![0].status='completed';
    const before=structuredClone(data);
    data.lessons[0].slots=[];
    const edited=editWeeklyResource(data,slot.planningItemId!,{title:'Shared new title',content:'New detail'});
    const restored=prepareWeeklyBank(undoPlannerPlacement(edited,before));
    expect(restored.lessons[0].slots![0]).toMatchObject({id:slot.id,title:'Shared new title',status:'completed'});
    expect(restored.lessons[1].slots![0].title).toBe('Shared new title');
    expect(restored.lessons[2].slots![0].title).toBe('I do');
    const copy=placePlannerCard(restored,{slot:restored.lessons[0].slots![0]},restored.lessons[1].id,1);
    expect(copy.lessons[1].slots![1].planningItemId).toBe(slot.planningItemId);
  });
  it('starts new lessons without scheduled presentation or copywork cards and preserves existing plans',()=>{
    const plan=fixture(); plan.lessons.forEach(l=>delete l.slots);
    const resources=['presentation','copywork'].map(kind=>({...blankResource(),kind:kind as 'presentation'|'copywork',week:plan.week.startDate,date:'2026-09-08'}));
    const unit={course:'WL',resources} as UnitPlan;
    const next=populateSlots(plan,[unit]);
    expect(next.lessons.flatMap(l=>l.slots!).some(s=>['presentation','copywork'].includes(s.kind))).toBe(false);
    next.lessons[0].slots![0].kind='presentation';
    expect(populateSlots(next,[unit]).lessons[0].slots![0].kind).toBe('presentation');
  });
  it('opens + Text immediately, keeps typing focused, and updates Blue and Red from the bank',()=>{
    let latest:WeeklyPlanData;
    function Harness(){const[data,setData]=useState(fixture);latest=data;return <WeeklySlots data={data} units={[]} onChange={setData}/>;}
    render(<Harness/>);
    fireEvent.click(screen.getByText('+ Text'));
    const title=screen.getByLabelText('Title');title.focus();
    fireEvent.change(title,{target:{value:'Shared poem'}});
    expect(title).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Details'),{target:{value:'Read the opening stanza'}});
    fireEvent.click(screen.getByText('Done'));
    fireEvent.click(screen.getByText('Shared poem'));
    fireEvent.click(screen.getByText('+ Place Shared poem here'));
    fireEvent.click(screen.getByRole('button',{name:'World Lit Red'}));
    fireEvent.click(screen.getByText('Shared poem'));
    fireEvent.click(screen.getByText('+ Place Shared poem here'));
    fireEvent.click(screen.getByLabelText('Edit resource Shared poem'));
    fireEvent.change(screen.getByLabelText('Details'),{target:{value:'Read the entire poem'}});
    fireEvent.click(screen.getByText('Done'));
    expect(latest!.lessons.slice(0,2).map(l=>l.slots!.find(s=>s.title==='Shared poem')?.content)).toEqual(['Read the entire poem','Read the entire poem']);
    fireEvent.click(screen.getByLabelText('Open Shared poem details'));
    expect(screen.queryByLabelText('Details')).not.toBeInTheDocument();
    expect(screen.getByText('Edit in planning area')).toBeInTheDocument();
  });
  it('limits display words without destroying the original content',()=>{
    expect(shortWords('one two three four five six seven',6)).toBe('one two three four five six…');
    expect(shortWords('Short title',6)).toBe('Short title');
  });
});
describe('released weekly core vocabulary',()=>{
  it('groups tagged weeks, excludes reference/supporting/untagged cards, and deduplicates shared decks',()=>{
    const card=(id:string,tags:string[],front=id)=>({$id:id,front,back:'Definition',tags} as FlashcardCard);
    const groups=groupWeeklyVocabulary([card('b',['CORE','week:2026-09-07']),card('a',['CORE','week:2026-09-07']),card('dup',['CORE','week:2026-09-07'],'a'),card('r',['REFERENCE','week:2026-09-07']),card('s',['SUPPORTING','week:2026-09-07']),card('untagged',[]),card('old',['week:2026-08-31'])]);
    expect(groups.get('2026-09-07')?.map(c=>c.front)).toEqual(['a','b']);
    expect(groups.get('2026-08-31')).toHaveLength(1);
  });
});
