import {it,expect,vi} from 'vitest';
import {readFlashcardCatalog} from './flashcard-catalog.js';
function fixture(){
 const rows={classes:[{$id:'a',teacherId:'ta'},{$id:'b',teacherId:'tb'}],deck_assignments:[{$id:'aa',classId:'a',deckId:'da'},{$id:'ab',classId:'b',deckId:'db'},{$id:'draft-a',classId:'a',deckId:'draft'}],planning_materials:[],flashcard_decks:[{$id:'da',creatorId:'ta',status:'published'},{$id:'db',creatorId:'tb',status:'published'},{$id:'draft',creatorId:'ta',status:'draft'},{$id:'personal',creatorId:'sa',status:'personal'}],student_deck_notes:[{$id:'pa',userId:'sa'},{$id:'pb',userId:'sb'}]};
 const match=(row,q)=>{if(q.method==='equal')return q.values.includes(row[q.attribute]);if(q.method==='lessThanEqual')return row[q.attribute]<=q.values[0];if(q.method==='or')return q.values.some(v=>match(row,typeof v==='string'?JSON.parse(v):v));if(q.method==='and')return q.values.every(v=>match(row,typeof v==='string'?JSON.parse(v):v));return true;};
 let returned=0;
 const db={getDocument:vi.fn(),listDocuments:vi.fn(async(_,c,queries)=>{let found=rows[c].filter(row=>queries.every(q=>match(row,JSON.parse(q))));const cursor=queries.map(JSON.parse).find(q=>q.method==='cursorAfter');if(cursor)found=found.slice(found.findIndex(r=>r.$id===cursor.values[0])+1);const docs=found.slice(0,100);returned+=docs.length;return {documents:docs};})};
 const call=(userId='sa',classIds=['a'],profile={role:'student'},memberClassIds=new Set(['a']),includeOwned=true)=>readFlashcardCatalog({body:{classIds},userId,profile,memberClassIds,includeOwned,db,databaseId:'main'});
 return {call,db,rows,count:()=>returned};
}
it('restricts students, teacher ownership, drafts and preferences',async()=>{
 const {call}=fixture();
 const a=await call();expect(a.decks.map(d=>d.$id)).toEqual(['da','personal']);expect(a.preferences.map(p=>p.$id)).toEqual(['pa']);expect(a.assignments.map(d=>d.$id)).toEqual(['aa']);
 await expect(call('sa',['b'])).rejects.toMatchObject({code:403});
 await expect(call('ta',['b'],{role:'teacher'},new Set())).rejects.toMatchObject({code:403});
 expect((await call('ta',['a'],{role:'teacher'},new Set())).decks.map(d=>d.$id)).toEqual(['da','draft']);
});
it('workshop mode excludes personal decks and revocation denies access',async()=>{
 const {call}=fixture();expect((await call('sa',['a'],{role:'student'},new Set(['a']),false)).decks.map(d=>d.$id)).toEqual(['da']);
 await expect(call('sa',['a'],{role:'student'},new Set())).rejects.toMatchObject({code:403});
});
it('25 simultaneous requests keep class and personal data isolated',async()=>{
 const {call}=fixture();const results=await Promise.all(Array.from({length:25},(_,i)=>i%2?call('sb',['b'],{role:'student'},new Set(['b'])):call()));
 results.forEach((r,i)=>{expect(r.decks.some(d=>d.$id===(i%2?'da':'db'))).toBe(false);expect(r.preferences.map(p=>p.$id)).toEqual([i%2?'pb':'pa']);});
});
it('reads 20 assigned decks in four list queries without per-deck gets',async()=>{
 const {call,db,rows,count}=fixture();rows.flashcard_decks=Array.from({length:20},(_,i)=>({$id:`d${i}`,creatorId:'ta',status:'published'}));rows.deck_assignments=rows.flashcard_decks.map(d=>({$id:d.$id,classId:'a',deckId:d.$id}));rows.student_deck_notes=[];
 expect((await call()).decks).toHaveLength(20);expect(db.getDocument).not.toHaveBeenCalled();expect(db.listDocuments).toHaveBeenCalledTimes(4);expect(count()).toBe(40);
});
