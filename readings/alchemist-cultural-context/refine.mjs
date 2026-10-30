// Apply the final editorial expansion only if the live paragraph matches the original.
import {Client,Databases,Users,Functions,Query} from 'node-appwrite';
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
const admin=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(admin), databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const rows=await db.listDocuments({databaseId,collectionId:'text_paragraphs',queries:[Query.equal('textId',manifest.id),Query.orderAsc('sortOrder'),Query.limit(100)]});
const expected=(await readFile(new URL('reading.md',root),'utf8')).split(/\n\s*\n/).find(p=>p.startsWith('Coelho uses that crowded room'));
const row=rows.documents.find(p=>p.content.startsWith('Coelho uses that crowded room'));
const old=expected.replace('Santiago’s **Personal Legend**, the calling he is meant to pursue, makes his own development part of the search. The **Soul of the World** gives that search a cosmic setting: Coelho imagines lives and natural things participating in a shared spiritual reality. Through this lens, learning about metal and learning about oneself can belong to the same adventure. This is the novel’s imaginative use of alchemy, not a claim that every historical alchemist was secretly writing self-help.','That is an interpretation of the novel, not a claim that every historical alchemist was secretly writing self-help.');
if(!row||![old,expected].includes(row.content))throw Error('Conflicting editorial change');
if(row.content!==expected){
 const text=await db.getDocument({databaseId,collectionId:'texts',documentId:manifest.id});
 const {jwt}=await new Users(admin).createJWT({userId:text.teacherId,duration:3600});
 const fn=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(jwt));
 const r=await fn.createExecution({functionId:'learning-content',body:JSON.stringify({action:'mutate',collection:'text_paragraphs',operation:'update',id:row.$id,data:{content:expected}}),async:false});
 if(r.responseStatusCode>=400||JSON.parse(r.responseBody||'{}').error)throw Error('Editorial update failed');
}
const verified=await db.getDocument({databaseId,collectionId:'text_paragraphs',documentId:row.$id});
if(verified.content!==expected)throw Error('Editorial readback failed');
// Refresh the parent timestamp so offline clients discover the content revision.
const parent=await db.getDocument({databaseId,collectionId:'texts',documentId:manifest.id});
const refreshJwt=await new Users(admin).createJWT({userId:parent.teacherId,duration:3600});
const refreshFn=new Functions(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setJWT(refreshJwt.jwt));
const refresh=await refreshFn.createExecution({functionId:'learning-content',body:JSON.stringify({action:'mutate',collection:'texts',operation:'update',id:manifest.id,data:{updatedAt:new Date().toISOString()}}),async:false});
if(refresh.responseStatusCode>=400||JSON.parse(refresh.responseBody||'{}').error)throw Error('Parent refresh failed');
const receipt=JSON.parse(await readFile(new URL('publication.json',root),'utf8'));
receipt.verifiedAt=new Date().toISOString();for(const reading of receipt.readings)reading.wordCount=manifest.wordCount;
await writeFile(new URL('publication.json',root),JSON.stringify(receipt,null,2)+'\n');
console.log('Verified final editorial paragraph:',manifest.wordCount,'words');
