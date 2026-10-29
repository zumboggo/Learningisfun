import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { IMAGE_BUCKET, imageExtension } from './reading-images.js';

export async function classBannerAction({body,profile,userId,memberClassIds,db,databaseId,storage,tokens,endpoint,projectId}) {
  const cls = await db.getDocument(databaseId, 'classes', body.classId);
  const owner = profile.role === 'teacher' && cls.teacherId === userId;
  const fail = (message, code=400) => { throw Object.assign(new Error(message), {code}); };
  let banner = JSON.parse(cls.bannerJson || 'null');
  if (body.action === 'readClassBanner') {
    if (!owner && !memberClassIds.has(cls.$id)) fail('Class access required',403);
    if (!banner) return {url:''};
    const token = await tokens.createFileToken({bucketId:IMAGE_BUCKET,fileId:banner.fileId,expire:new Date(Date.now()+3600000).toISOString()});
    const url = new URL(`${endpoint.replace(/\/$/,'')}/storage/buckets/${IMAGE_BUCKET}/files/${banner.fileId}/view`);
    url.searchParams.set('project',projectId); url.searchParams.set('token',token.secret);
    return {url:url.href};
  }
  if (!owner) fail('Only the class owner can change its banner',403);
  const previous = banner;
  let uploaded;
  if (body.remove === true) banner = null;
  else {
    if (![body.x,body.y].every(n=>Number.isFinite(n)&&n>=0&&n<=100)) fail('Invalid banner position');
    if (body.source !== undefined) {
      if (typeof body.source !== 'string' || body.source.length > 1500000) fail('Banner is too large');
      const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(body.source);
      if (!match) fail('Choose a JPEG image');
      const bytes = Buffer.from(match[1],'base64');
      if (imageExtension(bytes) !== 'jpg') fail('Invalid banner image');
      uploaded = ID.unique();
      await storage.createFile({bucketId:IMAGE_BUCKET,fileId:uploaded,file:InputFile.fromBuffer(bytes,'class-banner.jpg')});
    }
    if (!uploaded && !banner) fail('Upload a banner first');
    banner = {fileId:uploaded || banner.fileId,x:body.x,y:body.y};
  }
  const bannerJson = JSON.stringify(banner);
  try { await db.updateDocument(databaseId,'classes',cls.$id,{bannerJson}); }
  catch (error) { if(uploaded) await storage.deleteFile({bucketId:IMAGE_BUCKET,fileId:uploaded}).catch(()=>{}); throw error; }
  if(previous && previous.fileId !== banner?.fileId) await storage.deleteFile({bucketId:IMAGE_BUCKET,fileId:previous.fileId}).catch(()=>{});
  return {bannerJson};
}
