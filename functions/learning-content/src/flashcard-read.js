import {Query} from 'node-appwrite';
import {listAll} from './planning.js';
export async function readFlashcardDeck({body,userId,memberClassIds,db,databaseId}) {
  if(typeof body.deckId!=='string'||!body.deckId)throw new Error('Choose a deck');
  const deck=await db.getDocument(databaseId,'flashcard_decks',body.deckId);
  if(deck.creatorId!==userId){
    const classes=[...memberClassIds];
    const assignments=classes.length?await db.listDocuments(databaseId,'deck_assignments',[Query.equal('deckId',deck.$id),Query.equal('classId',classes),Query.limit(1)]):{documents:[]};
    if(deck.status!=='published'||!assignments.documents.length)throw Object.assign(new Error('Deck unavailable for this account'),{code:403});
  }
  const revision=deck.updatedAt;
  if(typeof revision==='string'&&body.revision===revision)return {deck,revision,unchanged:true};
  const cards=await listAll(db,databaseId,'flashcard_cards',[Query.equal('deckId',deck.$id)]);
  const latest=await db.getDocument(databaseId,'flashcard_decks',deck.$id);
  // Never label a mixed snapshot as the final revision of a concurrent edit.
  return {deck:latest,revision:latest.updatedAt===revision?revision:null,cards,unchanged:false};
}
