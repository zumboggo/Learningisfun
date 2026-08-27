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
export async function refreshClassMaterials(classId: string, userId: string, isTeacher: boolean): Promise<ClassMaterialRefreshResult> {
  const tasks: Array<[string, () => Promise<unknown>]> = [
    ['notes and discussions', () => syncClassSessionsFromServer([classId])],
    ['quizzes', () => syncQuizzesFromServer([classId])],
    ['texts', () => syncTextsFromServer([classId], userId, isTeacher)],
    ['presentations', () => syncPresentationLinks([classId])],
    ['writing prompts', () => syncWritingFromServer([classId])],
    ['card decks', () => syncDecksFromServer([classId], userId, isTeacher)],
  ];
  const outcomes = await Promise.allSettled(tasks.map(([, task]) => task()));
  const refreshed: string[] = [], failed: string[] = [];
  outcomes.forEach((outcome, index) => {
    const name = tasks[index][0];
    if (outcome.status === 'fulfilled' && outcome.value !== false) refreshed.push(name);
    else failed.push(name);
  });
  return { refreshed, failed };
}
