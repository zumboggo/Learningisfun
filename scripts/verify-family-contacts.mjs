// Read-only verification of the deployed backend; never reads or prints student details.
import {Client,Databases,Functions,Users} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {FAMILY_CONTACT_CLASS_ID} from '../functions/learning-content/src/family-contact-schema.js';
import {FAMILY_CONTACT_COLLECTION} from '../functions/learning-content/src/family-contacts.js';
loadEnvFile(join(homedir(),'.config','learningisfun','appwrite.env'));
const base=()=>new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID);
const admin=base().setKey(process.env.APPWRITE_API_KEY),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const db=new Databases(admin),cls=await db.getDocument(databaseId,'classes',FAMILY_CONTACT_CLASS_ID);
const collection=await db.getCollection(databaseId,FAMILY_CONTACT_COLLECTION);
if(collection.$permissions.length||collection.documentSecurity)throw Error('Contact collection must be function-only.');
const {jwt}=await new Users(admin).createJWT({userId:cls.teacherId,duration:120});
const teacher=base().setJWT(jwt),functions=new Functions(teacher);
const call=async body=>{
 const e=await functions.createExecution({functionId:'learning-content',body:JSON.stringify({classId:FAMILY_CONTACT_CLASS_ID,...body})});
 return {status:e.responseStatusCode,data:JSON.parse(e.responseBody||'{}')};
};
const preview=await call({action:'readFamilyContacts',preview:true});
if(preview.status!==200||preview.data.teacher!==false||preview.data.preview!==true||preview.data.response!==null||'rows' in preview.data)throw Error('Teacher student-preview access failed.');
const other=await call({action:'readFamilyContacts',classId:'other-class'});
if(other.status!==403)throw Error('Other-class access was not rejected.');
const save=await call({action:'saveFamilyContacts',confirmed:true,values:[]});
if(save.status!==403)throw Error('Teacher must not be able to submit as a student.');
const generic=await call({action:'mutate',collection:FAMILY_CONTACT_COLLECTION,operation:'create',id:'forbidden-smoke-test',data:{}});
if(generic.status!==400)throw Error('Generic mutations must not access contact storage.');
try{await new Databases(teacher).listDocuments(databaseId,FAMILY_CONTACT_COLLECTION);throw Error('Teacher client unexpectedly has direct collection access.');}catch(cause){if(![401,403].includes(cause.code))throw cause;}
console.log('Verified deployed backend: private storage; teacher student-preview contains no data; wrong-class and teacher submissions blocked; generic mutations blocked; direct database reads denied. No contact records were created or read.');
