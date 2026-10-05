import { mergePlannerQuizzes } from './planner-quizzes';
import { isTextDiscussion } from './planner-routines';
import type { WeeklyPlanData } from './planner.service';
import { courseCode, type LessonSlot } from './unit-planning';

export interface WeeklyResource extends LessonSlot { course: string; sourceWeek?: string }

// Only content belongs to the resource. Placement ID, source ID and completion
// stay with the individual lesson, including historical completed placements.
const contentKeys = ['publishClassIds','existingTextId','isRoutine','isCopywork','assignedReading','activityType','title','kind','content','url','minutes','optional','publish','givenBy','dueDate'] as const;
export function resourceContent(slot: Partial<LessonSlot>): Partial<LessonSlot> {
  return Object.fromEntries(contentKeys.map(key=>[key,slot[key]]));
}
function signature(slot: LessonSlot) {
  return JSON.stringify(contentKeys.map(key=>key==='publishClassIds' ? [...(slot.publishClassIds||[])].sort() : slot[key]));
}

/** One bank per course/week. Existing divergent edits remain distinct resources. */
export function prepareWeeklyBank(data: WeeklyPlanData): WeeklyPlanData {
  const next = mergePlannerQuizzes(data);
  next.weeklyResources ||= [];
  for (const lesson of next.lessons) for (const slot of [...(lesson.slots||[]),...(lesson.overflow||[])]) {
    if(isTextDiscussion(slot)){slot.title='Text Discussion';slot.isRoutine=true;}
  }
  for (const lesson of next.lessons) {
    for (const slot of [...(lesson.slots || []), ...(lesson.overflow || [])]) {
      const course = courseCode(lesson.classCode);
      const existing = next.weeklyResources.find(item => item.id === slot.planningItemId && item.course === course);
      if (existing) {
        Object.assign(slot, resourceContent(existing));
        continue;
      }
      let item = next.weeklyResources.find(item => item.course === course && signature(item) === signature(slot));
      if (!item) {
        item = { ...slot, parentTextId: undefined, id: `bank-${slot.id}`, course };
        next.weeklyResources.push(item);
      }
      slot.planningItemId = item.id;
      Object.assign(slot, resourceContent(item));
    }
  }
  // Merge old routine names while retaining lesson IDs, completion and notes.
  for (const course of new Set(next.weeklyResources.map(item=>item.course))) {
    const discussions: WeeklyResource[] = next.weeklyResources.filter(item=>item.course===course && isTextDiscussion(item));
    const canonical = discussions.find(item=>item.title==='Text Discussion') || discussions[0];
    if (!canonical) continue;
    canonical.title='Text Discussion'; canonical.isRoutine=true;
    canonical.content=[...new Set(discussions.flatMap(item=>[item.content,item.url!==canonical.url?item.url:'']).filter(Boolean))].join('\n\n');
    const ids: Set<string>=new Set(discussions.map(item=>item.id));
    next.weeklyResources=next.weeklyResources.filter(item=>!ids.has(item.id)||item.id===canonical.id);
    for (const lesson of next.lessons) for (const slot of [...(lesson.slots||[]),...(lesson.overflow||[])]) {
      if (slot.planningItemId && ids.has(slot.planningItemId) && courseCode(lesson.classCode)===course) {slot.planningItemId=canonical.id;Object.assign(slot,resourceContent(canonical));}
    }
  }
  return next;
}

export function editWeeklyResource(data: WeeklyPlanData, id: string, update: Partial<LessonSlot>): WeeklyPlanData {
  const next = prepareWeeklyBank(data);
  const item = next.weeklyResources!.find(item => item.id === id);
  if (!item) return data;
  // Identity and each lesson's completion belong to the placement, not the content.
  const content = Object.fromEntries(contentKeys.filter(key=>Object.hasOwn(update,key)).map(key=>[key,update[key]]));
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
