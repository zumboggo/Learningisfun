// Explicit live verification with isolated synthetic teacher/student accounts.
// Never alters a real class or reads student submissions. Removes only fixtures
// created by this invocation, including the temporary authentication accounts.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Client,Databases,Functions,Users,ID,Query} from 'node-appwrite';
import {discussionKey} from '../functions/learning-content/src/reading-discussion.js';
if(!process.argv.includes('--run'))throw Error('Pass --run to create and remove isolated verification fixtures');
const endpoint=process.env.APPWRITE_ENDPOINT,project=process.env.APPWRITE_PROJECT_ID,databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const admin=new Client().setEndpoint(endpoint).setProject(project).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),created=[],accounts=[];
const textId=ID.unique(),classId=ID.unique(),workspaceId=discussionKey(textId,classId),now=new Date().toISOString();
const create=async(collectionId,id,data)=>{await db.createDocument(databaseId,collectionId,id,data,[]);created.push([collectionId,id]);};
const identity=async(role)=>{
 const id=ID.unique(),email=`curated-${id}@example.invalid`;
 await users.create({userId:id,email,password:randomUUID(),name:`Curated verification ${role}`});accounts.push(id);
 await create('users',id,{email,name:`Curated verification ${role}`,role,deviceId:'verification',lastSyncAt:now,createdAt:now});
 const token=await users.createJWT({userId:id,duration:900});
 const client=new Client().setEndpoint(endpoint).setProject(project).setJWT(token.jwt),functions=new Functions(client);
 const invoke=async(body,expected=200)=>{
  const execution=await functions.createExecution({functionId:'learning-content',body:JSON.stringify({textId,classId,...body})});
  const result=JSON.parse(execution.responseBody||'{}');
  assert.equal(execution.responseStatusCode,expected,`${body.action}: ${result.error||execution.errors||execution.status}`);
  if(expected===200)assert.ok(!result.error,result.error);
  return result;
 };
 return {id,client,invoke};
};
try{
 const teacher=await identity('teacher'),student=await identity('student'),peer=await identity('student');
 await create('classes',classId,{name:'Synthetic verification',courseName:'Curated discussion verification',schoolYear:'2026-2027',teacherId:teacher.id,joinCode:ID.unique().slice(0,16),joinCodeActive:false,status:'active',createdAt:now});
 for(const account of [student,peer])await create('class_members',ID.unique(),{classId,userId:account.id,role:'student',joinedAt:now});
 await create('texts',textId,{teacherId:teacher.id,title:'Synthetic discussion verification',contentMode:'full',status:'published',createdAt:now,updatedAt:now});
 await create('text_assignments',ID.unique(),{textId,classId,isAssignedReading:true,assignedAt:'2000-01-01',dueDate:'2000-01-01'});
 const read={action:'readReadingDiscussion'};
 for(let i=0;i<4;i++)await student.invoke({action:'saveReadingQuestionDraft',draftId:`draft-${i}`,content:`Synthetic private question ${i}?`});
 const saved=await student.invoke(read);assert.equal(saved.notebook.length,4);assert.equal((await teacher.invoke(read)).notebook,undefined);assert.equal((await peer.invoke(read)).notebook.length,0);
 const secondToken=await users.createJWT({userId:student.id,duration:300});
 const secondDevice=new Functions(new Client().setEndpoint(endpoint).setProject(project).setJWT(secondToken.jwt));
 const recovery=await secondDevice.createExecution({functionId:'learning-content',body:JSON.stringify({action:'readReadingDiscussion',textId,classId})});assert.equal(JSON.parse(recovery.responseBody).notebook.length,4);
 await assert.rejects(()=>new Databases(teacher.client).getDocument(databaseId,'reading_question_drafts',saved.notebook[0].id));
 await assert.rejects(()=>new Databases(student.client).getDocument(databaseId,'reading_question_drafts',saved.notebook[0].id));
 console.log('Live teacher/student/peer accounts: private notebooks and cross-device recovery verified');
 const selected={action:'publishReadingQuestions',draftIds:saved.notebook.slice(0,3).map(d=>d.id)};
 await student.invoke(selected);await student.invoke(selected);assert.equal((await student.invoke(read)).publishedCount,3);
 await student.invoke({action:'publishReadingQuestions',draftIds:[saved.notebook[3].id]},403);
 const roots=(await student.invoke(read)).posts;
 await peer.invoke({action:'voteReadingDiscussion',postId:roots[0].id,upvoted:true});
 await student.invoke({action:'withdrawReadingQuestion',postId:roots[0].id});
 await student.invoke({action:'publishReadingQuestions',draftIds:[saved.notebook[3].id]});
 const replacement=(await student.invoke(read)).posts.find(p=>!roots.some(q=>q.id===p.id));assert.equal(replacement.score,0);
 console.log('Live publication limits, idempotent retries, withdrawal and vote isolation verified');
 const preview=await teacher.invoke({action:'previewReadingAssignments',studentIds:[peer.id,student.id]});
 assert.equal(preview.assignments.find(a=>a.studentId===student.id).status,'gap');
 await teacher.invoke({action:'publishReadingAssignments',studentIds:[peer.id,student.id],assignments:preview.assignments,requestId:'verification-round'});
 const assigned=(await peer.invoke(read)).assignments[0];assert.equal(assigned.status,'pending');
 await peer.invoke({action:'postReadingDiscussion',parentId:assigned.questionId,content:'Synthetic answer',quotation:' Exact passage. ',paragraph:2,requestId:'verification-reply'});
 assert.equal((await peer.invoke(read)).assignments[0].status,'completed');
 const reply=(await peer.invoke(read)).posts.find(p=>p.parentId);assert.equal(reply.quotation,' Exact passage. ');
 await student.invoke({action:'withdrawReadingQuestion',postId:assigned.questionId},403);
 const later=await teacher.invoke({action:'previewReadingAssignments',studentIds:[peer.id]});assert.notEqual(later.assignments[0].questionId,assigned.questionId);
 console.log('Live matching, self-answer gap, assignment completion, exact quotation and later-round coverage verified');
 // Four simultaneous legacy-client publishes must leave exactly three roots.
 const concurrent=await Promise.all([0,1,2,3].map(async i=>{
  const execution=await new Functions(peer.client).createExecution({functionId:'learning-content',body:JSON.stringify({textId,classId,action:'postReadingDiscussion',category:'question',content:`Concurrent synthetic ${i}?`,requestId:`concurrent-${i}`})});
  return execution.responseStatusCode;
 }));
 assert.equal(concurrent.filter(code=>code===200).length,3);assert.equal((await peer.invoke(read)).publishedCount,3);
 console.log('Live concurrent publishing: fourth question rejected');
}finally{
 for(const collection of ['reading_votes','reading_reports','reading_posts','reading_question_drafts','reading_reply_rounds']){
  let rows;do{rows=await db.listDocuments(databaseId,collection,[Query.equal('workspaceId',workspaceId),Query.limit(100)]);for(const row of rows.documents)await db.deleteDocument(databaseId,collection,row.$id);}while(rows.documents.length===100);
 }
 await db.deleteDocument(databaseId,'reading_question_state',workspaceId).catch(e=>{if(e.code!==404)throw e;});
 for(const [collection,id] of created.reverse())await db.deleteDocument(databaseId,collection,id);
 for(const userId of accounts)await users.delete({userId});
 console.log('Removed all synthetic verification records and accounts');
}
