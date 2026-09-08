// Explicit production smoke test: creates only synthetic private fixtures and
// removes those exact records afterward. Never reads student submissions.
import { Client, Databases, Functions, Storage, Users, ID, Query } from 'node-appwrite';
import { createHash } from 'node:crypto';
if (!process.argv.includes('--run')) throw new Error('Pass --run to create and remove synthetic PDF test fixtures.');
const endpoint = process.env.APPWRITE_ENDPOINT, project = process.env.APPWRITE_PROJECT_ID, databaseId = process.env.APPWRITE_DATABASE_ID || 'main';
const admin = new Client().setEndpoint(endpoint).setProject(project).setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(admin), storage = new Storage(admin);
const sources = await db.listDocuments(databaseId, 'planner_sources', [Query.equal('active', true), Query.limit(2)]);
if (sources.documents.length !== 1) throw new Error('Expected one active teacher source.');
const teacherId = sources.documents[0].teacherId;
const credential = await new Users(admin).createJWT({ userId: teacherId, duration: 120 });
const functions = new Functions(new Client().setEndpoint(endpoint).setProject(project).setJWT(credential.jwt));
const invoke = async body => {
  const execution = await functions.createExecution({ functionId: 'learning-content', body: JSON.stringify(body) });
  const result = JSON.parse(execution.responseBody || '{}');
  if (execution.responseStatusCode !== 200 || result.error) throw new Error(`PDF endpoint failed (${execution.responseStatusCode}): ${result.error || execution.status}`);
  return result;
};
const textId = ID.unique();
const bytes = Buffer.alloc(5 * 1024 * 1024, 32);
bytes.write(`%PDF-1.4\n% Synthetic upload boundary test ${textId}\n`);
bytes.write('\n%%EOF', bytes.length - 6);
const fileId = `pdf_${createHash('sha256').update(teacherId).digest('hex').slice(0, 10)}_${createHash('sha256').update(bytes).digest('hex').slice(0, 20)}`;
let textCreated = false;
try {
  const uploaded = await invoke({ action: 'uploadOriginalPdf', name: 'Synthetic storage smoke test.pdf', data: bytes.toString('base64') });
  if (uploaded.fileId !== fileId) throw new Error('Unexpected file ID');
  const repeat = await invoke({ action: 'uploadOriginalPdf', name: 'Synthetic storage smoke test.pdf', data: bytes.toString('base64') });
  if (repeat.fileId !== fileId) throw new Error('Retry created a duplicate');
  const now = new Date().toISOString();
  await db.createDocument(databaseId, 'texts', textId, { teacherId, title: 'Synthetic PDF smoke test', author: '', source: '', contentMode: 'full', originalPdfId: fileId, status: 'draft', createdAt: now, updatedAt: now }, []);
  textCreated = true;
  const { url } = await invoke({ action: 'readOriginalPdf', textId, download: true });
  const response = await fetch(url);
  if (!response.ok || !Buffer.from(await response.arrayBuffer()).equals(bytes)) throw new Error('Download did not preserve exact bytes');
  const unsigned = new URL(url); unsigned.searchParams.delete('token');
  const denied = await fetch(unsigned);
  if (denied.ok) throw new Error('Original PDF is publicly readable');
  console.log('Verified: deployed 5 MB upload, idempotent retry, exact download, and anonymous access denial.');
} finally {
  if (textCreated) await db.deleteDocument(databaseId, 'texts', textId);
  try { await storage.deleteFile({ bucketId: 'original-pdfs', fileId }); }
  catch (error) { if (error.code !== 404) throw error; }
  console.log('Removed only the synthetic PDF and test text.');
}
