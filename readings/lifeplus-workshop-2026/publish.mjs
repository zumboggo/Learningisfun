import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Client,Databases,Users,Functions,Storage,Query} from 'node-appwrite';
import {InputFile} from 'node-appwrite/file';
const root=path.dirname(fileURLToPath(import.meta.url)),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin),users=new Users(admin),storage=new Storage(admin),classId='5a726282-4771-4774-8213-d9329c124bbc';
const cls=await db.getDocument(databaseId,'classes',classId);if(cls.courseName!=='Lifeplus Workshop'||cls.status!=='active')throw Error('Unexpected class');
const owner=await users.get({userId:cls.teacherId});if(!/^(davidh|david hepting)$/i.test(owner.name))throw Error('Unexpected owner');
const {jwt}=await users.createJWT({userId:owner.$id,duration:3600});const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt),functions=new Functions(client);
async function call(body){const r=await functions.createExecution({functionId:'learning-content',body:JSON.stringify(body),async:false});const data=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||data.error||r.status==='failed')throw Error(data.error||`Function failed ${r.responseStatusCode}`);return data;}
async function get(c,id){try{return await db.getDocument(databaseId,c,id)}catch(e){if(e.code===404)return null;throw e}}
async function put(c,id,data,native=false){const old=await get(c,id);if(old){for(const [k,v] of Object.entries(data)){if(['createdAt','updatedAt','assignedAt','status'].includes(k))continue;if(JSON.stringify(old[k])!==JSON.stringify(v))throw Error(`Conflicting ${c}/${id}/${k}; preserved`)}return 'reused'}if(native)await call({action:'scopedData',collection:c,operation:'create',id,data});else await call({action:'mutate',collection:c,operation:'create',id,data});return 'created'}
const now='2026-11-13T12:00:00+08:00',receipt=process.argv.includes('--cards-only')?JSON.parse(await readFile(path.join(root,'publication.json'),'utf8')):{classId,readings:[],verifiedAt:new Date().toISOString()};
const entries=[['copywork','ws26-copywork'],['qft','ws26-qft'],['features','ws26-features'],['assignment-rubric','ws26-rubric']];
for(const [file,id] of (process.argv.includes('--cards-only')?[]:entries)){
 let md=await readFile(path.join(root,file+'.md'),'utf8'),title=md.split('\n')[0].replace(/^# /,'');md=md.slice(md.indexOf('\n')).trim();let imageId;
 if(file==='features'){
  const bytes=await readFile(path.join(root,'../../public/workshop/joining-lif.webp'));imageId='img_'+createHash('sha256').update(owner.$id).digest('hex').slice(0,10)+'_'+createHash('sha256').update(bytes).digest('hex').slice(0,20);
  try{await storage.createFile({bucketId:'original-pdfs',fileId:imageId,file:InputFile.fromBuffer(bytes,'joining-lif.webp'),permissions:[]})}catch(e){if(e.code!==409)throw e}
  md=`![Joining LIF: sign in with your existing account, activate teacher access with David’s invitation, then join the workshop with its separate class code.](reading-image:${id}:${imageId})\n\n*AI-generated joining guide; the linked instructions below give the same steps in text.*\n\n`+md;
 }
 const status=await put('texts',id,{teacherId:owner.$id,title,author:file==='assignment-rubric'?'David Hepting':'Lifeplus Workshop — based on David Hepting’s notes',source:file==='assignment-rubric'?'Canvas assignment 21695/784829, read November 13, 2026; substantive instructions and rubric reproduced.':'Prepared for Lifeplus Workshop, November 19, 2026. Sources linked within the reading.',contentMode:'full',externalUrl:'',status:'draft',publicReadEnabled:false,annotationMode:'regular',createdAt:now,updatedAt:now});
 const paras=md.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
 for(let i=0;i<paras.length;i+=4)await Promise.all(paras.slice(i,i+4).map((content,j)=>put('text_paragraphs',id+'-p'+(i+j),{textId:id,sortOrder:i+j,content})));
 const saved=await db.listDocuments(databaseId,'text_paragraphs',[Query.equal('textId',id),Query.orderAsc('sortOrder'),Query.limit(100)]);if(saved.total!==paras.length||saved.documents.some((r,i)=>r.content!==paras[i]))throw Error('Paragraph mismatch');
 await call({action:'mutate',collection:'texts',operation:'update',id,data:{status:'published',updatedAt:new Date().toISOString()}});
 const existing=await db.listDocuments(databaseId,'text_assignments',[Query.equal('textId',id),Query.equal('classId',classId),Query.limit(10)]);if(existing.total>1)throw Error('Duplicate assignments');
 await put('text_assignments',existing.documents[0]?.$id||id+'-assignment',{textId:id,classId,assignedAt:now,dueDate:'',isAssignedReading:true,isCopywork:false});
 const read=await call({action:'readTexts',classIds:[classId],textId:id,includeContent:true});if(!read.texts.some(t=>t.$id===id&&t.status==='published')||read.paragraphs.filter(p=>p.textId===id).length!==paras.length)throw Error('Readback mismatch');
 if(imageId){const image=await call({action:'readReadingImage',textId:id,fileId:imageId});const response=await fetch(image.url);if(!response.ok)throw Error('Image inaccessible');await response.arrayBuffer()}
 receipt.readings.push({id,title,status,paragraphs:paras.length,sha256:createHash('sha256').update(md).digest('hex'),url:`https://zumboggo.github.io/Learningisfun/#/texts/${id}?classId=${classId}`});await writeFile(path.join(root,'publication.json'),JSON.stringify(receipt,null,2)+'\n');console.log('Verified',id,paras.length,'paragraphs');
}
const deckId='ws26-copywork-qft-cards',cards=JSON.parse(await readFile(path.join(root,'flashcards.json'),'utf8'));
const deckState=await put('flashcard_decks',deckId,{creatorId:owner.$id,title:'Copywork and QFT — Workshop Practice',description:'14 sample cards. Source: The Question Formulation Technique was created by Dan Rothstein and Luz Santana, co-founders of the Right Question Institute (rightquestion.org). QFT reference: https://media.rightquestion.org/resources/QFT-Card.pdf . Original Copywork explanations and examples. Recall before revealing, then rate honestly.',type:'teacher',status:'draft',createdAt:now,updatedAt:now},true);
for(const [i,c] of cards.entries()){const back=c.Definition+'\n\nExample: '+c.Example;await put('flashcard_cards',deckId+'-'+i,{deckId,front:c.Term,back,frontMarkdown:c.Term,backMarkdown:back,hint:'',tags:[i<6?'Copywork':'QFT'],sortOrder:i,createdAt:now},true)}
await call({action:'scopedData',collection:'flashcard_decks',operation:'update',id:deckId,data:{status:'published',updatedAt:new Date().toISOString()}});
await put('deck_assignments','ws26-card-assignment',{deckId,classId,isRequired:false,dailyTarget:5,assignedAt:now});
const deck=await call({action:'readFlashcardDeck',deckId});if(deck.cards?.length!==14)throw Error('Deck readback mismatch');
receipt.deck={id:deckId,status:deckState,cards:14,url:`https://zumboggo.github.io/Learningisfun/#/decks/${deckId}/review?workshop=${classId}`};await writeFile(path.join(root,'publication.json'),JSON.stringify(receipt,null,2)+'\n');console.log('Verified 14 cards and workshop assignment');
