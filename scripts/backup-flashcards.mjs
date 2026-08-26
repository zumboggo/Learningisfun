import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client, Databases, Query } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'main';

if (!endpoint || !projectId || !apiKey) {
  throw new Error('Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY');
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const [decks, cards, assignments] = await Promise.all([
  databases.listDocuments({ databaseId, collectionId: 'flashcard_decks', queries: [Query.limit(5000)] }),
  databases.listDocuments({ databaseId, collectionId: 'flashcard_cards', queries: [Query.limit(5000)] }),
  databases.listDocuments({ databaseId, collectionId: 'deck_assignments', queries: [Query.limit(5000)] }),
]);

const timestamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
const outputDirectory = resolve(process.env.FLASHCARD_BACKUP_DIR || '../flashcard-backups');
mkdirSync(outputDirectory, { recursive: true });
const outputPath = resolve(outputDirectory, `flashcards-${timestamp}.json`);
writeFileSync(outputPath, `${JSON.stringify({ exportedAt: new Date().toISOString(), decks: decks.documents, cards: cards.documents, assignments: assignments.documents }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, decks: decks.total, cards: cards.total, assignments: assignments.total }));
