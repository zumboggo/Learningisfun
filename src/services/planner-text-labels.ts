import type {LessonSlot} from './unit-planning';
import {isCopywork,resourceTitle} from './planner-appearance';
export type PlannerTextLabel='copywork'|'assigned';
export const textLabelDragType='application/planning-text-label';
export const isPlannerTextLabel=(value:string):value is PlannerTextLabel=>value==='copywork'||value==='assigned';
export const textLabelUpdate=(label:PlannerTextLabel)=>label==='copywork'?{isCopywork:true}:{assignedReading:true};
// Old copywork placeholders are replaced by the label tool; actual texts remain.
export const isCopyworkPlaceholder=(slot:LessonSlot)=>isCopywork(slot)&&resourceTitle(slot).trim().toLowerCase()==='copywork'&&!slot.url&&!slot.existingTextId;
