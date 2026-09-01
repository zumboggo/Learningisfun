import { account } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateId, getTimestamp } from '@/utils/helpers';

export interface WritingErrorLogEntry {
  id: string;
  problem: string;
  fix: string;
  source: 'manual' | 'ai';
  createdAt: string;
}

export interface WritingErrorLogSuggestion {
  problem: string;
  fix: string;
}

const preferenceKey = 'writingErrorLog';
const cacheKey = (userId: string) => `writingErrorLog_${userId}`;
const MAX_ROWS = 50;
const MAX_CELL_LENGTH = 500;

function cleanRows(value: unknown): WritingErrorLogEntry[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_ROWS).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Partial<WritingErrorLogEntry>;
    const problem = String(row.problem || '').trim().slice(0, MAX_CELL_LENGTH);
    const fix = String(row.fix || '').trim().slice(0, MAX_CELL_LENGTH);
    if (!problem && !fix) return [];
    return [{
      id: String(row.id || generateId()),
      problem,
      fix,
      source: row.source === 'ai' ? 'ai' as const : 'manual' as const,
      createdAt: String(row.createdAt || getTimestamp()),
    }];
  });
}

export function newErrorLogEntry(source: 'manual' | 'ai' = 'manual'): WritingErrorLogEntry {
  return { id: generateId(), problem: '', fix: '', source, createdAt: getTimestamp() };
}

export async function readCachedErrorLog(userId: string): Promise<WritingErrorLogEntry[]> {
  const cached = await db.app_metadata.get(cacheKey(userId));
  if (!cached) return [];
  try { return cleanRows(JSON.parse(cached.value)); }
  catch { return []; }
}

export async function refreshErrorLog(userId: string): Promise<WritingErrorLogEntry[]> {
  const cached = await readCachedErrorLog(userId);
  try {
    const preferences = await account.getPrefs<Record<string, unknown>>();
    if (!(preferenceKey in preferences)) return cached;
    const rows = cleanRows(preferences[preferenceKey]);
    await db.app_metadata.put({ key: cacheKey(userId), value: JSON.stringify(rows) });
    return rows;
  } catch {
    return cached;
  }
}

export async function saveErrorLog(userId: string, rows: WritingErrorLogEntry[]): Promise<{ rows: WritingErrorLogEntry[]; synced: boolean }> {
  const cleaned = cleanRows(rows);
  await db.app_metadata.put({ key: cacheKey(userId), value: JSON.stringify(cleaned) });
  try {
    const preferences = await account.getPrefs<Record<string, unknown>>();
    await account.updatePrefs({ prefs: { ...preferences, [preferenceKey]: cleaned } });
    return { rows: cleaned, synced: true };
  } catch {
    return { rows: cleaned, synced: false };
  }
}

export async function appendErrorLogSuggestions(userId: string, suggestions: WritingErrorLogSuggestion[]): Promise<{ added: number; synced: boolean }> {
  const existing = await refreshErrorLog(userId);
  const keys = new Set(existing.map(row => `${row.problem.toLocaleLowerCase()}\n${row.fix.toLocaleLowerCase()}`));
  const additions = suggestions.flatMap(suggestion => {
    const problem = suggestion.problem.trim().slice(0, MAX_CELL_LENGTH);
    const fix = suggestion.fix.trim().slice(0, MAX_CELL_LENGTH);
    const key = `${problem.toLocaleLowerCase()}\n${fix.toLocaleLowerCase()}`;
    if ((!problem && !fix) || keys.has(key)) return [];
    keys.add(key);
    return [{ ...newErrorLogEntry('ai'), problem, fix }];
  });
  const result = await saveErrorLog(userId, [...existing, ...additions].slice(0, MAX_ROWS));
  return { added: additions.length, synced: result.synced };
}
