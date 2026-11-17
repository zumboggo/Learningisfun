import {test} from 'node:test';
import assert from 'node:assert/strict';
import {peerWorkAction,peerWorkId,validatePeerWork,requirePeerWork,listPeerWork,PEER_WORK_COLLECTION} from './peer-work.js';
const activity={$id:'activity',classId:'class',workMode:'submitted',status:'active'};
function fixture(){
 const rows=new Map(),uploads=[],deleted=[],tokens=[];
 const db={getDocument:async(_,collection,id)=>{if(collection==='peer_review_activities')return activity;if(collection==='classes')return {teacherId:'teacher'};if(!rows.has(id))throw Object.assign(new Error('Not found'),{code:404});return rows.get(id)},createDocument:async(_,collection,id,data)=>{assert.equal(collection,PEER_WORK_COLLECTION);if(rows.has(id))throw Object.assign(new Error('Duplicate'),{code:409});const saved={$id:id,...data};rows.set(id,saved);return saved},listDocuments:async()=>({documents:[...rows.values()]})};
 const args={body:{action:'submitPeerReviewWork',activityId:'activity',title:'My essay',text:'My own argument'},profile:{role:'student'},userId:'student',memberClassIds:new Set(['class']),db,databaseId:'db',storage:{createFile:async data=>uploads.push(data),deleteFile:async data=>deleted.push(data)},tokens:{createFileToken:async data=>{tokens.push(data);return {secret:'temporary'}}},endpoint:'https://example.org/v1',projectId:'project'};
 return {args,rows,uploads,deleted,tokens};
}
test('validates text, links and supported attachments, rejecting empty and unsafe work',()=>{
 assert.equal(validatePeerWork({title:'Text',text:'Hello'}).text,'Hello');
 assert.equal(validatePeerWork({title:'Link',url:'https://docs.example.org/essay'}).url,'https://docs.example.org/essay');
 assert.ok(validatePeerWork({title:'File',file:{name:'essay.pdf',data:Buffer.from('%PDF-1.4 test').toString('base64')}}).file);
 for(const body of [{title:'Empty'},{title:'Link',url:'javascript:alert(1)'},{title:'Link',url:'https://user:secret@example.org'},{title:'Huge',text:'x'.repeat(20001)},{title:'File',file:{name:'bad.html',data:'SGVsbG8='}},{title:'File',file:{name:'fake.pdf',data:'SGVsbG8='}},{title:'File',file:{name:'huge.txt',data:'A'.repeat(7000000)}}])assert.throws(()=>validatePeerWork(body));
});
test('only enrolled students can submit; outsiders, parents and other teachers cannot read or download',async()=>{
 const {args}=fixture();
 for(const role of ['parent','teacher'])await assert.rejects(()=>peerWorkAction({...args,profile:{role}}),e=>e.code===403);
 for(const action of ['submitPeerReviewWork','readPeerReviewWork','downloadPeerReviewWork'])await assert.rejects(()=>peerWorkAction({...args,body:{...args.body,action},memberClassIds:new Set()}),e=>e.code===403);
 await assert.rejects(()=>peerWorkAction({...args,userId:'teacher',profile:{role:'teacher'}}),e=>e.code===403);
});
test('one immutable submission is saved for the authenticated student; classmates and owner can read it',async()=>{
 const {args,rows}=fixture();
 const result=await peerWorkAction({...args,body:{...args.body,studentId:'someone-else'}});
 assert.equal(result.work.studentId,'student');assert.equal(rows.size,1);
 await assert.rejects(()=>peerWorkAction(args),e=>e.code===409);
 for(const who of [{userId:'peer',profile:{role:'student'}},{userId:'teacher',profile:{role:'teacher'}}]){
  const read=await peerWorkAction({...args,...who,body:{action:'readPeerReviewWork',activityId:'activity',studentId:'student'}});assert.equal(read.work.text,'My own argument');assert.equal(read.work.fileId,undefined);
 }
 assert.notEqual(peerWorkId('other','student'),peerWorkId('activity','student'));
 await assert.rejects(()=>requirePeerWork(args.db,'db',activity,'missing'),e=>e.code===400);
 const summaries=await listPeerWork(args.db,'db',activity);assert.equal(summaries[0].text,undefined);
});
test('attachments remain private and downloads use the stored file, not a caller supplied file ID',async()=>{
 const {args,uploads,tokens}=fixture();
 await peerWorkAction({...args,body:{...args.body,file:{name:'essay.txt',data:'SGVsbG8='}}});
 assert.deepEqual(uploads[0].permissions,[]);
 const result=await peerWorkAction({...args,userId:'peer',body:{action:'downloadPeerReviewWork',activityId:'activity',studentId:'student',fileId:'someone-elses-file'}});
 assert.equal(tokens[0].fileId,uploads[0].fileId);assert.ok(result.url.endsWith('project=project&token=temporary'));
});
test('closed and live activities reject submissions and failed writes clean up new files',async()=>{
 const {args,deleted}=fixture();
 for(const change of [{status:'closed'},{workMode:'live'}]){
  const db={...args.db,getDocument:async(...params)=>params[1]==='peer_review_activities'?{...activity,...change}:args.db.getDocument(...params)};
  await assert.rejects(()=>peerWorkAction({...args,db}));
 }
 const db={...args.db,createDocument:async()=>{throw new Error('Storage failed')}};
 await assert.rejects(()=>peerWorkAction({...args,db,body:{...args.body,file:{name:'essay.txt',data:'SGVsbG8='}}}));
 assert.equal(deleted.length,1);
});
