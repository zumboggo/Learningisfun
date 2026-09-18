import type {FlashcardCard,FlashcardDeck} from '@/types';
export const chinaStudyWeek=(now=new Date())=>{
 const d=new Date(now.getTime()+8*60*60*1000);
 d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
 return d.toISOString().slice(0,10);
};
export function isReferenceCard(card:FlashcardCard,deck:FlashcardDeck){
 return /\breference\b/i.test(deck.title)||card.tags.some(tag=>/^(reference|name|names|date|dates|detail|details)$/i.test(tag));
}
export function vocabularyBuckets(cards:FlashcardCard[],decks:FlashcardDeck[]){
 const byId=new Map(decks.map(d=>[d.$id,d]));
 const unique=[...new Map(cards.map(card=>[card.$id,card])).values()].filter(c=>byId.has(c.deckId));
 return {core:unique.filter(c=>!isReferenceCard(c,byId.get(c.deckId)!)),reference:unique.filter(c=>isReferenceCard(c,byId.get(c.deckId)!))};
}
export interface VocabularySelection {userId:string;cardIds:string[];deckIds:string[]}
export function selectedVocabularyCards(cards:FlashcardCard[],selection:VocabularySelection){
 const ids=new Set(selection.cardIds),decks=new Set(selection.deckIds);
 return [...new Map(cards.filter(card=>ids.has(card.$id)&&decks.has(card.deckId)).map(card=>[card.$id,card])).values()];
}
