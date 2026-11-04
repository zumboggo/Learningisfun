// Read-only deployment check. No student work or paid AI requests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Client,Databases,Functions,Users} from 'node-appwrite';
const catalog=JSON.parse(readFileSync(new URL('../functions/learning-content/src/lesson-catalog.json',import.meta.url)));
const {APPWRITE_ENDPOINT,APPWRITE_PROJECT_ID,APPWRITE_API_KEY}=process.env;
const configure=()=>new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
const admin=configure().setKey(APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin);
for(const lesson of catalog)for(const classId of lesson.classIds){
 const cls=await db.getDocument(process.env.APPWRITE_DATABASE_ID||'main','classes',classId);
 const token=await users.createJWT({userId:cls.teacherId,duration:60}),functions=new Functions(configure().setJWT(token.jwt));
 const exec=await functions.createExecution({functionId:'learning-content',body:JSON.stringify({action:'lessonRead',classId,lessonId:lesson.id})});
 assert.equal(exec.responseStatusCode,200);const {lesson:live}=JSON.parse(exec.responseBody);
 assert.equal(live.title,lesson.title);assert.equal(live.final.sourceUrl,lesson.final.sourceUrl);assert.equal(live.stages.length,lesson.stages.length);
 console.log('Authenticated preview verified:',cls.name,live.title);
}
