import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classBannerAction} from './class-banner.js';
function setup(overrides={}) {
 const updates=[],deleted=[];
 const context={body:{action:'saveClassBanner',classId:'c',x:25,y:80},profile:{role:'teacher'},userId:'teacher',memberClassIds:new Set(),databaseId:'main',db:{getDocument:async()=>({$id:'c',teacherId:'teacher',bannerJson:JSON.stringify({fileId:'old',x:50,y:50})}),updateDocument:async(...args)=>updates.push(args)},storage:{deleteFile:async args=>deleted.push(args)},...overrides};
 return {context,updates,deleted};
}
test('only the class owner can save or remove banners',async()=>{
 for(const body of [{action:'saveClassBanner',classId:'c',x:50,y:50},{action:'saveClassBanner',classId:'c',remove:true}]){
  const {context,updates}=setup({userId:'other',body});await assert.rejects(classBannerAction(context),/class owner/);assert.equal(updates.length,0);
 }
});
test('reposition keeps the original file and saves both coordinates',async()=>{
 const {context,updates,deleted}=setup();const result=await classBannerAction(context);
 assert.deepEqual(JSON.parse(result.bannerJson),{fileId:'old',x:25,y:80});assert.equal(updates.length,1);assert.equal(deleted.length,0);
});
test('invalid coordinates cannot be saved',async()=>{
 const {context}=setup({body:{action:'saveClassBanner',classId:'c',x:-1,y:50}});await assert.rejects(classBannerAction(context),/position/);
});
test('removal clears the banner and cleans up the file',async()=>{
 const {context,deleted}=setup({body:{action:'saveClassBanner',classId:'c',remove:true}});
 assert.equal((await classBannerAction(context)).bannerJson,'null');assert.equal(deleted[0].fileId,'old');
});
test('nonmembers cannot read a banner',async()=>{
 const {context}=setup({body:{action:'readClassBanner',classId:'c'},userId:'other'});await assert.rejects(classBannerAction(context),/access required/);
});
test('members receive a temporary image URL',async()=>{
 const {context}=setup({body:{action:'readClassBanner',classId:'c'},userId:'student',memberClassIds:new Set(['c']),tokens:{createFileToken:async()=>({secret:'temporary'})},endpoint:'https://example.test/v1',projectId:'project'});
 const result=await classBannerAction(context);assert.match(result.url,/old\/view\?project=project&token=temporary/);
});
test('failed save cleans up new upload and preserves existing banner',async()=>{
 const deleted=[];
 const {context}=setup({body:{action:'saveClassBanner',classId:'c',x:50,y:50,source:'data:image/jpeg;base64,'+Buffer.from([255,216,255,0,0,0,0,0,0,0,0,0]).toString('base64')},storage:{createFile:async()=>{},deleteFile:async args=>deleted.push(args)}});
 context.db.updateDocument=async()=>{throw new Error('Save failed');};
 await assert.rejects(classBannerAction(context),/Save failed/);
 assert.equal(deleted.length,1);assert.notEqual(deleted[0].fileId,'old');
});
