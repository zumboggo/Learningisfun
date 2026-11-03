// Add only the private practice collection. No existing records or grants are changed.
import {Client,Databases} from 'node-appwrite';
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
const target={databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'rhetorical_practice'};
try{const c=await db.getCollection(target);if(c.$permissions.length||c.documentSecurity)throw Error('Unexpected practice permissions');}
catch(e){if(e.code!==404)throw e;await db.createCollection({...target,name:'Private Rhetorical Situation Practice',permissions:[],documentSecurity:false});}
for(const [key,size] of [['userId',255],['classId',255],['textId',255],['dataJson',1000000]]){
 try{const a=await db.getAttribute({...target,key});if(a.type!=='string'||a.size!==size||!a.required)throw Error('Unexpected attribute '+key);}
 catch(e){if(e.code!==404)throw e;await db.createStringAttribute({...target,key,size,required:true});}
}
for(let n=0;n<30;n++){
 const result=await db.listAttributes(target);
 if(result.attributes.some(a=>a.status==='failed'))throw Error('Attribute provisioning failed');
 if(result.attributes.length===4&&result.attributes.every(a=>a.status==='available')){console.log('Private rhetorical practice storage ready');process.exit(0);}
 await new Promise(r=>setTimeout(r,1000));
}
throw Error('Storage still provisioning; retry this additive script');
