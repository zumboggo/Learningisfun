// Private backup only. Supply an absolute directory outside the checkout.
import { Client, Databases, Query } from 'node-appwrite';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';
const destination = process.argv[2];
if (!destination || !isAbsolute(destination) || resolve(destination).startsWith(process.cwd() + '/')) throw new Error('Supply a private absolute backup directory outside the repository');
const db = new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
await mkdir(destination, { recursive: true, mode: 0o700 });
for (const collection of ['texts','text_assignments','text_paragraphs','text_annotations','tqe_records','class_sessions','text_discussion_posts','text_discussion_votes']) {
  const documents = []; let cursor;
  do {
    const page = await db.listDocuments(process.env.APPWRITE_DATABASE_ID || 'main', collection, [Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])]);
    documents.push(...page.documents); cursor = page.documents.length === 100 ? page.documents.at(-1).$id : null;
  } while (cursor);
  await writeFile(`${destination}/${collection}.json`, JSON.stringify({ backedUpAt: new Date().toISOString(), documents }), { mode: 0o600, flag: 'wx' });
  console.log(`${collection}: ${documents.length} records backed up`);
}
