import type { WeeklyPlanData } from './planner.service';
import type { LessonSlot } from './unit-planning';
import { prepareWeeklyBank } from './planner-bank';

export interface CardSelection { slot: LessonSlot; from?: string; index?: number }
/** Restore card placement only, preserving later text edits and unrelated weekly settings. */
export function undoPlannerPlacement(current: WeeklyPlanData, before: WeeklyPlanData): WeeklyPlanData {
  const next = structuredClone(current);
  const live = new Map(current.lessons.flatMap(lesson=>[...(lesson.slots||[]),...(lesson.overflow||[])]).map(slot=>[slot.id,slot]));
  for(const lesson of next.lessons) {
    const old=before.lessons.find(row=>row.id===lesson.id); if(!old)continue;
    lesson.slots=old.slots?.map(slot=>structuredClone(live.get(slot.id)||slot));
    lesson.overflow=old.overflow?.map(slot=>structuredClone(live.get(slot.id)||slot));
  }
  return current.weeklyResources ? prepareWeeklyBank(next) : next;
}
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
