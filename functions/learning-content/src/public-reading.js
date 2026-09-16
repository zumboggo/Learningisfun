import { Client, Databases, Query, Tokens } from 'node-appwrite';
import { PDF_BUCKET, ownsPdf } from './original-pdf.js';

// Separate guest-executable entry point. Never dispatch private learning actions.
export async function readPublicText({body,db,databaseId,tokens,endpoint,projectId}) {
  if (!['read','original'].includes(body.action) || typeof body.textId !== 'string' || !/^[\w-]{1,36}$/.test(body.textId)) throw new Error('Reading unavailable');
  const text=await db.getDocument(databaseId,'texts',body.textId);
  if (text.publicReadEnabled !== true || text.status !== 'published') throw new Error('Reading unavailable');
  if(body.action==='original') {
    if(!ownsPdf(text.teacherId,text.originalPdfId))throw new Error('Reading unavailable');
    const token=await tokens.createFileToken({bucketId:PDF_BUCKET,fileId:text.originalPdfId,expire:new Date(Date.now()+60000).toISOString()});
    const url=new URL(`${endpoint.replace(/\/$/,'')}/storage/buckets/${PDF_BUCKET}/files/${text.originalPdfId}/${body.download?'download':'view'}`);
    url.searchParams.set('project',projectId);url.searchParams.set('token',token.secret);
    return {url:url.toString()};
  }
  const paragraphs=[];let cursor;
  do {
    const page=await db.listDocuments(databaseId,'text_paragraphs',[Query.equal('textId',text.$id),Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);
    paragraphs.push(...page.documents.map(p=>({$id:p.$id,textId:text.$id,sortOrder:p.sortOrder,content:p.content})));
    cursor=page.documents.length===100?page.documents.at(-1).$id:null;
  }while(cursor);
  paragraphs.sort((a,b)=>a.sortOrder-b.sortOrder);
  // Explicit allowlist: no teacher IDs, assignments, class data or student work.
  return {text:{$id:text.$id,title:text.title,author:text.author||'',source:text.source||'',contentMode:text.contentMode||'full',externalUrl:text.externalUrl||'',originalPdfId:text.originalPdfId?'available':undefined,status:'published'},paragraphs};
}
export async function publicSharingAction({body,profile,userId,db,databaseId}) {
  const text=await db.getDocument(databaseId,'texts',body.textId);
  if(profile.role!=='teacher'||text.teacherId!==userId)throw new Error('Only the text owner can manage sharing');
  if(body.action==='setTextPublicSharing') {
    if(typeof body.enabled!=='boolean')throw new Error('Choose whether public reading is enabled');
    await db.updateDocument(databaseId,'texts',text.$id,{publicReadEnabled:body.enabled});
    return {enabled:body.enabled};
  }
  return {enabled:text.publicReadEnabled===true};
}
export default async({req,res})=>{
  try {
    const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
    return res.json(await readPublicText({body:JSON.parse(req.bodyText||'{}'),db:new Databases(client),databaseId:process.env.APPWRITE_DATABASE_ID||'main',tokens:new Tokens(client),endpoint:process.env.APPWRITE_ENDPOINT,projectId:process.env.APPWRITE_FUNCTION_PROJECT_ID}),200,{'cache-control':'no-store'});
  }catch{return res.json({error:'This text is not publicly shared. Sign in with an assigned class account to read it.'},404,{'cache-control':'no-store'});}
};
