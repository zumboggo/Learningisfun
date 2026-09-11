import { describe,it,expect } from 'vitest';
// @ts-expect-error Deployed server-side JavaScript module.
import { releaseDue, consolidateDecks } from '../../functions/learning-content/src/planning.js';

type Row=Record<string,any>;
function database() {
  const tables=new Map<string,Map<string,Row>>();
  const table=(name:string)=>{if(!tables.has(name))tables.set(name,new Map());return tables.get(name)!;};
  return {table,
    deleteDocument:async(_:string,name:string,key:string)=>{table(name).delete(key);},
    getDocument:async(_:string,name:string,key:string)=>{const row=table(name).get(key);if(!row)throw Object.assign(new Error('Missing'),{code:404});return row;},
    updateDocument:async(_:string,name:string,key:string,data:Row)=>{const row=table(name).get(key);if(!row)throw Object.assign(new Error('Missing'),{code:404});const next={...row,...data};table(name).set(key,next);return next;},
    createDocument:async(_:string,name:string,key:string,data:Row)=>{if(table(name).has(key))throw Object.assign(new Error('Duplicate'),{code:409});const next={$id:key,...data};table(name).set(key,next);return next;},
    listDocuments:async(_:string,name:string,queries:string[])=>{
      let rows=[...table(name).values()];
      for(const query of queries){const q=JSON.parse(query);if(q.method==='equal')rows=rows.filter(row=>q.values.includes(row[q.attribute]));if(q.method==='lessThanEqual')rows=rows.filter(row=>row[q.attribute]<=q.values[0]);if(q.method==='limit')rows=rows.slice(0,q.values[0]);}
      return {documents:rows,total:rows.length};
    },
  };
}
describe('scheduled releases',()=>{
  it('consolidates course decks without losing IDs, progress, or cross-course access',async()=>{
    const db=database();
    db.table('classes').set('blue',{$id:'blue',teacherId:'teacher',schoolYear:'2026-27'});
    const unit={course:'WL',classIds:['blue'],cards:[{front:'epic',tier:'CORE',id:'core',week:'2026-09-07'},{front:'Homer',tier:'REFERENCE',id:'ref'}]};
    db.table('planning_units').set('unit',{$id:'unit',teacherId:'teacher',dataJson:JSON.stringify(unit)});
    for(const key of ['legacy','shared'])db.table('flashcard_decks').set(key,{$id:key,creatorId:'teacher',title:key,status:'published'});
    for(const [key,deckId,classId] of [['a','legacy','blue'],['b','shared','blue'],['c','shared','ap']])db.table('deck_assignments').set(key,{$id:key,deckId,classId});
    for(const [key,front,deckId] of [['one','epic','legacy'],['two','Homer','legacy'],['three','extra knowledge','legacy'],['four','shared knowledge','shared']])db.table('flashcard_cards').set(key,{$id:key,deckId,front,back:'definition',tags:[]});
    db.table('card_reviews').set('review',{$id:'review',cardId:'one',deckId:'legacy',rating:3,reviewedAt:'2026-09-01'});
    const preview=await consolidateDecks(db,'main','teacher',unit,false);
    expect(preview).toMatchObject({core:2,reference:1,skipped:['shared']});
    expect(db.table('flashcard_cards').get('one')!.deckId).toBe('legacy');
    await consolidateDecks(db,'main','teacher',unit,true);
    expect(db.table('flashcard_cards').size).toBe(4);
    expect(db.table('card_reviews').get('review')).toEqual({$id:'review',cardId:'one',deckId:db.table('flashcard_cards').get('one')!.deckId,rating:3,reviewedAt:'2026-09-01'});
    expect(db.table('flashcard_cards').get('four')!.deckId).toBe('shared');
    expect(db.table('deck_assignments').has('b')).toBe(true);
    expect(db.table('deck_assignments').has('a')).toBe(false);
    expect(db.table('flashcard_decks').get('legacy')!.status).toBe('archived');
    await consolidateDecks(db,'main','teacher',unit,true);
    expect(db.table('flashcard_cards').size).toBe(4);
    expect(db.table('card_reviews').size).toBe(1);
  });
  it('publishes nothing before Friday, releases to both sections, and retries without duplicate cards or reviews',async()=>{
    const db=database();
    for(const key of ['blue','red'])db.table('classes').set(key,{$id:key,teacherId:'teacher',schoolYear:'2026-27'});
    const payload={kind:'core',course:'WL',classIds:['blue','red'],cards:[{id:'core-1',front:'epic',back:'A long narrative poem',tags:['CORE'],week:'2026-09-07'}]};
    db.table('planning_releases').set('job',{$id:'job',teacherId:'teacher',releaseAt:'2026-09-04T00:00:00.000Z',status:'pending',payloadJson:JSON.stringify(payload)});
    await releaseDue(db,'main','2026-09-03T23:59:59.000Z');
    expect(db.table('flashcard_cards').size).toBe(0);
    await releaseDue(db,'main','2026-09-04T00:00:00.000Z');
    expect(db.table('flashcard_cards').size).toBe(1);
    expect(db.table('deck_assignments').size).toBe(2);
    const original=[...db.table('flashcard_cards').values()][0];
    db.table('planning_releases').get('job')!.status='pending';
    await releaseDue(db,'main','2026-09-05T00:00:00.000Z');
    expect(db.table('flashcard_cards').size).toBe(1);
    expect([...db.table('flashcard_cards').values()][0].$id).toBe(original.$id);
    expect([...db.table('flashcard_cards').values()][0].createdAt).toBe(original.createdAt);
    expect([...db.table('flashcard_cards').values()][0].backMarkdown).toBe('A long narrative poem');
    expect(db.table('card_reviews').size).toBe(0);
  });
  it('releases a shared copywork link without creating any completed student entry',async()=>{
    const db=database();db.table('classes').set('blue',{$id:'blue',teacherId:'teacher',name:'Blue',courseName:'WL'});
    db.table('planning_releases').set('copy',{$id:'copy',teacherId:'teacher',releaseAt:'2026-09-04T00:00:00.000Z',status:'pending',payloadJson:JSON.stringify({kind:'copywork',classIds:['blue'],resource:{id:'r',week:'2026-09-07',date:'2026-09-11',title:'Passage',url:'https://example.com',paragraphs:5}})});
    await releaseDue(db,'main','2026-09-04T00:00:00.000Z');
    expect(db.table('planning_materials').size).toBe(1);
    expect(db.table('copywork_entries').size).toBe(0);
  });
  it('marks ownership changes as failed and leaves materials unpublished',async()=>{
    const db=database();db.table('classes').set('blue',{$id:'blue',teacherId:'someone-else'});
    db.table('planning_releases').set('job',{$id:'job',teacherId:'teacher',releaseAt:'2026-09-04T00:00:00.000Z',status:'pending',payloadJson:JSON.stringify({kind:'core',classIds:['blue']})});
    await releaseDue(db,'main','2026-09-04T00:00:00.000Z');
    expect(db.table('planning_releases').get('job')!.status).toBe('failed');
    expect(db.table('planning_materials').size).toBe(0);
  });
});
