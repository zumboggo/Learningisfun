import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Client,Databases,Users,Functions,Query} from 'node-appwrite';
const root=new URL('./',import.meta.url),d=process.env.APPWRITE_DATABASE_ID||'main',classId='5a726282-4771-4774-8213-d9329c124bbc';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin);
const cls=await db.getDocument(d,'classes',classId);if(cls.courseName!=='Lifeplus Workshop')throw Error('Wrong class');
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Wrong owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:3600});
const fn=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
async function call(body){const r=await fn.createExecution({functionId:'learning-content',body:JSON.stringify(body),async:false});const v=JSON.parse(r.responseBody||'{}');if(r.status==='failed'||r.responseStatusCode>=400||v.error)throw Error(v.error||'Mutation failed');return v;}
async function list(c,q){let out=[],cursor;do{const r=await db.listDocuments(d,c,[...q,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);out.push(...r.documents);cursor=r.documents.length===100?r.documents.at(-1).$id:null;}while(cursor);return out;}
function norm(s){s=s.replace(/\\([!\[\].])/g,'$1');if(/^\d+\.\s/.test(s)&&!s.includes('\n'))s=s.replace(/^(\d+)\.\s/,'**$1.** ');if(s.startsWith('*[')&&(s.includes('Cover:')||s.includes('edition cover.')))s=s.replaceAll('*','');return s;}
const images=JSON.parse(await readFile(new URL('publication.json',root),'utf8')).images;
const results=[];
for(const [id,file]of [['ws26-do-it-again',new URL('reading.md',root)],['ws26-rubric',new URL('../lifeplus-workshop-2026/assignment-rubric.md',root)]]){
 const backup=JSON.parse(await readFile(new URL(`${id}-before-update.json`,root),'utf8'));
 const current=await db.getDocument(d,'texts',id);if(current.teacherId!==owner.$id)throw Error('Wrong text owner');
 let md=await readFile(file,'utf8');
 for(const img of images)md=md.replaceAll(`](images/${img.file})`,`](reading-image:${id}:${img.fileId})`);
 const contents=md.slice(md.indexOf('\n')).trim().split(/\n\s*\n/).map(s=>norm(s.trim())).filter(Boolean);
 const live=await list('text_paragraphs',[Query.equal('textId',id),Query.orderAsc('sortOrder')]);
 const annotations=await db.listDocuments(d,'text_annotations',[Query.equal('textId',id),Query.limit(1)]);if(annotations.total)throw Error('Annotated text needs paragraph-aware migration');
 // Reconcile against the captured baseline or the intended content, allowing safe resume.
 for(let i=0;i<live.length;i++){const p=live[i],before=backup.paragraphs.find(b=>b.id===p.$id);if(p.content!==contents[p.sortOrder]&&(!before||before.content!==p.content||before.sortOrder!==p.sortOrder))throw Error('Concurrent paragraph edit detected');}
 const assignments=await list('text_assignments',[Query.equal('textId',id)]);
 const expected=backup.assignments.map(a=>({id:a.$id,classId:a.classId,assignedAt:a.assignedAt,dueDate:a.dueDate,isAssignedReading:a.isAssignedReading,isCopywork:a.isCopywork}));
 const actual=assignments.map(a=>({id:a.$id,classId:a.classId,assignedAt:a.assignedAt,dueDate:a.dueDate,isAssignedReading:a.isAssignedReading,isCopywork:a.isCopywork}));
 if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('Assignments changed');
 for(let i=0;i<contents.length;i+=4){await Promise.all(contents.slice(i,i+4).map(async(content,j)=>{const index=i+j,p=live.find(p=>p.sortOrder===index);if(p?.content===content)return;await call({action:'mutate',collection:'text_paragraphs',operation:p?'update':'create',id:p?.$id||`${id}-rev-p${index}`,data:{textId:id,sortOrder:index,content}});}));if(i%40===0)console.log(id,'progress',Math.min(i+4,contents.length),contents.length);}
 for(const p of live.filter(p=>p.sortOrder>=contents.length))await call({action:'mutate',collection:'text_paragraphs',operation:'delete',id:p.$id});
 await call({action:'mutate',collection:'texts',operation:'update',id,data:{status:'published',updatedAt:new Date().toISOString()}});
 const read=await call({action:'readTexts',classIds:[classId],textId:id,includeContent:true});
 const paragraphs=read.paragraphs.filter(p=>p.textId===id).sort((a,b)=>a.sortOrder-b.sortOrder);
 if(paragraphs.length!==contents.length||paragraphs.some((p,i)=>p.content!==contents[i]))throw Error('Reader verification failed');
 if(!read.texts.some(t=>t.$id===id&&t.status==='published'))throw Error('Not published');
 results.push({id,title:current.title,paragraphs:contents.length,sha256:createHash('sha256').update(contents.join('\n\n')).digest('hex'),assignments:actual,verifiedAt:new Date().toISOString()});
 console.log('Verified',id,contents.length,'paragraphs');
}
for(const img of images){const r=await call({action:'readReadingImage',textId:'ws26-do-it-again',fileId:img.fileId});const resp=await fetch(r.url);if(!resp.ok||(await resp.arrayBuffer()).byteLength!==img.bytes)throw Error('Image access verification failed');}
await writeFile(new URL('revision-publication.json',root),JSON.stringify({results,verifiedImages:images.length},null,2)+'\n');
console.log('Verified both texts, original assignments, and all four book covers.');
