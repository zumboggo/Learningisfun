const deny=()=>{throw Object.assign(Error('Content ownership or class enrollment required'),{code:403})};
export async function authorizeContentMutation({collection,id,data,userId,profile,memberClassIds,db,databaseId}){
 const teacher=['teacher','admin'].includes(profile.role);let prior;try{prior=await db.getDocument(databaseId,collection,id)}catch(e){if(e.code!==404)throw e}
 const next={...prior,...data};
 const own=async(c,key,field)=>{if(!key)deny();const row=await db.getDocument(databaseId,c,key);if(!teacher||row[field]!==userId)deny();return row};
 if(collection==='quizzes'||collection==='writing_prompts'){
  const field=collection==='quizzes'?'createdBy':'teacherId';if(prior&&prior[field]!==userId)deny();if(!teacher)deny();data[field]=userId;
 }
 for(const [child,parent,key,field]of [['quiz_questions','quizzes','quizId','createdBy'],['quiz_assignments','quizzes','quizId','createdBy'],['writing_prompt_assignments','writing_prompts','promptId','teacherId'],['deck_assignments','flashcard_decks','deckId','creatorId']])if(collection===child){if(prior)await own(parent,prior[key],field);await own(parent,next[key],field);}
 if(['quiz_assignments','writing_prompt_assignments','deck_assignments','text_assignments'].includes(collection)){if(prior)await own('classes',prior.classId,'teacherId');await own('classes',next.classId,'teacherId');}
 if(['writing_submissions','peer_reviews'].includes(collection)){
  const owner=collection==='writing_submissions'?'authorId':'reviewerId';if(prior&&prior[owner]!==userId)deny();data[owner]=userId;
  const submission=collection==='peer_reviews'?await db.getDocument(databaseId,'writing_submissions',next.submissionId):next;
  if(!submission.classId||!memberClassIds.has(submission.classId))deny();
  if(collection==='writing_submissions'){const prompt=await db.getDocument(databaseId,'writing_prompts',next.promptId);if(prompt.status!=='published')deny();}
 }
 if(['discussion_questions','discussion_answers','question_votes','text_discussion_posts','text_discussion_votes'].includes(collection)){
  let sessionId=next.classSessionId;
  if(['discussion_answers','question_votes'].includes(collection)){const q=await db.getDocument(databaseId,'discussion_questions',next.questionId);if(sessionId&&sessionId!==q.classSessionId)deny();sessionId=q.classSessionId;}
  if(collection==='text_discussion_votes'){const p=await db.getDocument(databaseId,'text_discussion_posts',next.postId);if(sessionId&&sessionId!==p.classSessionId)deny();sessionId=p.classSessionId;}
  if(!sessionId)deny();const session=await db.getDocument(databaseId,'class_sessions',sessionId),cls=await db.getDocument(databaseId,'classes',session.classId);
  if(next.classId&&next.classId!==session.classId)deny();if(!(teacher&&cls.teacherId===userId)&&!memberClassIds.has(cls.$id))deny();
  if(!prior&&collection!=='question_votes'&&collection!=='text_discussion_votes')data.authorId=userId;
 }
}
