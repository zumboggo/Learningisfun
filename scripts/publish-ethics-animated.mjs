import {readFile,writeFile} from 'node:fs/promises';
import {Client,Databases,Users,Functions} from 'node-appwrite';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin);const cls=await db.getDocument({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'classes',documentId:'e24ec8d9-21d7-4c32-a30e-08655c2f4e65'});
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:300});const f=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));

const call=async body=>{const r=await f.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error)throw Error(d.error||'Request failed');return d;};
const pack=JSON.parse(await readFile('public/stories/animated/the-grain-we-keep/episode.json','utf8')),id='grain-we-keep-animated';
const lib=await call({action:'animatedLibrary'});let draft=lib.drafts.find(x=>x.id===id);
if(draft){const current=await call({action:'animatedReadDraft',id});if(JSON.stringify(current.pack)!==JSON.stringify(pack))throw Error('Existing teacher draft differs; preserve it');}
else draft=await call({action:'animatedSaveDraft',id,revision:0,pack});
if(process.argv.includes('--draft-only')){console.log(JSON.stringify({id,revision:draft.revision,title:pack.title}));process.exit(0);}
const published=await call({action:'animatedPublish',id,revision:draft.revision});
const read=await call({action:'animatedReadDraft',id});if(JSON.stringify(read.pack)!==JSON.stringify(pack))throw Error('Saved package does not match');
const receipt={id,title:pack.title,version:published.version,versionId:published.versionId,bytes:draft.bytes,status:'published-unassigned',studioUrl:'https://zumboggo.github.io/Learningisfun/#/game/create?draft='+id};
await writeFile('stories/animated/the-grain-we-keep/publication.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
