import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {PeerReviewPage} from '@/pages/PeerReviewPage';
import {PeerWorkSubmission} from '@/components/teachers/PeerReviewWork';
const request=vi.hoisted(()=>vi.fn());
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:request}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'me'}})}));
vi.mock('@/lib/appwrite',()=>({client:{subscribe:()=>()=>{}},COLLECTIONS:{presentation_peer_reviews:'reviews'},DATABASE_ID:''}));
afterEach(()=>{cleanup();request.mockReset()});
const data={activity:{$id:'activity',classId:'class',title:'Essay exchange',workMode:'submitted',status:'active',reviewsRequired:1,instructions:'Share an argument.',rubricJson:JSON.stringify({name:'Essay',columns:['Developing','Effective'],rows:[{id:'argument',label:'Argument',description:'A supported claim',points:[0,10]}]})},roster:[{id:'me',name:'Me'},{id:'ready',name:'Ready Student'},{id:'waiting',name:'Waiting Student'}],submissions:[{$id:'work',studentId:'ready',title:'My essay',fileName:'essay.pdf'}],reviews:[],writtenCount:0,feedbackUnlocked:false,isTeacher:false};
const page=()=>render(<MemoryRouter initialEntries={['/peer-reviews/activity']}><Routes><Route path="/peer-reviews/:activityId" element={<PeerReviewPage/>}/></Routes></MemoryRouter>);
it('shows only classmates with work, displays their submission, and submits scores using the activity rubric',async()=>{
 request.mockImplementation(async p=>p.action==='readPeerReviewActivity'?data:p.action==='readPeerReviewWork'?{work:{$id:'work',studentId:'ready',title:'My essay',text:'The argument to review',url:'https://example.org/essay',fileName:'essay.pdf'}}:{});
 page();await screen.findByText('Essay exchange');
 expect(screen.getByText('Share an argument.')).toBeVisible();expect(screen.queryByRole('option',{name:/Waiting Student/})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Classmate'),{target:{value:'ready'}});
 expect(await screen.findByText('The argument to review')).toBeVisible();expect(screen.getByRole('link',{name:/Open shared work/})).toHaveAttribute('href','https://example.org/essay');expect(screen.getByRole('button',{name:'Download essay.pdf'})).toBeVisible();
 fireEvent.change(screen.getByLabelText('What was especially effective?'),{target:{value:'Your evidence supports the claim.'}});fireEvent.change(screen.getByLabelText('What is one useful next step?'),{target:{value:'Explain the second quotation.'}});
 fireEvent.click(screen.getByRole('button',{name:'Submit anonymous review'}));
 await waitFor(()=>expect(request).toHaveBeenCalledWith(expect.objectContaining({action:'submitPresentationPeerReview',presenterId:'ready',ratings:{argument:2}})));
});
it('uploads a file with the text and link, and preserves work when a submission fails',async()=>{
 const onSaved=vi.fn(),onDirty=vi.fn();request.mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValue({work:{}});
 render(<PeerWorkSubmission activityId="activity" onSaved={onSaved} onDirty={onDirty}/>);
 fireEvent.change(screen.getByLabelText('Work title'),{target:{value:'My essay'}});fireEvent.change(screen.getByLabelText('Your work (text)'),{target:{value:'My argument'}});fireEvent.change(screen.getByLabelText('Shared-document or project link'),{target:{value:'https://example.org/essay'}});fireEvent.change(screen.getByLabelText('Attach a file'),{target:{files:[new File(['Hello'],'essay.txt',{type:'text/plain'})]}});
 fireEvent.click(screen.getByRole('button',{name:'Submit work for peer review'}));expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost');expect(screen.getByLabelText('Your work (text)')).toHaveValue('My argument');
 fireEvent.click(screen.getByRole('button',{name:'Submit work for peer review'}));await waitFor(()=>expect(onSaved).toHaveBeenCalled());
 expect(request).toHaveBeenLastCalledWith({action:'submitPeerReviewWork',activityId:'activity',title:'My essay',text:'My argument',url:'https://example.org/essay',file:{name:'essay.txt',data:'SGVsbG8='}});
});
it('shows teacher submission status and keeps existing live activities working',async()=>{
 request.mockResolvedValue({...data,isTeacher:true});page();await screen.findByText('Student work and results');expect(screen.getAllByText('Not submitted yet')).toHaveLength(2);expect(screen.getByRole('button',{name:'View submitted work'})).toBeVisible();cleanup();
 request.mockResolvedValue({...data,activity:{...data.activity,workMode:undefined},submissions:undefined});page();await screen.findByText('Review a presentation');expect(screen.queryByText('Submit your work')).not.toBeInTheDocument();expect(screen.getByRole('option',{name:'Waiting Student'})).toBeInTheDocument();
});
it('shows saved own work and closed activities without accepting new submissions',async()=>{
 const saved={...data,activity:{...data.activity,status:'closed'},submissions:[{$id:'mine',studentId:'me',title:'My essay',fileName:''}]};
 request.mockImplementation(async p=>p.action==='readPeerReviewActivity'?saved:{work:{...saved.submissions[0],text:'Saved work',url:''}});page();expect(await screen.findByText('Saved work')).toBeVisible();expect(screen.queryByRole('button',{name:'Submit work for peer review'})).not.toBeInTheDocument();expect(screen.getByText('This peer-review activity is closed.')).toBeVisible();
});
