import { describe, it, expect } from 'vitest';
import { isRetiredActivity, removeRetiredActivities } from '../services/planner-retired-activities';
import type { LessonSlot } from '../services/unit-planning';
import type { WeeklyPlanData } from '../services/planner.service';
const slot = (content: string, extra = {}) => ({ id: 'a', title: 'They do', kind: 'activity', content, url: '', ...extra } as LessonSlot);
describe('retired green planner prompts', () => {
  it('removes selected prompts from banks, placements and legacy source fields idempotently', () => {
    const removed = slot('Plan the response. Planning only.');
    const kept = slot('Story circles — five rotating roles');
    const plan = { weeklyResources: [removed, kept], lessons: [{ slots: [removed, kept], overflow: [removed], theyDo: removed.content }], cancelledLessons: [{ slots: [removed] }] } as unknown as WeeklyPlanData;
    removeRetiredActivities(plan);
    expect(plan.weeklyResources).toEqual([kept]);
    expect(plan.lessons[0].slots).toEqual([kept]);
    expect(plan.lessons[0].overflow).toEqual([]);
    expect(plan.lessons[0].theyDo).toBe('');
    expect(plan.cancelledLessons![0].slots).toEqual([]);
    expect(removeRetiredActivities(structuredClone(plan))).toEqual(plan);
  });
  it('preserves leadership practice, story circles, edited prompts and dedicated materials', () => {
    for (const content of ['Student-led case presentations, or a live leadership practice task with observed feedback.', 'Story circles — five rotating roles: Discussion Leader, Passage Picker, Connector, Vocabulary Enricher, Illustrator/Poster Lead. Chapter posters built.', 'Plan the response. Planning only. Add your own example.']) expect(isRetiredActivity(slot(content))).toBe(false);
    for (const extra of [{isRoutine:true},{kind:'quiz'},{kind:'text'},{url:'https://example.com'},{isCopywork:true}]) expect(isRetiredActivity(slot('Peer feedback in the app.',extra))).toBe(false);
  });
});
