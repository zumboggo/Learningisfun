import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
export const PRESENTATION_BUCKET = 'presentation-files';
export const PRESENTATION_PREFIX = 'presentation-file:';
export async function presentationFileAction({body,profile,userId,memberClassIds,db,databaseId,storage,tokens,endpoint,projectId}) {
  if(body.action==='uploadPresentationFile') {
    if(profile.role!=='teacher') throw new Error('Only teachers can upload presentations.');
    const cls=await db.getDocument(databaseId,'classes',body.classId);
    if(cls.teacherId!==userId) throw new Error('You must own this class.');
    const title=String(body.title||'').trim();
    const name=String(body.name||'').replace(/[\r\n\\/]/g,'_');
    if(!title || title.length>255 || !/\.pptx?$/i.test(name) || name.length>180) throw new Error('Choose a PowerPoint (.ppt or .pptx) and a title.');
    if(typeof body.data!=='string' || body.data.length>7000000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.data)) throw new Error('PowerPoints must be 5 MB or smaller.');
    const bytes=Buffer.from(body.data,'base64');
    const valid=/\.pptx$/i.test(name)?bytes.subarray(0,4).equals(Buffer.from([80,75,3,4])):bytes.subarray(0,8).equals(Buffer.from([208,207,17,224,161,177,26,225]));
    if(!valid || bytes.length>5*1024*1024) throw new Error('Choose a valid PowerPoint of 5 MB or smaller.');
    const assignedAt=String(body.assignedAt||new Date().toISOString());
    if(!Number.isFinite(Date.parse(assignedAt))) throw new Error('Choose a valid date.');
    const fileId=ID.unique();
    await storage.createFile({bucketId:PRESENTATION_BUCKET,fileId,file:InputFile.fromBuffer(bytes,name),permissions:[]});
    try {
      const link=await db.createDocument(databaseId,'presentation_links',ID.unique(),{teacherId:userId,classId:cls.$id,title,url:PRESENTATION_PREFIX+fileId,assignedAt,watchedAt:null});
      return {link};
    } catch(error) {
      await storage.deleteFile({bucketId:PRESENTATION_BUCKET,fileId}).catch(()=>{});
      throw error;
    }
  }
  if(body.action==='downloadPresentationFile') {
    const link=await db.getDocument(databaseId,'presentation_links',body.linkId);
    if(!(profile.role==='teacher' && link.teacherId===userId) && !memberClassIds.has(link.classId)) throw new Error('This presentation is not available to your class.');
    if(!link.url.startsWith(PRESENTATION_PREFIX)) throw new Error('No uploaded presentation attached.');
    const fileId=link.url.slice(PRESENTATION_PREFIX.length);
    if(!/^[a-zA-Z0-9._-]{1,36}$/.test(fileId)) throw new Error('Invalid file reference.');
    const token=await tokens.createFileToken({bucketId:PRESENTATION_BUCKET,fileId,expire:new Date(Date.now()+5*60*1000).toISOString()});
    const url=new URL(`${endpoint.replace(/\/$/,'')}/storage/buckets/${PRESENTATION_BUCKET}/files/${fileId}/download`);
    url.searchParams.set('project',projectId);url.searchParams.set('token',token.secret);
    return {url:url.toString()};
  }
  throw new Error('Unsupported presentation file action.');
}
