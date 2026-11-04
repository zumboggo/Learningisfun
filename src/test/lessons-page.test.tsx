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
 auth.isTeacher=true;request.mockResolvedValueOnce({items:[item]}).mockResolvedValueOnce({rubric:['Summary'],rows:[{name:'Example learner',studentId:'1',revision:3,state:{outcome:'Demonstrated with support',checks:[],step:4,submissions:[{text:'First draft'},{text:'Second draft',feedback:'Improved summary',criteria:[true]}]}}]});
 render(<LessonsPage/>);fireEvent.click(await screen.findByText('Student progress'));fireEvent.click(await screen.findByText(/Example learner/));expect(screen.getByText('First draft')).toBeVisible();expect(screen.getByText('Second draft')).toBeVisible();expect(screen.getByText('Improved summary')).toBeVisible();
});
