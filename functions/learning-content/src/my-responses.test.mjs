import { test, expect } from 'vitest';
import { harness } from './reading-discussion-test-harness.mjs';
const listing={action:'listMyReadingResponses',listingClassId:'blue'};
test('personal responses are class scoped, private, read-only and retain safe context',async()=>{
 const {call,db,teacher}=harness();
 await call({action:'postReadingDiscussion',requestId:'root',category:'thought',content:'My thought'});
 const root=(await call({action:'readReadingDiscussion'})).posts[0];
 await call({action:'postReadingDiscussion',requestId:'reply',parentId:root.id,content:'Teacher advice'},teacher);
 await call({action:'postReadingDiscussion',requestId:'mine',parentId:root.id,content:'My reply'});
 const before=db.createTransaction.mock.calls.length;
 const {responses}=await call(listing);
 expect(responses).toHaveLength(2);expect(db.createTransaction.mock.calls).toHaveLength(before);
 expect(responses.find(r=>r.post.id===root.id).teacherReplies[0].content).toBe('Teacher advice');
 expect(responses.find(r=>r.post.parentId).context[0].content).toBe('My thought');
 expect(JSON.stringify(responses)).not.toContain('authorId');
 expect(responses.every(r=>r.canEdit)).toBe(true);
 await expect(call({...listing,listingClassId:'red'})).rejects.toThrow('Class access');
 await expect(call(listing,teacher)).rejects.toThrow('Class access');
 await call({action:'moderateReadingDiscussion',postId:root.id,operation:'lock'},teacher);
 expect((await call(listing)).responses.every(r=>!r.canEdit)).toBe(true);
 await call({action:'moderateReadingDiscussion',postId:root.id,operation:'hide'},teacher);
 expect((await call(listing)).responses).toEqual([]);
});
test('unavailable readings and other students never appear; all pages are read',async()=>{
 const {call,storage}=harness();
 for(let i=0;i<105;i++) storage.reading_posts.push({$id:'p'+i,workspaceId:(await import('./reading-discussion.js')).discussionKey('text','blue'),authorId:i===0?'peer':'student',dataJson:JSON.stringify({parentId:null,category:'connection',content:'Response '+i,createdAt:'2026-09-15'})});
 expect((await call(listing)).responses).toHaveLength(104);
 storage.texts[0].status='draft';expect((await call(listing)).responses).toEqual([]);
});
