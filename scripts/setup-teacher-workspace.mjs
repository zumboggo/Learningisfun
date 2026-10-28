import {Client,Databases,Functions,Users} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {WORKSPACE,writeRecord,readRecord,hashInvitation} from '../functions/learning-content/src/teacher-workspace.js';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(client),functions=new Functions(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const knownClasses=await Promise.all(['e24ec8d9-21d7-4c32-a30e-08655c2f4e65','88421c66-9cda-4002-8e15-086312b7805e'].map(id=>db.getDocument(databaseId,'classes',id)));
if(new Set(knownClasses.map(c=>c.teacherId)).size!==1)throw Error('Owner verification failed');
const ownerId=knownClasses[0].teacherId,owner=await new Users(client).get({userId:ownerId});
if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner of established classes');
const backupDir=join(homedir(),'.config/learningisfun/backups');await mkdir(backupDir,{recursive:true,mode:0o700});await writeFile(join(backupDir,'teacher-onboarding-owner.json'),JSON.stringify({ownerId,classes:knownClasses},null,2),{mode:0o600});
let collection;try{collection=await db.getCollection(databaseId,WORKSPACE)}catch(e){if(e.code!==404)throw e;collection=await db.createCollection(databaseId,WORKSPACE,'Private teacher workspace',[],false)}
if(collection.$permissions.length||collection.documentSecurity)throw Error('Workspace must be server only');
for(const [key,size]of Object.entries({ownerId:64,kind:255,dataJson:1000000})){try{await db.createStringAttribute(databaseId,WORKSPACE,key,size,true)}catch(e){if(e.code!==409)throw e}}
try{await db.createIntegerAttribute(databaseId,WORKSPACE,'revision',true)}catch(e){if(e.code!==409)throw e}
for(let i=0;i<100;i++){const a=await db.listAttributes(databaseId,WORKSPACE);if(a.attributes.length===4&&a.attributes.every(v=>v.status==='available'))break;if(i===99)throw Error('Attributes not ready');await new Promise(r=>setTimeout(r,500))}
for(const key of ['ownerId','kind']){try{await db.createIndex(databaseId,WORKSPACE,'idx_'+key,'key',[key])}catch(e){if(e.code!==409)throw e}}
const variables=await functions.listVariables({functionId:'learning-content'}),existing=variables.variables.find(v=>v.key==='OWNER_ACCOUNT_ID');if(existing&&existing.value!==ownerId)throw Error('Owner config mismatch');if(!existing)await functions.createVariable({functionId:'learning-content',variableId:'owner-account-id',key:'OWNER_ACCOUNT_ID',value:ownerId});
const prefs=await readRecord(db,databaseId,ownerId,'preferences');if(!prefs.revision){if(!process.env.OWNER_PRESENTATION_FOLDER_URL)throw Error('Supply existing owner folder URL privately');await writeRecord(db,databaseId,ownerId,'preferences',{presentationFolderUrl:process.env.OWNER_PRESENTATION_FOLDER_URL},0)}
const invitation=await readRecord(db,databaseId,'system','invitation');if(!invitation.revision){if(!process.env.TEACHER_INVITATION_CODE)throw Error('Supply initial invitation through private environment');await writeRecord(db,databaseId,'system','invitation',hashInvitation(process.env.TEACHER_INVITATION_CODE),0)}
console.log('Verified owner, private workspace and invitation initialized. No secrets displayed.');
