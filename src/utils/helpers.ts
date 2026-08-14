import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateDeviceId(): string {
  const stored = localStorage.getItem('edu_spark_device_id');
  if (stored) return stored;
  const id = uuidv4();
  localStorage.setItem('edu_spark_device_id', id);
  return id;
}

export function getTimestamp(): string {
  return new Date().toISOString();
}

export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * How a class is named everywhere it has to be picked out of a list.
 *
 * A section on its own ("Section 1") is ambiguous once a teacher runs the same
 * section number in two courses, so the course always comes first.
 */
export function classLabel(cls: { courseName?: string; name?: string } | null | undefined): string {
  if (!cls) return 'Class';
  const course = (cls.courseName || '').trim();
  const section = (cls.name || '').trim();
  if (course && section) return `${course} · ${section}`;
  return course || section || 'Class';
}

/**
 * Split a comma/semicolon separated tag string into clean tags.
 * Collapses inner whitespace and drops case-insensitive duplicates so
 * "vocab, Vocab" does not become two separate tags.
 */
export function parseTags(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value.split(/[;,]/)) {
    const tag = raw.trim().replace(/\s+/g, ' ');
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
