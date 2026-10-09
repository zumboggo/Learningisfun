import {expect,it,vi} from 'vitest';
// @ts-expect-error Independently deployed server module.
import {readFlashcardDeck} from '../../functions/learning-content/src/flashcard-read.js';
// @ts-expect-error Independently deployed server module.
import {planningAction} from '../../functions/learning-content/src/planning.js';
function setup(){
 const deck={$id:'d',creatorId:'teacher',status:'published',updatedAt:'r2'};
 const db={getDocument:vi.fn(async()=>deck),listDocuments:vi.fn(async(_:string,c:string)=>({documents:c==='deck_assignments'?[{$id:'a'}]:[{$id:'card',deckId:'d'}]}))};
 return {deck,db,args:{body:{deckId:'d',revision:'r2'},userId:'student',memberClassIds:new Set(['class']),db,databaseId:'db'}};
}
it('checks authorization but reads zero card rows when the revision is unchanged',async()=>{
 const {args,db}=setup();expect((await readFlashcardDeck(args)).unchanged).toBe(true);
 expect(db.listDocuments.mock.calls.map(c=>c[1])).toEqual(['deck_assignments']);
});
it('downloads changed decks and denies another class before returning content',async()=>{
 const {args,db}=setup();args.body.revision='r1';expect((await readFlashcardDeck(args)).cards).toHaveLength(1);
 db.listDocuments.mockResolvedValue({documents:[]});await expect(readFlashcardDeck(args)).rejects.toThrow('unavailable');
});
it('does not cache a mixed concurrent edit as the new revision',async()=>{
 const {args,db,deck}=setup();args.body.revision='old';db.getDocument.mockResolvedValueOnce(deck).mockResolvedValueOnce({...deck,updatedAt:'r3'});
 expect((await readFlashcardDeck(args)).revision).toBeNull();
});
it('copywork-only queries never read decks, assignments, or cards',async()=>{
 const db={listDocuments:vi.fn(async(_db:string,_collection:string,_queries:string[])=>({documents:[]}))};
 await planningAction({body:{action:'readPlanningMaterials',kind:'copywork',includeCards:false},profile:{role:'student'},userId:'s',memberClassIds:new Set(['c']),db,databaseId:'db'});
 expect(db.listDocuments).toHaveBeenCalledTimes(1);
 expect(db.listDocuments.mock.calls[0][1]).toBe('planning_materials');
});
