// Provision only the new private planning collection and function.
// node --env-file=$HOME/.config/learningisfun/appwrite.env scripts/setup-teacher-planning.mjs
import { Client, Databases, Functions, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const endpoint = process.env.APPWRITE_ENDPOINT;
const project = process.env.APPWRITE_PROJECT_ID;
const key = process.env.APPWRITE_API_KEY;
if (!endpoint || !project || !key) throw Error('Missing Appwrite configuration');
const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
const db = new Databases(client), functions = new Functions(client);
const databaseId = 'brainstorming', collectionId = 'teacher_libraries', functionId = 'teacher-planning';
async function createIfMissing(get, create) {
  try { return await get(); } catch (error) { if (error.code !== 404) throw error; return create(); }
}
await createIfMissing(() => db.get({ databaseId }), () => db.create({ databaseId, name: 'Brainstorming' }));
const collection = await createIfMissing(() => db.getCollection({ databaseId, collectionId }), () => db.createCollection({ databaseId, collectionId, name: 'Private teacher planning', permissions: [], documentSecurity: true }));
if (collection.$permissions.length || !collection.documentSecurity) throw Error('Unexpected collection permissions; review before deploying');
for (const [attribute, size] of [['ownerId', 36], ['deviceId', 36], ['payload', 1000000]]) {
  await createIfMissing(() => db.getAttribute({ databaseId, collectionId, key: attribute }), () => db.createStringAttribute({ databaseId, collectionId, key: attribute, size, required: true }));
}
for (let attempt = 0; attempt < 60; attempt++) {
  const attributes = await db.listAttributes({ databaseId, collectionId });
  if (attributes.attributes.every(a => a.status === 'available')) break;
  if (attributes.attributes.some(a => a.status === 'failed') || attempt === 59) throw Error('Planning attributes did not become available');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
await createIfMissing(() => db.getIndex({ databaseId, collectionId, key: 'owner' }), () => db.createIndex({ databaseId, collectionId, key: 'owner', type: 'key', attributes: ['ownerId'] }));
await createIfMissing(() => functions.get({ functionId }), () => functions.create({ functionId, name: 'Teacher Planning', runtime: 'node-22', execute: ['users'], enabled: true, logging: false, entrypoint: 'src/main.js', commands: 'npm install', scopes: ['databases.read', 'documents.read', 'documents.write'] }));
const existing = await functions.get({ functionId });
if (JSON.stringify(existing.execute) !== JSON.stringify(['users'])) throw Error('Unexpected function execute permissions');
const variables = await functions.listVariables({ functionId });
for (const [name, value] of Object.entries({ APPWRITE_ENDPOINT: endpoint, APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID || 'main' })) {
  const found = variables.variables.find(v => v.key === name);
  if (found) await functions.updateVariable({ functionId, variableId: found.$id, key: name, value });
  else await functions.createVariable({ functionId, variableId: ID.unique(), key: name, value });
}
const temporary = mkdtempSync(join(tmpdir(), 'teacher-planning-'));
try {
  const archive = join(temporary, 'function.tar.gz');
  execFileSync('tar', ['-czf', archive, '-C', resolve('functions/teacher-planning'), 'package.json', 'src']);
  const deployment = await functions.createDeployment({ functionId, code: InputFile.fromPath(archive), activate: true, entrypoint: 'src/main.js', commands: 'npm install' });
  console.log('Planning deployment submitted:', deployment.$id);
  for (let attempt = 0; attempt < 120; attempt++) {
    const state = await functions.getDeployment({ functionId, deploymentId: deployment.$id });
    if (state.status === 'ready') { console.log('Planning backend ready'); break; }
    if (state.status === 'failed' || attempt === 119) throw Error('Planning deployment not ready: ' + state.status);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
} finally { rmSync(temporary, { recursive: true, force: true }); }
