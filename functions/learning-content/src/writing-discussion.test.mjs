import {test,expect} from 'vitest';
import {harness} from './reading-discussion-test-harness.mjs';
import {writingArchive,writingSettings} from './writing-discussion.js';
function writing(){
 const h=harness(),date='2026-10-15T01:00:00Z';
 h.storage.class_sessions=[{$id:'writing',classId:'blue',discussionType:'presentation',assignmentId:'prompt',promptMarkdown:'Explain 中文',sessionDate:'2026-10-15',status:'active',notesMarkdown:'{}'}];
 h.storage.discussion_questions=[{$id:'prompt',classSessionId:'writing'}];
 h.storage.discussion_answers=[{$id:'one',questionId:'prompt',authorId:'student',answerText:'First response',createdAt:date},{$id:'two',questionId:'prompt',authorId:'peer',answerText:'Second response',createdAt:date}];
 h.storage.class_members.push({$id:'peer-blue',userId:'peer',classId:'blue',role:'student'});
 const call=(action,fields={},who)=>h.call({action,writingSessionId:'writing',...fields},who);
 return {...h,call,enable:()=>call('setWritingDiscussionSettings',{discussionMode:true},h.teacher)};
}
test('private by default; visibility is independent of replying and strips every identity',async()=>{
 const h=writing();expect((await h.call('readReadingDiscussion')).posts).toEqual([]);
 await h.call('setWritingDiscussionSettings',{studentsCanView:true},h.teacher);
 const shared=await h.call('readReadingDiscussion');expect(shared.posts).toHaveLength(2);expect(shared.canWrite).toBe(false);
 for(const p of shared.posts){expect(p).not.toHaveProperty('authorId');expect(p).not.toHaveProperty('username');}
 expect(shared.participation).toEqual([]);expect(shared).not.toHaveProperty('rounds');
 await expect(h.call('postReadingDiscussion',{parentId:'two',content:'Feedback',requestId:'a'})).rejects.toThrow('read-only');
 await h.enable();expect((await h.call('readReadingDiscussion')).canWrite).toBe(true);
 await h.call('postReadingDiscussion',{parentId:'two',content:'Feedback',requestId:'a'});
 await h.call('setWritingDiscussionSettings',{studentsCanView:false},h.teacher);
 expect((await h.call('readReadingDiscussion')).posts).toEqual([]);
 await expect(h.call('postReadingDiscussion',{parentId:'two',content:'More',requestId:'b'})).rejects.toThrow('private');
 expect((await h.call('readReadingDiscussion',{},h.teacher)).posts).toHaveLength(3);
 await h.call('setWritingDiscussionSettings',{studentsCanView:true,discussionMode:false},h.teacher);
 expect((await h.call('readReadingDiscussion')).posts).toHaveLength(3);
 expect((await h.call('readReadingDiscussion')).canWrite).toBe(false);
});
test('assignments exclude self, complete only on direct replies, retain identity on revision, and retry safely',async()=>{
 const h=writing();await h.enable();
 const preview=await h.call('previewReadingAssignments',{studentIds:['student','peer']},h.teacher);
 expect(preview.assignments).toEqual(expect.arrayContaining([expect.objectContaining({studentId:'student',questionId:'two'}),expect.objectContaining({studentId:'peer',questionId:'one'})]));
 const publish={...preview,studentIds:['student','peer'],requestId:'round'};
 await h.call('publishReadingAssignments',publish,h.teacher);await h.call('publishReadingAssignments',publish,h.teacher);
 expect(h.storage.reading_reply_rounds).toHaveLength(1);
 const reply={parentId:'two',content:'Direct feedback',requestId:'reply'};
 await h.call('postReadingDiscussion',reply);await h.call('postReadingDiscussion',reply);
 expect(h.storage.reading_posts).toHaveLength(1);
 const own=await h.call('readReadingDiscussion');expect(own.assignments).toHaveLength(1);expect(own.assignments[0].status).toBe('completed');
 h.storage.discussion_answers[1].answerText='Revised submission';
 const revised=await h.call('readReadingDiscussion');expect(revised.posts.find(p=>p.id==='two').content).toBe('Revised submission');expect(revised.posts.find(p=>p.parentId==='two')).toBeDefined();
 expect(h.storage.discussion_answers).toHaveLength(2);
 await expect(h.call('publishReadingAssignments',{...publish,requestId:'forged',assignments:publish.assignments.map(a=>({...a,questionId:a.studentId==='student'?'one':'two'}))},h.teacher)).rejects.toThrow();
});
test('finished prompts preserve visibility and cannot be changed via reply APIs',async()=>{
 const h=writing();await h.enable();h.storage.class_sessions[0].status='published';
 const read=await h.call('readReadingDiscussion');expect(read.posts).toHaveLength(2);expect(read.canReply).toBe(false);expect(read.canSubmit).toBe(false);
 await expect(h.call('postReadingDiscussion',{parentId:'two',content:'late',requestId:'late'})).rejects.toThrow('read-only');
 await expect(h.call('previewReadingAssignments',{studentIds:['student']},h.teacher)).rejects.toThrow('read-only');
 await h.call('setWritingDiscussionSettings',{studentsCanView:false},h.teacher);
 expect((await h.call('readReadingDiscussion')).posts).toEqual([]);
 expect(h.storage.class_sessions[0].publishedNotesMarkdown).not.toContain('First response');
 expect(writingSettings({status:'published',notesMarkdown:'{}'}).studentsCanView).toBe(true);
 expect(writingArchive(h.storage.class_sessions[0])).toContain('/presentations/writing/live');
});
test('exports are teacher-only, paginated and optionally named; cross-class access is rejected',async()=>{
 const h=writing();await expect(h.call('exportWritingResponses')).rejects.toThrow('teacher');
 await expect(h.call('setWritingDiscussionSettings',{discussionMode:true})).rejects.toThrow('teacher');
 await expect(h.call('readReadingDiscussion',{}, {role:'student',userId:'outsider',classIds:[]})).rejects.toThrow('access');
 for(let i=0;i<205;i++)h.storage.discussion_answers.push({...h.storage.discussion_answers[0],$id:`extra-${i}`});
 const anonymous=await h.call('exportWritingResponses',{},h.teacher);expect(anonymous.posts).toHaveLength(207);expect(anonymous.posts.every(p=>!('name'in p)&&!('authorId'in p))).toBe(true);
 const named=await h.call('exportWritingResponses',{includeNames:true},h.teacher);expect(named.posts.find(p=>p.id==='one').name).toBe('Student');
});
test('moderation applies to virtual submissions without duplicating or changing the response',async()=>{
 const h=writing();await h.enable();await h.call('moderateReadingDiscussion',{postId:'two',operation:'hide'},h.teacher);
 expect((await h.call('readReadingDiscussion')).posts.map(p=>p.id)).toEqual(['one']);
 expect(h.storage.reading_posts).toHaveLength(0);expect(h.storage.discussion_answers[1].answerText).toBe('Second response');
 await expect(h.call('postReadingDiscussion',{parentId:'two',content:'hidden',requestId:'hidden'})).rejects.toThrow('hidden');
});
