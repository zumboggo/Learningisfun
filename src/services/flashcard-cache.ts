import {db} from '@/db/schema';
import {executeLearningContent} from './learning-content.service';
import type {FlashcardCard,FlashcardDeck} from '@/types';
const inFlight=new Map<string,Promise<void>>();
export const deckCacheKey=(userId:string,deckId:string)=>`deck-cards:${userId}:${deckId}`;
export async function ensureDeckCards(userId:string,deckId:string):Promise<void>{
 const key=deckCacheKey(userId,deckId),running=inFlight.get(key);if(running)return running;
 const task=(async()=>{
  const cached=await db.app_metadata.get(key);
  const deck=await db.flashcard_decks.get(deckId);
  if(!navigator.onLine){
   if(cached||deck?.creatorId===userId)return;
   throw new Error('Open this deck while online to download it for offline practice.');
  }
  const result=await executeLearningContent<{deck:FlashcardDeck;revision:string|null;unchanged:boolean;cards?:FlashcardCard[]}>({action:'readFlashcardDeck',deckId,revision:cached?.value});
  if(result.unchanged)return;
  if(!Array.isArray(result.cards))throw new Error('The deck download was incomplete. Please retry.');
  const queued=await db.sync_queue.where('entityType').equals('card').filter(op=>op.syncStatus!=='synced').toArray();
  const protectedIds=new Set(queued.map(op=>op.entityId));
  const cards=result.cards.map(card=>({...card,frontMarkdown:card.frontMarkdown||card.front,backMarkdown:card.backMarkdown||card.back,hint:card.hint||'',tags:card.tags||[]}));
  await db.transaction('rw',db.flashcard_cards,db.flashcard_decks,db.app_metadata,async()=>{
   const old=await db.flashcard_cards.where('deckId').equals(deckId).toArray();
   const remoteIds=new Set(cards.map(card=>card.$id));
   await db.flashcard_cards.bulkDelete(old.filter(card=>!remoteIds.has(card.$id)&&!protectedIds.has(card.$id)).map(card=>card.$id));
   await db.flashcard_cards.bulkPut(cards.filter(card=>!protectedIds.has(card.$id)));
   await db.flashcard_decks.put(result.deck);
   if(result.revision)await db.app_metadata.put({key,value:result.revision});
   else await db.app_metadata.put({key,value:''});
  });
 })().finally(()=>inFlight.delete(key));inFlight.set(key,task);return task;
}
export async function invalidateDeckCards(userId:string,deckId:string){const key=deckCacheKey(userId,deckId);if(await db.app_metadata.get(key))await db.app_metadata.put({key,value:''});}
