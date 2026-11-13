import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
const mock=vi.hoisted(()=>({ensure:vi.fn(async()=>{}),queue:vi.fn(),start:vi.fn(async()=>({$id:'session'})),user:{$id:'u',role:'student'}}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:mock.user,isTeacher:false,isParent:false})}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:()=>undefined}));
vi.mock('@/services/flashcard-cache',()=>({ensureDeckCards:mock.ensure}));
vi.mock('@/db/schema',()=>({db:{flashcard_decks:{bulkGet:async()=>[{$id:'c',title:'Core Vocabulary',type:'teacher',status:'published'},{$id:'o',title:'Essay writing',type:'teacher',status:'published'}]},flashcard_cards:{where:()=>({anyOf:()=>({toArray:async()=>[{$id:'core',deckId:'c',front:'Core term',back:'Definition',tags:[]},{$id:'other',deckId:'o',front:'Essay term',back:'Definition',tags:[]}]})})},student_card_state:{where:()=>({equals:()=>({and:()=>({toArray:async()=>[]})})})}}}));
vi.mock('@/services/flashcard.service',()=>({buildFlashcardQueue:mock.queue,startFlashcardStudySession:mock.start,finishFlashcardStudySession:vi.fn(async()=>{}),getDeckProgress:vi.fn(),getDeckStudySettings:vi.fn(),filterCustomStudyCards:vi.fn(),reportFlashcard:vi.fn(),retentionForIntensity:vi.fn(),setCardStudyPreference:vi.fn(),undoLastCardReview:vi.fn(),reviewCard:vi.fn()}));
import {FlashcardReviewPage} from '@/pages/FlashcardReviewPage';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('filters category cards before applying the review queue and keeps their original deck',async()=>{
 mock.queue.mockImplementation(async(_user,id,_mode,_limit,allowed)=>id==='o'&&allowed.has('other')?[{$id:'other',deckId:'o',front:'Essay term',back:'Definition',tags:[]}]:[]);
 render(<MemoryRouter initialEntries={['/decks/combined/review?decks=c,o&category=other&autostart=1']}><Routes><Route path="/decks/:deckId/review" element={<FlashcardReviewPage/>}/></Routes></MemoryRouter>);
 await waitFor(()=>expect(mock.start).toHaveBeenCalledWith('u','o',null));
 expect(mock.ensure).toHaveBeenCalledWith('u','o');
 expect(mock.ensure).not.toHaveBeenCalledWith('u','c');
 expect(mock.queue).toHaveBeenCalledWith('u','o','mixed',30,new Set(['other']));
 expect(await screen.findByText('Essay term')).toBeInTheDocument();
});
it('shows an honest empty category without substituting other cards',async()=>{
 render(<MemoryRouter initialEntries={['/decks/combined/review?category=core&autostart=1']}><Routes><Route path="/decks/:deckId/review" element={<FlashcardReviewPage/>}/></Routes></MemoryRouter>);
 expect(await screen.findByText('No Core Vocabulary cards have been assigned yet.')).toBeInTheDocument();
 expect(mock.queue).not.toHaveBeenCalled();
});
