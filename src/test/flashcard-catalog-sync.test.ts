import 'fake-indexeddb/auto';
import {beforeEach,it,expect,vi} from 'vitest';
import {db} from '@/db/schema';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
import {executeLearningContent} from '@/services/learning-content.service';
import {syncDecksFromServer} from '@/services/flashcard.service';
const request=vi.mocked(executeLearningContent);
const deck={$id:'d',creatorId:'t',title:'Deck',description:'',type:'teacher',status:'published',createdAt:'',updatedAt:''};
beforeEach(async()=>{await Promise.all([db.app_metadata.clear(),db.flashcard_decks.clear(),db.deck_assignments.clear(),db.student_deck_notes.clear(),db.sync_queue.clear()]);await db.app_metadata.put({key:'currentUserId',value:'a'});request.mockReset();});
it('uses one catalog execution and reconciles removed assignments',async()=>{
 await db.deck_assignments.put({$id:'old',deckId:'old',classId:'c',isRequired:false,dailyTarget:null,assignedAt:''});
 request.mockResolvedValue({decks:[deck],assignments:[],preferences:[]});
 expect(await syncDecksFromServer(['c'],'a')).toBe(true);
 expect(request).toHaveBeenCalledTimes(1);expect(request).toHaveBeenCalledWith({action:'readFlashcardCatalog',classIds:['c']});
 expect(await db.deck_assignments.get('old')).toBeUndefined();expect(await db.flashcard_decks.get('d')).toBeDefined();
});
it.each(['logout','switch'])('does not persist a response after %s',async(change)=>{
 request.mockImplementation(async()=>{if(change==='logout')await db.app_metadata.delete('currentUserId');else await db.app_metadata.put({key:'currentUserId',value:'b'});return {decks:[deck],assignments:[],preferences:[]};});
 expect(await syncDecksFromServer(['c'],'a')).toBe(false);expect(await db.flashcard_decks.count()).toBe(0);
});
