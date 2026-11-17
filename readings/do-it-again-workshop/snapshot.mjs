import {Client,Databases,Query} from 'node-appwrite';
import {writeFile} from 'node:fs/promises';
const c=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(c),d=process.env.APPWRITE_DATABASE_ID||'main';
for(const id of ['ws26-do-it-again','ws26-rubric']){
 const text=await db.getDocument(d,'texts',id),paragraphs=[];let cursor;
 do{const r=await db.listDocuments(d,'text_paragraphs',[Query.equal('textId',id),Query.orderAsc('sortOrder'),Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);paragraphs.push(...r.documents);cursor=r.documents.length===100?r.documents.at(-1).$id:null;}while(cursor);
 const assignments=await db.listDocuments(d,'text_assignments',[Query.equal('textId',id),Query.limit(100)]);
 const annotations=await db.listDocuments(d,'text_annotations',[Query.equal('textId',id),Query.limit(1)]);
 await writeFile(new URL(`./${id}-before-update.json`,import.meta.url),JSON.stringify({text,paragraphs:paragraphs.map(p=>({id:p.$id,sortOrder:p.sortOrder,content:p.content})),assignments:assignments.documents,annotationCount:annotations.total},null,2)+'\n');
 console.log(id,'paragraphs',paragraphs.length,'annotations',annotations.total);
}
