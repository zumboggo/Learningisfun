import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions,Storage,Query} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
import {createHash} from 'node:crypto';
import {readRecord,writeRecord} from '../functions/learning-content/src/teacher-workspace.js';
import {verifiedWorldLitClasses} from '../functions/learning-content/src/journal-catalog.js';
import {validatePackage} from '../functions/learning-content/src/story-engine.js';
const id='everything-i-owned',date='2026-11-02',releaseAt='2026-10-30T00:00:00.000Z';
const pack=JSON.parse(await readFile(`public/stories/animated/${id}/episode.json`,'utf8'));
const {errors}=validatePackage(pack);if(errors.length)throw Error(JSON.stringify(errors));
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const classes=await Promise.all(verifiedWorldLitClasses.map(c=>db.getDocument({databaseId,collectionId:'classes',documentId:c.id})));
if(classes.length!==2||classes.some(c=>c.teacherId!==classes[0].teacherId||c.courseName!=='World Literature'||c.status!=='active'))throw Error('Unexpected World Literature classes');
const owner=await users.get({userId:classes[0].teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
for(const cls of classes){const members=await db.listDocuments({databaseId,collectionId:'class_members',queries:[Query.equal('classId',cls.$id),Query.equal('role','student'),Query.limit(500)]});if(!members.documents.some(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now()))throw Error('No active students in '+cls.name);}
const {jwt}=await users.createJWT({userId:owner.$id,duration:900});
const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Function request failed');return d;};
const before=await call({action:'animatedLibrary'});
if(process.argv.includes('--preflight')){console.log(JSON.stringify({classes:classes.map(c=>({id:c.$id,name:c.name})),existingAssignments:before.assignments.filter(a=>classes.some(c=>c.$id===a.classId)&&a.date>='2026-11-02'&&a.date<='2026-11-08'),date,releaseAt,activeMembershipsVerified:true},null,2));process.exit(0);}
const storage=new Storage(admin);const bucket=await storage.getBucket({bucketId:'private-episode-media'});if(bucket.$permissions.length||bucket.fileSecurity)throw Error('Unexpected private media permissions');
for(const name of ['opening-v1.mp4','opening-v1.poster.jpg','opening-v1.vtt']){
 const path='stories/shared/'+id+'/'+name,bytes=await readFile('public/'+path),fileId=createHash('sha256').update(bytes).digest('hex').slice(0,36);
 try{await storage.createFile({bucketId:'private-episode-media',fileId,file:InputFile.fromBuffer(bytes,name),permissions:[]})}catch(e){if(e.code!==409)throw e;}
 if(!Buffer.from(await storage.getFileDownload({bucketId:'private-episode-media',fileId})).equals(bytes))throw Error('Media byte mismatch');
 const key='private-media:'+path,current=await readRecord(db,databaseId,'system',key);if(current.value&&current.value.fileId!==fileId)throw Error('Preserve differing existing teaser');if(!current.value)await writeRecord(db,databaseId,'system',key,{fileId},current.revision);
}
let previousReceipt;try{previousReceipt=JSON.parse(await readFile(`stories/animated/${id}/publication.json`,'utf8'));}catch{}
let draft=before.drafts.find(d=>d.id===id);
if(draft){draft=await call({action:'animatedReadDraft',id});if(JSON.stringify(draft.pack)!==JSON.stringify(pack)){const expected=structuredClone(pack);for(const field of ['description','downloadLabel','filename'])delete expected.keepsake[field];if(!previousReceipt||JSON.stringify(expected)!==JSON.stringify(draft.pack))throw Error('Existing draft differs beyond this task’s reviewed keepsake labels');draft=await call({action:'animatedSaveDraft',id,revision:draft.revision,pack});}}
else draft=await call({action:'animatedSaveDraft',id,revision:0,pack});
const version=await call({action:'animatedPublish',id,revision:draft.revision});
for(const cls of classes){const prior=before.assignments.filter(a=>a.id===id&&a.classId===cls.$id&&a.date===date);if(prior.length>1||prior.some(a=>a.versionId!==version.versionId&&(!previousReceipt||a.versionId!==previousReceipt.versionId||!previousReceipt.assignments.some(p=>p.assignmentId===a.assignmentId))))throw Error('Conflicting assignment');await call({action:'animatedAssign',versionId:version.versionId,classId:cls.$id,date,releaseAt,assignmentId:prior[0]?.assignmentId});}
const library=await call({action:'animatedLibrary'}),assignments=library.assignments.filter(a=>a.id===id&&classes.some(c=>c.$id===a.classId)&&a.date===date);
if(assignments.length!==2||new Set(assignments.map(a=>a.classId)).size!==2||assignments.some(a=>a.versionId!==version.versionId||Date.parse(a.releaseAt)!==Date.parse(releaseAt)))throw Error('Assignment parity/date mismatch');
for(const a of assignments){const loaded=await call({action:'animatedRead',assignmentId:a.assignmentId});if(!loaded.preview||Object.keys(loaded.mediaUrls||{}).length!==3||JSON.stringify(loaded.pack)!==JSON.stringify(pack))throw Error('Live package mismatch');}
const versionRecord=await db.getDocument({databaseId,collectionId:'episode_records',documentId:version.versionId}),published=JSON.parse(versionRecord.dataJson);
const raw=await storage.getFileDownload({bucketId:'animated-episodes',fileId:published.fileId});if(JSON.stringify(raw?.format?raw:JSON.parse(Buffer.from(raw).toString()))!==JSON.stringify(pack))throw Error('Published bytes differ');
const previewKey='private-preview:'+id,previewRecord=await readRecord(db,databaseId,'system',previewKey);if(previewRecord.value&&previewRecord.value.fileId!==published.fileId){if(!previousReceipt)throw Error('Preserve differing existing preview');const old=JSON.parse((await db.getDocument({databaseId,collectionId:'episode_records',documentId:previousReceipt.versionId})).dataJson);if(previewRecord.value.fileId!==old.fileId)throw Error('Preserve differing existing preview');}if(previewRecord.value?.fileId!==published.fileId)await writeRecord(db,databaseId,'system',previewKey,{fileId:published.fileId},previewRecord.revision);
const preview=await call({action:'readPrivateAnimatedPreview',slug:id});if(JSON.stringify(preview.pack)!==JSON.stringify(pack)||Object.keys(preview.mediaUrls||{}).length!==3)throw Error('Private preview mismatch');
const receipt={id,title:pack.title,status:'published-assigned',version:version.version,versionId:version.versionId,bytes:draft.bytes,activeMembershipsVerified:true,liveTeacherReadVerified:true,publishedBytesVerified:true,privateMediaVerified:true,privatePreviewVerified:true,studentRelease:'Friday 2026-10-30 08:00 Asia/Shanghai',studioUrl:'https://zumboggo.github.io/Learningisfun/#/game/create?draft='+id,previewUrl:'https://zumboggo.github.io/Learningisfun/#/game/story-preview/'+id,assignments:assignments.map(a=>({classId:a.classId,className:classes.find(c=>c.$id===a.classId).name,date:a.date,releaseAt:a.releaseAt,assignmentId:a.assignmentId,playUrl:'https://zumboggo.github.io/Learningisfun/#/game/play/'+a.assignmentId}))};
await writeFile(`stories/animated/${id}/publication.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
