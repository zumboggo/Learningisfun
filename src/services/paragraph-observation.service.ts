import { db } from '@/db/schema';
import { generateId, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import type { ParagraphObservation, Reading } from '@/types';

export interface TeachingParagraph {
  index: number;
  text: string;
}

export async function upsertParagraphObservation(
  teacherId: string,
  input: {
    readingId: string;
    assignmentId: string;
    classSessionId: string;
    paragraphIndex: number;
    observationMarkdown: string;
    keyQuestionMarkdown: string;
    vocabularyMarkdown: string;
  },
): Promise<ParagraphObservation> {
  const existing = await db.paragraph_observations
    .where('classSessionId')
    .equals(input.classSessionId)
    .and(item => item.paragraphIndex === input.paragraphIndex)
    .first();
  const now = getTimestamp();
  const observation: ParagraphObservation = {
    $id: existing?.$id || generateId(),
    readingId: input.readingId,
    assignmentId: input.assignmentId,
    classSessionId: input.classSessionId,
    paragraphIndex: input.paragraphIndex,
    teacherId,
    observationMarkdown: input.observationMarkdown,
    keyQuestionMarkdown: input.keyQuestionMarkdown,
    vocabularyMarkdown: input.vocabularyMarkdown,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    syncStatus: 'local',
  };
  await db.paragraph_observations.put(observation);
  await addToQueue(teacherId, 'paragraph_observation', observation.$id, existing ? 'update' : 'create', observation);
  return observation;
}

export async function getSessionParagraphObservations(classSessionId: string): Promise<ParagraphObservation[]> {
  const observations = await db.paragraph_observations
    .where('classSessionId')
    .equals(classSessionId)
    .toArray();
  return observations.sort((a, b) => a.paragraphIndex - b.paragraphIndex);
}

export function splitReadingIntoParagraphs(reading: Reading | undefined): TeachingParagraph[] {
  if (!reading) return [];
  return reading.content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(text => text.trim())
    .filter(Boolean)
    .map((text, index) => ({ index, text }));
}

export function paragraphNotesMarkdown(observations: ParagraphObservation[]): string {
  const used = observations.filter(item =>
    item.observationMarkdown.trim() || item.keyQuestionMarkdown.trim() || item.vocabularyMarkdown.trim(),
  );
  if (used.length === 0) return '';
  const sections = ['## Paragraph Observations'];
  for (const item of used) {
    sections.push(`### Paragraph ${item.paragraphIndex + 1}`);
    if (item.observationMarkdown.trim()) sections.push(item.observationMarkdown.trim());
    if (item.keyQuestionMarkdown.trim()) sections.push(`**Key question:** ${item.keyQuestionMarkdown.trim()}`);
    if (item.vocabularyMarkdown.trim()) sections.push(`**Vocabulary:** ${item.vocabularyMarkdown.trim()}`);
  }
  return sections.join('\n\n');
}
