import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {Client,Databases,Users,Functions,Query} from 'node-appwrite';
import {newTextDraft,readingParagraphs,proseWords} from '../../functions/learning-content/src/text-authoring-model.js';
if(!process.env.APPWRITE_API_KEY)loadEnvFile(homedir()+'/.config/learningisfun/appwrite.env');
const base=()=>new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID);
const admin=base().setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const classId='e24ec8d9-21d7-4c32-a30e-08655c2f4e65',draftId='sheep-loyalty-debate-20261110';
const cls=await db.getDocument({databaseId,collectionId:'classes',documentId:classId});
assert.equal(cls.courseName,'Ethics and Leadership');assert.equal(cls.status,'active');
const owner=await users.get({userId:cls.teacherId});assert.match(owner.name,/^(davidh|david hepting)$/i);
async function clientFor(userId){const {jwt}=await users.createJWT({userId,duration:900});return new Functions(base().setJWT(jwt));}
const teacher=await clientFor(owner.$id);
async function call(body,client=teacher){const r=await client.createExecution({functionId:'learning-content',body:JSON.stringify(body)});const d=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||d.error){const e=Error(d.error||'Function failed');e.code=r.responseStatusCode;throw e;}return d;}
const members=await db.listDocuments({databaseId,collectionId:'class_members',queries:[Query.equal('classId',classId),Query.equal('role','student'),Query.limit(500)]});
const member=members.documents.find(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now());assert(member,'Active student membership required');
const student=await clientFor(member.userId);
const episodeReceipt=JSON.parse(await readFile(new URL('../../stories/animated/the-sheep-behind-our-house/publication.json',import.meta.url),'utf8'));
const episode=JSON.parse(await readFile(new URL('../../public/stories/animated/the-sheep-behind-our-house/episode.json',import.meta.url),'utf8'));
const library=await call({action:'animatedLibrary'});
const assignment=library.assignments.find(a=>a.assignmentId===episodeReceipt.assignments[0].assignmentId);assert(assignment);assert.equal(assignment.classId,classId);
const live=await call({action:'animatedRead',assignmentId:assignment.assignmentId},student);assert.equal(live.preview,false);assert.deepEqual(live.pack,episode);
assert.equal(Object.keys(live.mediaUrls||{}).length,3);
for(const url of Object.values(live.mediaUrls)){const r=await fetch(url,{headers:{Range:'bytes=0-255'}});assert(r.ok,'Existing teaser media inaccessible');await r.arrayBuffer();}
const markdown=await readFile(new URL('reading.md',import.meta.url),'utf8');
const value=newTextDraft();value.title=markdown.split('\n')[0].replace(/^# /,'');value.content=markdown.slice(markdown.indexOf('\n')+1).trim();
value.author='Original classroom companion reading';value.brief={...value.brief,topic:'Family loyalty and justice: Confucius and Joseph Henrich',course:'Ethics and Leadership',length:'custom',customWords:600,illustrations:0,preferences:'Short, funny, challenging debate preparation. Questions explicitly requested.'};value.reviewed=true;value.voice='B';
const manifest={draftId,title:value.title,file:'reading.md',classId,voice:'B',wordCount:proseWords(value.content),sha256:createHash('sha256').update(markdown).digest('hex'),images:[],episodeId:episodeReceipt.id,episodeUrl:episodeReceipt.assignments[0].playUrl,assignmentPolicy:'Available now; no deadline; preserve existing episode assignment'};
await writeFile(new URL('manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
if(!process.argv.includes('--publish')){console.log(JSON.stringify({episodeVerified:true,episodeAssignmentPreserved:assignment.date,mediaVerified:true,reading:manifest,mutation:false},null,2));process.exit(0);}
let saved;try{saved=await call({action:'textReadDraft',draftId});}catch(e){if(e.code!==404)throw e;}
if(saved){assert.equal(saved.value.title,value.title,'Existing draft title conflict');assert.equal(saved.value.content,value.content,'Existing draft content conflict');assert(saved.value.reviewed);}else saved=await call({action:'textSaveDraft',draftId,revision:0,value});
const published=await call({action:'textPublish',draftId,revision:saved.revision,assignments:[{classId,dueDate:'',isAssignedReading:true}]});
const expected=readingParagraphs(value,published.textId);
const rows=await db.listDocuments({databaseId,collectionId:'text_paragraphs',queries:[Query.equal('textId',published.textId),Query.orderAsc('sortOrder'),Query.limit(100)]});
assert.deepEqual(rows.documents.map(p=>p.content),expected);assert.equal(published.text.status,'published');
assert.equal(published.assigned.length,1);assert.equal(published.assigned[0].dueDate,'');assert.equal(published.assigned[0].classId,classId);
for(const client of [teacher,student]){const read=await call({action:'readTexts',classIds:[classId],textId:published.textId,includeContent:true},client);assert(read.texts.some(t=>t.$id===published.textId));assert.deepEqual(read.paragraphs.filter(p=>p.textId===published.textId).sort((a,b)=>a.sortOrder-b.sortOrder).map(p=>p.content),expected);}
const after=await call({action:'animatedLibrary'});assert.deepEqual(after.assignments,library.assignments,'Episode assignments must remain unchanged');
const receipt={textId:published.textId,title:value.title,classId,className:cls.courseName,url:`https://zumboggo.github.io/Learningisfun/#/texts/${published.textId}?classId=${classId}`,dueDate:null,wordCount:manifest.wordCount,paragraphs:expected.length,teacherReadVerified:true,studentReadVerified:true,episodeStudentReadVerified:true,episodeMediaVerified:true,episodeAssignmentsPreserved:true,studentAttemptsCreated:false,episodeUrl:manifest.episodeUrl,verifiedAt:new Date().toISOString()};
await writeFile(new URL('publication.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
