import type { WeeklyPlanData } from './planner.service';
import type { LessonSlot } from './unit-planning';

export interface CardSelection { slot: LessonSlot; from?: string; index?: number }
export function placePlannerCard(data: WeeklyPlanData, selection: CardSelection, lessonId: string, index: number): WeeklyPlanData {
  const next = structuredClone(data);
  const destination = next.lessons.find(lesson => lesson.id === lessonId);
  if (!destination) return data;
  let slot: LessonSlot;
  if (selection.from !== undefined) {
    const source = next.lessons.find(lesson => lesson.id === selection.from);
    const sourceIndex = selection.index;
    if (!source || sourceIndex === undefined || source.slots?.[sourceIndex]?.id !== selection.slot.id) return data;
    [slot] = source.slots.splice(sourceIndex, 1);
    if (source === destination && sourceIndex < index) index--;
  } else slot = { ...structuredClone(selection.slot), id: crypto.randomUUID(), status: 'planned' };
  destination.slots ||= [];
  destination.slots.splice(Math.max(0, Math.min(index, destination.slots.length)), 0, slot);
  return next;
}
