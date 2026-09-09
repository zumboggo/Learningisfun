import type { WeeklyPlanData } from './planner.service';

export const plannerOrder: Record<string, number> = { 'WL-B': 0, 'WL-R': 1, ETH: 2, AP: 3 };
export const plannerLabel: Record<string, string> = { 'WL-B': 'World Lit Blue', 'WL-R': 'World Lit Red', ETH: 'Ethics', AP: 'AP Lang' };
export const progressLabels = { on_track: 'On Track', partial: '1 Class Behind', behind: '2 Classes Behind' } as const;
export const preparationCode = (code: string) => code.startsWith('WL-') ? 'WL' : code;

/** Upgrade the weekly UI without overwriting lesson edits or manual tasks. */
export function normalizePlan(value: WeeklyPlanData): WeeklyPlanData {
  const data = structuredClone(value);
  data.week.blocks.sort((a,b) => (plannerOrder[a.code] ?? 99) - (plannerOrder[b.code] ?? 99));
  data.courses.sort((a,b) => (plannerOrder[a.classCode] ?? 99) - (plannerOrder[b.classCode] ?? 99));
  data.preparation = data.preparation.filter(task =>
    !/^(quiz-results-|add-cards-|cards-)/.test(task.id) &&
    !/^(Check quiz|Remind students:|Prepare presentation:)/i.test(task.label));
  if (!data.preparation.some(task => task.id === 'flashcards-updated')) {
    data.preparation.unshift({ id: 'flashcards-updated', label: 'Flashcards Updated', kind: 'other', status: 'todo' });
  }
  const oldWorldLit = data.preparation.filter(task => ['prepare-presentation-WL-B', 'prepare-presentation-WL-R'].includes(task.id));
  data.preparation = data.preparation.filter(task => !oldWorldLit.includes(task));
  for (const block of data.week.blocks) {
    const code = preparationCode(block.code);
    if (!data.preparation.some(task => task.id === `prepare-presentation-${code}`)) {
      data.preparation.push({ id: `prepare-presentation-${code}`, label: `Prepare Presentation · ${code === 'WL' ? 'World Lit' : plannerLabel[code] || block.label}`, kind: 'presentation', classCode: code, status: code === 'WL' && oldWorldLit.some(task => task.status === 'ready') ? 'ready' : 'todo' });
    }
  }
  return data;
}
