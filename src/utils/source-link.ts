export function validOptionalSourceLink(title: string, url: string): boolean {
  if (!title.trim() && !url.trim()) return true;
  if (!title.trim() || !url.trim()) return false;
  try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; }
}
