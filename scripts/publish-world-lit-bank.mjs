// Publish complete classroom episodes to the shared World Literature bank.
// Development fixtures (the framework demo and action rehearsal) are not lessons.
import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions} from 'node-appwrite';
import {verifiedWorldLitClasses} from '../functions/learning-content/src/journal-catalog.js';
import {validatePackage} from '../functions/learning-content/src/story-engine.js';
const date=process.argv.find(a=>a.startsWith('--date='))?.slice(7);
if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('Supply --date=YYYY-MM-DD');
const releaseAt=date+'T00:00:00+08:00';
if(Date.parse(releaseAt)>Date.now())throw Error('This publication must be available now');
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const classes=await Promise.all(verifiedWorldLitClasses.map(c=>db.getDocument({databaseId,collectionId:'classes',documentId:c.id})));
if(classes.some(c=>c.teacherId!==classes[0].teacherId||c.courseName!=='World Literature'||c.status!=='active'))throw Error('Unexpected World Literature classes');
const owner=await users.get({userId:classes[0].teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:900});
const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Function request failed');return d;};
const folders=['a-knight-needs-a-witness','the-castle-that-served-supper','the-promise-left-behind','the-door-that-disappeared','the-giants-that-were-mills'];
// Preflight every package before changing live content.
const episodes=await Promise.all(folders.map(async folder=>{
 const receiptPath=`stories/animated/${folder}/publication.json`,receipt=JSON.parse(await readFile(receiptPath,'utf8'));
 const pack=JSON.parse(await readFile(`public/stories/animated/${folder}/episode.json`,'utf8'));
 const {errors}=validatePackage(pack);if(errors.length)throw Error(pack.title+': '+JSON.stringify(errors));
 return {receiptPath,receipt,pack};
}));
for(const {receiptPath,receipt,pack:localPack} of episodes){
 let pack=localPack;
 const before=await call({action:'animatedLibrary'});let draft=before.drafts.find(d=>d.id===receipt.id);
 if(draft){const current=await call({action:'animatedReadDraft',id:receipt.id});pack=current.pack;const {errors}=validatePackage(pack);if(errors.length)throw Error('Live episode is invalid: '+pack.title);draft=current;}
 else draft=await call({action:'animatedSaveDraft',id:receipt.id,revision:0,pack});
 const version=await call({action:'animatedPublish',id:receipt.id,revision:draft.revision});
 // The backend mirrors to the partner class; repeat both calls to verify retries.
 for(const cls of classes)await call({action:'animatedAssign',versionId:version.versionId,classId:cls.$id,date,releaseAt});
 const library=await call({action:'animatedLibrary'});
 const assignments=library.assignments.filter(a=>classes.some(c=>c.$id===a.classId)&&a.id===receipt.id);
 if(assignments.length!==2||new Set(assignments.map(a=>a.classId)).size!==2||new Set(assignments.map(a=>a.fileId)).size!==1||assignments.some(a=>Date.parse(a.releaseAt)>Date.now()))throw Error('Section parity verification failed: '+pack.title);
 for(const a of assignments){const loaded=await call({action:'animatedRead',assignmentId:a.assignmentId});if(!loaded.preview||JSON.stringify(loaded.pack)!==JSON.stringify(pack))throw Error('Published package mismatch: '+pack.title);}
 const updated={...receipt,title:pack.title,status:'published-assigned',version:version.version,versionId:version.versionId,bytes:draft.bytes,assignments:assignments.map(a=>({classId:a.classId,className:classes.find(c=>c.$id===a.classId).name,date:a.date,releaseAt:a.releaseAt,version:a.version,versionId:a.versionId,assignmentId:a.assignmentId,playUrl:'https://zumboggo.github.io/Learningisfun/#/game/play/'+a.assignmentId}))};
 await writeFile(receiptPath,JSON.stringify(updated,null,2)+'\n');console.log('Verified both sections:',pack.title);
}
const final=await call({action:'animatedLibrary'});
const banks=classes.map(c=>final.assignments.filter(a=>a.classId===c.$id).map(a=>a.id+':'+a.fileId).sort());
if(JSON.stringify(banks[0])!==JSON.stringify(banks[1]))throw Error('World Literature banks differ');
console.log('World Lit Red and Blue share all '+banks[0].length+' published episodes.');
