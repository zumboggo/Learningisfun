import { syncClassSessionsFromServer } from '@/services/class-session.service';
import { syncDecksFromServer } from '@/services/flashcard.service';
import { syncPresentationLinks } from '@/services/presentation.service';
import { syncQuizzesFromServer } from '@/services/quiz.service';
import { syncTextsFromServer } from '@/services/text.service';
import { syncWritingFromServer } from '@/services/writing.service';

export interface ClassMaterialRefreshResult {
  refreshed: string[];
  failed: string[];
}

/**
 * Force-refresh one class without the normal background-sync cache window.
 * Each content area is independent, so one temporary failure does not prevent
 * a newly published quiz or note from reaching the device.
 */
export type ContentDomain = 'sessions' | 'quizzes' | 'texts' | 'presentations' | 'writing' | 'flashcards';

export async function syncClassMaterials(classIds: string[], userId: string, isTeacher: boolean, force = false, domains?: ContentDomain[]): Promise<ClassMaterialRefreshResult> {
  const tasks: Array<[ContentDomain, string, () => Promise<unknown>]> = [
    ['sessions', 'notes and discussions', () => syncClassSessionsFromServer(classIds)],
    ['quizzes', 'quizzes', () => syncQuizzesFromServer(classIds)],
    ['texts', 'texts', () => syncTextsFromServer(classIds, userId, isTeacher)],
    ['presentations', 'presentations', () => syncPresentationLinks(classIds)],
    ['writing', 'writing prompts', () => syncWritingFromServer(classIds)],
    ['flashcards', 'card decks', () => syncDecksFromServer(classIds, userId)],
  ];
  const selected = tasks.filter(([domain]) => !domains || domains.includes(domain));
  const scope = [...new Set(classIds)].sort().join(',');
  const outcomes = await Promise.allSettled(selected.map(([domain,, task]) => runCachedSync(
    `class-content:${userId}:${isTeacher?'teacher':'member'}:${scope}:${domain}`,
    domain === 'flashcards' ? SYNC_WINDOWS.stableContent : SYNC_WINDOWS.catalog,
    async () => { if (await task() === false) throw new Error('Content refresh failed'); }, force,
  )));
  const refreshed: string[] = [], failed: string[] = [];
  outcomes.forEach((outcome, index) => {
    const name = selected[index][1];
    if (outcome.status === 'fulfilled') refreshed.push(name);
    else failed.push(name);
  });
  return { refreshed, failed };
}

export function refreshClassMaterials(classId: string, userId: string, isTeacher: boolean) {
  return syncClassMaterials([classId], userId, isTeacher, true);
}
import { runCachedSync, SYNC_WINDOWS } from './sync-policy';
