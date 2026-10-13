import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions} from 'node-appwrite';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin);const cls=await db.getDocument({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'classes',documentId:'09d7f0a7-4c29-462c-820f-e11ea914d375'});
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:300});const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));

const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Request failed');return d;};
const pack=JSON.parse(await readFile('public/stories/animated/the-castle-that-served-supper/episode.json','utf8')),id='quixote-inn-animated';
const lib=await call({action:'animatedLibrary'});let draft=lib.drafts.find(x=>x.id===id);
if(draft){const current=await call({action:'animatedReadDraft',id});if(JSON.stringify(current.pack)!==JSON.stringify(pack))throw Error('Existing teacher draft differs; preserve it');}
else draft=await call({action:'animatedSaveDraft',id,revision:0,pack});
const read=await call({action:'animatedReadDraft',id});if(JSON.stringify(read.pack)!==JSON.stringify(pack))throw Error('Saved package does not match');
const receipt={id,title:pack.title,revision:read.revision,bytes:draft.bytes,status:'draft-unassigned',studioUrl:'https://zumboggo.github.io/Learningisfun/#/game/create?draft='+id};
await writeFile('stories/animated/the-castle-that-served-supper/publication.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
