import {Client,Databases} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {FAMILY_CONTACT_CLASS_ID} from '../functions/learning-content/src/family-contact-schema.js';
import {FAMILY_CONTACT_COLLECTION} from '../functions/learning-content/src/family-contacts.js';
loadEnvFile(join(homedir(),'.config','learningisfun','appwrite.env'));
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
const databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const cls=await db.getDocument(databaseId,'classes',FAMILY_CONTACT_CLASS_ID);
if(cls.name!=='Gr. 9 Boys Advisory'||cls.status!=='active')throw Error('Expected active advisory class was not found.');
let collection;
try{collection=await db.getCollection(databaseId,FAMILY_CONTACT_COLLECTION)}catch(cause){if(cause.code!==404)throw cause;collection=await db.createCollection(databaseId,FAMILY_CONTACT_COLLECTION,'Grade 9 advisory private family contacts',[],false);}
if(collection.$permissions.length||collection.documentSecurity)throw Error('Unexpected collection access policy. Stop before storing contact details.');
const specs={classId:64,userId:64,valuesJson:8192,updatedAt:40};
let attributes=await db.listAttributes(databaseId,FAMILY_CONTACT_COLLECTION);
for(const [key,size] of Object.entries(specs)){
 const existing=attributes.attributes.find(a=>a.key===key);
 if(existing){if(existing.type!=='string'||existing.size!==size||!existing.required)throw Error('Unexpected existing attribute '+key);}
 else await db.createStringAttribute(databaseId,FAMILY_CONTACT_COLLECTION,key,size,true);
}
for(let n=0;n<60;n++){
 attributes=await db.listAttributes(databaseId,FAMILY_CONTACT_COLLECTION);
 if(attributes.attributes.some(a=>a.status==='failed'))throw Error('A contact attribute could not be provisioned.');
 if(Object.keys(specs).every(key=>attributes.attributes.some(a=>a.key===key&&a.status==='available')))break;
 if(n===59)throw Error('Attributes are still preparing. Retry setup later.');
 await new Promise(r=>setTimeout(r,500));
}
let indexes=await db.listIndexes(databaseId,FAMILY_CONTACT_COLLECTION);
if(!indexes.indexes.some(i=>i.key==='idx_class'))await db.createIndex(databaseId,FAMILY_CONTACT_COLLECTION,'idx_class','key',['classId']);
for(let n=0;n<60;n++){
 indexes=await db.listIndexes(databaseId,FAMILY_CONTACT_COLLECTION);
 const index=indexes.indexes.find(i=>i.key==='idx_class');
 if(index?.status==='available'){if(index.type!=='key'||JSON.stringify(index.attributes)!==JSON.stringify(['classId']))throw Error('Unexpected contact index.');break;}
 if(n===59||index?.status==='failed')throw Error('Contact index is not ready.');
 await new Promise(r=>setTimeout(r,500));
}
console.log('Private function-only family contact storage is ready for Gr. 9 Boys Advisory. No student data was read or imported.');
