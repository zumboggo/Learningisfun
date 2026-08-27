import { ID } from 'appwrite';
import mammoth from 'mammoth';
import { db } from '@/db/schema';
import { addToQueue } from '@/services/sync.service';
import { FUNCTION_IDS } from '@/lib/appwrite';
import { executeLearningContent } from '@/services/learning-content.service';
import { getTimestamp } from '@/utils/helpers';
import { htmlToMarkdown } from '@/utils/rich-text';
import type { LearningText, TextAnnotation, TextAssignment, TextParagraph, TextSupportLevel, TextVersion, TextVersionParagraph } from '@/types';

export const ANNOTATIONS_TO_UNLOCK = 3;

export function splitParagraphs(content: string): string[] {
  return content.replace(/\r\n?/g, '\n').split(/\n[ \t]*\n+/).map(block => {
    const lines=block.split('\n').map(line=>line.trim()).filter(Boolean);
    const hasMarkdownStructure=lines.some(line=>/^(#{1,3}\s|[-*]\s|\d+\.\s|>\s?|```|\|)/.test(line)) || lines.some(line=>/^\|?\s*:?-{3,}/.test(line));
    return (hasMarkdownStructure?lines.join('\n'):lines.join(' ')).trim();
  }).filter(Boolean);
}

export async function paragraphsFromFile(file: File): Promise<string[]> {
  if (file.name.toLowerCase().endsWith('.docx')) {
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    return splitParagraphs(htmlToMarkdown(result.value));
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

export async function updateTextParagraphs(textId:string,teacherId:string,contents:string[]):Promise<void>{
  const text=await db.texts.get(textId); if(!text||text.teacherId!==teacherId)throw new Error('Only the text creator can edit it');
  const existing=await db.text_paragraphs.where('textId').equals(textId).sortBy('sortOrder');
  const removed=existing.slice(contents.length); if(removed.length){const annotatedIds=new Set((await db.text_annotations.where('textId').equals(textId).toArray()).map(row=>row.paragraphId));const blocked=removed.find(row=>annotatedIds.has(row.$id));if(blocked)throw new Error(`Paragraph ${blocked.sortOrder+1} has student annotations and cannot be removed. You can still rewrite it.`);}
  for(let index=0;index<contents.length;index++){const content=contents[index].trim();const current=existing[index];if(current){if(current.content===content&&current.sortOrder===index)continue;const updated={...current,content,sortOrder:index};await db.text_paragraphs.put(updated);await addToQueue(teacherId,'text_paragraph',current.$id,'update',updated);}else{const paragraph:TextParagraph={$id:ID.unique(),textId,sortOrder:index,content};await db.text_paragraphs.put(paragraph);await addToQueue(teacherId,'text_paragraph',paragraph.$id,'create',paragraph);}}
  for(const paragraph of removed){await db.text_paragraphs.delete(paragraph.$id);await addToQueue(teacherId,'text_paragraph',paragraph.$id,'delete',paragraph);}
  const versions=await db.text_versions.where('textId').equals(textId).toArray(); if(versions.length){await db.text_versions.bulkDelete(versions.map(row=>row.$id));await db.text_version_paragraphs.where('textId').equals(textId).delete();}
}

export async function updateTextAssignments(textId:string,userId:string,access:Array<{classId:string;assignedAt:string}>):Promise<void>{
  const current=await db.text_assignments.where('textId').equals(textId).toArray(),wanted=new Map(access.map(row=>[row.classId,row.assignedAt]));
  for(const [classId,assignedAt] of wanted){const existing=current.find(row=>row.classId===classId);if(existing){if(existing.assignedAt!==assignedAt){const updated={...existing,assignedAt};await db.text_assignments.put(updated);await addToQueue(userId,'text_assignment',existing.$id,'update',updated);}}else{const assignment:TextAssignment={$id:ID.unique(),textId,classId,assignedAt};await db.text_assignments.put(assignment);await addToQueue(userId,'text_assignment',assignment.$id,'create',assignment);}}
  for(const assignment of current)if(!wanted.has(assignment.classId)){await db.text_assignments.delete(assignment.$id);await addToQueue(userId,'text_assignment',assignment.$id,'delete',assignment);}
}

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

export async function addAnnotation(params: { textId: string; paragraphId: string; classId: string; authorId: string; type: TextAnnotation['type']; content: string; kind?: NonNullable<TextAnnotation['kind']>; selectedText?: string; tags?: string[]; parentId?: string | null; visibility?: NonNullable<TextAnnotation['visibility']> }): Promise<TextAnnotation> {
  const now = getTimestamp(); const id = ID.unique();
  const annotation: TextAnnotation = { $id: id, textId: params.textId, paragraphId: params.paragraphId, classId: params.classId,
    authorId: params.authorId, anonymousLabel: `Reader ${params.authorId.slice(-4).toUpperCase()}`, type: params.type, kind: params.kind || 'annotation', content: params.content.trim(),
    selectedText: params.selectedText?.trim() || '', tagsJson: JSON.stringify((params.tags || []).map(tag=>tag.trim().toLowerCase()).filter(Boolean).slice(0,8)), parentId: params.parentId || null, visibility: params.visibility || 'class',
    moderationStatus: 'visible', flagged: false, flagReason: '', createdAt: now, updatedAt: now, syncStatus: 'local' };
  await db.text_annotations.put(annotation); await addToQueue(params.authorId, 'text_annotation', id, 'create', annotation); return annotation;
}

export async function updateAnnotation(annotationId: string, userId: string, content: string, tags: string[]): Promise<void> {
  const annotation = await db.text_annotations.get(annotationId);
  if (!annotation || annotation.authorId !== userId) throw new Error('You can only edit your own annotation');
  const updated: TextAnnotation = { ...annotation, content: content.trim(), tagsJson: JSON.stringify(tags.map(tag=>tag.trim().toLowerCase()).filter(Boolean).slice(0,8)), updatedAt: getTimestamp(), syncStatus: 'local' };
  await db.text_annotations.put(updated); await addToQueue(userId, 'text_annotation', annotationId, 'update', updated);
}

export async function deleteAnnotation(annotationId: string, userId: string): Promise<void> {
  const annotation = await db.text_annotations.get(annotationId);
  if (!annotation || annotation.authorId !== userId) throw new Error('You can only delete your own annotation');
  const replies = await db.text_annotations.where('parentId').equals(annotationId).toArray();
  await db.text_annotations.bulkDelete([annotationId, ...replies.map(reply=>reply.$id)]);
  await addToQueue(userId, 'text_annotation', annotation.$id, 'delete', annotation);
}

export async function flagAnnotation(annotationId: string, reason: string): Promise<void> {
  await executeLearningContent({ action: 'flagTextAnnotation', annotationId, reason: reason.trim() });
}

export async function moderateAnnotation(annotationId: string, command: 'hide'|'show'|'delete'|'dismissFlag'): Promise<void> {
  await executeLearningContent({ action: 'moderateTextAnnotation', annotationId, command });
  if (command === 'delete') await db.text_annotations.delete(annotationId);
  else { const item=await db.text_annotations.get(annotationId); if(item)await db.text_annotations.put({...item,moderationStatus:command==='hide'?'hidden':command==='show'?'visible':item.moderationStatus,flagged:false,flagReason:''}); }
}

export async function canSeePeerAnnotations(textId: string, classId: string, userId: string): Promise<boolean> {
  return (await db.text_annotations.where('[textId+classId]').equals([textId, classId]).and(a => a.authorId === userId && (a.visibility || 'class') === 'class' && (a.kind || 'annotation') === 'annotation').count()) >= ANNOTATIONS_TO_UNLOCK;
}

export async function syncTextsFromServer(classIds: string[], _userId: string, isTeacher: boolean): Promise<boolean> {
  if (!FUNCTION_IDS.learningContent || !classIds.length) return true;
  try {
    const result = await executeLearningContent<{ assignments: TextAssignment[]; texts: LearningText[]; paragraphs: TextParagraph[]; annotations: TextAnnotation[] }>({ action: 'readTexts', classIds, includeContent: false });
    const assignments = result.assignments;
    await db.text_assignments.bulkPut(assignments); const ids = [...new Set(assignments.map(a => a.textId))];
    const [localAssignments,queuedAssignmentChanges]=await Promise.all([db.text_assignments.where('classId').anyOf(classIds).toArray(),db.sync_queue.where('entityType').equals('text_assignment').filter(row=>row.syncStatus!=='synced').toArray()]);
    const remoteAssignmentIds=new Set(assignments.map(row=>row.$id)),protectedAssignmentIds=new Set(queuedAssignmentChanges.map(row=>row.entityId));
    const staleAssignmentIds=localAssignments.filter(row=>!remoteAssignmentIds.has(row.$id)&&!protectedAssignmentIds.has(row.$id)).map(row=>row.$id);if(staleAssignmentIds.length)await db.text_assignments.bulkDelete(staleAssignmentIds);
    if (!ids.length && !isTeacher) return true;
    for (const text of result.texts) await db.texts.put({ ...text, syncStatus: 'synced' });
    for (const paragraph of result.paragraphs) await db.text_paragraphs.put(paragraph);
    for (const annotation of result.annotations) await db.text_annotations.put({ ...annotation, syncStatus: 'synced' });
    return true;
  } catch { return false; }
}

export async function generateSharedTextVersion(textId: string, level: TextSupportLevel): Promise<TextVersion> {
  const result = await executeLearningContent<{ version: TextVersion; paragraphs: TextVersionParagraph[] }>({ action: 'generateTextVersion', textId, level });
  await db.text_versions.put(result.version);
  if (result.paragraphs.length) await db.text_version_paragraphs.bulkPut(result.paragraphs);
  return result.version;
}

export async function syncTextFromServer(textId: string, classId: string): Promise<boolean> {
  if (!FUNCTION_IDS.learningContent || !textId || !classId) return true;
  try {
    const result = await executeLearningContent<{ assignments: TextAssignment[]; texts: LearningText[]; paragraphs: TextParagraph[]; versions?: TextVersion[]; versionParagraphs?: TextVersionParagraph[]; annotations: TextAnnotation[] }>({
      action: 'readTexts', classIds: [classId], textId, includeContent: true,
    });
    if (result.assignments.length) await db.text_assignments.bulkPut(result.assignments);
    for (const text of result.texts) await db.texts.put({ ...text, syncStatus: 'synced' });
    for (const paragraph of result.paragraphs) await db.text_paragraphs.put(paragraph);
    for (const version of result.versions || []) await db.text_versions.put(version);
    for (const paragraph of result.versionParagraphs || []) await db.text_version_paragraphs.put(paragraph);
    for (const annotation of result.annotations) await db.text_annotations.put({ ...annotation, syncStatus: 'synced' });
    const [localParagraphs,queuedParagraphChanges]=await Promise.all([db.text_paragraphs.where('textId').equals(textId).toArray(),db.sync_queue.where('entityType').equals('text_paragraph').filter(row=>row.syncStatus!=='synced').toArray()]);
    const remoteParagraphIds=new Set(result.paragraphs.map(row=>row.$id)),protectedParagraphIds=new Set(queuedParagraphChanges.map(row=>row.entityId));
    const staleParagraphIds=localParagraphs.filter(row=>!remoteParagraphIds.has(row.$id)&&!protectedParagraphIds.has(row.$id)).map(row=>row.$id);if(staleParagraphIds.length)await db.text_paragraphs.bulkDelete(staleParagraphIds);
    const remoteVersionIds=new Set((result.versions||[]).map(row=>row.$id)),localVersions=await db.text_versions.where('textId').equals(textId).toArray(),staleVersions=localVersions.filter(row=>!remoteVersionIds.has(row.$id));
    if(staleVersions.length){await db.text_versions.bulkDelete(staleVersions.map(row=>row.$id));for(const version of staleVersions)await db.text_version_paragraphs.where('versionId').equals(version.$id).delete();}
    return true;
  } catch { return false; }
}
