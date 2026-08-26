import { readFileSync } from 'node:fs';
import { Client, Databases } from 'node-appwrite';

const planPath = process.argv[2];
if (!planPath || process.argv[3] !== '--confirm') {
  throw new Error('Usage: apply-flashcard-refresh.mjs PLAN.json --confirm');
}

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'main';
if (!endpoint || !projectId || !apiKey) throw new Error('Missing Appwrite configuration');

const plan = JSON.parse(readFileSync(planPath, 'utf8'));
const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

for (const card of plan.updates) {
  const back = `${card.definition}\n\n${card.example}`;
  await databases.updateDocument({
    databaseId,
    collectionId: 'flashcard_cards',
    documentId: card.id,
    data: {
      front: card.term,
      back,
      frontMarkdown: card.term,
      backMarkdown: back,
      hint: '',
      sortOrder: card.sortOrder,
    },
  });
}

for (const cardId of plan.deletes) {
  await databases.deleteDocument({ databaseId, collectionId: 'flashcard_cards', documentId: cardId });
}

console.log(JSON.stringify({ updated: plan.updates.length, deleted: plan.deletes.length }));
