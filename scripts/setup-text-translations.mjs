import {Client,Databases} from 'node-appwrite';
const {APPWRITE_ENDPOINT,APPWRITE_PROJECT_ID,APPWRITE_API_KEY}=process.env;
if(!APPWRITE_ENDPOINT||!APPWRITE_PROJECT_ID||!APPWRITE_API_KEY)throw Error('Appwrite setup credentials required');
const db=new Databases(new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY));
const databaseId=process.env.APPWRITE_DATABASE_ID||'main';
for(const [collectionId,attributes] of Object.entries({text_translations:{textId:36,level:32,language:20,sourceHash:64,paragraphId:36,status:20,pairs:100000,reported:'boolean'},text_translation_locks:{translationId:36}})) {
  try{await db.createCollection({databaseId,collectionId,name:collectionId,permissions:[],documentSecurity:false});}catch(e){if(e.code!==409)throw e;}
  for(const [key,size] of Object.entries(attributes)) {
    const args={databaseId,collectionId,key};
    try{await db.getAttribute(args);}catch(e){if(e.code!==404)throw e;if(size==='boolean')await db.createBooleanAttribute({...args,required:false,default:false});else await db.createStringAttribute({...args,size,required:true});}
  }
  for(let attempt=0;attempt<60;attempt++) {
    const result=await db.listAttributes({databaseId,collectionId});
    if(result.attributes.some(a=>a.status==='failed'))throw Error('Attribute creation failed');
    if(result.attributes.every(a=>a.status==='available'))break;
    if(attempt===59)throw Error('Attributes are not ready');
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  console.log(`${collectionId}: ready (server-only access)`);
}
