import { useState } from 'react';
import { render,screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe,it,expect } from 'vitest';
import { WeeklySlots } from '@/components/planner/WeeklySlots';
import { createWeeklyPlan } from '@/services/planner.service';
import { populateSlots } from '@/services/unit-planning';
import type { PlannerWeekSource } from '@/services/planner-parser';
const week:PlannerWeekSource={key:'Week',header:'',startDate:'2026-09-07',calendar:'',blocks:[{code:'AP',title:'AP',label:'AP',unit:'1',std:'',goal:'Analyze',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'',iso:'2026-09-08',daytype:'',I:'Model',W:'Discuss',Y:'Write',C:'Check',due:[]}]}]};
function Harness(){const [data,setData]=useState(populateSlots(createWeeklyPlan(week,{}),[]));return <WeeklySlots data={data} units={[]} onChange={setData}/>;}
describe('weekly slot editor',()=>{
  it('keeps focus in the detail editor and supports copying without dragging',async()=>{
    const user=userEvent.setup();render(<Harness/>);
    await user.click(screen.getByLabelText('Edit resource I do'));
    const title=screen.getByLabelText('Title');await user.clear(title);await user.type(title,'Presentation about rhetoric');
    expect(title).toHaveFocus();expect(title).toHaveValue('Presentation about rhetoric');
    await user.click(screen.getByRole('button',{name:'Done'}));
    await user.click(screen.getByRole('button',{name:'Copy Presentation about rhetoric'}));
    await user.click(screen.getByRole('button',{name:/Place Presentation about rhetoric here/}));
    expect(screen.getAllByLabelText('Open Presentation about rhetoric details')).toHaveLength(2);
  });
});
