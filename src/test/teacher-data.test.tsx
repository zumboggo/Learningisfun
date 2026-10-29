import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const call=vi.hoisted(()=>vi.fn());
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:call}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'teacher'}})}));
import TeacherDataPage from '@/pages/TeacherDataPage';
afterEach(()=>{cleanup();vi.clearAllMocks();});
const student={userId:'s',name:'Sam',questions:2,replies:3,discussionStarters:0,writingResponses:1,annotations:0,flashcardReviews:5,studySeconds:120,episodeAttempts:1,episodeCompletions:1,lastActivity:'2026-10-29'};
const report={studentRows:[student],episodeRows:[{userId:'s',assignmentId:'a',title:'A story',assignedDate:'2026-10-28',firstScore:50,latestScore:100,bestScore:100,quizTries:2,plays:1,complete:true,assessmentMode:'quiz',lastActivity:'2026-10-29'},{userId:'s',assignmentId:'b',title:'Unfinished story',assignedDate:'2026-10-28',firstScore:null,latestScore:null,bestScore:null,quizTries:0,plays:1,complete:false,assessmentMode:'quiz',lastActivity:'2026-10-29'}],generatedAt:'2026-10-29T10:00:00Z',missingSources:[]};
it('shows participation, separates unsubmitted quizzes and filters first scores below 75',async()=>{
 call.mockImplementation(async p=>p.classId?report:{classes:[{id:'c',name:'Class',courseName:'English'}]});
 render(<MemoryRouter><TeacherDataPage/></MemoryRouter>);
 expect(await screen.findByRole('link',{name:'Sam'})).toHaveAttribute('href','/classes/c/students/s/progress');
 fireEvent.click(screen.getByRole('button',{name:'Episode scores'}));
 expect(screen.getByText('50%')).toBeInTheDocument();expect(screen.getByText('In progress · Quiz not submitted')).toBeInTheDocument();
 fireEvent.click(screen.getByLabelText('Only first MC scores below 75%'));
 expect(screen.queryByText('Unfinished story')).not.toBeInTheDocument();expect(screen.getByText('A story')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Period'),{target:{value:'7'}});
 await waitFor(()=>expect(call).toHaveBeenCalledWith({action:'teacherData',classId:'c',days:7}));
});
it('reports server failures rather than empty or zero data',async()=>{
 call.mockRejectedValue(new Error('Connection unavailable'));
 render(<MemoryRouter><TeacherDataPage/></MemoryRouter>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable');
 expect(screen.queryByText('No classes yet. Data appears here once you have a class.')).not.toBeInTheDocument();
});
