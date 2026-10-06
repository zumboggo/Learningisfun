import type { WeeklyPlanData } from './planner.service';
import { preparePlannerStarters } from './planner-starters';
import { editWeeklyResource } from './planner-bank';
import { courseCode } from './unit-planning';

export const vocabPresentationCourses = [
  { code: 'AP', label: 'AP Lang' },
  { code: 'WL', label: 'World Lit' },
  { code: 'ETH', label: 'Ethics and Leadership' },
] as const;

export function vocabPresentationClassIds(data: WeeklyPlanData, course: string): string[] {
  return [...new Set([...data.lessons, ...(data.cancelledLessons || [])]
    .filter(lesson => courseCode(lesson.classCode) === course && lesson.classId)
    .map(lesson => lesson.classId))];
}

/** Attach to the course's existing vocabulary cards, preserving their lesson details. */
export function attachVocabPresentation(data: WeeklyPlanData, course: string, url: string): WeeklyPlanData {
  let next = preparePlannerStarters(data);
  const classIds = vocabPresentationClassIds(next, course);
  if (!classIds.length) throw new Error('Map this course to a class before uploading its presentation.');
  const items = next.weeklyResources!.filter(item => item.course === course && item.kind === 'presentation' && item.title.trim().toLowerCase() === 'vocab presentation');
  if (!items.length) {
    const item = { id: `preparation-vocab:${course}`, course, kind: 'presentation' as const, title: 'Vocab Presentation', content: '', url: '', minutes: 10, optional: false, status: 'planned' as const };
    next.weeklyResources!.push(item); items.push(item);
  }
  for (const item of items) next = editWeeklyResource(next, item.id, { url, publish: true, publishClassIds: classIds });
  return next;
}
