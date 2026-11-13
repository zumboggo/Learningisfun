import type {FlashcardCard,FlashcardDeck} from '@/types';
export const FLASHCARD_CATEGORIES=['core','reference','other'] as const;
export type FlashcardCategory=typeof FLASHCARD_CATEGORIES[number];
export const CATEGORY_LABELS:Record<FlashcardCategory,string>={core:'Core Vocabulary',reference:'Reference Vocabulary',other:'Other'};
export const chinaStudyWeek=(now=new Date())=>{
 const d=new Date(now.getTime()+8*60*60*1000);
 d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
 return d.toISOString().slice(0,10);
};
/** Whole assigned decks are combined without changing card IDs or review history. */
export function deckVocabularyCategory(deck:FlashcardDeck):FlashcardCategory{
 if(/\breference\s+vocab(?:ulary)?\b/i.test(deck.title))return 'reference';
 if(/\bcore\s+vocab(?:ulary)?\b/i.test(deck.title))return 'core';
 return 'other';
}
export function vocabularyBuckets(cards:FlashcardCard[],decks:FlashcardDeck[]){
 const byId=new Map(decks.map(d=>[d.$id,d]));
 const buckets:Record<FlashcardCategory,FlashcardCard[]>={core:[],reference:[],other:[]};
 for(const card of new Map(cards.map(card=>[card.$id,card])).values()){
  const deck=byId.get(card.deckId);if(deck)buckets[deckVocabularyCategory(deck)].push(card);
 }
 return buckets;
}
export function categoryStudyLink(deckIds:string[],category:FlashcardCategory='core',limit=30,weekly=false){
 return '/decks/combined/review?'+new URLSearchParams({decks:[...new Set(deckIds)].join(','),category,limit:String(limit),autostart:'1',...(weekly?{week:chinaStudyWeek(),mode:'unlimited'}:{})});
}
export interface VocabularySelection {userId:string;cardIds:string[];deckIds:string[]}
export function selectedVocabularyCards(cards:FlashcardCard[],selection:VocabularySelection){
 const ids=new Set(selection.cardIds),decks=new Set(selection.deckIds);
 return [...new Map(cards.filter(card=>ids.has(card.$id)&&decks.has(card.deckId)).map(card=>[card.$id,card])).values()];
}
