import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions,Storage,Query} from 'node-appwrite';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const cls=await db.getDocument({databaseId,collectionId:'classes',documentId:'7e5810c3-dfac-4595-ba51-0e20e645e727'});
if(cls.courseName!=='English Corner'||cls.status!=='active')throw Error('Unexpected class');
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:300});
const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Request failed');return d;};
const id='everyone-belongs-english-corner',pack=JSON.parse(await readFile('public/stories/animated/everyone-belongs/episode.json','utf8'));
const library=await call({action:'animatedLibrary'});let draft=library.drafts.find(d=>d.id===id);
if(draft){draft=await call({action:'animatedReadDraft',id});if(JSON.stringify(draft.pack)!==JSON.stringify(pack))throw Error('Existing draft differs; preserve teacher edits');}
else draft=await call({action:'animatedSaveDraft',id,revision:0,pack});
const version=await call({action:'animatedPublish',id,revision:draft.revision});
const record=await db.getDocument({databaseId,collectionId:'episode_records',documentId:version.versionId});
const published=JSON.parse(record.dataJson);
const bytes=await new Storage(admin).getFileDownload({bucketId:'animated-episodes',fileId:published.fileId});
if(JSON.stringify((bytes?.format?bytes:JSON.parse(Buffer.from(bytes).toString())))!==JSON.stringify(pack))throw Error('Published package mismatch');
const a=await call({action:'animatedAssign',versionId:version.versionId,classId:cls.$id,date:'2026-10-21'});
const read=await call({action:'animatedRead',assignmentId:a.assignmentId});
if(JSON.stringify(read.pack)!==JSON.stringify(pack)||a.date!=='2026-10-21'||Date.parse(a.releaseAt)>Date.now())throw Error('Assignment verification failed');
const refreshed=await call({action:'animatedLibrary'});if(refreshed.assignments.filter(x=>x.id===id&&x.classId===cls.$id&&x.date==='2026-10-21').length!==1)throw Error('Assignment missing or duplicated');
const members=await db.listDocuments({databaseId,collectionId:'class_members',queries:[Query.equal('classId',cls.$id),Query.equal('role','student'),Query.limit(500)]});
const active=members.documents.filter(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now());
let studentReadVerified=false;
if(active.length){const token=await users.createJWT({userId:active[0].userId,duration:60});const sf=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(token.jwt));const e=await sf.createExecution({functionId:'learning-content',body:JSON.stringify({action:'animatedRead',assignmentId:a.assignmentId})});const r=JSON.parse(e.responseBody||'{}');if(e.responseStatusCode>=400||r.preview||JSON.stringify(r.pack)!==JSON.stringify(pack))throw Error('Student read failed');studentReadVerified=true;}
const receipt={id,title:pack.title,version:version.version,versionId:version.versionId,classId:cls.$id,className:cls.courseName,section:cls.name,date:a.date,releaseAt:a.releaseAt,assignmentId:a.assignmentId,playUrl:'https://zumboggo.github.io/Learningisfun/#/game/play/'+a.assignmentId,previewUrl:'https://zumboggo.github.io/Learningisfun/#/game/story-preview/everyone-belongs',livePackageVerified:true,activeStudentMemberships:active.length,studentReadVerified,writing:'On paper; prompt and sentence frames at end of episode'};
await writeFile('stories/animated/everyone-belongs/publication.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
