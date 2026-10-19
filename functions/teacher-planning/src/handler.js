import { createHash } from 'node:crypto';
import { Permission, Role, Query } from 'node-appwrite';
const collection = 'teacher_libraries';
const database = 'brainstorming';
const documentId = (userId, deviceId) => createHash('sha256').update(JSON.stringify([userId, deviceId])).digest('hex').slice(0, 36);
const error = (message, code) => Object.assign(new Error(message), { code });

export function validatePayload(payload) {
  if (typeof payload !== 'string' || Buffer.byteLength(payload) > 950000) throw error('Invalid or oversized backup', 400);
  let data;
  try { data = JSON.parse(payload); } catch { throw error('Invalid backup JSON', 400); }
  const boards = data?.library?.boards;
  const strings = (value, size) => Array.isArray(value) && value.length === size && value.every(x => typeof x === 'string');
  if (typeof data.device !== 'string' || data.device.length > 60 || !Array.isArray(boards) || !boards.length || boards.length > 1000
    || typeof data.library.currentId !== 'string' || !boards.some(b => b.id === data.library.currentId)
    || new Set(boards.map(b => b.id)).size !== boards.length
    || boards.some(b => !b || typeof b.id !== 'string' || typeof b.data?.title !== 'string'
      || b.data.rowCount !== 8 || b.data.columnCount !== 10 || !strings(b.data.rows, 10)
      || !strings(b.data.cards, 100) || !strings(b.data.notes, 2) || typeof b.data.footerNote !== 'string')) {
    throw error('Invalid planning library', 400);
  }
  return payload;
}

export async function handlePlanning({ db, userId, body, profileDatabase = 'main' }) {
  if (!userId) throw error('Sign in to access planning', 401);
  const profile = await db.getDocument(profileDatabase, 'users', userId);
  if (!['teacher', 'admin'].includes(profile.role)) throw error('Teacher account required', 403);
  if (body.action === 'list') {
    const documents = []; let cursor;
    do {
      const page = await db.listDocuments(database, collection, [Query.equal('ownerId', userId), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])]);
      documents.push(...page.documents.map(doc => ({ deviceId: doc.deviceId, payload: doc.payload, updatedAt: doc.$updatedAt })));
      cursor = page.documents.length === 100 ? page.documents.at(-1).$id : null;
    } while (cursor);
    return { documents };
  }
  if (!['save', 'delete'].includes(body.action)) throw error('Unknown planning action', 400);
  if (typeof body.deviceId !== 'string' || !/^[a-zA-Z0-9-]{1,36}$/.test(body.deviceId)) throw error('Invalid device ID', 400);
  // Never accept an owner ID or document ID from the caller.
  const id = documentId(userId, body.deviceId);
  if (body.action === 'delete') {
    try { await db.deleteDocument(database, collection, id); } catch (err) { if (err.code !== 404) throw err; }
    return { ok: true };
  }
  const data = { ownerId: userId, deviceId: body.deviceId, payload: validatePayload(body.payload) };
  try { await db.updateDocument(database, collection, id, data); }
  catch (err) {
    if (err.code !== 404) throw err;
    try { await db.createDocument(database, collection, id, data, [Permission.read(Role.user(userId))]); }
    catch (createError) {
      if (createError.code !== 409) throw createError;
      await db.updateDocument(database, collection, id, data);
    }
  }
  return { ok: true };
}
