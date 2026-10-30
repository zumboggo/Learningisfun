import {expect,it} from 'vitest';
import {harness} from './reading-discussion-test-harness.mjs';
const action='setReadingRequirements';
const requirements={questions:5,replies:2,replyQuoteRequired:true};
it('allows only the class teacher to save valid requirements, scoped per reading and class',async()=>{
 const {call,teacher}=harness();
 await expect(call({action,requirements})).rejects.toThrow('teacher');
 await expect(call({action,requirements:{...requirements,questions:-1}},teacher)).rejects.toThrow('0–100');
 await expect(call({action,requirements:{...requirements,replies:1.5}},teacher)).rejects.toThrow('0–100');
 await call({action,requirements},teacher);
 await call({action:'setReadingDiscussionIdentity',showStudentNames:true},teacher);
 expect((await call({action:'readReadingDiscussion'},teacher)).requirements).toEqual(requirements);
 expect((await call({action:'readReadingDiscussion',classId:'red'},teacher)).requirements).toBeNull();
 await call({action,requirements:{...requirements,questions:0}},teacher);
 expect((await call({action:'readReadingDiscussion'},teacher)).showStudentNames).toBe(true);
});
it('counts quoted replies separately and allows more than three assigned questions',async()=>{
 const {call,teacher}=harness();
 await call({action,requirements},teacher);
 for(let n=0;n<5;n++)await call({action:'postReadingDiscussion',category:'question',content:'Question '+n,requestId:'q'+n});
 const data=await call({action:'readReadingDiscussion'},teacher);
 await call({action:'postReadingDiscussion',parentId:data.posts[0].id,content:'Reply',quotation:'  ',requestId:'r1'});
 await call({action:'postReadingDiscussion',parentId:data.posts[0].id,content:'Reply with evidence',quotation:'A passage',requestId:'r2'});
 const result=await call({action:'readReadingDiscussion'},teacher);
 expect(result.participation[0]).toMatchObject({question:5,replies:2,quotedReplies:1});
});
