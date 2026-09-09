import type { LessonSlot } from './unit-planning';
import { routineNames } from './planner-routines';

export const isCopywork = (slot:LessonSlot) => slot.isCopywork ?? (slot.kind==='copywork' || slot.kind==='activity' && /\bcopywork\b/i.test(slot.title+' '+slot.content));
export const isAssignedReading = (slot:LessonSlot) => slot.assignedReading ?? Boolean(slot.existingTextId);
export const isQuiz = (slot:LessonSlot) => slot.kind==='quiz' || /^quiz$/i.test(slot.title.trim());
export function resourceCategory(slot:LessonSlot):'presentation'|'routine'|'text'|'activity' {
  if(isCopywork(slot) || slot.kind==='text')return 'text';
  if(slot.isRoutine || slot.kind==='activity' && routineNames.some(name=>name===slot.title))return 'routine';
  return slot.kind==='presentation'?'presentation':'activity';
}
export const resourceTitle = (slot:LessonSlot) => isQuiz(slot) ? 'Quiz' : isCopywork(slot) && /^(I do|We do|They do|Check)$/i.test(slot.title) ? 'Copywork' : slot.title;
export function resourceColor(slot:LessonSlot) {
  if(isQuiz(slot))return 'border-rose-300 bg-rose-50 text-rose-950';
  const category=resourceCategory(slot);
  if(category==='text')return isAssignedReading(slot)?'border-blue-600 bg-blue-800 text-white':'border-blue-300 bg-blue-50 text-blue-950';
  if(category==='routine')return 'border-amber-300 bg-amber-50 text-amber-950';
  if(category==='presentation')return 'border-purple-300 bg-purple-50 text-purple-950';
  return 'border-emerald-300 bg-emerald-50 text-emerald-950';
}
export function resourcePriority(slot:LessonSlot) { return isQuiz(slot)?-2:resourceCategory(slot)==='text' && isAssignedReading(slot)?-1:0; }
