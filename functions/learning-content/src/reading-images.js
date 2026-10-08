import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { textAssignmentAvailable } from './text-schedule.js';

// Share the existing private reading-file bucket to avoid requiring another plan bucket.
export const IMAGE_BUCKET = 'original-pdfs';
const MAX_BYTES = 5 * 1024 * 1024;
const prefix = userId => `img_${createHash('sha256').update(userId).digest('hex').slice(0,10)}_`;
export const ownsImage = (userId,fileId) => typeof fileId==='string' && /^img_[a-f0-9]{10}_[a-f0-9]{20}$/.test(fileId) && fileId.startsWith(prefix(userId));
export function isPublicIPv4(address) {
  const parts=address.split('.').map(Number);
  if(parts.length!==4 || parts.some(p=>!Number.isInteger(p)||p<0||p>255))return false;
  const [a,b]=parts;
  return !(a===0 || a===10 || a===127 || a>=224 || (a===100 && b>=64 && b<=127) || (a===169 && b===254) || (a===172 && b>=16 && b<=31) || (a===192 && [0,2,168].includes(b)) || (a===198 && [18,19,51].includes(b)) || (a===203 && b===0));
}
export function imageExtension(bytes) {
  if(bytes.length<12 || bytes.length>MAX_BYTES)throw new Error('Pictures must be 5 MB or smaller.');
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
  if(bytes[0]===255 && bytes[1]===216 && bytes[2]===255)return 'jpg';
  if(/^GIF8[79]a$/.test(bytes.subarray(0,6).toString()))return 'gif';
  if(bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP')return 'webp';
  throw new Error('Choose a PNG, JPEG, WebP or GIF image.');
}
export async function downloadImage(source, redirects=0) {
  const url=new URL(source);
  if(url.protocol!=='https:' || url.username || url.password || (url.port && url.port!=='443') || redirects>4)throw new Error('Use a public HTTPS image URL.');
  const addresses=await lookup(url.hostname,{all:true,family:4});
  if(!addresses.length || addresses.some(row=>!isPublicIPv4(row.address)))throw new Error('Image address is not public.');
  // Pin the validated address for the actual connection to prevent DNS rebinding.
  return new Promise((resolve,reject)=>{
    const req=request(url,{lookup:(_hostname,options,callback)=>{
      if(options.all)callback(null,[addresses[0]]);else callback(null,addresses[0].address,4);
    },headers:{Accept:'image/png,image/jpeg,image/webp,image/gif','User-Agent':'LearningIsFun-ReadingImageImporter/1.0'}},res=>{
      if([301,302,303,307,308].includes(res.statusCode)) {
        res.resume();
        if(!res.headers.location){reject(new Error('Image redirect has no location.'));return;}
        downloadImage(new URL(res.headers.location,url).href,redirects+1).then(resolve,reject);return;
      }
      if(res.statusCode!==200 || Number(res.headers['content-length']||0)>MAX_BYTES){res.destroy();reject(new Error('Image could not be downloaded.'));return;}
      const chunks=[];let size=0;
      res.on('data',chunk=>{size+=chunk.length;if(size>MAX_BYTES){res.destroy(new Error('Picture exceeds 5 MB.'));return;}chunks.push(chunk);});
      res.on('error',reject);res.on('end',()=>resolve(Buffer.concat(chunks)));
    });
    const deadline=setTimeout(()=>req.destroy(new Error('Image download timed out.')),15000);
    req.on('close',()=>clearTimeout(deadline));req.on('error',reject);req.end();
  });
}
export async function readingImageAction({body,profile,userId,memberClassIds,db,databaseId,storage,tokens,endpoint,projectId,publicOnly=false}) {
  if(body.action==='importReadingImage') {
    if(publicOnly || profile?.role!=='teacher')throw new Error('Only teachers can add reading pictures.');
    if(typeof body.source!=='string' || body.source.length>7100000)throw new Error('Picture is too large.');
    const data=/^data:image\/(?:png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(body.source);
    const bytes=data?Buffer.from(data[1],'base64'):await downloadImage(body.source);
    const extension=imageExtension(bytes);
    const fileId=prefix(userId)+createHash('sha256').update(bytes).digest('hex').slice(0,20);
    try{await storage.createFile({bucketId:IMAGE_BUCKET,fileId,file:InputFile.fromBuffer(bytes,`reading.${extension}`),permissions:[]});}catch(error){if(error.code!==409)throw error;}
    return {fileId};
  }
  if(body.action!=='readReadingImage' || typeof body.textId!=='string' || !/^[\w-]{1,36}$/.test(body.textId))throw new Error('Invalid reading image request.');
  const text=await db.getDocument(databaseId,'texts',body.textId);
  const owner=!publicOnly && profile?.role==='teacher' && text.teacherId===userId;
  if(!owner) {
    const shared=text.publicReadEnabled===true && text.status==='published';
    if(!shared) {
      if(publicOnly || text.status!=='published' || !memberClassIds?.size)throw new Error('Reading unavailable.');
      const assigned=await db.listDocuments(databaseId,'text_assignments',[Query.equal('textId',text.$id),Query.equal('classId',[...memberClassIds]),Query.limit(100)]);
      if(!assigned.documents.some(textAssignmentAvailable))throw new Error('Reading unavailable.');
    }
  }
  if(!ownsImage(text.teacherId,body.fileId))throw new Error('Image unavailable.');
  let found=false,cursor;
  do {
    const page=await db.listDocuments(databaseId,'text_paragraphs',[Query.equal('textId',text.$id),Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);
    found=page.documents.some(row=>String(row.content).includes(`](reading-image:${text.$id}:${body.fileId})`));
    cursor=page.documents.length===100?page.documents.at(-1).$id:undefined;
  }while(!found && cursor);
  if(!found)throw new Error('Image is not part of this reading.');
  const token=await tokens.createFileToken({bucketId:IMAGE_BUCKET,fileId:body.fileId,expire:new Date(Date.now()+5*60000).toISOString()});
  const url=new URL(`${endpoint.replace(/\/$/,'')}/storage/buckets/${IMAGE_BUCKET}/files/${body.fileId}/view`);
  url.searchParams.set('project',projectId);url.searchParams.set('token',token.secret);
  return {url:url.href};
}
