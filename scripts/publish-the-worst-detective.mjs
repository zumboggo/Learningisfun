import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{Client,Databases,Users,Functions,Storage,Query}from'node-appwrite';import{InputFile}from'node-appwrite/file';
import{validatePackage}from'../functions/learning-content/src/story-engine.js';import{packageBytes}from'../functions/learning-content/src/animated-episodes.js';
import{readRecord,writeRecord}from'../functions/learning-content/src/teacher-workspace.js';
const id='the-worst-detective',date='2026-11-04',releaseAt='2026-11-03T00:00:00.000Z';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin),storage=new Storage(admin),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const cls=await db.getDocument({databaseId,collectionId:'classes',documentId:'7e5810c3-dfac-4595-ba51-0e20e645e727'});if(cls.courseName!=='English Corner'||cls.status!=='active')throw Error('Unexpected class');
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
if(process.argv.includes('--media-only')){
 const bucketId='private-episode-media',bucket=await storage.getBucket({bucketId});if(bucket.$permissions.length||bucket.fileSecurity)throw Error('Expected server-only media bucket');
 for(const name of ['opening-v1.mp4','opening-v1.poster.jpg','opening-v1.vtt']){
  const path='stories/shared/hamster-mystery/'+name,bytes=await readFile('public/'+path),fileId=createHash('sha256').update(bytes).digest('hex').slice(0,36);
  try{await storage.createFile({bucketId,fileId,file:InputFile.fromBuffer(bytes,name),permissions:[]})}catch(e){if(e.code!==409)throw e;}
  if(!Buffer.from(await storage.getFileDownload({bucketId,fileId})).equals(bytes))throw Error('Media bytes differ');
  const key='private-media:'+path,prior=await readRecord(db,databaseId,'system',key);if(prior.value&&prior.value.fileId!==fileId)throw Error('Existing immutable media differs');if(!prior.value)await writeRecord(db,databaseId,'system',key,{fileId},prior.revision);
  console.log('Verified private media:',name);
 }
 process.exit(0);
}
const {jwt}=await users.createJWT({userId:owner.$id,duration:900}),f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
const call=async body=>{const e=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const r=JSON.parse(e.responseBody||'{}');if(e.responseStatusCode>=400||r.error)throw Error(r.error||'Request failed');return r};
const pack=JSON.parse(await readFile(`public/stories/animated/${id}/episode.json`,'utf8')),{errors}=validatePackage(pack,{requireEnglishCornerWriting:true});if(errors.length)throw Error(JSON.stringify(errors));if(packageBytes(pack)>5000000)throw Error('Package too large');
const before=await call({action:'animatedLibrary'}),weekly=before.assignments.filter(a=>a.classId===cls.$id&&a.date>='2026-11-02'&&a.date<='2026-11-08');if(weekly.some(a=>a.id!==id)||weekly.length>1||weekly.some(a=>a.date!==date))throw Error('Conflicting weekly assignment; preserve it');
let draft=before.drafts.find(d=>d.id===id);if(draft){draft=await call({action:'animatedReadDraft',id});if(JSON.stringify(draft.pack)!==JSON.stringify(pack))throw Error('Existing draft differs; preserve teacher changes');}else draft=await call({action:'animatedSaveDraft',id,revision:0,pack});
const version=await call({action:'animatedPublish',id,revision:draft.revision});
await call({action:'animatedAssign',versionId:version.versionId,classId:cls.$id,date,releaseAt,assignmentId:weekly[0]?.assignmentId});
const library=await call({action:'animatedLibrary'}),matches=library.assignments.filter(a=>a.id===id&&a.classId===cls.$id&&a.date===date);if(matches.length!==1)throw Error('Expected exactly one assignment');const a=matches[0];
if(a.versionId!==version.versionId||Date.parse(a.releaseAt)!==Date.parse(releaseAt))throw Error('Assignment date/version mismatch');
const live=await call({action:'animatedRead',assignmentId:a.assignmentId});if(!live.preview||JSON.stringify(live.pack)!==JSON.stringify(pack))throw Error('Teacher package mismatch');
for(const name of ['opening-v1.mp4','opening-v1.poster.jpg','opening-v1.vtt']){const path='stories/shared/hamster-mystery/'+name,url=live.mediaUrls?.[path];if(!url)throw Error('Signed media URL missing: '+name);const r=await fetch(url);if(!r.ok||!Buffer.from(await r.arrayBuffer()).equals(await readFile('public/'+path)))throw Error('Live signed media mismatch');}
const rec=JSON.parse((await db.getDocument({databaseId,collectionId:'episode_records',documentId:version.versionId})).dataJson),raw=await storage.getFileDownload({bucketId:'animated-episodes',fileId:rec.fileId});if(JSON.stringify(raw?.format?raw:JSON.parse(Buffer.from(raw).toString()))!==JSON.stringify(pack))throw Error('Published bytes mismatch');
const members=await db.listDocuments({databaseId,collectionId:'class_members',queries:[Query.equal('classId',cls.$id),Query.equal('role','student'),Query.limit(500)]}),active=members.documents.filter(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now());let studentReadVerified=false;
if(active.length){const token=await users.createJWT({userId:active[0].userId,duration:60}),sf=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(token.jwt));const e=await sf.createExecution({functionId:'learning-content',body:JSON.stringify({action:'animatedRead',assignmentId:a.assignmentId})}),r=JSON.parse(e.responseBody||'{}');if(e.responseStatusCode>=400||r.preview||JSON.stringify(r.pack)!==JSON.stringify(pack)||!r.mediaUrls?.['stories/shared/hamster-mystery/opening-v1.mp4'])throw Error('Student read failed');studentReadVerified=true;}
const receipt={id,title:pack.title,status:'published-assigned',classId:cls.$id,className:cls.courseName,date:a.date,timezone:'Asia/Shanghai',releaseAt:a.releaseAt,version:version.version,versionId:version.versionId,assignmentId:a.assignmentId,playUrl:'https://zumboggo.github.io/Learningisfun/#/game/play/'+a.assignmentId,studioUrl:'https://zumboggo.github.io/Learningisfun/#/game/create?draft='+id,bytes:packageBytes(pack),activeStudentMemberships:active.length,liveTeacherReadVerified:true,publishedBytesVerified:true,signedMediaVerified:true,studentReadVerified,studentAttemptsCreated:0};
await writeFile(`stories/animated/${id}/publication.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
