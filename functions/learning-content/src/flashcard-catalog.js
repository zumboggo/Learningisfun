import {Query} from 'node-appwrite';
import {listAll} from './planning.js';

// One authenticated catalog read, with no card bodies or per-deck permission scans.
export async function readFlashcardCatalog({body,profile,userId,memberClassIds,db,databaseId,includeOwned=true}) {
 const ownedClasses=['teacher','admin'].includes(profile.role)
  ? await listAll(db,databaseId,'classes',[Query.equal('teacherId',userId)]) : [];
 const allowed=new Set([...memberClassIds,...ownedClasses.map(c=>c.$id)]);
 const requested=Array.isArray(body.classIds)?body.classIds:[];
 if(requested.some(id=>typeof id!=='string'||!allowed.has(id)))throw Object.assign(Error('Class access required'),{code:403});
 const classIds=[...new Set(requested)];
 const assignments=classIds.length?await listAll(db,databaseId,'deck_assignments',[Query.equal('classId',classIds)]):[];
 const released=classIds.length?await listAll(db,databaseId,'planning_materials',[Query.equal('classId',classIds),Query.lessThanEqual('releaseAt',new Date().toISOString())]):[];
 const deckIds=[...new Set([...assignments.map(a=>a.deckId),...released.filter(r=>r.kind==='deck').map(r=>JSON.parse(r.dataJson).deckId)].filter(Boolean))];
 const filters=[];
 if(includeOwned)filters.push(Query.equal('creatorId',userId));
 // Chunk ID filters so large catalogs do not exceed query value limits.
 for(let i=0;i<deckIds.length;i+=100)filters.push(Query.and([Query.equal('$id',deckIds.slice(i,i+100)),Query.equal('status','published')]));
 const decks=filters.length?await listAll(db,databaseId,'flashcard_decks',[filters.length===1?filters[0]:Query.or(filters)]):[];
 const visible=new Set(decks.map(d=>d.$id));
 const preferences=await listAll(db,databaseId,'student_deck_notes',[Query.equal('userId',userId)]);
 return {decks,assignments:assignments.filter(a=>visible.has(a.deckId)),preferences};
}
