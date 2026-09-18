import {expect,it,vi} from 'vitest';
import {buildFlashcardQueue} from '@/services/flashcard.service';
const data=vi.hoisted(()=>({cards:[{ $id:'other',deckId:'d',sortOrder:0 },{$id:'wanted',deckId:'d',sortOrder:1}],states:[] as object[],preferences:[] as object[]}));
vi.mock('@/db/schema',()=>({db:{
 flashcard_cards:{where:()=>({equals:()=>({sortBy:async()=>data.cards})})},
 student_card_state:{where:()=>({equals:()=>({and:()=>({toArray:async()=>data.states})})})},
 student_deck_notes:{where:()=>({equals:()=>({toArray:async()=>data.preferences})})},
 app_metadata:{get:async()=>({value:JSON.stringify({newLimit:1})})}
}}));
it('applies collection selection before per-deck new-card limits',async()=>{
 expect((await buildFlashcardQueue('u','d','mixed',30,new Set(['wanted']))).map(c=>c.$id)).toEqual(['wanted']);
});
it('unlimited pool includes scheduled cards while normal study respects their due date',async()=>{
 data.states=[{cardId:'wanted',dueDate:'2099-01-01',status:'review'}];
 expect(await buildFlashcardQueue('u','d','mixed',30,new Set(['wanted']))).toEqual([]);
 expect((await buildFlashcardQueue('u','d','all',Number.MAX_SAFE_INTEGER,new Set(['wanted']))).map(c=>c.$id)).toEqual(['wanted']);
 data.preferences=[{cardId:'wanted',suspended:true}];
 expect(await buildFlashcardQueue('u','d','all',30,new Set(['wanted']))).toEqual([]);
});
