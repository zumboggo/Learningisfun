import {Query} from 'node-appwrite';
const collections={card_review:'card_reviews',flashcard_review_event:'flashcard_review_events',flashcard_study_session:'flashcard_study_sessions'};
const fields={card_review:['userId','cardId','deckId','rating','reviewAt','previousState','newState','deviceId','operationId'],flashcard_review_event:['userId','classId','deckId','cardId','sessionId','rating','reviewedAt','elapsedSeconds'],flashcard_study_session:['userId','classId','deckId','startedAt','endedAt','activeSeconds','cardsReviewed','againCount','hardCount','goodCount','easyCount']};
export async function saveFlashcardBatch({body,userId,memberClassIds,db,databaseId}){
 if(!Array.isArray(body.operations)||body.operations.length>40||!body.operations.length)throw new Error('Send 1–40 practice operations');
 const allowed=new Set(),results=[];
 for(const op of body.operations){
  try{
   const data=op.payload,collection=collections[op.entityType];
   if(!collection||typeof op.id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,35}$/.test(op.id)||!data||data.userId!==userId||JSON.stringify(data).length>20000)throw new Error('Invalid practice operation');
   if(!allowed.has(data.deckId)){
    const deck=await db.getDocument(databaseId,'flashcard_decks',data.deckId);
    const classes=[...memberClassIds];
    const assignment=deck.creatorId===userId?true:classes.length&&deck.status==='published'&&(await db.listDocuments(databaseId,'deck_assignments',[Query.equal('deckId',deck.$id),Query.equal('classId',classes),Query.limit(1)])).documents.length;
    if(!assignment)throw new Error('Deck unavailable for this account');allowed.add(data.deckId);
   }
   if(data.classId&&!memberClassIds.has(data.classId))throw new Error('Class unavailable for this account');
   if(op.entityType!=='flashcard_study_session'&&!['again','hard','good','easy'].includes(data.rating))throw new Error('Invalid rating');
   const clean=Object.fromEntries(fields[op.entityType].filter(k=>data[k]!==undefined).map(k=>[k,data[k]]));
   try{await db.createDocument(databaseId,collection,op.id,clean);}
   catch(error){
    if(error.code!==409)throw error;
    // Reviews/events are immutable: a retry must not overwrite another device's history.
    if(op.entityType==='flashcard_study_session'){
     const existing=await db.getDocument(databaseId,collection,op.id);
     if(existing.userId!==userId||existing.deckId!==data.deckId)throw new Error('Session belongs to another account or deck');
     for(const key of ['activeSeconds','cardsReviewed','againCount','hardCount','goodCount','easyCount'])clean[key]=Math.max(Number(existing[key]||0),Number(clean[key]||0));
     clean.startedAt=existing.startedAt;
     clean.endedAt=[existing.endedAt,clean.endedAt].filter(Boolean).sort().at(-1)||null;
     await db.updateDocument(databaseId,collection,op.id,clean);
    }
   }
   results.push({id:op.id,ok:true});
  }catch(error){results.push({id:op.id,ok:false,error:String(error.message).slice(0,200)});}
 }
 return {results};
}
