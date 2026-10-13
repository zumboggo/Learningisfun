import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions} from 'node-appwrite';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin);const cls=await db.getDocument({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'classes',documentId:'09d7f0a7-4c29-462c-820f-e11ea914d375'});
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:300});const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));

const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Request failed');return d;};
const id='quixote-inn-animated',path='stories/animated/the-castle-that-served-supper/publication.json';
const expected=JSON.parse(await readFile('public/stories/animated/the-castle-that-served-supper/episode.json','utf8'));
const draft=await call({action:'animatedReadDraft',id});
if(JSON.stringify(draft.pack)!==JSON.stringify(expected))throw Error('Teacher draft changed; inspect before publishing');
const version=await call({action:'animatedPublish',id,revision:draft.revision});
const library=await call({action:'animatedLibrary'}),assignments=[];
for(const classId of ['09d7f0a7-4c29-462c-820f-e11ea914d375','b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c']){
 const c=await db.getDocument({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'classes',documentId:classId});
 if(c.teacherId!==owner.$id)throw Error('Unexpected class ownership');
 const existing=library.assignments.filter(a=>a.id===id&&a.classId===classId&&a.date>='2026-10-12'&&a.date<='2026-10-16');
 if(existing.length>1||existing.some(a=>a.versionId!==version.versionId))throw Error('Conflicting existing weekly assignment');
 const a=existing[0]||await call({action:'animatedAssign',versionId:version.versionId,classId,date:'2026-10-12'});
 const read=await call({action:'animatedRead',assignmentId:a.assignmentId});
 if(!read.preview||JSON.stringify(read.pack)!==JSON.stringify(expected))throw Error('Assignment verification failed');
 assignments.push({classId,className:c.name,date:a.date,releaseAt:a.releaseAt,assignmentId:a.assignmentId,playUrl:'https://zumboggo.github.io/Learningisfun/#/game/play/'+a.assignmentId});
}
const verified=await call({action:'animatedLibrary'});
for(const a of assignments)if(verified.assignments.filter(x=>x.assignmentId===a.assignmentId).length!==1)throw Error('Missing or duplicate assignment');
const receipt={id,title:expected.title,version:version.version,versionId:version.versionId,bytes:draft.bytes,status:'published-assigned',studioUrl:'https://zumboggo.github.io/Learningisfun/#/game/create?draft='+id,assignments};
await writeFile(path,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
