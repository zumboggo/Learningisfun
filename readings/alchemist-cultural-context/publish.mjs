// Run with the existing private Appwrite admin environment. No credentials are saved here.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Client,Databases,Users,Functions,Storage,Query} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
const root=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),storage=new Storage(admin),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const cls=await db.getDocument({databaseId,collectionId:'classes',documentId:manifest.assignments[0].classId});
if(cls.courseName!=='World Literature'||cls.status!=='active')throw Error('Unexpected class');
const owner=await users.get({userId:cls.teacherId});
if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected teacher');
const {jwt}=await users.createJWT({userId:owner.$id,duration:3600});
const functions=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
async function call(body){const r=await functions.createExecution({functionId:'learning-content',body:JSON.stringify(body),async:false});const data=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||data.error||r.status==='failed')throw Error(data.error||`Function failed ${r.responseStatusCode}`);return data;}
async function get(collectionId,documentId){try{return await db.getDocument({databaseId,collectionId,documentId});}catch(e){if(e.code===404)return null;throw e;}}
async function put(collection,id,data){const existing=await get(collection,id);if(existing){for(const [key,value]of Object.entries(data)){if(['createdAt','updatedAt','status'].includes(key))continue;const same=key==='assignedAt'?Date.parse(existing[key])===Date.parse(value):existing[key]===value;if(!same)throw Error(`Existing ${collection}/${id} differs at ${key}; preserving edits`);}return;}await call({action:'mutate',collection,operation:'create',id,data});}
const receipt=[];
const checkpoint={textId:manifest.id,uploads:[],stage:"preparing"};
async function saveCheckpoint(){await writeFile(path.join(root,"checkpoint.json"),JSON.stringify(checkpoint,null,2)+"\n");}
for(const part of [{...manifest,part:1}]){
 console.log(`Preparing part ${part.part}: ${part.title}`);
 const markdown=await readFile(path.join(root,part.file),'utf8');
 let body=markdown.slice(markdown.indexOf('\n')+1).trim();
 const files=[];
 for(const relative of part.images){
  const bytes=await readFile(path.join(root,relative));
  if(bytes.length>5*1024*1024||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid picture');
  const fileId='img_'+createHash('sha256').update(owner.$id).digest('hex').slice(0,10)+'_'+createHash('sha256').update(bytes).digest('hex').slice(0,20);
  try{await storage.createFile({bucketId:'original-pdfs',fileId,file:InputFile.fromBuffer(bytes,path.basename(relative)),permissions:[]});}catch(e){if(e.code!==409)throw e;}
  const saved=await storage.getFile({bucketId:'original-pdfs',fileId});if(saved.sizeOriginal!==bytes.length)throw Error('Stored image size differs');
  checkpoint.uploads.push({relative,fileId});await saveCheckpoint();
  body=body.replaceAll(`](${relative})`,`](reading-image:${part.id}:${fileId})`);files.push(fileId);
 }
 const now=new Date().toISOString();
 const text={teacherId:owner.$id,title:part.title,author:'Original classroom reading',source:'The cultural context of The Alchemist — original narrative synthesis; historical sources linked in the reading. Four illustrations generated with ImageGen.',contentMode:'full',externalUrl:'',status:'draft',publicReadEnabled:false,annotationMode:'tqe',createdAt:now,updatedAt:now};
 await put('texts',part.id,text);
 const paragraphs=body.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
 // Bounded concurrency keeps publication practical without flooding the function.
 for(let i=0;i<paragraphs.length;i+=4)await Promise.all(paragraphs.slice(i,i+4).map((content,j)=>put('text_paragraphs',`${part.id}-p${i+j}`,{textId:part.id,sortOrder:i+j,content})));
 const stored=await db.listDocuments({databaseId,collectionId:'text_paragraphs',queries:[Query.equal('textId',part.id),Query.orderAsc('sortOrder'),Query.limit(100)]});
 if(stored.total!==paragraphs.length||stored.documents.some((p,i)=>p.content!==paragraphs[i]||p.sortOrder!==i))throw Error('Reading verification failed');
 await call({action:'mutate',collection:'texts',operation:'update',id:part.id,data:{status:'published',updatedAt:new Date().toISOString()}});
 checkpoint.stage='published';await saveCheckpoint();
 for (const target of manifest.assignments){
 const targetClass=await db.getDocument({databaseId,collectionId:'classes',documentId:target.classId});
 if(targetClass.courseName!=='World Literature'||targetClass.teacherId!==owner.$id||targetClass.status!=='active')throw Error('Unexpected target class');
 const assignment={textId:part.id,classId:target.classId,assignedAt:`${target.date}T12:00:00+08:00`,dueDate:target.date,isAssignedReading:true,isCopywork:false};
 const assigned=await db.listDocuments({databaseId,collectionId:'text_assignments',queries:[Query.equal('textId',part.id),Query.equal('classId',target.classId),Query.limit(10)]});
 if(assigned.total>1)throw Error('Duplicate assignment detected');
 await put('text_assignments',assigned.documents[0]?.$id||`${part.id}-${target.section.startsWith("Red")?"r":"b"}`,assignment);
 const visible=await call({action:'readTexts',classIds:[target.classId],textId:part.id,includeContent:true});
 if(!visible.texts?.some(t=>t.$id===part.id&&t.status==='published')||visible.paragraphs?.filter(p=>p.textId===part.id).length!==paragraphs.length)throw Error('Teacher readback failed');
 for(const fileId of files){const result=await call({action:'readReadingImage',textId:part.id,fileId});const response=await fetch(result.url);if(!response.ok||!(response.headers.get('content-type')||'').startsWith('image/'))throw Error('Image access failed');await response.arrayBuffer();}
 receipt.push({part:part.part,title:part.title,textId:part.id,date:target.date,section:target.section,classId:target.classId,voice:part.voice,wordCount:part.wordCount,images:files.length,paragraphs:paragraphs.length,url:`https://zumboggo.github.io/Learningisfun/#/texts/${part.id}?classId=${target.classId}`});
 await writeFile(path.join(root,'publication.json'),JSON.stringify({className:cls.courseName,verifiedAt:new Date().toISOString(),readings:receipt},null,2)+'\n');
 const readback=await get('text_assignments',assigned.documents[0]?.$id||`${part.id}-${target.section.startsWith("Red")?"r":"b"}`);
 if(readback.dueDate!==target.date||!readback.isAssignedReading)throw Error('Assignment readback failed');
 console.log(`Verified ${target.section}: ${paragraphs.length} paragraphs, ${files.length} pictures, ${target.date}`);
 }
 checkpoint.stage='verified';await saveCheckpoint();
}
