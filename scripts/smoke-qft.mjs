// Explicit live verification with isolated synthetic teacher/student accounts.
// Never alters a real class or reads student submissions. Removes only fixtures
// created by this invocation, including the temporary authentication accounts.
import assert from 'node:assert/strict';
import {recordId} from '../functions/learning-content/src/teacher-workspace.js';
import {randomUUID} from 'node:crypto';
import {Client,Databases,Functions,Users,Storage,ID,Query} from 'node-appwrite';
if(!process.argv.includes('--run'))throw Error('Pass --run to create and remove isolated verification fixtures');
const endpoint=process.env.APPWRITE_ENDPOINT,project=process.env.APPWRITE_PROJECT_ID,databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const admin=new Client().setEndpoint(endpoint).setProject(project).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),created=[],accounts=[];
const classId=ID.unique(),now=new Date().toISOString();
let sessionId,imageId;
const create=async(collectionId,id,data)=>{await db.createDocument(databaseId,collectionId,id,data,[]);created.push([collectionId,id]);};
const identity=async(role)=>{
 const id=ID.unique(),email=`qft-${id}@example.invalid`;
 await users.create({userId:id,email,password:randomUUID(),name:`QFT verification ${role}`});accounts.push(id);
 await create('users',id,{email,name:`QFT verification ${role}`,role,deviceId:'verification',lastSyncAt:now,createdAt:now});
 const token=await users.createJWT({userId:id,duration:900});
 const client=new Client().setEndpoint(endpoint).setProject(project).setJWT(token.jwt),functions=new Functions(client);
 const invoke=async(body,expected=200)=>{
  const execution=await functions.createExecution({functionId:'learning-content',body:JSON.stringify({classId,...body})});
  const result=JSON.parse(execution.responseBody||'{}');
  assert.equal(execution.responseStatusCode,expected,`${body.action}: ${result.error||execution.errors||execution.status}`);
  if(expected===200)assert.ok(!result.error,result.error);
  return result;
 };
 return {id,client,invoke};
};
try {
 const teacher=await identity('teacher'),student=await identity('student'),outsider=await identity('student');
 await create('classes',classId,{name:'Synthetic QFT verification',courseName:'QFT verification',schoolYear:'2026-2027',teacherId:teacher.id,joinCode:ID.unique().slice(0,16),joinCodeActive:false,status:'active',createdAt:now});
 await create('class_members',ID.unique(),{classId,userId:student.id,role:'student',joinedAt:now});
 ({fileId:imageId}=await teacher.invoke({action:'importReadingImage',source:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='}));
 ({sessionId}=await teacher.invoke({action:'createQft',title:'Synthetic QFT stimulus',paragraph:'Model paragraph',imageId}));
 const withImage=await student.invoke({action:'readQft',sessionId});assert.ok(withImage.imageUrl);assert.equal((await fetch(withImage.imageUrl)).status,200);
 const listing=await student.invoke({action:'scopedData',collection:'class_sessions',operation:'list',queries:[Query.equal('$id',sessionId)]});
 assert.equal(listing.documents[0].notesMarkdown,'{"qftVersion":2}');
 await outsider.invoke({action:'readQft',sessionId},403);
 await student.invoke({action:'addQftQuestion',sessionId,content:'Not yet'},403);
 let result=await teacher.invoke({action:'addQftQuestion',sessionId,content:'  Why this?  '});
 const questionId=result.questions[0].id;
 assert.equal(result.questions[0].content,'  Why this?  ');
 assert.ok(!('authorId' in result.questions[0]));
 await student.invoke({action:'voteQft',sessionId,questionId,delta:1},403);
 await teacher.invoke({action:'updateQft',sessionId,settings:{votingOpen:true,studentQuestions:true,studentReplies:true}});
 await student.invoke({action:'addQftQuestion',sessionId,content:'A late question'});
 for(let i=0;i<5;i++)result=await student.invoke({action:'voteQft',sessionId,questionId,delta:1});
 assert.equal(result.remaining,0);assert.ok(!('votes' in result.questions[0]));
 await student.invoke({action:'voteQft',sessionId,questionId,delta:1},400);
 result=await student.invoke({action:'replyQft',sessionId,questionId,content:'My idea'});
 assert.equal(result.replies[0].label,'Anonymous');assert.ok(!('authorId' in result.replies[0]));
 await teacher.invoke({action:'updateQft',sessionId,settings:{allowStackedVotes:false}},400);
 result=await teacher.invoke({action:'updateQft',sessionId,settings:{votingOpen:false,anonymousReplies:false}});
 assert.equal(result.questions[0].votes,5);assert.equal(result.replies[0].label,'QFT verification student');
 await student.invoke({action:'voteQft',sessionId,questionId,delta:-1},403);
 await assert.rejects(()=>new Databases(student.client).getDocument(databaseId,'teacher_workspace',recordId(sessionId,'qft')));
 console.log('Live QFT passed: student discovery, anonymous questions, oral capture, late questions, reply names, private storage, vote budget, stacking and open/close voting.');
} finally {
 if(sessionId){for(const [collection,id] of [['teacher_workspace',recordId(sessionId,'qft')],['reading_question_state',recordId('teacher-lock',sessionId)],['class_sessions',sessionId]])await db.deleteDocument(databaseId,collection,id).catch(e=>{if(e.code!==404)throw e;});}
 for(const id of accounts)await db.deleteDocument(databaseId,'reading_question_state',recordId('teacher-lock',id)).catch(e=>{if(e.code!==404)throw e;});
 for(const [collection,id] of created.reverse())await db.deleteDocument(databaseId,collection,id);
 if(imageId)await new Storage(admin).deleteFile({bucketId:'original-pdfs',fileId:imageId});
 for(const id of accounts)await users.delete({userId:id});
 console.log('Removed isolated verification data and accounts.');
}
