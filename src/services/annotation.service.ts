import { db } from '@/db/schema';
import { generateId, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import type { Annotation, AnnotationType } from '@/types';

export async function createAnnotation(
  userId: string,
  readingId: string,
  type: AnnotationType,
  selectedText: string,
  textBefore: string,
  textAfter: string,
  startOffset: number,
  endOffset: number,
  blockId: string,
  color: string = '#facc15',
  noteText: string = '',
): Promise<Annotation> {
  const id = generateId();
  const now = getTimestamp();
  const annotation: Annotation = {
    $id: id,
    userId,
    readingId,
    type,
    selectedText,
    textBefore,
    textAfter,
    startOffset,
    endOffset,
    blockId,
    color,
    noteText,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'local',
  };

  await db.annotations.put(annotation);
  await addToQueue(userId, 'annotation', id, 'create', annotation);
  return annotation;
}

export async function updateAnnotation(
  annotationId: string,
  userId: string,
  updates: Partial<Pick<Annotation, 'noteText' | 'color'>>,
): Promise<void> {
  const now = getTimestamp();
  await db.annotations.update(annotationId, { ...updates, updatedAt: now, syncStatus: 'local' });
  const annotation = await db.annotations.get(annotationId);
  if (annotation) {
    await addToQueue(userId, 'annotation', annotationId, 'update', { ...annotation, ...updates });
  }
}

export async function deleteAnnotation(annotationId: string, userId: string): Promise<void> {
  await db.annotations.delete(annotationId);
  await addToQueue(userId, 'annotation', annotationId, 'delete', { $id: annotationId });
}

export async function getReadingAnnotations(readingId: string, userId: string): Promise<Annotation[]> {
  return db.annotations
    .where('readingId')
    .equals(readingId)
    .and(a => a.userId === userId)
    .toArray();
}

export async function getTeacherVisibleAnnotations(readingId: string): Promise<Annotation[]> {
  return db.annotations
    .where('readingId')
    .equals(readingId)
    .and(a => a.type === 'teacher_visible_note')
    .toArray();
}

export function findAnnotationAnchor(
  content: string,
  annotation: Annotation,
): { start: number; end: number } | null {
  const selectedIdx = content.indexOf(annotation.selectedText);
  if (selectedIdx >= 0) {
    return { start: selectedIdx, end: selectedIdx + annotation.selectedText.length };
  }

  const beforeIdx = annotation.textBefore
    ? content.indexOf(annotation.textBefore)
    : -1;
  if (beforeIdx >= 0) {
    const approxStart = beforeIdx + annotation.textBefore.length;
    const approxEnd = approxStart + annotation.selectedText.length;
    const candidate = content.substring(approxStart, approxEnd);
    if (candidate === annotation.selectedText) {
      return { start: approxStart, end: approxEnd };
    }
  }

  const afterIdx = annotation.textAfter
    ? content.indexOf(annotation.textAfter)
    : -1;
  if (afterIdx >= 0) {
    const approxEnd = afterIdx;
    const approxStart = approxEnd - annotation.selectedText.length;
    if (approxStart >= 0) {
      const candidate = content.substring(approxStart, approxEnd);
      if (candidate === annotation.selectedText) {
        return { start: approxStart, end: approxEnd };
      }
    }
  }

  return null;
}
