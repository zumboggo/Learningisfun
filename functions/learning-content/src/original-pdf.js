import { textAssignmentAvailable, textReleaseAt } from './text-schedule.js';
import { createHash } from 'node:crypto';
import { Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

export const PDF_BUCKET = 'original-pdfs';
export async function readEditableParagraphs({db, databaseId, textId, profile, userId}) {
  const text = await db.getDocument(databaseId, 'texts', textId);
  if (profile.role !== 'teacher' || text.teacherId !== userId) throw new Error('Only the text owner can edit this text');
  const paragraphs = []; let cursor;
  do {
    const page = await db.listDocuments(databaseId, 'text_paragraphs', [Query.equal('textId', textId), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])]);
    paragraphs.push(...page.documents);
    cursor = page.documents.length === 100 ? page.documents.at(-1).$id : undefined;
  } while(cursor);
  return paragraphs;
}
const prefix = userId => `pdf_${createHash('sha256').update(userId).digest('hex').slice(0, 10)}_`;
export function ownsPdf(userId, fileId) {
  return typeof fileId === 'string' && fileId.startsWith(prefix(userId)) && /^pdf_[a-f0-9]{10}_[a-f0-9]{20}$/.test(fileId);
}

export async function authorizeTextMutation({ collection, id, data, userId, db, databaseId }) {
  if (!['texts', 'text_assignments', 'text_paragraphs'].includes(collection)) return;
  if(collection==='text_assignments' && data.dueDate) textReleaseAt(data.dueDate);
  let prior;
  try { prior = await db.getDocument(databaseId, collection, id); }
  catch (error) { if (error.code !== 404) throw error; }
  if (collection === 'texts') {
    if (prior && prior.teacherId !== userId) throw new Error('Only the text owner can change this text.');
    data.teacherId = userId;
    if (data.originalPdfId && !ownsPdf(userId, data.originalPdfId)) throw new Error('This PDF belongs to another teacher.');
  } else {
    const parents = [...new Set([prior?.textId, data.textId].filter(Boolean))];
    if (!parents.length) throw new Error('A text is required.');
    for (const textId of parents) {
      const text = await db.getDocument(databaseId, 'texts', textId);
      if (text.teacherId !== userId) throw new Error('Only the text owner can change its content or assignments.');
    }
  }
}

export async function originalPdfAction({ body, profile, userId, memberClassIds, db, databaseId, storage, tokens, endpoint, projectId }) {
  if (body.action === 'uploadOriginalPdf') {
    if (profile.role !== 'teacher') throw new Error('Only teachers can upload original PDFs.');
    if (typeof body.data !== 'string' || body.data.length > 7000000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.data)) throw new Error('Original PDFs must be 5 MB or smaller.');
    const buffer = Buffer.from(body.data, 'base64');
    if (buffer.length > 5 * 1024 * 1024 || buffer.subarray(0, 5).toString() !== '%PDF-') throw new Error('Please choose a valid PDF of 5 MB or smaller.');
    const fileId = prefix(userId) + createHash('sha256').update(buffer).digest('hex').slice(0, 20);
    const name = String(body.name || 'Reading.pdf').replace(/[\r\n\\/]/g, '_').slice(0, 180).replace(/\.pdf$/i, '') + '.pdf';
    try { await storage.createFile({ bucketId: PDF_BUCKET, fileId, file: InputFile.fromBuffer(buffer, name), permissions: [] }); }
    catch (error) { if (error.code !== 409) throw error; }
    return { fileId };
  }
  if (body.action === 'readOriginalPdf') {
    const text = await db.getDocument(databaseId, 'texts', body.textId);
    const owns = profile.role === 'teacher' && text.teacherId === userId;
    if (!owns) {
      if (text.status !== 'published' || !memberClassIds.size) throw new Error('This PDF is not available to your class.');
      const assignments = await db.listDocuments(databaseId, 'text_assignments', [Query.equal('textId', text.$id), Query.equal('classId', [...memberClassIds]), Query.limit(100)]);
      if (!assignments.documents.some(a=>textAssignmentAvailable(a))) throw new Error('This PDF is not available to your class.');
    }
    if (!ownsPdf(text.teacherId, text.originalPdfId)) throw new Error('No original PDF is attached to this text.');
    // Check access afresh on every open. Never persist the short-lived bearer URL.
    const expire = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const token = await tokens.createFileToken({ bucketId: PDF_BUCKET, fileId: text.originalPdfId, expire });
    const url = new URL(`${endpoint.replace(/\/$/, '')}/storage/buckets/${PDF_BUCKET}/files/${text.originalPdfId}/${body.download ? 'download' : 'view'}`);
    url.searchParams.set('project', projectId);
    url.searchParams.set('token', token.secret);
    return { url: url.toString() };
  }
  throw new Error('Unsupported PDF action');
}
