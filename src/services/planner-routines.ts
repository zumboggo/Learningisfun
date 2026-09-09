import type { LessonSlot } from './unit-planning';

export const routineNames = ['QFT', 'Popup Debate', 'TQE', 'Experiments'] as const;
export function routineSlot(title: typeof routineNames[number]): LessonSlot {
  return { id: `routine-${title}`, title, kind: 'activity', isRoutine: true, content: '', url: '', minutes: 10, optional: false, status: 'planned' };
}
