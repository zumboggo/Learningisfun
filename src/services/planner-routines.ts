import type { LessonSlot } from './unit-planning';

export const routineNames = ['QFT', 'Copywork', 'Popup Debate', 'Close Read', 'Presentations', 'Experiments'] as const;
export function routineSlot(title: typeof routineNames[number]): LessonSlot {
  return { id: `routine-${title}`, title, kind: title === 'Presentations' ? 'presentation' : title === 'Copywork' ? 'copywork' : 'activity', content: '', url: '', minutes: 10, optional: false, status: 'planned' };
}
