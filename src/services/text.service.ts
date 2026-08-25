import { ID } from 'appwrite';
import mammoth from 'mammoth';
import { db } from '@/db/schema';
import { addToQueue } from '@/services/sync.service';
import { FUNCTION_IDS } from '@/lib/appwrite';
import { executeLearningContent } from '@/services/learning-content.service';
import { getTimestamp } from '@/utils/helpers';
import type { LearningText, TextAnnotation, TextAssignment, TextParagraph } from '@/types';

export const ANNOTATIONS_TO_UNLOCK = 3;

export function splitParagraphs(content: string): string[] {
  return content.replace(/\r\n?/g, '\n').split(/\n\s*\n+/).map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
}

export async function paragraphsFromFile(file: File): Promise<string[]> {
  if (file.name.toLowerCase().endsWith('.docx')) {
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const doc = new DOMParser().parseFromString(result.value, 'text/html');
    return [...doc.querySelectorAll('p')].map(p => p.textContent?.trim() || '').filter(Boolean);
  }
  return splitParagraphs(await file.text());
}

export async function createText(params: { teacherId: string; title: string; author: string; source: string; paragraphs: string[]; classIds: string[]; contentMode?: 'full' | 'link'; externalUrl?: string; schedule?: { assignedAt: string; dueClassNumber?: number } }): Promise<LearningText> {
  const now = getTimestamp();
  const text: LearningText = { $id: ID.unique(), teacherId: params.teacherId, title: params.title, author: params.author,
    source: params.source, contentMode: params.contentMode || 'full', externalUrl: params.externalUrl || '', status: 'published', createdAt: now, updatedAt: now, syncStatus: 'local' };
  await db.texts.put(text); await addToQueue(params.teacherId, 'text', text.$id, 'create', text);
  for (let i = 0; i < params.paragraphs.length; i++) {
    const paragraph: TextParagraph = { $id: ID.unique(), textId: text.$id, sortOrder: i, content: params.paragraphs[i] };
    await db.text_paragraphs.put(paragraph); await addToQueue(params.teacherId, 'text_paragraph', paragraph.$id, 'create', paragraph);
  }
  await setTextClasses(text.$id, params.classIds, params.teacherId, params.schedule);
  return text;
}

export async function updateTextMetadata(textId:string,teacherId:string,updates:{title:string;author:string;source:string;externalUrl?:string}):Promise<void>{const text=await db.texts.get(textId);if(!text||text.teacherId!==teacherId)throw new Error('Only the text creator can edit it');const patch={title:updates.title.trim(),author:updates.author.trim(),source:updates.source.trim(),externalUrl:updates.externalUrl?.trim() || text.externalUrl || '',updatedAt:getTimestamp(),syncStatus:'local' as const};await db.texts.update(textId,patch);const updated=await db.texts.get(textId);if(updated)await addToQueue(teacherId,'text',textId,'update',updated);}

export async function setTextClasses(textId: string, classIds: string[], userId: string, schedule?: { assignedAt: string; dueClassNumber?: number }): Promise<void> {
  const current = await db.text_assignments.where('textId').equals(textId).toArray(); const wanted = new Set(classIds);
  for (const classId of wanted) if (!current.some(a => a.classId === classId)) {
    const a: TextAssignment = { $id: ID.unique(), textId, classId, assignedAt: schedule?.assignedAt || getTimestamp(), dueClassNumber: schedule?.dueClassNumber };
    await db.text_assignments.put(a); await addToQueue(userId, 'text_assignment', a.$id, 'create', a);
  }
  if (schedule) for (const a of current) if (wanted.has(a.classId) && (a.assignedAt !== schedule.assignedAt || a.dueClassNumber !== schedule.dueClassNumber)) {
    const updated = { ...a, assignedAt: schedule.assignedAt, dueClassNumber: schedule.dueClassNumber };
    await db.text_assignments.put(updated); await addToQueue(userId, 'text_assignment', a.$id, 'update', updated);
  }
  for (const a of current) if (!wanted.has(a.classId)) { await db.text_assignments.delete(a.$id); await addToQueue(userId, 'text_assignment', a.$id, 'delete', a); }
}

export async function setTextAssignmentDueDate(assignmentId: string, userId: string, assignedAt: string): Promise<void> {
  const assignment = await db.text_assignments.get(assignmentId);
  if (!assignment) throw new Error('Text assignment not found');
  const updated: TextAssignment = { ...assignment, assignedAt };
  await db.text_assignments.put(updated);
  await addToQueue(userId, 'text_assignment', assignmentId, 'update', updated);
}

export async function addAnnotation(params: { textId: string; paragraphId: string; classId: string; authorId: string; type: TextAnnotation['type']; content: string }): Promise<TextAnnotation> {
  const now = getTimestamp(); const id = ID.unique();
  const annotation: TextAnnotation = { $id: id, textId: params.textId, paragraphId: params.paragraphId, classId: params.classId,
    authorId: params.authorId, anonymousLabel: `Reader ${id.slice(-4).toUpperCase()}`, type: params.type, content: params.content.trim(),
    moderationStatus: 'visible', createdAt: now, updatedAt: now, syncStatus: 'local' };
  await db.text_annotations.put(annotation); await addToQueue(params.authorId, 'text_annotation', id, 'create', annotation); return annotation;
}

export async function canSeePeerAnnotations(textId: string, classId: string, userId: string): Promise<boolean> {
  return (await db.text_annotations.where('[textId+classId]').equals([textId, classId]).and(a => a.authorId === userId).count()) >= ANNOTATIONS_TO_UNLOCK;
}

export async function syncTextsFromServer(classIds: string[], _userId: string, isTeacher: boolean): Promise<boolean> {
  if (!FUNCTION_IDS.learningContent || !classIds.length) return true;
  try {
    const result = await executeLearningContent<{ assignments: TextAssignment[]; texts: LearningText[]; paragraphs: TextParagraph[]; annotations: TextAnnotation[] }>({ action: 'readTexts', classIds, includeContent: false });
    const assignments = result.assignments;
    await db.text_assignments.bulkPut(assignments); const ids = [...new Set(assignments.map(a => a.textId))];
    if (!ids.length && !isTeacher) return true;
    for (const text of result.texts) await db.texts.put({ ...text, syncStatus: 'synced' });
    for (const paragraph of result.paragraphs) await db.text_paragraphs.put(paragraph);
    for (const annotation of result.annotations) await db.text_annotations.put({ ...annotation, syncStatus: 'synced' });
    return true;
  } catch { return false; }
}

export async function syncTextFromServer(textId: string, classId: string): Promise<boolean> {
  if (!FUNCTION_IDS.learningContent || !textId || !classId) return true;
  try {
    const result = await executeLearningContent<{ assignments: TextAssignment[]; texts: LearningText[]; paragraphs: TextParagraph[]; annotations: TextAnnotation[] }>({
      action: 'readTexts', classIds: [classId], textId, includeContent: true,
    });
    if (result.assignments.length) await db.text_assignments.bulkPut(result.assignments);
    for (const text of result.texts) await db.texts.put({ ...text, syncStatus: 'synced' });
    for (const paragraph of result.paragraphs) await db.text_paragraphs.put(paragraph);
    for (const annotation of result.annotations) await db.text_annotations.put({ ...annotation, syncStatus: 'synced' });
    return true;
  } catch { return false; }
}
