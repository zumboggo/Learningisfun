import type { LearningText, TextAssignment } from '@/types';
import type { WeeklyPlanData } from './planner.service';
import { prepareWeeklyBank } from './planner-bank';
import { courseCode } from './unit-planning';

/** Import reading links, not copies of student-facing texts. Preserve teacher edits. */
export function addAssignedTexts(data: WeeklyPlanData, texts: LearningText[], assignments: TextAssignment[], baseUrl: string): WeeklyPlanData {
  const next = prepareWeeklyBank(data);
  const end = new Date(data.week.startDate+'T00:00:00Z'); end.setUTCDate(end.getUTCDate()+7);
  const endDate = end.toISOString().slice(0,10);
  for (const assignment of assignments) {
    const date = assignment.assignedAt.slice(0,10);
    if (date < data.week.startDate || date >= endDate) continue;
    const lesson = data.lessons.find(item => item.classId === assignment.classId);
    const text = texts.find(item => item.$id === assignment.textId && item.status !== 'archived');
    if (!lesson || !text) continue;
    const course = courseCode(lesson.classCode), id = `assigned-${course}-${text.$id}`;
    if (next.dismissedAssignedTexts?.includes(id) || next.weeklyResources!.some(item => item.id === id || item.course === course && item.existingTextId === text.$id)) continue;
    const url = new URL(baseUrl); url.hash = `/texts/${text.$id}`;
    next.weeklyResources!.push({ id, course, existingTextId:text.$id, assignedReading:true, resourceId:id, title:text.title, content:text.author ? `By ${text.author}` : '', url:url.href, kind:'text', minutes:0, optional:false, publish:true, status:'planned' });
  }
  return next;
}
