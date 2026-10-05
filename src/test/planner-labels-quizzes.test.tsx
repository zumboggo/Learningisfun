import {useState} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {createWeeklyPlan,type WeeklyPlanData} from '@/services/planner.service';
import {populateSlots,type LessonSlot} from '@/services/unit-planning';
import {preparePlannerStarters} from '@/services/planner-starters';
import {prepareWeeklyBank} from '@/services/planner-bank';
import {resourceColor,resourceTitle} from '@/services/planner-appearance';
import {textLabelDragType} from '@/services/planner-text-labels';
import {WeeklySlots} from '@/components/planner/WeeklySlots';
import {PlannerPreparation} from '@/components/planner/PlannerPreparation';
import {normalizePlan} from '@/services/planner-layout';
afterEach(cleanup);
function fixture(start='2026-10-12',second='2026-10-14',q='Q 10/14') {
 return populateSlots(createWeeklyPlan({key:start,header:'',startDate:start,calendar:'',blocks:['WL-B','WL-R'].map(code=>({code,title:code,label:code,unit:'',goal:'',std:'',diff:'',presentationCandidates:[],textQueue:['Essay'],days:[start,second].map((iso,index)=>({date:iso,iso,daytype:'',I:'',W:'',Y:'',C:'',due:index?[q]:[]}))}))},{}),[]);
}
const text:LessonSlot={id:'essay',title:'Essay',kind:'text',content:'Notes',url:'https://example.com/essay',minutes:10,optional:false,status:'planned'};
it('merges the dated Q and default quiz in every section without duplicating on retries',()=>{
 for(const [start,second,q] of [['2026-10-12','2026-10-14','Q 10/14'],['2027-01-04','2027-01-06','Q 1/6']]) {
   const source=fixture(start,second,q),plan=preparePlannerStarters(source);
   for(const lesson of plan.lessons.filter(lesson=>lesson.date===second)) {
     expect(lesson.slots).toHaveLength(1);
     expect(resourceTitle(lesson.slots![0])).toBe('Quiz '+(q==='Q 10/14'?'10/14':'1/06'));
     expect(resourceColor(lesson.slots![0])).toContain('rose');
   }
   expect(plan.weeklyResources!.filter(item=>item.kind==='quiz')).toHaveLength(1);
   expect(preparePlannerStarters(plan)).toEqual(plan);
   expect(source.lessons[1].slots![0].title).toBe(q);
 }
});
it('upgrades saved redundant quizzes without overwriting other periods or losing notes',()=>{
 const source=fixture(),first=source.lessons[0],second=source.lessons[1];
 first.slots!.push({...text,id:'read'});
 second.slots!.push({...text,id:'generic-quiz',kind:'quiz',title:'Quiz',content:'Keep notes',status:'completed'});
 const bank=prepareWeeklyBank(source),quiz=bank.lessons[1].slots![0];
 expect(bank.lessons[1].slots).toHaveLength(1);
 expect(quiz).toMatchObject({title:'Quiz 10/14',kind:'quiz',status:'completed',content:'Keep notes'});
 expect(bank.lessons[0].slots![0]).toMatchObject({title:'Essay',content:'Notes'});
 expect(prepareWeeklyBank(JSON.parse(JSON.stringify(bank)))).toEqual(bank);
});
it('labels texts from the bank and lessons, showing C/A and updating linked placements',()=>{
 let latest:WeeklyPlanData;
 function Harness(){const[data,setData]=useState(()=>{
   const plan=preparePlannerStarters(fixture());
   const item=plan.weeklyResources!.find(item=>item.title==='Essay')!;
   plan.lessons[0].slots!.push({...text,planningItemId:item.id});
   plan.lessons[2].slots!.push({...text,id:'red-essay',planningItemId:item.id});
   return prepareWeeklyBank(plan);
 });latest=data;return <WeeklySlots data={data} units={[]} onChange={setData}/>;}
 render(<Harness/>);
 const bank=within(screen.getByRole('complementary',{name:'Planning resources'}));
 const bankText=bank.getByRole('button',{name:'Essay'}).closest('[draggable]')!;
 expect(bankText).toHaveClass('bg-blue-50');
 const transfer={setData:vi.fn(),effectAllowed:''};
 fireEvent.dragStart(bank.getByRole('button',{name:'Copywork'}),{dataTransfer:transfer});
 expect(transfer.setData).toHaveBeenCalledWith(textLabelDragType,'copywork');
 fireEvent.drop(bankText,{dataTransfer:{getData:(type:string)=>type===textLabelDragType?'copywork':''}});
 expect(within(bankText as HTMLElement).getByLabelText('Copywork')).toHaveTextContent('C');
 expect(bankText).toHaveClass('bg-blue-50');
 const target=screen.getAllByLabelText('Open Essay details')[0].closest('[draggable]')!;
 fireEvent.drop(target,{dataTransfer:{getData:(type:string)=>type===textLabelDragType?'assigned':''}});
 expect(bankText).toHaveClass('bg-blue-800');
 expect(within(bankText as HTMLElement).getByLabelText('Assigned reading')).toHaveTextContent('A');
 const placements=latest!.lessons.flatMap(lesson=>lesson.slots||[]).filter(slot=>slot.title==='Essay');
 expect(placements).toHaveLength(2);expect(placements.every(slot=>slot.assignedReading&&slot.isCopywork&&!slot.parentTextId)).toBe(true);
 expect(preparePlannerStarters(latest!).weeklyResources!.find(item=>item.title==='Essay')).toMatchObject({assignedReading:true,isCopywork:true});
 expect(screen.getByRole('region',{name:'activity resources'})).toHaveClass('bg-rose-50');
 expect(bank.getByRole('button',{name:'Quiz 10/14'})).toBeInTheDocument();
});
it('supports label selection by click and replaces standalone Copywork with the tool',()=>{
 function Harness(){const[data,setData]=useState(()=>{
 const plan=preparePlannerStarters(fixture());
 plan.weeklyResources!.push({...text,id:'old-copywork',title:'Copywork',url:'',kind:'copywork',course:'WL'});
 return plan;
 });return <WeeklySlots data={data} units={[]} onChange={setData}/>;}
 render(<Harness/>);
 const bank=within(screen.getByRole('complementary',{name:'Planning resources'}));
 expect(bank.queryByLabelText('Add Copywork to a lesson')).not.toBeInTheDocument();
 expect(bank.getByRole('button',{name:'Copywork'})).toHaveAttribute('draggable','true');
 fireEvent.click(bank.getByRole('button',{name:'Assigned'}));
 fireEvent.click(bank.getByRole('button',{name:'Essay'}));
 expect(bank.getByRole('button',{name:'Essay'}).closest('[draggable]')).toHaveClass('bg-blue-800');
});
it('keeps the three preparation checks independent and preserves manual tasks',()=>{
 let latest:WeeklyPlanData;
 function Harness(){const[data,setData]=useState(()=>{const plan=fixture();plan.preparation.push({id:'manual',label:'Print handout',kind:'handout',status:'ready'});return normalizePlan(plan);});latest=data;return <PlannerPreparation data={data} units={[]} onChange={setData}/>;}
 render(<Harness/>);
 const todo=within(screen.getByRole('region',{name:'Weekly to-do'}));
 expect(todo.getAllByRole('checkbox')).toHaveLength(4);
 fireEvent.click(todo.getByLabelText('Vocab Presentations'));
 fireEvent.click(todo.getByLabelText('Choose Assigned Readings and Copywork'));
 expect(todo.getByLabelText('Upload Lesson Plans')).not.toBeChecked();
 expect(todo.getByLabelText('Print handout')).toBeChecked();
 expect(normalizePlan(latest!).preparation).toEqual(latest!.preparation);
});
