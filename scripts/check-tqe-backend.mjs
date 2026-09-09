import { Client, Databases, Functions } from 'node-appwrite';

const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(client), functions = new Functions(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'main';
for (const [collectionId, keys] of Object.entries({texts:['annotationMode','tqeStage'],text_annotations:['tqeType'],tqe_records:['textId','classId','kind','ownerId','payloadJson','updatedAt']})) {
  const collection = await db.getCollection({databaseId,collectionId});
  const attributes = collection.attributes.filter(a=>keys.includes(a.key));
  if (attributes.length!==keys.length || attributes.some(a=>a.status!=='available')) throw Error(`${collectionId}: attributes are not ready`);
  if (collectionId==='tqe_records' && (collection.$permissions.length || !collection.indexes.some(i=>i.key==='idx_text_class'&&i.status==='available'))) throw Error('TQE records permissions or index are not ready');
  console.log(`${collectionId}: requested attributes ready; collection permissions ${JSON.stringify(collection.$permissions)}`);
}
const fn = await functions.get({functionId:'learning-content'});
console.log(`learning-content: enabled=${fn.enabled}, execute=${JSON.stringify(fn.execute)}, deployment=${fn.deploymentId || fn.deployment || 'none'}`);
if (process.argv[2]) {
  const deployment = await functions.getDeployment({functionId:'learning-content',deploymentId:process.argv[2]});
  console.log(`Requested deployment: ${deployment.status}`);
  if (deployment.status !== 'ready') process.exitCode = 2;
}
