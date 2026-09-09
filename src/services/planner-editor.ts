import type { WeeklyPlanData } from './planner.service';
import type { LessonSlot } from './unit-planning';

/** Import legacy choices once; afterward cards are the only editable source. */
export function migrateCardEditor(data: WeeklyPlanData): WeeklyPlanData {
  if (data.cardEditorVersion === 1) return data;
  const next = structuredClone(data);
  for (const course of next.courses) {
    const lessons = next.lessons.filter(lesson => lesson.classCode === course.classCode);
    if (!lessons.length) continue;
    for (const [kind, items] of [['text', course.texts], ['presentation', course.presentations]] as const) {
      for (const item of items) {
        const lesson = lessons.find(row => row.date === item.date) || lessons[0];
        const all = [...(lesson.slots || []), ...(lesson.overflow || [])];
        const found = all.find(slot => slot.kind === kind && (item.resourceId ? slot.resourceId === item.resourceId : slot.title === item.title));
        if (found) { found.resourceId ||= item.resourceId || item.title; found.publish ??= item.publish; found.givenBy ??= 'givenBy' in item ? item.givenBy : ''; continue; }
        const slot: LessonSlot = { id: crypto.randomUUID(), resourceId: item.resourceId || item.title, kind, title: item.title, content: 'content' in item ? item.content || '' : '', url: item.url, minutes: 10, optional: false, status: 'planned', publish: item.publish, givenBy: 'givenBy' in item ? item.givenBy : '', dueDate: item.date };
        lesson.overflow ||= []; lesson.overflow.push(slot);
      }
    }
    for (const extra of next.extras.filter(extra => extra.courseCode === course.classCode)) {
      const destinations = lessons.filter(lesson => lesson.extraActivityIds.includes(extra.id) || extra.lessonDates.includes(lesson.date));
      for (const lesson of destinations.length ? destinations : [lessons[0]]) {
        const slot: LessonSlot = { id: crypto.randomUUID(), kind: 'activity', title: extra.label, content: extra.target || '', url: '', minutes: 10, optional: false, status: 'planned' };
        if (destinations.length) { lesson.slots ||= []; lesson.slots.push(slot); }
        else { lesson.overflow ||= []; lesson.overflow.push(slot); }
      }
    }
  }
  next.cardEditorVersion = 1;
  return next;
}

export function projectCardMaterials(data: WeeklyPlanData): WeeklyPlanData {
  const next = structuredClone(data);
  for (const course of next.courses) {
    course.texts = []; course.presentations = [];
    for (const lesson of next.lessons.filter(row => row.classCode === course.classCode)) {
      for (const slot of [...(lesson.slots || []), ...(lesson.overflow || [])]) {
        const common = { resourceId: slot.resourceId || slot.id, title: slot.title, date: slot.dueDate || lesson.date, url: slot.url, publish: slot.publish !== false };
        if (slot.kind === 'text' && !slot.existingTextId) course.texts.push({ ...common, content: slot.content });
        if (slot.kind === 'presentation') course.presentations.push({ ...common, givenBy: slot.givenBy || 'teacher' });
      }
      lesson.texts = course.texts.filter(item => item.date === lesson.date).map(item => item.title);
      lesson.presentations = course.presentations.filter(item => item.date === lesson.date && item.publish).map(item => item.title);
    }
  }
  // Legacy extra choices were copied to cards during migration.
  next.extras = [];
  return next;
}
