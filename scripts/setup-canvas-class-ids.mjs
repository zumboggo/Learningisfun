import {Client,Databases} from 'node-appwrite';
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY)),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
try {await db.createStringAttribute(databaseId,'classes','canvasCourseId',32,false);}catch(error){if(error.code!==409)throw error;}
const attribute=await db.getAttribute(databaseId,'classes','canvasCourseId');
if(attribute.status!=='available')throw new Error('Canvas field is still provisioning. Run this script again shortly.');
// Explicitly verified app IDs: no runtime matching on editable class names.
const mapping=[
  ['88421c66-9cda-4002-8e15-086312b7805e','20636'],
  ['e24ec8d9-21d7-4c32-a30e-08655c2f4e65','20641'],
  ['09d7f0a7-4c29-462c-820f-e11ea914d375','21695'],
  ['b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c','21824'],
];
for(const [id,canvasCourseId] of mapping) {
  const cls=await db.getDocument(databaseId,'classes',id);
  if(cls.canvasCourseId && cls.canvasCourseId!==canvasCourseId)throw new Error('Existing Canvas mapping differs for '+id);
  await db.updateDocument(databaseId,'classes',id,{canvasCourseId});
}
console.log('Stored Canvas IDs on the four verified classes.');
