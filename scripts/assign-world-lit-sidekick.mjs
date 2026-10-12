import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions} from 'node-appwrite';
const receiptPath='stories/animated/a-knight-needs-a-witness/publication.json';
const receipt=JSON.parse(await readFile(receiptPath,'utf8'));
const oldAssignments=JSON.parse(await readFile('stories/episode-assignments.json','utf8')).filter(a=>a.episodeId==='a-knight-needs-a-witness'&&a.version===2);
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),classes=[];
for(const old of oldAssignments){const c=await db.getDocument({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'classes',documentId:old.classId});classes.push({old,c});}
if(new Set(classes.map(({c})=>c.teacherId)).size!==1)throw Error('Classes have different owners');
const owner=await users.get({userId:classes[0].c.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected teacher');
const {jwt}=await users.createJWT({userId:owner.$id,duration:600});
const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Function failed');return d;};
const pack=JSON.parse(await readFile('public/stories/animated/a-knight-needs-a-witness/episode.json','utf8'));
const library=await call({action:'animatedLibrary'}),assigned=[];
for(const {old,c} of classes){
 const existing=library.assignments.filter(a=>a.id===receipt.id&&a.classId===c.$id&&a.date===old.assignedDate);
 if(existing.length>1)throw Error('Multiple current assignments need review');
 if(existing.length&&existing[0].versionId!==receipt.versionId)throw Error('Existing assignment uses another version; preserve it');
 const a=existing[0]||await call({action:'animatedAssign',versionId:receipt.versionId,classId:c.$id,date:old.assignedDate,releaseAt:old.releaseAt});
 const read=await call({action:'animatedRead',assignmentId:a.assignmentId});
 if(!read.preview||JSON.stringify(read.pack)!==JSON.stringify(pack))throw Error('Assignment content or teacher preview mismatch');
 assigned.push({classId:c.$id,className:c.name,date:a.date,releaseAt:a.releaseAt,assignmentId:a.assignmentId,playUrl:'https://zumboggo.github.io/Learningisfun/#/game/play/'+a.assignmentId});
}
const verified=await call({action:'animatedLibrary'});for(const a of assigned)if(verified.assignments.filter(x=>x.assignmentId===a.assignmentId).length!==1)throw Error('Library verification failed');
await writeFile(receiptPath,JSON.stringify({...receipt,status:'published-assigned',assignments:assigned},null,2)+'\n');
console.log(JSON.stringify(assigned,null,2));
