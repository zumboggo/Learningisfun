import {randomUUID} from 'node:crypto';
import {ID} from 'node-appwrite';
import {atomic,readRecord,writeRecord,fail} from './teacher-workspace.js';
import {ownsImage,IMAGE_BUCKET} from './reading-images.js';
export const QFT_ACTIONS=['createQft','readQft','updateQft','addQftQuestion','editQftQuestion','classifyQftQuestion','replyQft','voteQft'];
export const defaults={studentQuestions:false,studentReplies:false,anonymousReplies:true,votesPerStudent:5,allowStackedVotes:true,votingOpen:false,votingStarted:false};
export function settings(input,previous=defaults){
 const next={...previous};
 for(const key of ['studentQuestions','studentReplies','anonymousReplies','allowStackedVotes','votingOpen'])if(typeof input[key]==='boolean')next[key]=input[key];
 if(input.votesPerStudent!==undefined){if(!Number.isInteger(input.votesPerStudent)||input.votesPerStudent<1||input.votesPerStudent>100)fail('Choose between 1 and 100 votes.');next.votesPerStudent=input.votesPerStudent;}
 if(next.votingOpen)next.votingStarted=true;
 return next;
}
const content=(value,max=5000)=>{if(typeof value!=='string'||!value.trim()||value.length>max)fail(`Enter text of up to ${max} characters.`);return value;};
export async function qftAction(args){
 const {body,db,databaseId,userId,profile,memberClassIds}=args;
 if(body.action==='createQft')return atomic(args,async({db})=>{
  const cls=await db.getDocument(databaseId,'classes',body.classId);
  if(profile.role!=='teacher'||cls.teacherId!==userId)fail('Class teacher required.',403);
  const title=content(body.title,255),config=settings(body.settings||{}),now=new Date().toISOString();
  if(body.imageId&&!ownsImage(userId,body.imageId))fail('Upload your own image.');
  const session=await db.createDocument(databaseId,'class_sessions',ID.unique(),{classId:cls.$id,assignmentId:null,discussionType:'qft',textId:null,title,promptMarkdown:title,sessionDate:now.slice(0,10),status:'active',votesPerStudent:config.votesPerStudent,allowStackedVotes:config.allowStackedVotes,notesMarkdown:'{"qftVersion":2}',publishedNotesMarkdown:'',publishedAt:null,createdAt:now,updatedAt:now},[]);
  await writeRecord(db,databaseId,session.$id,'qft',{config,paragraph:typeof body.paragraph==='string'?body.paragraph.slice(0,10000):'',imageId:body.imageId||'',questions:[],replies:[],ballots:{}},0);
  return {sessionId:session.$id};
 });
 const session=await db.getDocument(databaseId,'class_sessions',body.sessionId),cls=await db.getDocument(databaseId,'classes',session.classId);
 const teacher=profile.role==='teacher'&&cls.teacherId===userId,student=profile.role==='student'&&memberClassIds.has(cls.$id);
 if(!teacher&&!student)fail('Class access required.',403);
 if(session.notesMarkdown!=='{"qftVersion":2}')fail('QFT unavailable.',404);
 const read=async db=>{const record=await readRecord(db,databaseId,session.$id,'qft');if(!record.value)fail('QFT unavailable.',404);return record;};
 if(body.action!=='readQft'){
  await atomic({...args,transactionOwner:session.$id},async({db})=>{
   const record=await read(db),state=record.value,c=state.config;
   if(body.action==='updateQft'){
    if(!teacher)fail('Teacher controls only.',403);
    const next=settings(body.settings||{},c);
    if(Object.values(state.ballots).some(ballot=>Object.values(ballot).reduce((a,b)=>a+b,0)>next.votesPerStudent||(!next.allowStackedVotes&&Object.values(ballot).some(n=>n>1))))fail('Existing votes exceed these settings. Increase the allowance or keep multiple votes enabled.');
    state.config=next;
   }else if(body.action==='addQftQuestion'){
    if(!teacher&&!c.studentQuestions)fail('Your teacher is recording questions aloud.',403);
    // Deliberately store no author identity for questions, including teacher capture.
    state.questions.push({id:randomUUID(),content:content(body.content),createdAt:new Date().toISOString()});
   }else if(body.action==='editQftQuestion'){
    if(!teacher)fail('Teacher corrections only.',403);
    const question=state.questions.find(q=>q.id===body.questionId);if(!question)fail('Question unavailable.');question.content=content(body.content);
   }else if(body.action==='classifyQftQuestion'){
    if(!['closed','open',null].includes(body.questionType))fail('Choose closed, open, or clear the question type.');
    const question=state.questions.find(q=>q.id===body.questionId);if(!question)fail('Question unavailable.');
    question.questionType=body.questionType;
   }else if(body.action==='replyQft'){
    if(!teacher&&!c.studentReplies)fail('Your teacher is recording replies.',403);
    if(!state.questions.some(q=>q.id===body.questionId))fail('Question unavailable.');
    state.replies.push({id:randomUUID(),questionId:body.questionId,content:content(body.content),teacher,authorId:teacher?null:userId,name:teacher?'Teacher':profile.name||profile.username||'Student'});
   }else if(body.action==='voteQft'){
    if(!student||!c.votingOpen)fail('Voting is closed.',403);
    if(!state.questions.some(q=>q.id===body.questionId)||![1,-1].includes(body.delta))fail('Invalid vote.');
    const ballot=state.ballots[userId]||{},count=(ballot[body.questionId]||0)+body.delta;
    if(count<0||(!c.allowStackedVotes&&count>1))fail('This vote is not available.');
    if(Object.values(ballot).reduce((a,b)=>a+b,0)+body.delta>c.votesPerStudent)fail('You have used all your votes.');
    ballot[body.questionId]=count;state.ballots[userId]=ballot;
   }else fail('Unknown QFT action.');
   await writeRecord(db,databaseId,session.$id,'qft',state,record.revision);
  });
 }
 const {value:state}=await read(db),c=state.config,own=student?state.ballots[userId]||{}:{},reveal=c.votingStarted&&!c.votingOpen;
 let imageUrl='';
 if(state.imageId&&args.tokens){const token=await args.tokens.createFileToken({bucketId:IMAGE_BUCKET,fileId:state.imageId,expire:new Date(Date.now()+5*60000).toISOString()});const url=new URL(`${args.endpoint.replace(/\/$/,'')}/storage/buckets/${IMAGE_BUCKET}/files/${state.imageId}/view`);url.searchParams.set('project',args.projectId);url.searchParams.set('token',token.secret);imageUrl=url.href;}
 return {title:session.title,classId:cls.$id,teacher,config:c,paragraph:state.paragraph,imageUrl,remaining:c.votesPerStudent-Object.values(own).reduce((a,b)=>a+b,0),questions:state.questions.map(q=>({...q,mineVotes:own[q.id]||0,...(reveal?{votes:Object.values(state.ballots).reduce((sum,b)=>sum+(b[q.id]||0),0)}:{})})),replies:state.replies.map(r=>({id:r.id,questionId:r.questionId,content:r.content,label:r.teacher?'Teacher':c.anonymousReplies?'Anonymous':r.name}))};
}
