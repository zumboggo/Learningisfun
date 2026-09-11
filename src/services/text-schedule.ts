export { textAssignmentAvailable, textReleaseAt } from '../../functions/learning-content/src/text-schedule.js';
export function textSchedule(dueDate: string, assignedAt = new Date().toISOString()) {
  return { dueDate, assignedAt: dueDate ? `${dueDate}T12:00:00+08:00` : assignedAt };
}
