import {Query} from 'node-appwrite';
import {allRows,fail} from './teacher-workspace.js';
const ownUserCollections=new Set(['card_reviews','flashcard_review_events','flashcard_study_sessions','student_card_state','student_deck_notes']);
const allowed=new Set(['classes','class_members','class_sessions','class_session_items','flashcard_decks','flashcard_cards','deck_assignments',...ownUserCollections]);
export async function scopedDataAction({body,profile,userId,db,databaseId}){
 const {collection,operation,id}=body;if(!allowed.has(collection))fail('Use the dedicated classroom controls for this data.',403);
 const teacher=['teacher','admin'].includes(profile.role),members=await allRows(db,databaseId,'class_members',[Query.equal('userId',userId)]),owned=teacher?await allRows(db,databaseId,'classes',[Query.equal('teacherId',userId)]):[],ownedIds=new Set(owned.map(c=>c.$id)),classIds=new Set([...ownedIds,...members.filter(m=>m.role!=='substitute'||m.expiresAt&&Date.parse(m.expiresAt)>Date.now()).map(m=>m.classId)]);
 const ownClass=async classId=>{if(!teacher||!ownedIds.has(classId))fail('Class ownership required',403)};
 const assigned=classIds.size?await allRows(db,databaseId,'deck_assignments',[Query.equal('classId',[...classIds])]):[];
 const decks=await allRows(db,databaseId,'flashcard_decks',[Query.equal('creatorId',userId)]),deckIds=new Set(decks.map(d=>d.$id));
 for(const assignment of assigned){const deck=await db.getDocument(databaseId,'flashcard_decks',assignment.deckId);if(deck.status==='published')deckIds.add(deck.$id);}
 const ownDeck=async deckId=>{const deck=await db.getDocument(databaseId,'flashcard_decks',deckId);if(deck.creatorId!==userId)fail('Deck ownership required',403);return deck};
 const readScope=async()=>{
  if(collection==='classes')return Query.equal('$id',[...classIds,'__none__']);
  if(collection==='class_members')return Query.or([Query.equal('userId',userId),Query.equal('classId',[...ownedIds,'__none__'])]);
  if(collection==='class_sessions')return Query.or([Query.equal('classId',[...ownedIds,'__none__']),Query.and([Query.equal('classId',[...classIds,'__none__']),Query.notEqual('status','draft')])]);
  if(collection==='deck_assignments')return Query.equal('classId',[...classIds,'__none__']);
  if(collection==='class_session_items'){const sessions=classIds.size?await allRows(db,databaseId,'class_sessions',[Query.equal('classId',[...classIds])]):[];return Query.equal('classSessionId',[...sessions.filter(s=>ownedIds.has(s.classId)||s.status==='published').map(s=>s.$id),'__none__']);}
  if(collection==='flashcard_decks')return Query.equal('$id',[...deckIds,'__none__']);
  if(collection==='flashcard_cards')return Query.equal('deckId',[...deckIds,'__none__']);
  return Query.equal('userId',userId);
 };
 const sanitize=row=>collection==='class_sessions'&&!ownedIds.has(row.classId)?{...row,notesMarkdown:''}:collection==='classes'&&!ownedIds.has(row.$id)?{...row,joinCode:'',parentCode:'',parentCodeActive:false,substituteCode:'',substituteCodeActive:false}:row;
 if(['list','get'].includes(operation)){
  const queries=(body.queries||[]).map(q=>{let parsed;try{parsed=JSON.parse(q)}catch{fail('Invalid query')};if(!['equal','notEqual','lessThan','lessThanEqual','greaterThan','greaterThanEqual','orderAsc','orderDesc','limit','offset','cursorAfter','cursorBefore','contains','isNull','isNotNull','or','and','startsWith'].includes(parsed.method))fail('Unsupported query');return q;});
  // A code lookup reveals only the class invitation landing data, never another code or roster.
  const code=collection==='classes'&&operation==='list'?queries.map(q=>JSON.parse(q)).find(q=>q.method==='equal'&&['joinCode','parentCode','substituteCode'].includes(q.attribute)&&q.values?.length===1):null;
  if(code){if(typeof code.values[0]!=='string'||code.values[0].length<4||code.values[0].length>32)fail('Invalid class code');const rows=await db.listDocuments(databaseId,'classes',[Query.equal(code.attribute,code.values[0]),Query.equal(code.attribute+'Active',true),Query.equal('status','active'),Query.limit(1)]);return {...rows,documents:rows.documents.filter(c=>code.attribute!=='substituteCode'||c.substituteExpiresAt&&Date.parse(c.substituteExpiresAt)>Date.now()).map(row=>({...sanitize(row),[code.attribute]:code.values[0],[code.attribute+'Active']:true}))};}
  const scope=await readScope();if(operation==='get'){const rows=await db.listDocuments(databaseId,collection,[scope,Query.equal('$id',id),Query.limit(1)]);if(!rows.documents.length)fail('Record unavailable',404);return sanitize(rows.documents[0]);}
  const result=await db.listDocuments(databaseId,collection,[...queries,scope]);return {...result,documents:result.documents.map(sanitize)};
 }
 if(!['create','update','delete'].includes(operation)||typeof id!=='string')fail('Invalid data operation');
 let prior;if(operation!=='create')prior=await db.getDocument(databaseId,collection,id);
 const data=Object.fromEntries(Object.entries(body.data||{}).filter(([k])=>!k.startsWith('$'))),next={...prior,...data};
 if(collection==='classes'){if(!teacher)fail('Teacher account required',403);if(prior)await ownClass(prior.$id);if(next.teacherId!==userId)fail('Cannot change class owner',403);if(operation==='delete')fail('Archive classes instead of deleting them');}
 else if(collection==='class_members'){await ownClass(next.classId);if(operation!=='create'||next.userId!==userId||next.role!=='teacher')fail('Use the roster controls',403);}
 else if(collection==='flashcard_decks'){if(prior&&prior.creatorId!==userId||next.creatorId!==userId)fail('Deck ownership required',403);if(!teacher&&next.type!=='personal')fail('Students can create only personal decks',403);}
 else if(collection==='flashcard_cards'){if(prior)await ownDeck(prior.deckId);await ownDeck(next.deckId);}
 else if(collection==='deck_assignments'){if(prior)await ownClass(prior.classId);await ownClass(next.classId);await ownDeck(next.deckId);}
 else if(ownUserCollections.has(collection)){if(prior?.userId&&prior.userId!==userId||next.userId!==userId)fail('Only your own study data is available',403);if(next.deckId&&!deckIds.has(next.deckId))fail('Deck unavailable',403);}
 else if(collection==='class_session_items'){const session=await db.getDocument(databaseId,'class_sessions',next.classSessionId);await ownClass(session.classId);if(prior&&prior.classSessionId!==next.classSessionId)fail('Cannot move session items');}
 else fail('Use the dedicated lesson controls',403);
 if(operation==='create')return db.createDocument(databaseId,collection,id,data,[]);
 if(operation==='update')return db.updateDocument(databaseId,collection,id,data);
 await db.deleteDocument(databaseId,collection,id);return {};
}
