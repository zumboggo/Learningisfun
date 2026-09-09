import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { compareLessons, copyLessonCards } from '@/services/planner-compare';
import { createWeeklyPlan, type WeeklyPlanRecord } from '@/services/planner.service';
import { populateSlots } from '@/services/unit-planning';
import { migrateCardEditor } from '@/services/planner-editor';
import { CopyLessonDialog } from '@/components/planner/CopyLessonDialog';
import { PlannerSharePreview } from '@/components/planner/PlannerSharePreview';
import { WeeklyPlannerEditor } from '@/components/planner/WeeklyPlannerEditor';
import { executeLearningContent } from '@/services/learning-content.service';

vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
afterEach(()=>{cleanup();localStorage.clear();vi.resetAllMocks();});
function fixture(){return migrateCardEditor(populateSlots(createWeeklyPlan({key:'Week',startDate:'2026-09-07',header:'',calendar:'',blocks:['WL-B','WL-R'].map((code,index)=>({code,label:code,title:code,unit:'1',std:'',goal:'Read',diff:'',presentationCandidates:[],textQueue:[],days:[{date:'',iso:index?'2026-09-09':'2026-09-08',daytype:'',I:'Public activity',W:'',Y:'',C:'',due:[]}]}))},{'WL-B':'blue','WL-R':'red'}),[]));}
describe('World Lit comparison and sharing',()=>{
  it('pairs lessons by meeting number and retains an empty counterpart',()=>{
    const data=fixture();data.lessons.push({...structuredClone(data.lessons[0]),id:'extra',date:'2026-09-10'});
    expect(compareLessons(data).map(lesson=>lesson?.date||null)).toEqual(['2026-09-08','2026-09-09','2026-09-10',null]);
  });
  it('copies cards independently while preserving destination notes and resetting dates',()=>{
    const data=fixture(),[blue,red]=data.lessons;
    blue.slots![0].status='completed';blue.slots![0].dueDate='2026-09-08';red.privateNotes='Keep these notes';
    const copied=copyLessonCards(data,blue.id,red.id,'append');
    expect(copied.lessons[1].slots).toHaveLength(2);
    expect(copied.lessons[1].slots![1]).toMatchObject({status:'planned',dueDate:undefined});
    expect(copied.lessons[1].slots![1].id).not.toBe(blue.slots![0].id);
    expect(copied.lessons[1].privateNotes).toBe('Keep these notes');
    expect(copyLessonCards(copied,blue.id,red.id,'replace').lessons[1].slots).toHaveLength(1);
    expect(()=>copyLessonCards(data,blue.id,blue.id,'replace')).toThrow();
    expect(data.lessons[1].slots).toHaveLength(1);
  });
  it('does not copy until confirmation and defaults to append',()=>{
    const data=fixture(),onCopy=vi.fn();
    render(<CopyLessonDialog data={data} sourceId={data.lessons[0].id} onCopy={onCopy} onClose={()=>{}}/>);
    expect(screen.getByLabelText('Add after existing cards')).toBeChecked();
    expect(onCopy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Add copies'));
    expect(onCopy.mock.calls[0][0].lessons[1].slots).toHaveLength(2);
  });
  it('previews public content without exposing private fields or triggering publication',()=>{
    const data=fixture();data.lessons[0].privateNotes='PRIVATE NOTE';data.courses[0].intention='PRIVATE INTENTION';
    data.lessons[0].slots!.push({...data.lessons[0].slots![0],id:'hidden',title:'HIDDEN TITLE',content:'HIDDEN CONTENT',publish:false});
    const confirm=vi.fn();render(<PlannerSharePreview data={data} busy={false} error="" onClose={()=>{}} onConfirm={confirm}/>);
    expect(screen.queryByText(/PRIVATE NOTE|PRIVATE INTENTION|HIDDEN CONTENT|HIDDEN TITLE/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Public activity/)).toHaveLength(2);
    expect(confirm).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Confirm · Share now'));expect(confirm).toHaveBeenCalledOnce();
  });
  it('opens the preview without publishing and sends the saved version only on confirmation',async()=>{
    const data=fixture();const record={$id:'plan',teacherId:'teacher',sourceId:'source',weekKey:'Week',weekStart:data.week.startDate,status:'ready',planJson:JSON.stringify(data),publishedJson:'',createdAt:'now',updatedAt:'reviewed-version'} as WeeklyPlanRecord;
    vi.mocked(executeLearningContent).mockResolvedValue({plan:{...record,status:'published'},published:{agendas:2,texts:0,presentations:0}});
    render(<MemoryRouter><WeeklyPlannerEditor initial={data} record={record} userId="teacher" sourceId="source" units={[]} onUnitsChange={()=>{}} onSaved={()=>{}}/></MemoryRouter>);
    fireEvent.click(screen.getByText('Share with students…'));
    expect(executeLearningContent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirm · Share now'));
    await waitFor(()=>expect(executeLearningContent).toHaveBeenCalledWith({action:'publishWeeklyPlan',planId:'plan',expectedUpdatedAt:'reviewed-version'}));
    expect(await screen.findByText(/Published 2 agendas/)).toBeInTheDocument();
  });
});
