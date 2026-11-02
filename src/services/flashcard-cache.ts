import {deckRefreshBoundary,deckRefreshKey} from './deck-refresh-policy';
import {db} from '@/db/schema';
import {executeLearningContent} from './learning-content.service';
import type {FlashcardCard,FlashcardDeck} from '@/types';
const inFlight=new Map<string,Promise<void>>();
export const deckCacheKey=(userId:string,deckId:string)=>`deck-cards:${userId}:${deckId}`;
export async function ensureDeckCards(userId:string,deckId:string,force=false):Promise<void>{
 const key=deckCacheKey(userId,deckId),running=inFlight.get(key);if(running){await running;if(force)return ensureDeckCards(userId,deckId,true);return;}
 const task=(async()=>{
  const initialOwner=(await db.app_metadata.get('currentUserId'))?.value;
  if(initialOwner&&initialOwner!==userId)throw new Error('Account changed. Reopen the deck.');
  const cached=await db.app_metadata.get(key);
  const deck=await db.flashcard_decks.get(deckId);
  const hasCards=await db.flashcard_cards.where('deckId').equals(deckId).count()>0;
  if(!navigator.onLine){
   if(cached||deck?.creatorId===userId)return;
   throw new Error('Open this deck while online to download it for offline practice.');
  }
  const stamp=await db.app_metadata.get(deckRefreshKey(userId,deckId));
  const accessOnly=!force&&Boolean(cached?.value)&&hasCards&&Number(stamp?.value||0)>=deckRefreshBoundary();
  const started=Date.now();
  const result=await executeLearningContent<{deck:FlashcardDeck;revision:string|null;unchanged:boolean;cards?:FlashcardCard[]}>({action:'readFlashcardDeck',deckId,revision:hasCards?cached?.value:undefined,accessOnly});
  const owner=(await db.app_metadata.get('currentUserId'))?.value;
  if(owner!==initialOwner||(owner&&owner!==userId))throw new Error('Account changed. Reopen the deck.');
  if(result.unchanged){if(!accessOnly)await db.app_metadata.put({key:deckRefreshKey(userId,deckId),value:String(started)});return;}
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
   await db.app_metadata.put({key:deckRefreshKey(userId,deckId),value:result.revision?String(started):'0'});
   if(result.revision)await db.app_metadata.put({key,value:result.revision});
   else await db.app_metadata.put({key,value:''});
  });
 })().catch(async error=>{if(error?.code===403){await db.app_metadata.delete(key);await db.app_metadata.delete(deckRefreshKey(userId,deckId));}throw error;}).finally(()=>inFlight.delete(key));inFlight.set(key,task);return task;
}
export async function invalidateDeckCards(userId:string,deckId:string){await db.app_metadata.delete(deckRefreshKey(userId,deckId));const key=deckCacheKey(userId,deckId);if(await db.app_metadata.get(key))await db.app_metadata.put({key,value:''});}

// Local-only eligibility check on the normal visible-page sync. No server cron.
export async function refreshDueDeckCards(userId:string):Promise<void>{
 if(!navigator.onLine)return;
 const keys=await db.app_metadata.where('key').startsWith(`deck-cards:${userId}:`).toArray();
 for(const row of keys){
  if((await db.app_metadata.get('currentUserId'))?.value!==userId)return;
  const deckId=row.key.slice(`deck-cards:${userId}:`.length);
  const checked=Number((await db.app_metadata.get(deckRefreshKey(userId,deckId)))?.value||0);
  const retryKey=`deck-content-attempt:${userId}:${deckId}`;
  const attempted=Number((await db.app_metadata.get(retryKey))?.value||0);
  if(checked>=deckRefreshBoundary()||Date.now()-attempted<60_000)continue;
  await db.app_metadata.put({key:retryKey,value:String(Date.now())});
  try{await ensureDeckCards(userId,deckId);}catch{/* Retry next visible sync; never mark a failed refresh complete. */}
 }
}
