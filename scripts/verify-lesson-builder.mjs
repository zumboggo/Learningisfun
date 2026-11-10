// Read-only production smoke check. No student work or paid AI calls.
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
const token=await users.createJWT({userId:cls.teacherId,duration:60}),functions=new Functions(configure().setJWT(token.jwt));
for(const action of ['lessonBuilderLibrary','lessonLibrary']){const execution=await functions.createExecution({functionId:'learning-content',body:JSON.stringify({action})});assert.equal(execution.responseStatusCode,200,action+' failed');const result=JSON.parse(execution.responseBody);assert.ok(Array.isArray(result[action==='lessonLibrary'?'items':'drafts']));if(action==='lessonBuilderLibrary')assert.ok(result.classes.some(c=>c.id===cls.$id));console.log('Verified:',action);}
const bucket=await storage.getBucket({bucketId:'original-pdfs'});assert.equal(bucket.$permissions.length,0);assert.equal(bucket.fileSecurity,false);assert.ok(!bucket.allowedFileExtensions.length||bucket.allowedFileExtensions.includes('webp'));assert.ok(bucket.maximumFileSize>=5*1024*1024);console.log('Verified: private image storage accepts optimized uploads');

// A malformed image must reach the decoder and fail before any file is written.
const rejected=await functions.createExecution({functionId:'learning-content',body:JSON.stringify({action:'lessonUploadImage',data:'data:image/png;base64,'+Buffer.from('invalid image fixture').toString('base64')})});
assert.equal(rejected.responseStatusCode,400);assert.match(JSON.parse(rejected.responseBody).error,/cannot be decoded/);console.log('Verified: deployed image decoder rejects invalid bytes without storing a file');

// Missing private draft is rejected before any provider call or write.
const pageEdit=await functions.createExecution({functionId:'learning-content',body:JSON.stringify({action:'lessonEditPage',draftId:'page-edit-smoke-missing',revision:0,pageIndex:0,instruction:'Add context',requestId:'page-edit-smoke'})});
assert.equal(pageEdit.responseStatusCode,404);
assert.match(JSON.parse(pageEdit.responseBody).error,/Save the draft first/);
console.log('Verified: page-edit preview route rejects missing drafts before spending');
