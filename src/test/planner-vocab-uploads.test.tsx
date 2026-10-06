import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlannerPreparation } from '@/components/planner/PlannerPreparation';
import { createWeeklyPlan } from '@/services/planner.service';
import { preparePlannerStarters } from '@/services/planner-starters';
import { attachVocabPresentation } from '@/services/planner-vocab-presentations';
import { projectCardMaterials } from '@/services/planner-editor';
const execute = vi.hoisted(() => vi.fn());
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: execute }));
const fixture = () => preparePlannerStarters(createWeeklyPlan({ key: 'Week', startDate: '2026-10-05', header: '', calendar: '', blocks: ['AP', 'WL-B', 'WL-R', 'ETH'].map(code => ({ code, label: code, title: code, unit: '', std: '', goal: '', diff: '', presentationCandidates: [], textQueue: [], days: [{ date: 'Monday', iso: '2026-10-05', daytype: '', I: '', W: '', Y: '', C: '', due: [] }] })) }, { AP: 'ap', 'WL-B': 'blue', 'WL-R': 'red', ETH: 'ethics' }));
describe('preparation vocabulary uploads', () => {
  it('attaches World Lit to both sections and updates existing placements without losing lesson details', () => {
    const plan = fixture();
    const slot = plan.lessons.find(lesson => lesson.classCode === 'WL-B')!.slots!.find(item => item.title === 'Vocab Presentation')!;
    slot.status = 'completed';
    const resource = plan.weeklyResources!.find(item => item.id === slot.planningItemId)!;
    resource.content = 'Keep these vocabulary notes';
    const next = attachVocabPresentation(plan, 'WL', 'presentation-file:world-lit');
    const updated = next.lessons.find(lesson => lesson.classCode === 'WL-B')!.slots!.find(item => item.id === slot.id)!;
    expect(updated).toMatchObject({ status: 'completed', content: 'Keep these vocabulary notes', url: 'presentation-file:world-lit', publishClassIds: ['blue', 'red'] });
    const projected = projectCardMaterials(next);
    for (const code of ['WL-B', 'WL-R']) expect(projected.courses.find(course => course.classCode === code)!.presentations).toEqual([expect.objectContaining({ url: 'presentation-file:world-lit', publish: true })]);
    expect(projected.courses.find(course => course.classCode === 'AP')!.presentations.every(item => item.url !== 'presentation-file:world-lit')).toBe(true);
    expect(plan.weeklyResources!.find(item => item.id === resource.id)!.url).toBe('');
    const replacement = projectCardMaterials(attachVocabPresentation(next, 'WL', 'presentation-file:replacement'));
    expect(replacement.courses.find(course => course.classCode === 'WL-B')!.presentations).toHaveLength(1);
    expect(replacement.courses.find(course => course.classCode === 'WL-B')!.presentations[0].resourceId).toBe(projected.courses.find(course => course.classCode === 'WL-B')!.presentations[0].resourceId);
  });
  it('uploads from the preparation row and keeps edits made during upload', async () => {
    let finish!: (value: { url: string }) => void;
    execute.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    function Harness() { const [data, setData] = useState(fixture); return <PlannerPreparation data={data} units={[]} onChange={setData}/>; }
    render(<Harness/>);
    for (const label of ['AP Lang', 'World Lit', 'Ethics and Leadership']) expect(screen.getByRole('button', { name: `Upload ${label}` })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Upload AP Lang presentation'), { target: { files: [new File(['PK\x03\x04slides'], 'ap.pptx')] } });
    await vi.waitFor(() => expect(execute).toHaveBeenCalledWith(expect.objectContaining({ action: 'uploadPlannerPresentation', name: 'ap.pptx' })));
    fireEvent.click(screen.getByLabelText('Upload Lesson Plans'));
    await act(async () => { finish({ url: 'presentation-file:ap' }); });
    expect(screen.getByLabelText('Upload Lesson Plans')).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('AP Lang: ap.pptx attached');
    expect(screen.getByRole('button', { name: /Upload AP Lang/ })).toHaveTextContent('✓');
    expect(screen.getByLabelText('Vocab Presentations')).not.toBeChecked();
  });
  it('disables uploads for unmapped courses', () => {
    const data = fixture(); data.lessons.forEach(lesson => { lesson.classId = ''; });
    render(<PlannerPreparation data={data} units={[]} onChange={vi.fn()}/>);
    expect(screen.getByRole('button', { name: 'Upload World Lit' })).toBeDisabled();
    expect(() => attachVocabPresentation(data, 'WL', 'presentation-file:x')).toThrow('Map this course');
  });
  it('reports an upload failure without adding a presentation', async () => {
    const change = vi.fn(); execute.mockRejectedValueOnce(new Error('Upload unavailable'));
    render(<PlannerPreparation data={fixture()} units={[]} onChange={change}/>);
    fireEvent.change(screen.getByLabelText('Upload World Lit presentation'), { target: { files: [new File(['PK\x03\x04slides'], 'wl.pptx')] } });
    await vi.waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Upload unavailable'));
    expect(change).not.toHaveBeenCalled();
  });
});
