import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readingImageAction, isPublicIPv4, imageExtension } from './reading-images.js';
const png=Buffer.from('89504e470d0a1a0a0000000d49484452','hex');
const context={profile:{role:'teacher'},userId:'teacher',storage:{async createFile(){}}};
test('blocks internal, metadata, loopback, reserved and IPv6 targets',()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.0.1','192.168.0.1','100.64.0.1','0.0.0.0','::1','224.0.0.1','198.18.1.1'])assert.equal(isPublicIPv4(ip),false,ip);
 assert.equal(isPublicIPv4('93.184.216.34'),true);
});
test('requires raster bytes and enforces size limit',()=>{
 assert.equal(imageExtension(png),'png');
 assert.throws(()=>imageExtension(Buffer.from('<svg onload="alert(1)"></svg>')));
 assert.throws(()=>imageExtension(Buffer.alloc(6*1024*1024)));
});
test('imports are teacher only and retries deduplicate by owner and content',async()=>{
 const body={action:'importReadingImage',source:`data:image/png;base64,${png.toString('base64')}`};
 await assert.rejects(readingImageAction({...context,profile:{role:'student'},body}));
 const first=await readingImageAction({...context,body});
 const retry=await readingImageAction({...context,body,storage:{async createFile(){throw {code:409};}}});
 assert.deepEqual(first,retry);
 const other=await readingImageAction({...context,body,userId:'other'});
 assert.notEqual(first.fileId,other.fileId);
});
test('image access follows text sharing, class release and membership',async()=>{
 const {fileId}=await readingImageAction({...context,body:{action:'importReadingImage',source:`data:image/png;base64,${png.toString('base64')}`}});
 let shared=false,referenced=true,assigned=true;
 const db={async getDocument(){return {$id:'text',teacherId:'teacher',publicReadEnabled:shared,status:'published'};},async listDocuments(_db,collection){return {documents:collection==='text_paragraphs'?(referenced?[{content:`![A](reading-image:text:${fileId})`}]:[]):(assigned?[{assignedAt:'2020-01-01'}]:[])};}};
 const args={body:{action:'readReadingImage',textId:'text',fileId},db,databaseId:'main',tokens:{async createFileToken(){return {secret:'temporary'};}},endpoint:'https://appwrite.test/v1',projectId:'project'};
 await assert.rejects(readingImageAction({...args,publicOnly:true}));
 shared=true;
 assert.match((await readingImageAction({...args,publicOnly:true})).url,/token=temporary/);
 referenced=false;
 await assert.rejects(readingImageAction({...args,publicOnly:true}));
 referenced=true;shared=false;
 assert.match((await readingImageAction({...args,profile:{role:'student'},userId:'student',memberClassIds:new Set(['class'])})).url,/original-pdfs/);
 assigned=false;
 await assert.rejects(readingImageAction({...args,profile:{role:'student'},userId:'student',memberClassIds:new Set(['class'])}));
});
