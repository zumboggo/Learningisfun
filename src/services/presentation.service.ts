import { db } from '@/db/schema';
import { executeLearningContent } from '@/services/learning-content.service';
import type { ClassSession, PresentationLink } from '@/types';

export type LiveQuestionType = 'mc' | 'short' | 'paragraph' | 'cloze';
export interface LiveQuestionDraft { type: LiveQuestionType; text: string; options: string[]; answer: string; }
export interface LiveQuestion extends LiveQuestionDraft { id: string; sortOrder: number; }
export interface LivePresentationState {
  session: ClassSession;
  questions: LiveQuestion[];
  activeQuestion: LiveQuestion | null;
  ownAnswer: string | null;
  answeredCount: number;
  enrolledCount: number;
  mcCounts: number[];
  reveal: boolean;
  responses: Array<{ id: string; answer: string; label: string }>;
  isTeacher: boolean;
  allowResubmission: boolean;
}

export async function syncPresentationLinks(classIds: string[]): Promise<PresentationLink[]> {
  if (!classIds.length) return [];
  const result = await executeLearningContent<{ links: PresentationLink[]; liveSessions: ClassSession[] }>({ action: 'readPresentationLinks', classIds });
  for (const link of result.links) await db.presentation_links.put(link);
  for (const session of result.liveSessions || []) await db.class_sessions.put({ ...session, syncStatus: 'synced' });
  return result.links;
}

export async function addPresentationLinks(input: { title: string; url: string; classIds: string[]; assignedAt: string }): Promise<void> {
  const result = await executeLearningContent<{ links: PresentationLink[] }>({ action: 'addPresentationLinks', ...input });
  for (const link of result.links) await db.presentation_links.put(link);
}

export async function setPresentationWatched(linkId: string, watched: boolean): Promise<void> {
  const result = await executeLearningContent<{ link: PresentationLink }>({ action: 'setPresentationWatched', linkId, watched });
  await db.presentation_links.put(result.link);
}

export async function deletePresentationLink(linkId: string): Promise<void> {
  await executeLearningContent({ action: 'deletePresentationLink', linkId });
  await db.presentation_links.delete(linkId);
}

export async function createLivePresentation(classId: string, title: string, questions: LiveQuestionDraft[], allowResubmission = false): Promise<string> {
  const result = await executeLearningContent<{ sessionId: string }>({ action: 'createLivePresentation', classId, title, questions, allowResubmission });
  return result.sessionId;
}

export async function createWritingPrompt(classId: string, prompt: string, allowResubmission = false): Promise<string> {
  return createLivePresentation(classId, 'Writing Prompt', [{ type: 'paragraph', text: prompt.trim(), options: [], answer: '' }], allowResubmission);
}

export async function readLivePresentation(sessionId: string): Promise<LivePresentationState> {
  return executeLearningContent<LivePresentationState>({ action: 'readLivePresentation', sessionId });
}

export async function controlLivePresentation(sessionId: string, command: 'next' | 'previous' | 'pause' | 'reveal' | 'hide' | 'end'): Promise<void> {
  await executeLearningContent({ action: 'controlLivePresentation', sessionId, command });
}

export async function submitLiveAnswer(sessionId: string, answer: string): Promise<void> {
  await executeLearningContent({ action: 'submitLiveAnswer', sessionId, answer });
}
