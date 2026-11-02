import {describe,it,expect,vi} from 'vitest';
import {scopedDataAction} from './scoped-data.js';

function fixture(userId='student') {
 const rows={class_members:[{classId:'class',userId,role:'student'}],classes:[],deck_assignments:[{deckId:'shared'},{deckId:'shared'},{deckId:'draft'}],flashcard_decks:[]};
 const db={
  listDocuments:vi.fn(async(_,collection)=>({documents:rows[collection]||[]})),
  getDocument:vi.fn(async(_,collection,id)=>({$id:id,status:id==='draft'?'draft':'published',creatorId:'other'})),
  createDocument:vi.fn(async(_,collection,id,data)=>({$id:id,...data})),
 };
 const call=body=>scopedDataAction({body,profile:{role:'student'},userId,db,databaseId:'main'});
 return {db,call};
}
describe('scoped data read amplification',()=>{
 for(const collection of ['classes','class_members','class_sessions','class_session_items','deck_assignments','student_card_state','card_reviews']){
  it(`does not load deck access for ${collection} reads`,async()=>{
   const {db,call}=fixture();await call({collection,operation:'list'});
   expect(db.getDocument).not.toHaveBeenCalled();
   expect(db.listDocuments.mock.calls.filter(c=>c[1]==='flashcard_decks')).toHaveLength(0);
   expect(db.listDocuments.mock.calls.filter(c=>c[1]==='deck_assignments')).toHaveLength(collection==='deck_assignments'?1:0);
  });
 }
 it('checks each assigned deck once and excludes unpublished decks',async()=>{
  const {db,call}=fixture();await call({collection:'flashcard_cards',operation:'list'});
  expect(db.getDocument.mock.calls.map(c=>c[2])).toEqual(['shared','draft']);
  const scope=JSON.parse(db.listDocuments.mock.calls.at(-1)[2][0]);
  expect(scope).toMatchObject({attribute:'deckId',values:['shared','__none__']});
 });
 it('keeps own study data scoped to the authenticated user on each request',async()=>{
  for(const user of ['alice','bob']){const {db,call}=fixture(user);await call({collection:'card_reviews',operation:'list'});
   expect(JSON.parse(db.listDocuments.mock.calls.at(-1)[2][0])).toMatchObject({attribute:'userId',values:[user]});}
 });
 it('still rejects a study write to an inaccessible deck',async()=>{
  const {db,call}=fixture();await expect(call({collection:'student_card_state',operation:'create',id:'state',data:{userId:'student',deckId:'draft'}})).rejects.toMatchObject({code:403});
  expect(db.createDocument).not.toHaveBeenCalled();
 });
 it('does not share authorization results between requests',async()=>{
  const {db,call}=fixture();await call({collection:'flashcard_cards',operation:'list'});
  db.getDocument.mockImplementation(async(_,__,id)=>({$id:id,status:'draft'}));
  await call({collection:'flashcard_cards',operation:'list'});
  expect(JSON.parse(db.listDocuments.mock.calls.at(-1)[2][0]).values).toEqual(['__none__']);
 });
});
