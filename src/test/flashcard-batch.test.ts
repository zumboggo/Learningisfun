import {expect,it,vi} from 'vitest';
// @ts-expect-error Independently deployed server module.
import {saveFlashcardBatch} from '../../functions/learning-content/src/flashcard-batch.js';
const operation=(id:string,userId='student')=>({id,entityType:'card_review',payload:{userId,deckId:'deck',cardId:'card',rating:'good',reviewAt:'2026-10-09T01:00:00Z',previousState:'{}',newState:'{}',deviceId:'device',operationId:id}});
function setup(){const stored=new Map<string,any>();return {stored,db:{getDocument:vi.fn(async(_:string,collection:string,id:string)=>collection==='flashcard_decks'?{$id:id,creatorId:'student',status:'published'}:stored.get(id)),listDocuments:vi.fn(async()=>({documents:[]})),createDocument:vi.fn(async(_:string,_c:string,id:string,data:unknown)=>{if(stored.has(id))throw {code:409};stored.set(id,data);}),updateDocument:vi.fn(async(_:string,_c:string,id:string,data:unknown)=>stored.set(id,data))}};}
it('one batch preserves independent device histories and makes retries idempotent',async()=>{
 const {db,stored}=setup(),args={body:{operations:[operation('device-a'),operation('device-b')]},userId:'student',memberClassIds:new Set(),db,databaseId:'db'};
 expect((await saveFlashcardBatch(args)).results.every((r:any)=>r.ok)).toBe(true);await saveFlashcardBatch(args);
 expect(stored.size).toBe(2);expect(db.updateDocument).not.toHaveBeenCalled();expect(db.getDocument).toHaveBeenCalledTimes(2); // one deck authorization per batch
});
it('rejects foreign-account and foreign-class operations without saving them',async()=>{
 const {db,stored}=setup(),other=operation('a','other'),foreign=operation('b');Object.assign(foreign.payload,{classId:'other-class'});
 const result=await saveFlashcardBatch({body:{operations:[other,foreign]},userId:'student',memberClassIds:new Set(['own']),db,databaseId:'db'});
 expect(result.results.every((r:any)=>!r.ok)).toBe(true);expect(stored.size).toBe(0);
});
it('an out-of-order session retry cannot reduce already saved totals',async()=>{
 const {db,stored}=setup();stored.set('session',{userId:'student',deckId:'deck',startedAt:'a',endedAt:'z',cardsReviewed:10,activeSeconds:100});
 await saveFlashcardBatch({body:{operations:[{id:'session',entityType:'flashcard_study_session',payload:{userId:'student',deckId:'deck',startedAt:'b',endedAt:null,cardsReviewed:2,activeSeconds:20}}]},userId:'student',memberClassIds:new Set(),db,databaseId:'db'});
 expect(stored.get('session')).toMatchObject({cardsReviewed:10,activeSeconds:100,startedAt:'a',endedAt:'z'});
});
