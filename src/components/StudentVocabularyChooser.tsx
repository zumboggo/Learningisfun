import {useEffect,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {useNavigate} from 'react-router-dom';
import {db} from '@/db/schema';
import type {FlashcardCard,FlashcardDeck} from '@/types';
import {classLabel} from '@/utils/helpers';
import {chinaStudyWeek,vocabularyBuckets,type VocabularySelection} from '@/services/student-vocabulary';
import {Button} from '@/components/common/Button';

export function StudentVocabularyChooser({userId,decks,limit}:{userId:string;decks:FlashcardDeck[];limit:number}){
 const navigate=useNavigate(),[selected,setSelected]=useState<string[]|null>(null),[error,setError]=useState('');
 const groups=useLiveQuery(async()=>{
  const memberships=await db.class_members.where('userId').equals(userId).toArray();
  const ids=[...new Set(memberships.map(m=>m.classId))];
  const classes=(await db.classes.bulkGet(ids)).filter(c=>Boolean(c));
  const assignments=ids.length?await db.deck_assignments.where('classId').anyOf(ids).toArray():[];
  const cards=decks.length?await db.flashcard_cards.where('deckId').anyOf(decks.map(d=>d.$id)).toArray():[];
  return {classes:classes.map(cls=>{
   const deckIds=new Set(assignments.filter(a=>a.classId===cls!.$id).map(a=>a.deckId));
   const owned=decks.filter(d=>deckIds.has(d.$id)&&d.type!=='personal');
   const buckets=vocabularyBuckets(cards.filter(c=>deckIds.has(c.deckId)),owned);
   return {id:cls!.$id,label:classLabel(cls!),...buckets};
  }).sort((a,b)=>a.label.localeCompare(b.label)),personal:decks.filter(d=>d.type==='personal').map(d=>({id:d.$id,label:d.title,cards:cards.filter(c=>c.deckId===d.$id)}))};
 },[userId,decks]);
 useEffect(()=>{let active=true;void db.app_metadata.get('vocabulary-groups:'+userId).then(row=>{
  if(!active)return;try{const value=JSON.parse(row?.value||'null');setSelected(Array.isArray(value)?value:null);}catch{setSelected(null);}
 });return()=>{active=false;};},[userId]);
 const defaults=groups?.classes.map(c=>c.id+':core')||[];
 const chosen=selected??defaults;
 const toggle=(id:string)=>{const next=chosen.includes(id)?chosen.filter(x=>x!==id):[...chosen,id];setSelected(next);void db.app_metadata.put({key:'vocabulary-groups:'+userId,value:JSON.stringify(next)});};
 const selectedCards=[...(groups?.classes.flatMap(c=>[...(chosen.includes(c.id+':core')?c.core:[]),...(chosen.includes(c.id+':reference')?c.reference:[])])||[]),...(groups?.personal.flatMap(d=>chosen.includes('personal:'+d.id)?d.cards:[])||[])];
 const start=(cards:FlashcardCard[],unlimited=false)=>{
  if(!cards.length)return;setError('');
  const selection:VocabularySelection={userId,cardIds:[...new Set(cards.map(c=>c.$id))],deckIds:[...new Set(cards.map(c=>c.deckId))]};
  try{sessionStorage.setItem('vocabulary-session:'+userId,JSON.stringify(selection));navigate('/decks/combined/review?'+new URLSearchParams({decks:selection.deckIds.join(','),selection:'vocabulary',limit:String(limit),autostart:'1',...(unlimited?{mode:'unlimited'}:{})}));}
  catch{setError('Unable to start this session. Please allow browser storage and try again.');}
 };
 const week=chinaStudyWeek();
 return <section className="mb-6 space-y-3" aria-label="Class vocabulary">
  <h2 className="text-xl font-semibold">Choose what to study</h2>
  <p className="text-sm text-slate-500">Two collections per class. Your cards and study progress stay intact.</p>
  {groups?.classes.map(c=>{
   const weekly=c.core.filter(card=>card.tags.includes('week:'+week));
   return <div key={c.id} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
    <h3 className="mb-3 font-semibold">{c.label}</h3>
    <Button size="lg" className="mb-3 w-full" disabled={!weekly.length} onClick={()=>start(weekly,true)}>This week's vocab · {weekly.length} {weekly.length===1?'word':'words'}</Button>
    <p className="mb-3 text-xs text-slate-500">{weekly.length?'Unlimited practice · does not change your review schedule':'No core vocabulary is scheduled for this week.'}</p>
    <div className="grid grid-cols-2 gap-2">{(['core','reference'] as const).map(kind=><label key={kind} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border bg-white p-3 text-sm"><input type="checkbox" checked={chosen.includes(c.id+':'+kind)} onChange={()=>toggle(c.id+':'+kind)}/><span><strong>{kind==='core'?'Core Vocab':'Reference Vocab'}</strong><small className="block text-slate-500">{c[kind].length} cards{kind==='reference'?' · names, dates & details':''}</small></span></label>)}</div>
   </div>;
  })}
  {groups?.personal.map(d=><label key={d.id} className="flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={chosen.includes('personal:'+d.id)} onChange={()=>toggle('personal:'+d.id)}/>{d.label} · {d.cards.length} cards · My deck</label>)}
  {error&&<p role="alert" className="text-red-700">{error}</p>}
  <Button size="lg" className="w-full bg-blue-600" disabled={!selectedCards.length} onClick={()=>start(selectedCards)}>Study Now</Button>
  <p className="text-center text-xs text-slate-500">Study up to {limit} cards from all selected collections.</p>
 </section>;
}
