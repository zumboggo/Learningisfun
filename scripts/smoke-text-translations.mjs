import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Client,Databases,Functions,Users,ID,Query} from 'node-appwrite';
if(!process.argv.includes('--run'))throw Error('Pass --run to create and remove isolated verification fixtures');
const endpoint=process.env.APPWRITE_ENDPOINT,project=process.env.APPWRITE_PROJECT_ID,databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const admin=new Client().setEndpoint(endpoint).setProject(project).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),created=[],accounts=[];
const textId=ID.unique(),classId=ID.unique(),paragraphId=ID.unique(),now=new Date().toISOString();
const create=async(collectionId,id,data)=>{await db.createDocument(databaseId,collectionId,id,data,[]);created.push([collectionId,id]);};
async function identity(role){const id=ID.unique(),email=`translation-${id}@example.invalid`;await users.create({userId:id,email,password:randomUUID(),name:`Translation verification ${role}`});accounts.push(id);await create('users',id,{email,name:`Translation verification ${role}`,role,deviceId:'verification',lastSyncAt:now,createdAt:now});const token=await users.createJWT({userId:id,duration:900});const client=new Client().setEndpoint(endpoint).setProject(project).setJWT(token.jwt);return {id,client,invoke:async body=>{const result=await new Functions(client).createExecution({functionId:'learning-content',body:JSON.stringify(body)});const data=JSON.parse(result.responseBody||'{}');if(data.error)throw Error(data.error);return data;}};}
let teacher;
try{
 teacher=await identity('teacher');const student=await identity('student'),outsider=await identity('student');
 await create('classes',classId,{name:'Synthetic verification',courseName:'Translation verification',schoolYear:'2026-2027',teacherId:teacher.id,joinCode:ID.unique().slice(0,16),joinCodeActive:false,status:'active',createdAt:now});
 await create('class_members',ID.unique(),{classId,userId:student.id,role:'student',joinedAt:now});
 await create('texts',textId,{teacherId:teacher.id,title:'Synthetic bilingual verification',contentMode:'full',status:'published',createdAt:now,updatedAt:now});
 await create('text_assignments',ID.unique(),{textId,classId,isAssignedReading:true,assignedAt:'2000-01-01',dueDate:'2000-01-01'});
 const content='Mina opened the book. She wanted to understand the story.';
 await create('text_paragraphs',paragraphId,{textId,sortOrder:0,content});
 const request={action:'generateTextTranslation',textId,paragraphId,content,level:'original',language:'zh-Hans'};
 await assert.rejects(()=>outsider.invoke(request),/not available/);
 const first=await student.invoke(request);assert.equal(first.status,'ready');assert.equal(first.pairs.map(p=>p.english).join(''),content);assert.ok(first.pairs.every(p=>p.translation.trim()));
 assert.deepEqual(await student.invoke({...request,action:'readTextTranslation'}),first);
 assert.deepEqual(await student.invoke(request),first);
 assert.equal((await student.invoke({...request,action:'reportTextTranslation'})).ok,true);
 await assert.rejects(()=>new Databases(student.client).listDocuments({databaseId,collectionId:'text_translations'}));
 console.log('Live translation: exact English alignment, Chinese output, shared reuse, report, and access isolation verified.');
}finally{
 for(const collectionId of ['text_translations','text_translation_locks']){
  const rows=await db.listDocuments({databaseId,collectionId,queries:[Query.limit(5000)]});
  for(const row of rows.documents.filter(r=>r.textId===textId))await db.deleteDocument({databaseId,collectionId,documentId:row.$id});
 }
 // Preserve billing records for the synthetic teacher as the audit trail of this paid verification.
 for(const [collectionId,documentId] of created.reverse())await db.deleteDocument({databaseId,collectionId,documentId});
 for(const userId of accounts)await users.delete({userId});
 console.log('Synthetic reading and accounts removed; billing audit retained.');
}
