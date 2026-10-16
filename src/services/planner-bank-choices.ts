import { isQuiz, resourceCategory } from './planner-appearance';
import type { WeeklyResource } from './planner-bank';
import { resourceSlot, type LessonSlot, type UnitResource } from './unit-planning';

const words = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Trim redundant bank suggestions without changing saved lesson placements. */
export function plannerBankChoices(items: WeeklyResource[], resources: UnitResource[]) {
  const texts = [...items, ...resources.map(resourceSlot)].filter(item => resourceCategory(item) === 'text');
  const visible = (item: LessonSlot, course?: string) => {
    if (item.kind === 'presentation' && item.optional) return false;
    if (resourceCategory(item) !== 'activity' || isQuiz(item)) return true;
    const description = `${item.title} ${item.content}`;
    if (/\bcheck\s+(?:the\s+)?weekly\s+due\s+list\b/i.test(description)) return false;
    if (/\bchoose\s+from\s+(?:the\s+)?weekly\s+activity\s+menu\b/i.test(description)) return false;
    if (item.optional && /\bpresentations?\b/i.test(description) || /\boptional\s+presentations?\b|\bpresentations?\s*\(optional\)/i.test(description)) return false;
    if (/\bthis\s+week\s*:\s*(?:Q|Quiz)\s+\d{1,2}\/\d{1,2}\b/i.test(description)) return false;
    const normalized = ` ${words(description)} `;
    return !texts.some(text => (!course || !('course' in text) || text.course === course) && words(text.title) && normalized.includes(` ${words(text.title)} `));
  };
  return {
    items: items.filter(item => visible(item, item.course)),
    resources: resources.filter(item => visible(resourceSlot(item))),
  };
}
