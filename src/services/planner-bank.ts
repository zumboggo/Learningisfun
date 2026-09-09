import type { WeeklyPlanData } from './planner.service';
import { courseCode, type LessonSlot } from './unit-planning';

export interface WeeklyResource extends LessonSlot { course: string }

/** One bank per course/week. Existing divergent edits remain distinct resources. */
export function prepareWeeklyBank(data: WeeklyPlanData): WeeklyPlanData {
  const next = structuredClone(data);
  next.weeklyResources ||= [];
  for (const lesson of next.lessons) {
    for (const slot of [...(lesson.slots || []), ...(lesson.overflow || [])]) {
      const existing = next.weeklyResources.find(item => item.id === slot.planningItemId);
      if (existing) {
        const { activityType, title, kind, content, url, minutes, optional, publish, givenBy, dueDate } = existing;
        Object.assign(slot, { activityType, title, kind, content, url, minutes, optional, publish, givenBy, dueDate });
        continue;
      }
      const course = courseCode(lesson.classCode);
      const signature = (item: LessonSlot) => JSON.stringify([item.activityType,item.kind,item.title,item.content,item.url,item.minutes,item.optional,item.publish,item.givenBy,item.dueDate]);
      let item = next.weeklyResources.find(item => item.course === course && signature(item) === signature(slot));
      if (!item) {
        item = { ...slot, id: `bank-${slot.id}`, course };
        next.weeklyResources.push(item);
      }
      slot.planningItemId = item.id;
    }
  }
  return next;
}

export function editWeeklyResource(data: WeeklyPlanData, id: string, update: Partial<LessonSlot>): WeeklyPlanData {
  const next = prepareWeeklyBank(data);
  const item = next.weeklyResources!.find(item => item.id === id);
  if (!item) return data;
  // Identity and each lesson's completion belong to the placement, not the content.
  const { id: ignoredId, resourceId: ignoredSource, planningItemId: ignoredLink, status: ignoredStatus, ...content } = update;
  void ignoredId; void ignoredSource; void ignoredLink; void ignoredStatus;
  Object.assign(item, content);
  for (const lesson of next.lessons) for (const slot of [...(lesson.slots || []), ...(lesson.overflow || [])]) {
    if (slot.planningItemId === id) Object.assign(slot, content);
  }
  return next;
}

export function shortWords(text: string, limit: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, limit).join(' ') + (words.length > limit ? '…' : '');
}
