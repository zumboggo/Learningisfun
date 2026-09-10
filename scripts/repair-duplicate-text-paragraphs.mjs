// Explicit text ID required. Back up before removing duplicate positions.
// Run with --apply only after reviewing the dry-run summary. Never commits content.
import { Client, Databases, Query } from 'node-appwrite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const textId = process.argv[2], apply = process.argv.includes('--apply');
if (!textId || !/^[a-zA-Z0-9_-]+$/.test(textId)) throw new Error('Supply an exact text ID');
const db = new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
const databaseId = process.env.APPWRITE_DATABASE_ID || 'main';
const text = await db.getDocument(databaseId, 'texts', textId);
const paragraphs = await db.listDocuments(databaseId, 'text_paragraphs', [Query.equal('textId', textId), Query.limit(5000)]);
const annotations = await db.listDocuments(databaseId, 'text_annotations', [Query.equal('textId', textId), Query.limit(1)]);
if (paragraphs.documents.length !== paragraphs.total) throw new Error('Incomplete paragraph read; refusing repair');
if (annotations.total) throw new Error('Text has annotations; needs an annotation-preserving migration, not this repair');
const groups = new Map();
for (const row of paragraphs.documents) groups.set(row.sortOrder, [...(groups.get(row.sortOrder) || []), row]);
const removed = [...groups.values()].flatMap(rows => rows.sort((a,b) => b.$updatedAt.localeCompare(a.$updatedAt) || b.$createdAt.localeCompare(a.$createdAt)).slice(1));
console.log(JSON.stringify({textId, paragraphs: paragraphs.total, duplicateRecords: removed.length, remaining: groups.size, apply}));
if (apply && removed.length) {
  if (!process.env.TEXT_BACKUP_DIR) throw new Error('Set a private TEXT_BACKUP_DIR outside the repository');
  const dir = resolve(process.env.TEXT_BACKUP_DIR);
  mkdirSync(dir, {recursive: true, mode: 0o700});
  const backup = resolve(dir, textId + '-' + Date.now() + '.json');
  writeFileSync(backup, JSON.stringify({text, paragraphs: paragraphs.documents}, null, 2), {mode: 0o600, flag: 'wx'});
  // Recheck immediately before destructive work; abort if students have started.
  const check = await db.listDocuments(databaseId, 'text_annotations', [Query.equal('textId', textId), Query.limit(1)]);
  if (check.total) throw new Error('Annotations arrived; repair cancelled');
  for (const row of removed) await db.deleteDocument(databaseId, 'text_paragraphs', row.$id);
  const after = await db.listDocuments(databaseId, 'text_paragraphs', [Query.equal('textId', textId), Query.limit(1)]);
  console.log(JSON.stringify({removed:removed.length,remaining:after.total,backup}));
}
