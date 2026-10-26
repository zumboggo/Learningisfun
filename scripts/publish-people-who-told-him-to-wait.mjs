import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions,Storage,Query} from 'node-appwrite';
import {validatePackage} from '../functions/learning-content/src/story-engine.js';
import {packageBytes} from '../functions/learning-content/src/animated-episodes.js';
const id='the-people-who-told-him-to-wait',date='2026-10-27',releaseAt='2026-10-23T00:00:00.000Z';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const cls=await db.getDocument({databaseId,collectionId:'classes',documentId:'88421c66-9cda-4002-8e15-086312b7805e'});
if(cls.courseName!=='AP English'||cls.status!=='active')throw Error('Unexpected class');
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected class owner');
const members=await db.listDocuments({databaseId,collectionId:'class_members',queries:[Query.equal('classId',cls.$id),Query.equal('role','student'),Query.limit(500)]});
if(!members.documents.some(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now()))throw Error('No active student memberships');
const {jwt}=await users.createJWT({userId:owner.$id,duration:900});
const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Episode request failed');return d;};
const before=await call({action:'animatedLibrary'});
const readings=(await call({action:'listReadingDiscussions'})).readings.filter(r=>r.classId===cls.$id&&r.date>='2026-10-19'&&r.date<='2026-11-01');
const weekly=before.assignments.filter(a=>a.classId===cls.$id&&a.date>='2026-10-26'&&a.date<='2026-11-01');
if(weekly.some(a=>a.id!==id))throw Error('Another episode is already assigned in the target week: '+weekly.map(a=>a.title).join(', '));
if(process.argv.includes('--preflight')){const assignedText=await call({action:'readTexts',classIds:[cls.$id],textId:'6aa39a2e0031e7a13263',includeContent:true});await writeFile('/tmp/mlk-assigned-reading.json',JSON.stringify(assignedText));console.log(JSON.stringify({class:{id:cls.$id,name:cls.name,courseName:cls.courseName},activeStudentsVerified:true,date,releaseAt,weeklyAssignments:weekly,readings,recentAssignments:before.assignments.filter(a=>a.classId===cls.$id).sort((a,b)=>a.date.localeCompare(b.date)).slice(-8).map(a=>({title:a.title,date:a.date})),matchingDraft:before.drafts.filter(d=>d.id===id)},null,2));process.exit(0);}
const pack=JSON.parse(await readFile(`public/stories/animated/${id}/episode.json`,'utf8'));
const {errors}=validatePackage(pack);if(errors.length)throw Error(JSON.stringify(errors));if(packageBytes(pack)>5000000)throw Error('Package too large');
let draft=before.drafts.find(d=>d.id===id);
if(draft){draft=await call({action:'animatedReadDraft',id});if(JSON.stringify(draft.pack)!==JSON.stringify(pack)){if(draft.revision!==1||draft.fileId!=='cf93b38f1cbf9612f66d4c1c6860f37a')throw Error('Unexpected teacher draft; preserve changes');draft=await call({action:'animatedSaveDraft',id,revision:draft.revision,pack});}}
else draft=await call({action:'animatedSaveDraft',id,revision:0,pack});
const version=await call({action:'animatedPublish',id,revision:draft.revision});
if(weekly.length>1||weekly.some(a=>a.date!==date))throw Error('Conflicting weekly assignment');
let preservedPriorAssignment;
try{await call({action:'animatedAssign',versionId:version.versionId,classId:cls.$id,date,releaseAt,assignmentId:weekly[0]?.assignmentId});}
catch(error){if(!/Students have started this assignment/.test(error.message))throw error;
 // Publish a separate current assignment; never rewrite a started version or its attempts.
 await call({action:'animatedAssign',versionId:version.versionId,classId:cls.$id,date,releaseAt});
 await call({action:'animatedArchiveAssignment',assignmentId:weekly[0].assignmentId,archived:true});preservedPriorAssignment=weekly[0].assignmentId;
}
const library=await call({action:'animatedLibrary'}),assignments=library.assignments.filter(a=>a.id===id&&a.classId===cls.$id&&a.date===date);
if(assignments.length!==1)throw Error('Expected one assignment');const a=assignments[0];
if(a.versionId!==version.versionId||Date.parse(a.releaseAt)!==Date.parse(releaseAt))throw Error('Version/release mismatch');
const live=await call({action:'animatedRead',assignmentId:a.assignmentId});
if(!live.preview||JSON.stringify(live.pack)!==JSON.stringify(pack))throw Error('Live teacher preview mismatch');
const record=await db.getDocument({databaseId,collectionId:'episode_records',documentId:version.versionId}),published=JSON.parse(record.dataJson);
const raw=await new Storage(admin).getFileDownload({bucketId:'animated-episodes',fileId:published.fileId});
if(JSON.stringify(raw?.format?raw:JSON.parse(Buffer.from(raw).toString()))!==JSON.stringify(pack))throw Error('Published bytes differ');
let studentReadVerified=false;const active=members.documents.find(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now());if(active&&Date.parse(a.releaseAt)<=Date.now()){const token=await users.createJWT({userId:active.userId,duration:60});const sf=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(token.jwt));const e=await sf.createExecution({functionId:'learning-content',body:JSON.stringify({action:'animatedRead',assignmentId:a.assignmentId})});const r=JSON.parse(e.responseBody||'{}');if(e.responseStatusCode>=400||r.preview||JSON.stringify(r.pack)!==JSON.stringify(pack))throw Error('Student read failed');studentReadVerified=true;}
const receipt={preservedPriorAssignment,studentReadVerified,id,title:pack.title,status:'published-assigned',version:version.version,versionId:version.versionId,bytes:packageBytes(pack),activeMembershipsVerified:true,liveTeacherReadVerified:true,publishedBytesVerified:true,studentAccess:'Available from October 23 at 08:00 Asia/Shanghai. No student attempts created.',studioUrl:'https://zumboggo.github.io/Learningisfun/#/game/create?draft='+id,previewUrl:'https://zumboggo.github.io/Learningisfun/#/game/story-preview/'+id,assignments:[{classId:cls.$id,className:cls.name,courseName:cls.courseName,date:a.date,releaseAt:a.releaseAt,assignmentId:a.assignmentId,playUrl:'https://zumboggo.github.io/Learningisfun/#/game/play/'+a.assignmentId}]};
await writeFile(`stories/animated/${id}/publication.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
