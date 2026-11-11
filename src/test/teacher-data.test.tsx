import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const call=vi.hoisted(()=>vi.fn());
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:call}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'teacher'}})}));
import TeacherDataPage from '@/pages/TeacherDataPage';
afterEach(()=>{cleanup();vi.clearAllMocks();});
const student={userId:'s',name:'Sam',questions:2,replies:3,discussionStarters:0,writingResponses:1,annotations:0,flashcardReviews:5,studySeconds:120,episodeAttempts:1,episodeCompletions:1,lastActivity:'2026-10-29'};
const other={...student,userId:'other',name:'Alex'};
const episode={assignmentId:'a',title:'A story',assignedDate:'2026-10-28',archived:false};
const finished={userId:'s',assignmentId:'a',firstScore:50,latestScore:100,bestScore:100,quizTries:2,plays:1,complete:true,assessmentMode:'quiz',lastActivity:'2026-10-29'};
const started={...finished,userId:'other',firstScore:null,latestScore:null,bestScore:null,quizTries:0,complete:false};
const report={studentRows:[student,other],episodeRows:[finished],episodeCatalog:[episode],generatedAt:'2026-10-29T10:00:00Z',missingSources:[]};
it('opens a selected episode and ranks completed work above starts, with expandable submitted writing',async()=>{
 call.mockImplementation(async p=>p.episodeAssignmentId?{
   episodeRows:[{...started,hasWriting:true,answers:[]},{...finished,hasWriting:true,answers:[{prompt:'What changed?',text:'Kevin listened.'}]}],
   missingSources:[],
 }:p.classId?report:{classes:[{id:'c',name:'Class',courseName:'English Corner'}]});
 render(<MemoryRouter><TeacherDataPage/></MemoryRouter>);
 expect(await screen.findByRole('link',{name:'Sam'})).toHaveAttribute('href','/classes/c/students/s/progress');
 fireEvent.change(screen.getByLabelText('Period'),{target:{value:'7'}});
 await waitFor(()=>expect(call).toHaveBeenCalledWith({action:'teacherData',classId:'c',days:7}));
 await screen.findByRole('link',{name:'Sam'});
 fireEvent.click(screen.getByRole('button',{name:'Episodes'}));
 expect(screen.queryByRole('columnheader',{name:'Best quiz score'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/A story/}));
 expect(await screen.findByText('100%')).toBeInTheDocument();
 expect(call).toHaveBeenCalledWith({action:'teacherData',classId:'c',episodeAssignmentId:'a'});
 expect(screen.getAllByRole('rowheader').map(cell=>cell.textContent)).toEqual(['Sam','Alex']);
 expect(screen.getByText('First 50% · Latest 100%')).toBeInTheDocument();
 expect(screen.getByText('Not submitted')).toBeInTheDocument();
 const answer=screen.getByText('View answer').closest('details');
 expect(answer).not.toHaveAttribute('open');
 fireEvent.click(screen.getByText('View answer'));
 expect(answer).toHaveAttribute('open');
 expect(answer).toHaveTextContent('What changed?Kevin listened.');
 fireEvent.click(screen.getByLabelText('Only first quiz scores below 75%'));
 expect(screen.queryByRole('rowheader',{name:'Alex'})).not.toBeInTheDocument();
});
it('reports server failures rather than empty or zero data',async()=>{
 call.mockRejectedValue(new Error('Connection unavailable'));
 render(<MemoryRouter><TeacherDataPage/></MemoryRouter>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable');
 expect(screen.queryByText('No classes yet. Data appears here once you have a class.')).not.toBeInTheDocument();
});
