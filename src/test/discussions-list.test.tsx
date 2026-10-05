import {useEffect,useState} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {DiscussionsListPage} from '@/pages/DiscussionsListPage';
import {ReadingDiscussionsList} from '@/components/texts/ReadingDiscussionsList';
const mock=vi.hoisted(()=>({teacher:false,execute:vi.fn(),sync:vi.fn(),sessions:[
 {$id:'old-qft',classId:'blue',discussionType:'qft',status:'active',sessionDate:'2026-09-01',title:'Our old questions'},
 {$id:'draft',classId:'blue',discussionType:'qft',status:'draft',sessionDate:'2026-09-01',title:'Private draft'},
 {$id:'notes',classId:'blue',discussionType:'notes',status:'published',sessionDate:'2026-09-01',title:'Notes'},
]}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'user'},isTeacher:mock.teacher})}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:mock.execute}));
vi.mock('@/services/class-session.service',()=>({syncMyClassSessionsFromServer:mock.sync}));
vi.mock('@/services/sync-policy',()=>({runCachedSync:async(_key:string,_window:number,run:()=>Promise<unknown>)=>run(),SYNC_WINDOWS:{catalog:100}}));
vi.mock('@/db/schema',()=>({db:{
 classes:{where:()=>({equals:()=>({toArray:async()=>[{$id:'blue',name:'Blue',courseName:'Literature'}]}),anyOf:()=>({toArray:async()=>[{$id:'blue',name:'Blue',courseName:'Literature'}]})})},
 class_members:{where:()=>({equals:()=>({toArray:async()=>[{classId:'blue'}]})})},
 class_sessions:{where:()=>({anyOf:()=>({toArray:async()=>mock.sessions})})},
 text_assignments:{where:()=>({equals:()=>({toArray:async()=>[{textId:'essay',isAssignedReading:true}]})})},
 texts:{where:()=>({anyOf:()=>({and:()=>({toArray:async()=>[{$id:'essay',title:'Essay'}]})})})},
}}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:(query:()=>Promise<unknown>,deps:unknown[])=>{
 const [value,setValue]=useState<unknown>();
 // Match the caller-provided dependencies of the live-query hook.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 useEffect(()=>{let current=true;void query().then(result=>{if(current)setValue(result);});return()=>{current=false;};},deps);return value;
}}));
afterEach(()=>{cleanup();mock.teacher=false;vi.clearAllMocks();});
const readings=[
 {id:'empty',textId:'empty',classId:'blue',className:'Blue',title:'Empty text',date:'2026-10-05',available:true,questionCount:0,replyCount:0},
 {id:'question',textId:'question',classId:'blue',className:'Blue',title:'Text with question',date:'2026-10-05',available:true,questionCount:1,replyCount:0},
 {id:'reply',textId:'reply',classId:'blue',className:'Blue',title:'Text with reply',date:'2026-10-05',available:true,questionCount:0,replyCount:1},
];
it('lets students switch between all texts and discussions with questions or replies',async()=>{
 mock.execute.mockResolvedValue({readings});render(<MemoryRouter><DiscussionsListPage/></MemoryRouter>);
 await screen.findByText('Empty text');
 expect(screen.queryByRole('button',{name:'QFT'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Active Discussions'}));
 expect(screen.queryByText('Empty text')).not.toBeInTheDocument();
 expect(screen.getByText('Text with question')).toBeInTheDocument();expect(screen.getByText('Text with reply')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Active Discussions'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'All'}));expect(screen.getByText('Empty text')).toBeInTheDocument();
});
it('opens preserved QFTs from the archive at the bottom and keeps student drafts private',async()=>{
 mock.execute.mockResolvedValue({readings});render(<MemoryRouter><DiscussionsListPage/></MemoryRouter>);
 expect(screen.queryByText('Our old questions')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'View archived Discussions'}));
 const old=await screen.findByRole('link',{name:/Our old questions/});expect(old).toHaveAttribute('href','/discussions/old-qft');
 expect(screen.queryByText('Private draft')).not.toBeInTheDocument();expect(screen.queryByText('Notes',{exact:true})).not.toBeInTheDocument();
 expect(screen.getByRole('region',{name:'Text discussions'}).compareDocumentPosition(screen.getByRole('region',{name:'Archived Discussions'}))&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
it('teacher creation offers only a class and assigned text, opening the text workspace',async()=>{
 mock.teacher=true;mock.execute.mockResolvedValue({readings:[]});render(<MemoryRouter><DiscussionsListPage/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Start discussion'}));
 const modal=within(screen.getByRole('dialog'));await modal.findByRole('option',{name:'Essay'});
 expect(modal.queryByRole('button',{name:'QFT'})).not.toBeInTheDocument();
 const open=modal.getByRole('button',{name:'Open text discussion'});expect(open).toBeDisabled();
 fireEvent.change(modal.getByLabelText('Text'),{target:{value:'essay'}});expect(open).toBeEnabled();
 fireEvent.click(open);await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
it('shows an empty active result and respects the class filter',async()=>{
 mock.execute.mockResolvedValue({readings});render(<MemoryRouter><ReadingDiscussionsList classId="other"/></MemoryRouter>);
 await waitFor(()=>expect(screen.queryByText('Empty text')).not.toBeInTheDocument());
 fireEvent.click(screen.getByRole('button',{name:'Active Discussions'}));
 expect(screen.getByText('No discussions have posted questions or replies yet.')).toBeInTheDocument();
});
