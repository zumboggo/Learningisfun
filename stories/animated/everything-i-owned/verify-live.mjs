import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions,Query} from 'node-appwrite';
const root=new URL('../../../',import.meta.url),receiptPath=new URL('publication.json',import.meta.url);
const receipt=JSON.parse(await readFile(receiptPath,'utf8'));
const pack=JSON.parse(await readFile(new URL('public/stories/animated/everything-i-owned/episode.json',root),'utf8'));
const base=()=>new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID);
const admin=base().setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin);
const databaseId=process.env.APPWRITE_DATABASE_ID||'main';
for(const assignment of receipt.assignments){
 const cls=await db.getDocument({databaseId,collectionId:'classes',documentId:assignment.classId});
 assert.equal(cls.courseName,'World Literature');assert.equal(cls.status,'active');
 const members=await db.listDocuments({databaseId,collectionId:'class_members',queries:[Query.equal('classId',assignment.classId),Query.equal('role','student'),Query.limit(500)]});
 const member=members.documents.find(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now());assert(member);
 const {jwt}=await users.createJWT({userId:member.userId,duration:60});
 const f=new Functions(base().setJWT(jwt));
 const result=await f.createExecution({functionId:'learning-content',body:JSON.stringify({action:'animatedRead',assignmentId:assignment.assignmentId})});
 const body=JSON.parse(result.responseBody);assert(result.responseStatusCode<400,body.error);assert.equal(body.preview,false);
 assert.deepEqual(body.pack,pack);assert.equal(body.assignment.versionId,receipt.versionId);assert.equal(body.assignment.date,'2026-11-02');
 assert.equal(Object.keys(body.mediaUrls||{}).length,3);
 for(const url of Object.values(body.mediaUrls)){const media=await fetch(url,{headers:{Range:'bytes=0-255'}});assert(media.ok);await media.arrayBuffer();}
 console.log('Student read and private teaser verified:',cls.name);
}
await writeFile(receiptPath,JSON.stringify({...receipt,studentReadVerified:true,studentMediaVerified:true,studentAttemptsCreated:false},null,2)+'\n');
