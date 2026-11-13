import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import type {FlashcardCard,FlashcardDeck} from '@/types';
import {chinaStudyWeek,vocabularyBuckets,selectedVocabularyCards,categoryStudyLink} from '@/services/student-vocabulary';
import {StudentVocabularyChooser} from '@/components/StudentVocabularyChooser';
const mock=vi.hoisted(()=>({groups:[] as unknown[]}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:()=>mock.groups}));
const deck=(id:string,title:string,type='teacher')=>({$id:id,title,type,status:'published'} as FlashcardDeck);
const card=(id:string,deckId:string,tags:string[]=[])=>({$id:id,deckId,front:id,back:'Definition',tags} as FlashcardCard);
afterEach(cleanup);
it('combines every other assigned deck into Other and preserves original card IDs',()=>{
 const decks=[deck('c','WL · Core Vocabulary'),deck('r','WL · Reference Vocabulary'),deck('essay','Essay writing'),deck('memory','Memory and recall')];
 const cards=[card('term','c'),card('person','r'),card('writing','essay',['NAME']),card('recall','memory')];
 const buckets=vocabularyBuckets([...cards,cards[3]],decks);
 expect(buckets.core.map(c=>c.$id)).toEqual(['term']);
 expect(buckets.reference.map(c=>c.$id)).toEqual(['person']);
 expect(buckets.other.map(c=>c.$id)).toEqual(['writing','recall']);
 expect(cards.map(c=>c.deckId)).toEqual(['c','r','essay','memory']);
});
it('uses Monday in China rather than the device timezone',()=>{
 expect(chinaStudyWeek(new Date('2026-09-20T15:59:59Z'))).toBe('2026-09-14');
 expect(chinaStudyWeek(new Date('2026-09-20T16:00:00Z'))).toBe('2026-09-21');
});
it('keeps a stored selection within its specified decks and card IDs',()=>{
 expect(selectedVocabularyCards([card('a','d'),card('a','d'),card('b','d'),card('c','other')],{userId:'u',deckIds:['d'],cardIds:['a','c']})).toHaveLength(1);
});
it('shows exactly three class categories, defaults to Core, and does not expose source decks',()=>{
 const decks=[deck('c','WL · Core Vocabulary'),deck('r','WL · Reference Vocabulary'),deck('essay','Essay writing'),deck('memory','Memory and recall'),deck('personal','My upload','personal')];
 mock.groups=[{id:'class',label:'Literature',deckIds:['c','r','essay','memory']}];
 render(<MemoryRouter><StudentVocabularyChooser userId="u" decks={decks} limit={30}/></MemoryRouter>);
 expect(screen.getAllByRole('heading',{level:3}).map(h=>h.textContent)).toEqual(['Core Vocabulary','Reference Vocabulary','Other']);
 expect(screen.queryByText('Essay writing')).not.toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Study Other · Literature'})).toHaveAttribute('href',categoryStudyLink(['essay','memory'],'other',30));
 expect(screen.getByRole('link',{name:'Study Core Vocabulary'})).toHaveAttribute('href',categoryStudyLink(['c'],'core',30));
 expect(screen.getByRole('link',{name:/This week’s core/})).toHaveAttribute('href',categoryStudyLink(['c'],'core',30,true));
});
it('keeps the three categories visible even before cards are downloaded or assigned',()=>{
 mock.groups=[{id:'class',label:'Literature',deckIds:[]}];
 render(<MemoryRouter><StudentVocabularyChooser userId="u" decks={[]} limit={30}/></MemoryRouter>);
 expect(screen.getAllByRole('heading',{level:3})).toHaveLength(3);
 expect(screen.getByRole('link',{name:'Study Core Vocabulary · Literature'})).toHaveAttribute('href',categoryStudyLink([]));
});
