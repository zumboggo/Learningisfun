import type { LessonSlot } from './unit-planning';

export const routineNames = ['QFT', 'Popup Debate', 'Text Discussion', 'Experiments', 'Text Rendering', 'Microlabs', 'Show Call', 'Copywork Analysis'] as const;
export function routineSlot(title: typeof routineNames[number]): LessonSlot {
  return { id: `routine-${title}`, title, kind: 'activity', isRoutine: true, isCopywork: false, content: '', url: '', minutes: 10, optional: false, status: 'planned' };
}

export const isTextDiscussion = (slot: LessonSlot) => slot.kind === 'activity' && /^(Text Discussion|TQE|Written Discussion)$/i.test(slot.title.trim());
