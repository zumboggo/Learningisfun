import {Client,Databases} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
const databaseId=process.env.APPWRITE_DATABASE_ID||'main';
for(const [collectionId,key,size] of [['peer_review_activities','rubricJson',40000],['presentation_peer_reviews','ratingsJson',4000]]){
 try{await db.getAttribute({databaseId,collectionId,key})}catch(e){if(e.code!==404)throw e;await db.createStringAttribute({databaseId,collectionId,key,size,required:false});}
 const deadline=Date.now()+120000;
 while(true){const a=await db.getAttribute({databaseId,collectionId,key});if(a.status==='available')break;if(a.status==='failed'||Date.now()>deadline)throw new Error(`${collectionId}.${key}: ${a.status}`);await new Promise(r=>setTimeout(r,1000));}
 console.log(`${collectionId}.${key} available`);
}
