import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PlannerPreparation } from '@/components/planner/PlannerPreparation';
import { WeeklySlots } from '@/components/planner/WeeklySlots';
import { createWeeklyPlan, type WeeklyPlanData } from '@/services/planner.service';
import { normalizePlan } from '@/services/planner-layout';
import { placePlannerCard } from '@/services/planner-cards';
import { populateSlots } from '@/services/unit-planning';
import { routineNames, routineSlot } from '@/services/planner-routines';
import { PlannerPrintSheet } from '@/pages/PlannerPrintPage';
import { MemoryRouter } from 'react-router-dom';

function fixture() {
  return normalizePlan(populateSlots(createWeeklyPlan({ key: 'Test week', startDate: '2026-09-07', header: '', calendar: '', blocks: ['WL-B', 'WL-R', 'AP', 'ETH'].map(code => ({ code, label: code, title: code, unit: 'Imagery', std: '', goal: 'Explain imagery', diff: '', presentationCandidates: ['Poetry'], textQueue: [], days: [{ date: 'Tue', iso: '2026-09-08', daytype: '', I: 'Model the skill', W: 'Discuss', Y: 'Write', C: '', due: [] }] })) }, {}), []));
}
afterEach(cleanup);

describe('simplified weekly planner', () => {
  it('upgrades old tasks once while preserving manual work and saved completion', () => {
    const data = fixture();
    data.preparation.push({ id: 'quiz-results-WL-B', label: 'Update Quiz results in Canvas', kind: 'quiz', status: 'todo' }, { id: 'add-cards-WL-B', label: 'Add flashcards', kind: 'other', status: 'ready' }, { id: 'manual', label: 'Print handout', kind: 'handout', status: 'ready' });
    data.preparation[0].status = 'ready';
    const next = normalizePlan(data);
    expect(next.preparation).toHaveLength(5);
    expect(next.preparation[0].status).toBe('ready');
    expect(next.preparation.find(task => task.id === 'manual')?.status).toBe('ready');
    expect(normalizePlan(next)).toEqual(next);
    expect(next.lessons).toEqual(data.lessons);
  });
  it('cycles each section independently and saves presentation checks', () => {
    function Harness() { const [data, setData] = useState(fixture); return <PlannerPreparation data={data} units={[]} onChange={setData}/>; }
    render(<Harness/>);
    const blue = screen.getByRole('button', { name: /World Lit Blue: On Track/ });
    fireEvent.click(blue); expect(blue).toHaveTextContent('1 Class Behind');
    fireEvent.click(blue); expect(blue).toHaveTextContent('2 Classes Behind');
    expect(screen.getByRole('button', { name: /World Lit Red: On Track/ })).toBeInTheDocument();
    fireEvent.click(blue); expect(blue).toHaveTextContent('On Track');
    expect(screen.getAllByLabelText('Flashcards Updated')).toHaveLength(1);
    fireEvent.click(screen.getAllByLabelText('Presentation done and link posted')[0]);
    expect(screen.getAllByLabelText('Presentation done and link posted')[0]).toBeChecked();
    expect(screen.getAllByLabelText('Presentation done and link posted')).toHaveLength(3);
  });
  it('merges old World Lit preparation checks without losing completion', () => {
    const plan = fixture();
    plan.preparation = plan.preparation.filter(task => task.id !== 'prepare-presentation-WL');
    plan.preparation.push({id:'prepare-presentation-WL-R',label:'Red',kind:'presentation',status:'ready'}, {id:'prepare-presentation-WL-B',label:'Blue',kind:'presentation',status:'todo'});
    const next = normalizePlan(plan);
    expect(next.preparation.find(task => task.id === 'prepare-presentation-WL')?.status).toBe('ready');
    expect(next.preparation.filter(task => task.id.includes('prepare-presentation-WL'))).toHaveLength(1);
  });
  it('prints blank write-back spaces, a check for every card and three improvement slots', () => {
    const plan = fixture();
    render(<MemoryRouter><PlannerPrintSheet data={plan}/></MemoryRouter>);
    expect(screen.getAllByText('We Did:')).toHaveLength(plan.lessons.length);
    expect(screen.getAllByLabelText('Completion checkbox')).toHaveLength(plan.lessons.flatMap(lesson => lesson.slots || []).length);
    expect(screen.getByText('Improvements for next time')).toBeInTheDocument();
    expect(screen.getByText('Instruction / explanation')).toBeInTheDocument();
    expect(screen.getByText('Activities / pacing')).toBeInTheDocument();
    expect(screen.getByText('Support / other')).toBeInTheDocument();
  });
  it('places routine copies and opens their details when clicked', () => {
    function Harness() { const [data,setData] = useState(fixture); return <WeeklySlots data={data} units={[]} onChange={setData}/>; }
    render(<Harness/>);
    expect(screen.queryByText('Routines')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+ Activity'));
    routineNames.forEach(name => expect(screen.getByRole('button', {name})).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button',{name:'QFT'}));
    expect(screen.queryByLabelText('Activity type')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Minutes')).not.toBeInTheDocument();
    expect(screen.queryByText('If time')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Details')).toHaveAttribute('rows','2');
    fireEvent.click(screen.getByText('Done'));
    fireEvent.click(screen.getByRole('button',{name:'QFT'}));
    fireEvent.click(screen.getByText('+ Place QFT here'));
    fireEvent.click(screen.getByLabelText('Open QFT details'));
    expect(screen.queryByLabelText('Details')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Edit in planning area'));
    fireEvent.change(screen.getByLabelText('Details'), {target:{value:'Generate questions about the opening image.'}});
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getAllByText('Generate questions about the opening image.')[0]).toBeInTheDocument();
    expect(routineSlot('QFT').content).toBe('');
  });
  it('moves, copies and reorders without losing cards or imposing eight slots', () => {
    const data = fixture(), first = data.lessons[0], second = data.lessons[1], slot = first.slots![0];
    const moved = placePlannerCard(data, { slot, from: first.id, index: 0 }, first.id, 3);
    expect(moved.lessons[0].slots!.map(item => item.title)).toEqual(['We do', 'They do', 'I do']);
    const other = placePlannerCard(data, { slot, from: first.id, index: 0 }, second.id, 0);
    expect(other.lessons[0].slots).toHaveLength(2);
    expect(other.lessons[1].slots![0].id).toBe(slot.id);
    let copied = data;
    for (let i = 0; i < 10; i++) copied = placePlannerCard(copied, { slot }, second.id, 0);
    expect(copied.lessons[1].slots).toHaveLength(13);
    expect(new Set(copied.lessons[1].slots!.map(item => item.id)).size).toBe(13);
    expect(data.lessons[0].slots).toHaveLength(3);
  });
  it('edits through a pencil, copies across sections and removes only the lesson card', () => {
    let latest: WeeklyPlanData;
    function Harness() { const [data, setData] = useState(fixture); latest = data; return <WeeklySlots data={data} units={[]} onChange={setData}/>; }
    render(<Harness/>);
    expect(screen.queryByLabelText('Minutes')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Edit resource I do'));
    const title = within(screen.getByRole('dialog')).getByLabelText('Title');
    title.focus();
    fireEvent.change(title, { target: { value: 'Demonstrate' } });
    expect(title).toHaveFocus();
    fireEvent.click(screen.getByText('Done'));
    fireEvent.click(screen.getByLabelText('Copy Demonstrate'));
    fireEvent.click(screen.getByRole('button', { name: 'World Lit Red' }));
    fireEvent.click(screen.getByText('+ Place Demonstrate here'));
    expect(latest!.lessons[0].slots).toHaveLength(3);
    expect(latest!.lessons[1].slots).toHaveLength(4);
    fireEvent.click(screen.getAllByLabelText('Remove Demonstrate from this lesson')[1]);
    expect(latest!.lessons[0].slots).toHaveLength(3);
    expect(latest!.lessons[1].slots).toHaveLength(3);
  });
  it('accepts an internal drag and preserves legacy unplaced items', () => {
    let latest: WeeklyPlanData;
    function Harness() {
      const [data, setData] = useState(() => { const plan = fixture(); plan.lessons[0].overflow = [{ ...plan.lessons[0].slots![0], id: 'legacy', title: 'Older unplaced activity' }]; return plan; });
      latest = data; return <WeeklySlots data={data} units={[]} onChange={setData}/>;
    }
    render(<Harness/>);
    const lesson = latest!.lessons[0], slot = lesson.slots![0];
    fireEvent.drop(screen.getByRole('article'), { dataTransfer: { getData: () => JSON.stringify({ slot, from: lesson.id, index: 0 }) } });
    expect(latest!.lessons[0].slots!.map(item => item.title)).toEqual(['We do', 'They do', 'I do']);
    expect(latest!.lessons[0].overflow![0].title).toBe('Older unplaced activity');
    fireEvent.click(screen.getByText('Place', { exact: true }));
    expect(latest!.lessons[0].slots).toHaveLength(4);
    expect(latest!.lessons[0].overflow).toHaveLength(0);
  });
});
