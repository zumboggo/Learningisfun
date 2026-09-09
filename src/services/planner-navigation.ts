import type { PlannerWeekSource } from './planner-parser';

export function plannerMonday(now = new Date(), offset = 0): string {
  const date = new Date(`${new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7) + offset * 7);
  return date.toISOString().slice(0,10);
}
export function nearestPlannerWeek(weeks: PlannerWeekSource[], date: string) {
  const sorted = [...weeks].sort((a,b)=>a.startDate.localeCompare(b.startDate));
  return sorted.find(week=>week.startDate>=date) || sorted.at(-1);
}
export function recallPlannerChoice(key: string, valid: string[], fallback: string) {
  try { const saved = localStorage.getItem(key); return saved && valid.includes(saved) ? saved : fallback; } catch { return fallback; }
}
export function rememberPlannerChoice(key: string, value: string) { try { localStorage.setItem(key,value); } catch { /* Navigation still works without storage. */ } }
