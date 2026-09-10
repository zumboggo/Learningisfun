import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PlannerPrintSheet } from '@/pages/PlannerPrintPage';
import { createWeeklyPlan } from '@/services/planner.service';
import { printActivityText, selectPrintActivities } from '@/services/planner-print';
import type { LessonSlot } from '@/services/unit-planning';
afterEach(cleanup);
const slot=(index:number,patch:Partial<LessonSlot>={}):LessonSlot=>({id:String(index),title:'Activity '+index,content:'A longer description with details that stay saved in the planner.',kind:'activity',url:'',minutes:10,optional:false,status:'planned',...patch});
function fixture(count=4) {
  return createWeeklyPlan({key:'Sep 7–11',startDate:'2026-09-07',header:'',calendar:'',blocks:Array.from({length:count},(_,i)=>({code:['WL-B','WL-R','ETH','AP'][i]||'Extra'+i,label:'Class '+i,title:'',unit:'Unit 1',std:'',goal:'Develop an evidence-based claim.',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'Tue',iso:'2026-09-08',daytype:'OPEN',I:'Model',W:'Practice',Y:'Write',C:'Check',due:[]}]}))},{});
}
describe('bounded weekly print summary',()=>{
  it('uses exactly two paper canvases and shares space across all classes',()=>{
    const plan=fixture(6);
    const {container}=render(<MemoryRouter><PlannerPrintSheet data={plan}/></MemoryRouter>);
    expect(container.querySelectorAll('.planner-paper-page')).toHaveLength(2);
    expect(container.querySelectorAll('.planner-course-panel')).toHaveLength(6);
    expect(screen.getAllByText('Improvements for next time')).toHaveLength(1);
  });
  it('retains essential late resources before optional fillers and preserves their teaching order',()=>{
    const items=Array.from({length:14},(_,i)=>slot(i,{optional:i<12,...(i===12?{kind:'quiz'}:i===13?{kind:'text'}:{})}));
    const before=structuredClone(items);
    const result=selectPrintActivities(items);
    expect(result).toHaveLength(10);
    expect(result.slice(-2).map(item=>item.kind)).toEqual(['quiz','text']);
    expect(items).toEqual(before);
  });
  it('limits overflow, preserves deadlines, and includes private presentation titles',()=>{
    const plan=fixture();
    plan.lessons[0].slots=Array.from({length:25},(_,i)=>slot(i));
    plan.lessons[0].due=['Final essay due today'];
    plan.courses[0].presentations=[{title:'Teacher-only slides',date:'2026-09-08',givenBy:'teacher',url:'',publish:false}];
    const before=JSON.stringify(plan);
    const {container}=render(<MemoryRouter><PlannerPrintSheet data={plan}/></MemoryRouter>);
    expect(container.querySelectorAll('.planner-printed-lesson')[0].querySelectorAll('.planner-print-activity')).toHaveLength(10);
    expect(screen.getByText('+15 additional activities in planner')).toBeInTheDocument();
    expect(screen.getByText(/Final essay due today/)).toBeInTheDocument();
    expect(screen.getByText(/Teacher-only slides/)).toBeInTheDocument();
    expect(JSON.stringify(plan)).toBe(before);
  });
  it('keeps descriptions short and replaces generic titles with a useful cue',()=>{
    expect(printActivityText(slot(1,{title:'They do',content:'Compare these two opening paragraphs carefully with a partner.'}))).toEqual({title:'They do: Compare these two opening paragraphs…',description:''});
    expect(printActivityText(slot(2,{title:'Close reading',content:'All weekly targets'})).description).toBe('');
  });
  it('labels reserves separately and omits private intentions unless explicitly enabled',()=>{
    const plan=fixture();
    plan.lessons[0].slots=[slot(0)];
    plan.lessons[0].overflow=[slot(1,{title:'Extra partner practice'})];
    plan.courses[0].intention='Private student detail';
    render(<MemoryRouter><PlannerPrintSheet data={plan}/></MemoryRouter>);
    expect(screen.getByText('Reserve · not scheduled')).toBeInTheDocument();
    expect(screen.getByText(/Extra partner practice/)).toBeInTheDocument();
    expect(screen.queryByText(/Private student detail/)).not.toBeInTheDocument();
  });
});
