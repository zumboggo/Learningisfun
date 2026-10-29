import {Client,Databases} from 'node-appwrite';
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
const databaseId=process.env.APPWRITE_DATABASE_ID||'main';
try {await db.createStringAttribute(databaseId,'classes','bannerJson',1024,false);}catch(error){if(error.code!==409)throw error;}
for(let attempt=0;attempt<20;attempt++){
 const attribute=await db.getAttribute(databaseId,'classes','bannerJson');
 if(attribute.status==='available'){console.log('Class banner field ready');process.exit(0);}
 if(attribute.status==='failed')throw new Error('Banner field provisioning failed');
 await new Promise(resolve=>setTimeout(resolve,2000));
}
throw new Error('Banner field is still provisioning');
