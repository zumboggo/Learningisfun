import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions,Query} from 'node-appwrite';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin);
const cls=await db.getDocument({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'classes',documentId:'e24ec8d9-21d7-4c32-a30e-08655c2f4e65'});
if(cls.courseName!=='Ethics and Leadership'||cls.status!=='active')throw Error('Unexpected class');
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:300});
const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Request failed');return d;};
const id='one-more-step-toward-peace',date='2026-10-23';
const members=await db.listDocuments({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'class_members',queries:[Query.equal('classId',cls.$id),Query.equal('role','student'),Query.limit(500)]});if(!members.documents.some(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now()))throw Error('No active class members');
const pack=JSON.parse(await readFile('public/stories/animated/one-more-step-toward-peace/episode.json','utf8'));
const library=await call({action:'animatedLibrary'});let draft=library.drafts.find(d=>d.id===id);
if(process.argv.includes('--preflight')){console.log(JSON.stringify({className:cls.courseName,section:cls.name,date,activeMembershipsVerified:true,existingDraft:!!draft,existingAssignments:library.assignments.filter(a=>a.id===id).length}));process.exit(0);}
if(draft){const current=await call({action:'animatedReadDraft',id});if(JSON.stringify(current.pack)!==JSON.stringify(pack))throw Error('Existing draft differs; preserve teacher edits');draft=current;}
else draft=await call({action:'animatedSaveDraft',id,revision:0,pack});
const version=await call({action:'animatedPublish',id,revision:draft.revision});
const prior=library.assignments.find(a=>a.id===id&&a.classId===cls.$id&&a.date===date);
const assigned=await call({action:'animatedAssign',versionId:version.versionId,classId:cls.$id,date,releaseAt:'2026-10-22T16:00:00.000Z',...(prior?{assignmentId:prior.assignmentId}:{})});
if(assigned.date!==date||Date.parse(assigned.releaseAt)>Date.now())throw Error('Assignment date or release mismatch');
const read=await call({action:'animatedRead',assignmentId:assigned.assignmentId});
if(!read.preview||JSON.stringify(read.pack)!==JSON.stringify(pack))throw Error('Published package verification failed');
const after=await call({action:'animatedLibrary'});
if(after.assignments.filter(a=>a.assignmentId===assigned.assignmentId).length!==1)throw Error('Assignment verification failed');
const receipt={id,title:pack.title,className:cls.courseName,section:cls.name,classId:cls.$id,date:assigned.date,releaseAt:assigned.releaseAt,version:version.version,versionId:version.versionId,assignmentId:assigned.assignmentId,playUrl:'https://zumboggo.github.io/Learningisfun/#/game/play/'+assigned.assignmentId};
await writeFile('stories/animated/one-more-step-toward-peace/publication.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
