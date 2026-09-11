import {Client,Databases} from 'node-appwrite';
const {APPWRITE_ENDPOINT,APPWRITE_PROJECT_ID,APPWRITE_API_KEY}=process.env;
if(!APPWRITE_ENDPOINT||!APPWRITE_PROJECT_ID||!APPWRITE_API_KEY)throw Error('Appwrite setup credentials required');
const db=new Databases(new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY));
for(const key of ['isCopywork','isAssignedReading']){
  const args={databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'text_assignments',key};
  try{const a=await db.getAttribute(args);console.log(`${key}: ${a.status}`);}
  catch(error){if(error.code!==404)throw error;await db.createBooleanAttribute({...args,required:false});console.log(`${key}: created`);}
}
