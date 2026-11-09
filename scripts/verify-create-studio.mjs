// Read-only authenticated production checks; no paid generation, drafts, or student work.
import assert from 'node:assert/strict';
import {Client,Databases,Functions,Users,Storage} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import catalog from '../functions/learning-content/src/lesson-catalog.json' with {type:'json'};
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const configure=()=>new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID);
const admin=configure().setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin),storage=new Storage(admin);
const cls=await db.getDocument(process.env.APPWRITE_DATABASE_ID||'main','classes',catalog[0].classIds[0]);
const token=await users.createJWT({userId:cls.teacherId,duration:120}),functions=new Functions(configure().setJWT(token.jwt));
for(const action of ['textStudioLibrary','lessonBuilderLibrary','animatedLibrary']){const e=await functions.createExecution({functionId:'learning-content',body:JSON.stringify({action})});assert.equal(e.responseStatusCode,200,action+' failed: '+e.responseBody.slice(0,150));const r=JSON.parse(e.responseBody);assert.ok(Array.isArray(r.drafts));if(action==='textStudioLibrary'){assert.equal(r.imagePrice,.003);assert.equal(r.guidanceVersion,'2026-11-09.1');assert.equal(r.courses.length,3);console.log('Image provider configured:',r.imageAvailable);}console.log('Verified:',action);}
const bucket=await storage.getBucket({bucketId:'original-pdfs'});assert.equal(bucket.$permissions.length,0);assert.equal(bucket.fileSecurity,false);console.log('Verified: private reading image storage');
for(const [collection,field] of [['texts','title'],['text_paragraphs','content']]){const c=await db.getCollection({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:collection});const a=c.attributes.find(a=>a.key===field);console.log('Verified schema:',collection,field,a?.size);}
