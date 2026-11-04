import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {LessonsPage} from '@/pages/LessonsPage';
const auth=vi.hoisted(()=>({isTeacher:false,user:{$id:'learner'}}));
const request=vi.hoisted(()=>vi.fn());
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>auth}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:request}));
afterEach(()=>{cleanup();localStorage.clear();request.mockReset()});
const item={id:'pilot',classId:'wl',title:'Annotated entry',className:'World Literature',minutes:13,objective:'Cite and assess a source.'};
it('restores an unsent entry and reports saved completion when coaching is unavailable',async()=>{
 auth.isTeacher=false;localStorage.setItem('lesson-draft:learner:wl:pilot','My entry');
 const player={lesson:{...item,stages:[],final:{title:'New source',source:'Source card',sourceUrl:'https://example.org',rubric:['Summary'],prompt:'Write your entry.',delayedCheck:'Try again.'}},state:{step:0,draft:'',submissions:[],outcome:''},revision:2};
 request.mockResolvedValueOnce({items:[item]}).mockResolvedValueOnce(player).mockResolvedValueOnce({...player,state:{...player.state,draft:'My entry',outcome:'Completed',submissions:[{text:'My entry'}]},warning:'Saved for review.'});
 render(<LessonsPage/>);fireEvent.click(await screen.findByText('Open lesson'));expect(await screen.findByRole('textbox')).toHaveValue('My entry');fireEvent.click(screen.getByText('Submit for feedback'));expect(await screen.findByText('Completed')).toBeVisible();expect(screen.getByText('Saved for review.')).toBeVisible();
});
it('lets a teacher inspect original and revised evidence for their section',async()=>{
 auth.isTeacher=true;request.mockResolvedValueOnce({items:[{...item,className:'Blue',courseName:'World Literature',releaseAt:'2026-11-09T00:00:00+08:00'},{...item,classId:'red',className:'Red',courseName:'World Literature',assignedOn:'2026-11-04'}]}).mockResolvedValueOnce({rubric:['Summary'],rows:[{name:'Example learner',studentId:'1',revision:3,state:{outcome:'Demonstrated with support',checks:[],step:4,submissions:[{text:'First draft'},{text:'Second draft',feedback:'Improved summary',criteria:[true]}]}}]});
 render(<LessonsPage/>);const summary=await screen.findByText('Annotated entry');expect(screen.getAllByText('Annotated entry')).toHaveLength(1);expect(summary.closest('details')).not.toHaveAttribute('open');fireEvent.click(summary);expect(screen.getByText('Release: Nov 9, 2026')).toBeVisible();expect(screen.getByText('Assigned: Nov 4, 2026')).toBeVisible();fireEvent.click(screen.getAllByRole('button',{name:'Student progress'})[1]);expect(request).toHaveBeenLastCalledWith(expect.objectContaining({classId:'red',action:'lessonRoster'}));fireEvent.click(await screen.findByText(/Example learner/));expect(screen.getByText('First draft')).toBeVisible();expect(screen.getByText('Second draft')).toBeVisible();expect(screen.getByText('Improved summary')).toBeVisible();
});

it('shows the labeled model for teaching and folds it for the next recall question',async()=>{
 auth.isTeacher=false;
 const stage={title:'Leave a trail',shortTitle:'Cite a source',modelRows:[['Citation','Spar, Ira.']],questions:[{prompt:'First check'},{prompt:'Fresh check'}]};
 const lesson={...item,stages:[stage],final:{shortTitle:'Write your entry'}};
 const state={step:0,misses:0,checks:[],draft:'',submissions:[],outcome:'',notice:''};
 request.mockResolvedValueOnce({items:[item]}).mockResolvedValueOnce({lesson,state,revision:0}).mockResolvedValueOnce({lesson,state:{...state,step:1},revision:1});
 render(<LessonsPage/>);fireEvent.click(await screen.findByText('Open lesson'));
 const model=(await screen.findByText('Worked example')).closest('details');
 expect(model).toHaveAttribute('open');expect(screen.getByText('Spar, Ira.')).toBeVisible();
 fireEvent.change(screen.getByLabelText('Your answer'),{target:{value:'Spar'}});fireEvent.click(screen.getByText('Check answer'));
 await screen.findByText('Fresh check');expect(screen.getByText('Worked example').closest('details')).not.toHaveAttribute('open');
 fireEvent.click(screen.getByText('Worked example'));expect(screen.getByText('Spar, Ira.')).toBeVisible();
});

it('renders both real citation banks in sequence and advances after ordering each',async()=>{
 const {default:catalog}=await import('../../functions/learning-content/src/lesson-catalog.json');
 const l=catalog[0],questions=l.stages[1].questions;
 let step=2;
 const player=()=>({lesson:l,state:{step,misses:0,checks:[],draft:'',submissions:[],outcome:'',notice:''},revision:step});
 auth.isTeacher=false;
 request.mockImplementation(async b=>{if(b.action==='lessonLibrary')return {items:[{...item,id:l.id}]};if(b.action==='lessonAnswer'){expect(b.answer).toBe(questions[step-2].answers[0]);step++;}return player()});
 render(<LessonsPage/>);fireEvent.click(await screen.findByText('Open lesson'));
 for(const [i,q] of questions.entries()){
 await screen.findByText(q.prompt);expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 if(!('pieces' in q))throw Error('Missing citation pieces');const pieces=q.pieces;
 const order=i===0?[3,2,0,4,1]:[2,4,1,3,0];
 for(const [pos,idx] of order.entries()){
 const piece=screen.getByRole('button',{name:pieces[idx]});
 const slot=screen.getByRole('button',{name:(pos+1)+' Place piece here'});
 if(i===0){fireEvent.click(piece);fireEvent.click(slot);}else{const dt={setData:vi.fn(),getData:()=>String(idx)};fireEvent.dragStart(piece,{dataTransfer:dt});fireEvent.drop(slot,{dataTransfer:dt});}}
 fireEvent.click(screen.getByText('Check answer'));
 }
 await screen.findByText(l.stages[2].questions[0].prompt);
});

it('places the diagram with the model and makes room for original writing before comparison',async()=>{
 const {default:catalog}=await import('../../functions/learning-content/src/lesson-catalog.json');
 const lesson=catalog.find(l=>l.id==='nested-quotes-evidence-v2')!;
 const question=lesson.stages[0].questions[1];if(!('rehearsal' in question)||!question.rehearsal)throw Error('Missing rehearsal');
 const state={step:0,misses:0,checks:[],draft:'',submissions:[],outcome:'',notice:''};
 auth.isTeacher=false;
 request.mockResolvedValueOnce({items:[{...item,id:lesson.id}]}).mockResolvedValueOnce({lesson,state,revision:0}).mockResolvedValueOnce({lesson,state:{...state,step:1},revision:1});
 render(<LessonsPage/>);fireEvent.click(await screen.findByText('Open lesson'));
 expect(await screen.findByRole('img',{name:/writer’s words/i})).toHaveAttribute('src',expect.stringContaining('nested-quote-seam.jpg'));
 fireEvent.change(screen.getByLabelText('Your answer'),{target:{value:'a wall'}});fireEvent.click(screen.getByText('Check answer'));
 const compare=await screen.findByText('Compare with a model');expect(compare).toBeDisabled();expect(screen.queryByText(question.rehearsal.sample)).toBeNull();
 fireEvent.change(screen.getByLabelText('Practice in your own words'),{target:{value:'The editor calls the paper “a window” into the school.'}});fireEvent.click(compare);expect(screen.getByText(question.rehearsal.sample)).toBeVisible();
});
