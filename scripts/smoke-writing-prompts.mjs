// Explicit live verification with isolated synthetic teacher/student accounts.
// Never alters a real class or reads student submissions. Removes only fixtures
// created by this invocation, including the temporary authentication accounts.
import assert from 'node:assert/strict';
import {writingWorkspace} from '../functions/learning-content/src/writing-discussion.js';
import {randomUUID} from 'node:crypto';
import {Client,Databases,Functions,Users,ID,Query} from 'node-appwrite';
if(!process.argv.includes('--run'))throw Error('Pass --run to create and remove isolated verification fixtures');
const endpoint=process.env.APPWRITE_ENDPOINT,project=process.env.APPWRITE_PROJECT_ID,databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const admin=new Client().setEndpoint(endpoint).setProject(project).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),created=[],accounts=[];
const classId=ID.unique(),now=new Date().toISOString();
let sessionId;
const create=async(collectionId,id,data)=>{await db.createDocument(databaseId,collectionId,id,data,[]);created.push([collectionId,id]);};
const identity=async(role)=>{
 const id=ID.unique(),email=`writing-${id}@example.invalid`;
 await users.create({userId:id,email,password:randomUUID(),name:`Writing verification ${role}`});accounts.push(id);
 await create('users',id,{email,name:`Writing verification ${role}`,role,deviceId:'verification',lastSyncAt:now,createdAt:now});
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
 const teacher=await identity('teacher'),student=await identity('student'),peer=await identity('student'),outsider=await identity('student');
 await create('classes',classId,{name:'Synthetic writing verification',courseName:'Writing verification',schoolYear:'2026-2027',teacherId:teacher.id,joinCode:ID.unique().slice(0,16),joinCodeActive:false,status:'active',createdAt:now});
 await create('class_members',ID.unique(),{classId,userId:student.id,role:'student',joinedAt:now});
 await create('class_members',ID.unique(),{classId,userId:peer.id,role:'student',joinedAt:now});
 ({sessionId}=await teacher.invoke({action:'createLivePresentation',title:'Writing Prompt',questions:[{type:'paragraph',text:'Synthetic writing prompt',options:[],answer:''}],allowResubmission:false}));
 // Reproduce an existing prompt that predates automatic revision.
 const session=await db.getDocument(databaseId,'class_sessions',sessionId);
 await db.updateDocument(databaseId,'class_sessions',sessionId,{notesMarkdown:JSON.stringify({...JSON.parse(session.notesMarkdown),allowResubmission:false})});
 const read=()=>student.invoke({action:'readLivePresentation',sessionId});
 assert.equal((await read()).allowResubmission,true);
 await outsider.invoke({action:'submitLiveAnswer',sessionId,answer:'Not enrolled'},403);
 for(const answer of ['First response','Second response','Final revised response']){
  await student.invoke({action:'submitLiveAnswer',sessionId,answer});
  assert.equal((await read()).ownAnswer,answer);
 }
 const answers=await db.listDocuments(databaseId,'discussion_answers',[Query.equal('questionId',session.assignmentId)]);
 assert.equal(answers.total,1);
 assert.equal(answers.documents[0].answerText,'Final revised response');
 const root=answers.documents[0].$id;
 assert.equal((await read()).discussion.posts.length,0);
 await assert.rejects(()=>new Databases(student.client).getDocument(databaseId,'discussion_answers',root));
 await assert.rejects(()=>new Databases(student.client).updateDocument(databaseId,'class_sessions',sessionId,{notesMarkdown:'{}'}));
 await student.invoke({action:'readClassDiscussion',sessionId},403);
 await teacher.invoke({action:'setWritingDiscussionSettings',writingSessionId:sessionId,discussionMode:true});
 // A student can see submissions before writing their own.
 const shared=await peer.invoke({action:'readReadingDiscussion',writingSessionId:sessionId});
 assert.equal(shared.posts.length,1);assert.ok(!('username' in shared.posts[0]));assert.ok(!('authorId' in shared.posts[0]));
 await peer.invoke({action:'submitLiveAnswer',sessionId,answer:'Peer submission 中文'});
 const assignment=await teacher.invoke({action:'previewReadingAssignments',writingSessionId:sessionId,studentIds:[student.id,peer.id]});
 await teacher.invoke({action:'publishReadingAssignments',writingSessionId:sessionId,studentIds:[student.id,peer.id],assignments:assignment.assignments,requestId:'live-round'});
 const assigned=assignment.assignments.find(a=>a.studentId===peer.id);assert.equal(assigned.questionId,root);
 await peer.invoke({action:'postReadingDiscussion',writingSessionId:sessionId,parentId:root,content:'Specific feedback',requestId:'live-reply'});
 const replied=await peer.invoke({action:'readReadingDiscussion',writingSessionId:sessionId});assert.equal(replied.assignments[0].status,'completed');
 await student.invoke({action:'exportWritingResponses',writingSessionId:sessionId},403);
 const anonymous=await teacher.invoke({action:'exportWritingResponses',writingSessionId:sessionId,includeReplies:true});assert.equal(anonymous.posts.length,3);assert.ok(anonymous.posts.every(p=>!('name' in p)));
 const named=await teacher.invoke({action:'exportWritingResponses',writingSessionId:sessionId,includeNames:true});assert.equal(named.posts.length,2);assert.ok(named.posts.every(p=>p.name));
 await teacher.invoke({action:'setWritingDiscussionSettings',writingSessionId:sessionId,studentsCanView:false});
 assert.equal((await read()).discussion.posts.length,0);
 await peer.invoke({action:'postReadingDiscussion',writingSessionId:sessionId,parentId:root,content:'Hidden',requestId:'hidden'},403);
 await teacher.invoke({action:'controlLivePresentation',sessionId,command:'end'});
 await student.invoke({action:'submitLiveAnswer',sessionId,answer:'After closure'},403);
 const finished=await db.getDocument(databaseId,'class_sessions',sessionId);
 assert.ok(finished.publishedNotesMarkdown.includes(`/presentations/${sessionId}/live`));
 assert.ok(!finished.publishedNotesMarkdown.includes('Final revised response'));
 assert.equal((await read()).discussion.posts.length,0);
 assert.equal((await read()).ownAnswer,'Final revised response');
 assert.equal((await db.getDocument(databaseId,'discussion_answers',answers.documents[0].$id)).answerText,'Final revised response');
 console.log('Live verification passed: revisions, visibility, anonymity, assignment completion, named/anonymous exports, direct database restrictions, legacy API rejection, and read-only archives.');
} finally {
 if(sessionId){
  const workspaceId=writingWorkspace(sessionId);
  for(const collection of ['reading_posts','reading_settings','reading_reply_rounds','reading_question_state','reading_votes','reading_reports']){const rows=await db.listDocuments(databaseId,collection,[Query.equal('workspaceId',workspaceId),Query.limit(100)]);for(const row of rows.documents)await db.deleteDocument(databaseId,collection,row.$id);}
  const questions=await db.listDocuments(databaseId,'discussion_questions',[Query.equal('classSessionId',sessionId)]);
  for(const question of questions.documents){
   const answers=await db.listDocuments(databaseId,'discussion_answers',[Query.equal('questionId',question.$id)]);
   for(const answer of answers.documents)await db.deleteDocument(databaseId,'discussion_answers',answer.$id);
   await db.deleteDocument(databaseId,'discussion_questions',question.$id);
  }
  await db.deleteDocument(databaseId,'class_sessions',sessionId);
 }
 for(const [collection,id] of created.reverse())await db.deleteDocument(databaseId,collection,id);
 for(const id of accounts)await users.delete({userId:id});
 console.log('Removed isolated verification data and accounts.');
}
