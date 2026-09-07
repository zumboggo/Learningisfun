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
  it('keeps focus while typing and supports copying into an empty slot without dragging',async()=>{
    const user=userEvent.setup();render(<Harness/>);
    const title=screen.getByLabelText('Slot 1 title');await user.clear(title);await user.type(title,'Presentation about rhetoric');
    expect(title).toHaveFocus();expect(title).toHaveValue('Presentation about rhetoric');
    await user.click(screen.getAllByRole('button',{name:'Copy'})[0]);
    await user.click(screen.getAllByRole('button',{name:/Add Presentation about rhetoric/})[0]);
    expect(screen.getByLabelText('Slot 5 title')).toHaveValue('Presentation about rhetoric');
  });
});
