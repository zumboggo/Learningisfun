import StudioSection from '@/components/common/StudioSection';
import {useLiveQuery} from 'dexie-react-hooks';
import {Link} from 'react-router-dom';
import {db} from '@/db/schema';
import type {FlashcardDeck} from '@/types';
import {classLabel} from '@/utils/helpers';
import {CATEGORY_LABELS,FLASHCARD_CATEGORIES,categoryStudyLink,deckVocabularyCategory} from '@/services/student-vocabulary';

/** Three study decks per class; the source cards keep their IDs and review history. */
export function StudentVocabularyChooser({userId,decks,limit,classId,teacher=false}:{userId:string;decks:FlashcardDeck[];limit:number;classId?:string;teacher?:boolean}){
 const groups=useLiveQuery(async()=>{
  const memberships=classId||teacher?[]:await db.class_members.where('userId').equals(userId).toArray();
  const ids=classId?[classId]:[...new Set(memberships.map(m=>m.classId))];
  const classes=teacher&&!classId?await db.classes.where('teacherId').equals(userId).toArray():(await db.classes.bulkGet(ids)).filter(c=>Boolean(c));
  const classIds=classes.map(c=>c!.$id);
  const assignments=classIds.length?await db.deck_assignments.where('classId').anyOf(classIds).toArray():[];
  return classes.map(cls=>{
   const assigned=new Set(assignments.filter(a=>a.classId===cls!.$id).map(a=>a.deckId));
   return {id:cls!.$id,label:classLabel(cls!),deckIds:decks.filter(d=>assigned.has(d.$id)&&d.type!=='personal'&&d.status==='published').map(d=>d.$id)};
  }).sort((a,b)=>a.label.localeCompare(b.label));
 },[userId,decks,classId,teacher]);
 const categoryIds=(ids:string[],kind:typeof FLASHCARD_CATEGORIES[number])=>ids.filter(id=>decks.some(d=>d.$id===id&&deckVocabularyCategory(d)===kind));
 const allDeckIds=categoryIds([...new Set(groups?.flatMap(c=>c.deckIds)||[])],'core');
 return <section className="mb-6 space-y-3" aria-label="Class flashcards">
  <h2 className="text-xl font-semibold">Class flashcards</h2>
  <p className="text-sm text-slate-500">Study starts with Core Vocabulary. Choose Reference Vocabulary or Other whenever you want to practise those cards.</p>
  {!groups&&<p role="status">Loading class decks…</p>}
  {groups?.map((c,index)=><StudioSection key={c.id} title={c.label} defaultOpen tone={(['sage','peach','lavender','blue'] as const)[index%4]}>
   <div className="grid gap-3 sm:grid-cols-3">{FLASHCARD_CATEGORIES.map(kind=><Link key={kind} to={categoryStudyLink(categoryIds(c.deckIds,kind),kind,limit)} className="rounded-xl border border-slate-200 bg-white p-4 hover:bg-green-50 focus-visible:outline-2" aria-label={`Study ${CATEGORY_LABELS[kind]} · ${c.label}`}>
    <h3 className="font-semibold">{CATEGORY_LABELS[kind]}</h3><p className="mt-1 text-sm text-slate-500">{kind==='core'?'Your default study deck':kind==='reference'?'Names, dates, and details':'All other assigned flashcards'}</p><span className="mt-3 block text-sm font-semibold text-green-800">Study →</span>
   </Link>)}</div>
   <Link className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-green-800" to={categoryStudyLink(categoryIds(c.deckIds,'core'),'core',limit,true)}>This week’s core vocabulary · unlimited practice →</Link>
  </StudioSection>)}
  {groups?.length===0&&<p className="text-sm text-slate-500">Join a class to see its three flashcard decks. Your personal decks are available below.</p>}
  {allDeckIds.length>0&&<Link data-button-variant="primary" className="flex min-h-11 items-center justify-center rounded-lg bg-green-800 px-4 py-3 font-semibold text-white" to={categoryStudyLink(allDeckIds,'core',limit)}>Study Core Vocabulary</Link>}
 </section>;
}
