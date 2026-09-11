// School calendar uses China Standard Time, regardless of the viewer's device.
export function textReleaseAt(dueDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate || '')) throw new Error('Choose a valid reading date.');
  const day = new Date(`${dueDate}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0,10) !== dueDate) throw new Error('Choose a valid reading date.');
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay()+6)%7 - 3);
  day.setUTCHours(9); // Friday 17:00 Asia/Shanghai
  return day.toISOString();
}
export function textAssignmentAvailable(assignment, now = Date.now()) {
  if (!assignment.dueDate) return true; // Existing, undated assignments stay visible.
  try { return Date.parse(textReleaseAt(assignment.dueDate)) <= now; } catch { return false; }
}
