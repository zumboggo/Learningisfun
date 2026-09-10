import type { LessonPlan } from './planner.service';
import type { LessonSlot } from './unit-planning';

export const PRINT_ACTIVITY_LIMIT = 10;
export const PRINT_LESSON_LIMIT = 5;
export function compactPrintText(value: string, words = 5, characters = 100) {
  const plain = value.replace(/\s+/g, ' ').trim();
  const excerpt = plain.split(' ').slice(0, words).join(' ').slice(0, characters).trimEnd();
  return excerpt + (excerpt.length < plain.length ? '…' : '');
}
export function printLessonSlots(lesson: LessonPlan): LessonSlot[] {
  if (lesson.slots) return lesson.slots;
  return [['Settle',lesson.settle],['I do',lesson.iDo],['We do',lesson.weDo],['They do',lesson.theyDo],['Check',lesson.check],['Exit',lesson.exit]]
    .filter(([,content]) => content?.trim()).map(([title,content],i) => ({
      id:lesson.id+'-'+i,title,content,kind:'activity',minutes:0,url:'',optional:false,status:'planned',
    }));
}
// Keep teaching order, but omit optional filler before core resources when overloaded.
export function selectPrintActivities(slots: LessonSlot[], limit = PRINT_ACTIVITY_LIMIT) {
  const priority = (slot:LessonSlot) => slot.optional ? 2 : ['quiz','text','presentation','copywork'].includes(slot.kind) ? 0 : 1;
  const chosen = new Set(slots.map((slot,index)=>({slot,index})).sort((a,b)=>priority(a.slot)-priority(b.slot)||a.index-b.index).slice(0,limit).map(row=>row.index));
  return slots.filter((_,index)=>chosen.has(index));
}
export function printActivityText(slot: LessonSlot) {
  if (/^(i do|we do|they do|check|new activity|presentation(?: ·.*)?|copywork(?: ·.*)?)$/i.test(slot.title.trim()) && slot.content.trim()) {
    const detail = slot.content.replace(/^OPEN\s*·\s*Egan case deck\s*\([^)]*\):\s*/i,'');
    return {title: slot.title.split(' ·')[0]+': '+compactPrintText(detail), description:''};
  }
  const title = compactPrintText(slot.title, 12, 90);
  const description = /^(all weekly targets|all targets)$/i.test(slot.content.trim()) || slot.content.trim().startsWith(slot.title.trim()) ? '' : compactPrintText(slot.content);
  return {title, description};
}
