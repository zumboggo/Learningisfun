import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {loadEnvFile} from 'node:process';import {homedir} from 'node:os';
import {Client,Databases,Users,Functions,Storage,Query} from 'node-appwrite';import {InputFile} from 'node-appwrite/file';import {createHash} from 'node:crypto';
import {readRecord,writeRecord} from '../../../functions/learning-content/src/teacher-workspace.js';import {validatePackage} from '../../../functions/learning-content/src/story-engine.js';
if(!process.env.APPWRITE_API_KEY)loadEnvFile(homedir()+'/.config/learningisfun/appwrite.env');
const id='the-institution-protects-its-own',classId='e24ec8d9-21d7-4c32-a30e-08655c2f4e65',date='2026-11-10',releaseAt='2026-11-10T00:00:00.000Z';
const root=new URL('../../../',import.meta.url),pack=JSON.parse(await readFile(new URL(`public/stories/animated/${id}/episode.json`,root),'utf8'));
assert.deepEqual(validatePackage(pack).errors,[]);
const base=()=>new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID);
const admin=base().setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin),storage=new Storage(admin),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const cls=await db.getDocument({databaseId,collectionId:'classes',documentId:classId});assert.equal(cls.courseName,'Ethics and Leadership');assert.equal(cls.status,'active');
const owner=await users.get({userId:cls.teacherId});assert.match(owner.name,/^(davidh|david hepting)$/i);
async function functionsFor(userId){const {jwt}=await users.createJWT({userId,duration:900});return new Functions(base().setJWT(jwt));}
const teacher=await functionsFor(owner.$id);
async function call(body,client=teacher){const r=await client.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Function failed');return d;}
const before=await call({action:'animatedLibrary'});
const members=await db.listDocuments({databaseId,collectionId:'class_members',queries:[Query.equal('classId',classId),Query.equal('role','student'),Query.limit(500)]});const member=members.documents.find(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now());assert(member);
if(process.argv.includes('--preflight')){console.log(JSON.stringify({classId,className:cls.courseName,activeMembershipVerified:true,existing:before.assignments.filter(a=>a.id===id),date,releaseAt,noDeadline:true},null,2));process.exit(0);}
const bucket=await storage.getBucket({bucketId:'private-episode-media'});assert.equal(bucket.$permissions.length,0);assert.equal(bucket.fileSecurity,false);
for(const name of ['opening-v1.mp4','opening-v1.poster.jpg','opening-v1.vtt']){const path=`stories/shared/${id}/${name}`,bytes=await readFile(new URL('public/'+path,root)),fileId=createHash('sha256').update(bytes).digest('hex').slice(0,36);try{await storage.createFile({bucketId:'private-episode-media',fileId,file:InputFile.fromBuffer(bytes,name),permissions:[]});}catch(e){if(e.code!==409)throw e;}assert(Buffer.from(await storage.getFileDownload({bucketId:'private-episode-media',fileId})).equals(bytes));const key='private-media:'+path,current=await readRecord(db,databaseId,'system',key);if(current.value)assert.equal(current.value.fileId,fileId,'Preserve existing media');else await writeRecord(db,databaseId,'system',key,{fileId},current.revision);}
let draft=before.drafts.find(d=>d.id===id);if(draft){draft=await call({action:'animatedReadDraft',id});assert.deepEqual(draft.pack,pack,'Preserve conflicting draft');}else draft=await call({action:'animatedSaveDraft',id,revision:0,pack});
const version=await call({action:'animatedPublish',id,revision:draft.revision});
const row=await db.getDocument({databaseId,collectionId:'episode_records',documentId:version.versionId}),record=JSON.parse(row.dataJson),raw=await storage.getFileDownload({bucketId:'animated-episodes',fileId:record.fileId});assert.equal(JSON.stringify(raw?.format?raw:JSON.parse(Buffer.from(raw).toString())),JSON.stringify(pack),'Stored package content differs');
const key='private-preview:'+id,current=await readRecord(db,databaseId,'system',key);if(current.value)assert.equal(current.value.fileId,record.fileId);else await writeRecord(db,databaseId,'system',key,{fileId:record.fileId},current.revision);
const preview=await call({action:'readPrivateAnimatedPreview',slug:id});assert.deepEqual(preview.pack,pack);assert.equal(Object.keys(preview.mediaUrls||{}).length,3);
const receipt={id,title:pack.title,status:'published-unassigned',versionId:version.versionId,version:version.version,privateMediaVerified:true,privatePreviewVerified:true,publishedBytesVerified:true,previewUrl:`https://zumboggo.github.io/Learningisfun/#/game/story-preview/${id}`,studioUrl:`https://zumboggo.github.io/Learningisfun/#/game/create?draft=${id}`,assignments:[]};
if(process.argv.includes('--assign')){
 const prior=before.assignments.filter(a=>a.id===id&&a.classId===classId);assert(prior.length<=1);if(prior[0]){assert.equal(prior[0].versionId,version.versionId);assert.equal(prior[0].date,date);}
 await call({action:'animatedAssign',versionId:version.versionId,classId,date,releaseAt,...(prior[0]?{assignmentId:prior[0].assignmentId}:{})});
 const after=await call({action:'animatedLibrary'});const a=after.assignments.find(a=>a.id===id&&a.classId===classId);assert(a);assert.equal(a.versionId,version.versionId);assert.equal(a.date,date);
 const student=await functionsFor(member.userId);const live=await call({action:'animatedRead',assignmentId:a.assignmentId},student);assert.equal(live.preview,false);assert.deepEqual(live.pack,pack);assert.equal(Object.keys(live.mediaUrls||{}).length,3);
 for(const url of Object.values(live.mediaUrls)){const r=await fetch(url,{headers:{Range:'bytes=0-255'}});assert(r.ok);await r.arrayBuffer();}
 for(const old of before.assignments.filter(a=>a.id!==id))assert.deepEqual(after.assignments.find(a=>a.assignmentId===old.assignmentId),old);
 Object.assign(receipt,{status:'published-assigned',studentReadVerified:true,studentAttemptsCreated:false,unrelatedAssignmentsPreserved:true,deadline:null,assignments:[{classId,className:cls.courseName,section:cls.name,date:a.date,releaseAt:a.releaseAt,assignmentId:a.assignmentId,playUrl:`https://zumboggo.github.io/Learningisfun/#/game/play/${a.assignmentId}`}]});
}else assert.deepEqual((await call({action:'animatedLibrary'})).assignments,before.assignments);
await writeFile(new URL('publication.json',import.meta.url),JSON.stringify({...receipt,verifiedAt:new Date().toISOString()},null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
