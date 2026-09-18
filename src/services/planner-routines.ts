import type { LessonSlot } from './unit-planning';

export const routineNames = ['QFT', 'Popup Debate', 'TQE', 'Experiments', 'Written Discussion', 'Text Rendering', 'Microlabs', 'Show Call', 'Copywork Analysis'] as const;
export function routineSlot(title: typeof routineNames[number]): LessonSlot {
  return { id: `routine-${title}`, title, kind: 'activity', isRoutine: true, isCopywork: false, content: '', url: '', minutes: 10, optional: false, status: 'planned' };
}
