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
const textId='cw_enough_20261106';
const text=await db.getDocument(d,'texts',textId);
if(text.title!=='Please Stop Improving My Life'||text.teacherId!==owner.$id||text.status!=='published')throw Error('Unexpected model essay');
const paragraphs=await list('text_paragraphs',[Query.equal('textId',textId),Query.orderAsc('sortOrder')]);
if(!paragraphs.some(p=>p.content.includes('A Piece of Chalk')))throw Error('Not revised Chesterton essay');
const assignments=await list('text_assignments',[Query.equal('textId',textId),Query.equal('classId',classId)]);
if(assignments.length>1)throw Error('Duplicate assignments');
if(!assignments.length)await call({action:'mutate',collection:'text_assignments',operation:'create',id:'ws26-enough-model',data:{textId,classId,assignedAt:new Date().toISOString(),dueDate:'',isAssignedReading:false,isCopywork:false}});
const members=await list('class_members',[Query.equal('classId',classId),Query.equal('role','student')]);
const member=members.find(m=>m.userId!==owner.$id&&(!m.expiresAt||Date.parse(m.expiresAt)>Date.now()));
let learnerVerified=false;
if(member){
 const {jwt}=await users.createJWT({userId:member.userId,duration:300});
 const learner=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
 async function read(body){const r=await learner.createExecution({functionId:'learning-content',body:JSON.stringify({...body,workshop:true}),async:false});const v=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||v.error)throw Error(v.error||'Learner read failed');return v;}
 const result=await read({action:'readTexts',classIds:[classId],textId,includeContent:true});
 if(!result.texts.some(t=>t.$id===textId)||result.paragraphs.filter(p=>p.textId===textId).length!==paragraphs.length)throw Error('Learner content unavailable');
 const pdf=await read({action:'readOriginalPdf',textId,download:false});const response=await fetch(pdf.url);if(!response.ok)throw Error('Learner PDF unavailable');await response.arrayBuffer();learnerVerified=true;
}
await writeFile(new URL('workshop-model-publication.json',root),JSON.stringify({textId,title:text.title,classId,paragraphs:paragraphs.length,learnerVerified,verifiedAt:new Date().toISOString()},null,2)+'\n');
console.log('Workshop model available:',paragraphs.length,'paragraphs; learner and PDF verified:',learnerVerified);
