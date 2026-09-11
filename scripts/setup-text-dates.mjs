// Add only the optional text deadline attribute; do not rewrite existing assignments.
import { Client, Databases } from 'node-appwrite';
const {APPWRITE_ENDPOINT,APPWRITE_PROJECT_ID,APPWRITE_API_KEY}=process.env;
if(!APPWRITE_ENDPOINT||!APPWRITE_PROJECT_ID||!APPWRITE_API_KEY)throw Error('Appwrite setup credentials required');
const db=new Databases(new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY));
const args={databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'text_assignments',key:'dueDate'};
try { const attribute=await db.getAttribute(args); console.log(`Text due date: ${attribute.status}`); }
catch(error){if(error.code!==404)throw error;await db.createStringAttribute({...args,size:10,required:false});console.log('Created optional text due date attribute.');}
