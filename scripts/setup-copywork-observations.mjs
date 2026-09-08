// Additive migration only: existing entries and permissions remain unchanged.
import { Client, Databases } from 'node-appwrite';
const { APPWRITE_ENDPOINT: endpoint, APPWRITE_PROJECT_ID: project, APPWRITE_API_KEY: key } = process.env;
if (!endpoint || !project || !key) throw new Error('Appwrite setup credentials are required.');
const db = new Databases(new Client().setEndpoint(endpoint).setProject(project).setKey(key));
const target = { databaseId: process.env.APPWRITE_DATABASE_ID || 'main', collectionId: 'copywork_entries', key: 'observations' };
try {
  const attr = await db.getAttribute(target);
  if (attr.type !== 'string' || !attr.array || attr.size < 2000 || attr.required) throw new Error('Unexpected observations attribute; review before proceeding.');
} catch (error) {
  if (error.code !== 404) throw error;
  await db.createStringAttribute({ ...target, size: 2000, required: false, array: true });
}
for (let attempt = 0; attempt < 30; attempt++) {
  const attr = await db.getAttribute(target);
  if (attr.status === 'available') { console.log('Optional copywork observations attribute is ready. Existing entries unchanged.'); process.exit(0); }
  if (attr.status === 'failed') throw new Error('Attribute provisioning failed.');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
throw new Error('Observations attribute is still provisioning. Re-run before deploying.');
