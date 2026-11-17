import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Client,Databases,Users,Functions,Query} from 'node-appwrite';
import {textAssignmentAvailable} from '../../functions/learning-content/src/text-schedule.js';
const root=path.dirname(fileURLToPath(import.meta.url)),m=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8')),d=process.env.APPWRITE_DATABASE_ID||'main';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin);
const cls=await db.getDocument(d,'classes',m.classId);
if(cls.courseName!=='Lifeplus Workshop'||cls.status!=='active')throw Error('Unexpected class');
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:3600});
const fn=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
async function call(body){const r=await fn.createExecution({functionId:'learning-content',body:JSON.stringify(body),async:false});const v=JSON.parse(r.responseBody||'{}');if(r.status==='failed'||r.responseStatusCode>=400||v.error)throw Error(v.error||`Request failed: ${r.responseStatusCode}`);return v;}
async function get(c,id){try{return await db.getDocument(d,c,id)}catch(e){if(e.code===404)return null;throw e}}
async function list(c,queries){let result=[],cursor;do{const r=await db.listDocuments(d,c,[...queries,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);result.push(...r.documents);cursor=r.documents.length===100?r.documents.at(-1).$id:null;}while(cursor);return result;}
async function put(c,id,data){const old=await get(c,id);if(old){for(const [key,value]of Object.entries(data)){if(['createdAt','updatedAt','status'].includes(key))continue;if(JSON.stringify(old[key])!==JSON.stringify(value))throw Error(`Conflict at ${c}/${id}/${key}; preserving existing edit`);}return;}await call({action:'mutate',collection:c,operation:'create',id,data});}
let receipt;try{receipt=JSON.parse(await readFile(path.join(root,'publication.json'),'utf8'))}catch{receipt={textId:m.id,classId:m.classId,images:[]};}
const checkpoint=()=>writeFile(path.join(root,'publication.json'),JSON.stringify(receipt,null,2)+'\n');
let md=await readFile(path.join(root,'reading.md'),'utf8');
if(createHash('sha256').update(md).digest('hex')!==m.readingSha256)throw Error('Reading changed after manifest');
let body=md.slice(md.indexOf('\n')).trim();
for(const img of m.images){
 const bytes=await readFile(path.join(root,'images',img.file));if(bytes.length>5*1024*1024)throw Error('Image too large');
 const expected='img_'+createHash('sha256').update(owner.$id).digest('hex').slice(0,10)+'_'+createHash('sha256').update(bytes).digest('hex').slice(0,20);
 let fileId=receipt.images.find(i=>i.file===img.file)?.fileId;
 if(fileId&&fileId!==expected)throw Error('Changed image');
 if(!fileId){const imported=await call({action:'importReadingImage',source:'data:image/jpeg;base64,'+bytes.toString('base64')});fileId=imported.fileId;if(fileId!==expected)throw Error('Image hash mismatch');receipt.images.push({file:img.file,fileId,bytes:bytes.length});await checkpoint();console.log('Imported',img.file);}
 body=body.replaceAll(`](images/${img.file})`,`](reading-image:${m.id}:${fileId})`);
}
const now=new Date().toISOString();
await put('texts',m.id,{teacherId:owner.$id,title:m.title,author:'David Hepting',source:'David Hepting’s edited workshop handout, November 2026. Sources and book-cover credits linked within the text.',contentMode:'full',externalUrl:'',status:'draft',publicReadEnabled:false,annotationMode:'regular',createdAt:now,updatedAt:now});
const paragraphs=body.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
for(let i=0;i<paragraphs.length;i+=4){await Promise.all(paragraphs.slice(i,i+4).map((content,j)=>put('text_paragraphs',`${m.id}-p${i+j}`,{textId:m.id,sortOrder:i+j,content})));if(i%40===0)console.log('Paragraph progress',Math.min(i+4,paragraphs.length),paragraphs.length);}
const saved=await list('text_paragraphs',[Query.equal('textId',m.id),Query.orderAsc('sortOrder')]);
if(saved.length!==paragraphs.length||saved.some((p,i)=>p.content!==paragraphs[i]||p.sortOrder!==i))throw Error('Paragraph verification failed');
await call({action:'mutate',collection:'texts',operation:'update',id:m.id,data:{status:'published',updatedAt:now}});
const matching=await list('text_assignments',[Query.equal('classId',m.classId),Query.equal('textId',m.id)]);if(matching.length>1)throw Error('Duplicate assignment');
const assignment={textId:m.id,classId:m.classId,assignedAt:m.assignedAt,dueDate:m.dueDate,isAssignedReading:true,isCopywork:false};
await put('text_assignments',matching[0]?.$id||`${m.id}-assignment`,assignment);
const read=await call({action:'readTexts',classIds:[m.classId],textId:m.id,includeContent:true});
if(!read.texts?.some(t=>t.$id===m.id&&t.status==='published')||read.paragraphs?.filter(p=>p.textId===m.id).length!==paragraphs.length)throw Error('Native reader verification failed');
for(const image of receipt.images){const result=await call({action:'readReadingImage',textId:m.id,fileId:image.fileId});const r=await fetch(result.url);if(!r.ok||!(r.headers.get('content-type')||'').startsWith('image/'))throw Error('Image inaccessible');const b=Buffer.from(await r.arrayBuffer());if(b.length!==image.bytes)throw Error('Image size mismatch');}
const all=await list('text_assignments',[Query.equal('classId',m.classId)]);
const ordered=all.filter(a=>a.isAssignedReading).sort((a,b)=>b.assignedAt.localeCompare(a.assignedAt));
if(ordered[0]?.textId!==m.id)throw Error('Reading is not first');
if(!textAssignmentAvailable(assignment,Date.parse('2026-11-17T12:00:00+08:00')))throw Error('Not released this week');
receipt={...receipt,title:m.title,status:'published',paragraphs:paragraphs.length,bodySha256:createHash('sha256').update(body).digest('hex'),assignment,firstAssignedReading:true,availableDuringWorkshopWeek:true,verifiedAt:now,url:`https://zumboggo.github.io/Learningisfun/#/texts/${m.id}?classId=${m.classId}`};
await checkpoint();console.log('Verified',JSON.stringify({title:m.title,paragraphs:paragraphs.length,images:receipt.images.length,dueDate:m.dueDate,firstAssignedReading:true,url:receipt.url}));
