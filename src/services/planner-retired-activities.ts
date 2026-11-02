import type { LessonSlot } from './unit-planning';
import type { WeeklyPlanData } from './planner.service';

// David's November 2026 selection: retire these imported green prompts only.
// Story circles, leadership practice, dedicated routines and custom work remain.
const retired = new Set([
  'Suggested classroom check; use the Canvas deadlines above for submissions.',
  'Develop the current posted work; follow its specific submission and feedback requirements (§11).',
  'Plan the response. Planning only.',
  'Plan your response to the case. Planning only.',
  "Plan the fortnight's written response. Planning only — no drafting yet.",
  'Pop-up debate — I lead the first few, then you do. Socratic seminar in Units 1 and 4.',
  'Pop-up debate — you are assigned the position you do NOT hold. Teacher-led early, student-led thereafter.',
  "Pop-up debate on the fortnight's question. Teacher-led early in the year, student-led thereafter.",
  'Work through the text read in advance — QFT at unit openings, close reading otherwise.',
  'Whole-class work on the text read in advance — QFT at a unit opening, close-reading seminar otherwise.',
  '10-minute teaching presentations — one student or a small team teaches the rest of us.',
  'QFT on the opposition the case leaves open — students generate, vote, discuss the top questions.',
  'Draft your case decision tonight.',
  'Read ahead for the next circle.',
  'Peer feedback in the app.',
].map(normalize));
function normalize(value: string) { return value.trim().replace(/\s+/g, ' ').toLowerCase(); }
export const isRetiredActivityText = (value: string) => retired.has(normalize(value));
export const isRetiredActivity = (slot: LessonSlot) => slot.kind === 'activity' && !slot.isRoutine && !slot.isCopywork && !slot.assignedReading && !slot.existingTextId && !slot.url && isRetiredActivityText(slot.content || slot.title);

/** Mutate only the requested imported prompts, retaining all other plan fields. */
export function removeRetiredActivities(data: WeeklyPlanData): WeeklyPlanData {
  if (data.weeklyResources) data.weeklyResources = data.weeklyResources.filter(slot => !isRetiredActivity(slot));
  for (const lesson of [...data.lessons, ...(data.cancelledLessons || [])]) {
    if (lesson.slots) lesson.slots = lesson.slots.filter(slot => !isRetiredActivity(slot));
    if (lesson.overflow) lesson.overflow = lesson.overflow.filter(slot => !isRetiredActivity(slot));
    for (const key of ['iDo', 'weDo', 'theyDo', 'check'] as const) if (isRetiredActivityText(lesson[key] || '')) lesson[key] = '';
  }
  return data;
}
