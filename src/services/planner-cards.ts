import type { WeeklyPlanData } from './planner.service';
import type { LessonSlot } from './unit-planning';
import { isTextDiscussion } from './planner-routines';
import { isAssignedReading, resourceCategory } from './planner-appearance';
import { prepareWeeklyBank } from './planner-bank';

/** Keep each discussion directly below its text, even when readings sort first. */
export function orderedLessonSlots(slots: LessonSlot[]) {
  const rows=slots.map((slot,index)=>({slot,index}));
  const attached=new Set(slots.filter(slot=>slot.parentTextId && slots.some(parent=>parent.id===slot.parentTextId)).map(slot=>slot.id));
  return rows.filter(row=>!attached.has(row.slot.id))
    .sort((a,b)=>Number(isAssignedReading(b.slot))-Number(isAssignedReading(a.slot)))
    .flatMap(row=>[row,...rows.filter(child=>child.slot.parentTextId===row.slot.id)]);
}

export function removeLessonCard(slots: LessonSlot[], id: string) {
  return slots.filter(slot=>slot.id!==id).map(slot=>slot.parentTextId===id?{...slot,parentTextId:undefined}:slot);
}

export interface CardSelection { slot: LessonSlot; from?: string; index?: number }
/** Restore card placement only, preserving later text edits and unrelated weekly settings. */
export function undoPlannerPlacement(current: WeeklyPlanData, before: WeeklyPlanData): WeeklyPlanData {
  const next = structuredClone(current);
  const live = new Map(current.lessons.flatMap(lesson=>[...(lesson.slots||[]),...(lesson.overflow||[])]).map(slot=>[slot.id,slot]));
  for(const lesson of next.lessons) {
    const old=before.lessons.find(row=>row.id===lesson.id); if(!old)continue;
    lesson.slots=old.slots?.map(slot=>({...structuredClone(live.get(slot.id)||slot),parentTextId:slot.parentTextId}));
    lesson.overflow=old.overflow?.map(slot=>({...structuredClone(live.get(slot.id)||slot),parentTextId:slot.parentTextId}));
  }
  return current.weeklyResources ? prepareWeeklyBank(next) : next;
}
export function placePlannerCard(data: WeeklyPlanData, selection: CardSelection, lessonId: string, index: number, parentTextId?: string): WeeklyPlanData {
  const next = structuredClone(data);
  const destination = next.lessons.find(lesson => lesson.id === lessonId);
  if (!destination) return data;
  const parent=parentTextId?destination.slots?.find(slot=>slot.id===parentTextId):undefined;
  if(parentTextId && (!parent || resourceCategory(parent)!=='text' || !isTextDiscussion(selection.slot)))return data;
  let slot: LessonSlot;
  let children: LessonSlot[];
  if (selection.from !== undefined) {
    const source = next.lessons.find(lesson => lesson.id === selection.from);
    const sourceIndex = selection.index;
    if (!source || sourceIndex === undefined || source.slots?.[sourceIndex]?.id !== selection.slot.id) return data;
    const removedBefore=source===destination?source.slots.slice(0,index).filter(item=>item.id===selection.slot.id||item.parentTextId===selection.slot.id).length:0;
    [slot] = source.slots.splice(sourceIndex, 1);
    children=source.slots.filter(child=>child.parentTextId===slot.id);
    source.slots=source.slots.filter(child=>child.parentTextId!==slot.id);
    index-=removedBefore;
  } else {
    slot = { ...structuredClone(selection.slot), id: crypto.randomUUID(), status: 'planned' };
    children=data.lessons.flatMap(lesson=>lesson.slots||[]).filter(child=>child.parentTextId===selection.slot.id)
      .map(child=>({...structuredClone(child),id:crypto.randomUUID(),parentTextId:slot.id,status:'planned'}));
  }
  slot.parentTextId=parent?.id;
  destination.slots ||= [];
  if(parent) index=destination.slots.findIndex(item=>item.id===parent.id)+1;
  else if(destination.slots[index]?.parentTextId) {
    const group=destination.slots[index].parentTextId;
    while(destination.slots[index]?.parentTextId===group)index++;
  }
  destination.slots.splice(Math.max(0, Math.min(index, destination.slots.length)), 0, slot,...children);
  return next;
}
