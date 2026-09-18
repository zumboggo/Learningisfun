import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import type {FlashcardCard,FlashcardDeck} from '@/types';
import {chinaStudyWeek,vocabularyBuckets,selectedVocabularyCards} from '@/services/student-vocabulary';
import {StudentVocabularyChooser} from '@/components/StudentVocabularyChooser';
const mock=vi.hoisted(()=>({navigate:vi.fn(),put:vi.fn(),groups:{classes:[] as unknown[],personal:[] as unknown[]}}));
vi.mock('react-router-dom',()=>({useNavigate:()=>mock.navigate}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:()=>mock.groups}));
vi.mock('@/db/schema',()=>({db:{app_metadata:{get:async()=>undefined,put:mock.put}}}));
const deck={$id:'deck',title:'Literature',type:'teacher'} as FlashcardDeck;
const card=(id:string,tags:string[]=[],deckId='deck')=>({$id:id,deckId,front:id,back:'Definition',tags} as FlashcardCard);
afterEach(()=>{cleanup();vi.useRealTimers();sessionStorage.clear();mock.navigate.mockClear();});
it('groups mixed decks without moving cards or duplicating shared cards',()=>{
 const cards=[card('term'),card('person',['NAME']),card('date',['DATE']),card('detail',['REFERENCE'])];
 const buckets=vocabularyBuckets([...cards,cards[0]],[deck]);
 expect(buckets.core.map(c=>c.$id)).toEqual(['term']);
 expect(buckets.reference).toHaveLength(3);
 expect(cards.every(c=>c.deckId==='deck')).toBe(true);
 expect(vocabularyBuckets([card('ref',[],'reference')],[{$id:'reference',title:'Reference Vocabulary'} as FlashcardDeck]).reference).toHaveLength(1);
});
it('uses Monday in China rather than the device timezone',()=>{
 expect(chinaStudyWeek(new Date('2026-09-20T15:59:59Z'))).toBe('2026-09-14');
 expect(chinaStudyWeek(new Date('2026-09-20T16:00:00Z'))).toBe('2026-09-21');
});
it('keeps a stored selection within its specified decks and card IDs',()=>{
 expect(selectedVocabularyCards([card('a'),card('a'),card('b'),card('c',[],'other')],{userId:'u',deckIds:['deck'],cardIds:['a','c']})).toHaveLength(1);
});
it('launches only this week in unlimited mode, and Study Now combines checked collections',async()=>{
 const week=chinaStudyWeek();
 mock.groups={classes:[{id:'class',label:'Literature',core:[card('weekly',['week:'+week]),card('old',['week:2020-01-06'])],reference:[card('person',['NAME'])]}],personal:[]};
 render(<StudentVocabularyChooser userId="u" decks={[deck]} limit={30}/>);
 await waitFor(()=>expect(screen.getByRole('button',{name:"This week's vocab · 1 word"})).toBeEnabled());
 fireEvent.click(screen.getByRole('button',{name:/This week's vocab/}));
 expect(mock.navigate.mock.lastCall?.[0]).toContain('mode=unlimited');
 expect(JSON.parse(sessionStorage.getItem('vocabulary-session:u')!).cardIds).toEqual(['weekly']);
 fireEvent.click(screen.getByRole('checkbox',{name:/Reference Vocab/}));
 fireEvent.click(screen.getByRole('button',{name:'Study Now'}));
 expect(new Set(JSON.parse(sessionStorage.getItem('vocabulary-session:u')!).cardIds)).toEqual(new Set(['weekly','old','person']));
 expect(mock.navigate.mock.lastCall?.[0]).not.toContain('unlimited');
});
