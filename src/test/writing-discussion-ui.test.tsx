import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {expect,it,vi,beforeEach} from 'vitest';
import {WritingDiscussionPanel} from '@/components/discussions/WritingDiscussionPanel';
import type {ReadingDiscussion} from '@/services/reading-discussion.service';
const call=vi.hoisted(()=>vi.fn());
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'teacher'}})}));
vi.mock('@/services/reading-discussion.service',async original=>({...await original<typeof import('@/services/reading-discussion.service')>(),discussionCall:call}));
const data:ReadingDiscussion={teacher:true,title:'A prompt',className:'Blue',canWrite:true,discussionMode:true,studentsCanView:true,participation:[],posts:[{id:'a',parentId:null,category:'question',content:'First submission',quotation:'',paragraph:null,label:'Response A',username:'Alice',teacher:false,mine:false,createdAt:'2026-10-15',hidden:false,locked:false,pinned:false,score:0,voted:false},{id:'b',parentId:'a',category:'question',content:'Helpful feedback',quotation:'',paragraph:null,label:'Reader B',username:'Bob',teacher:false,mine:false,createdAt:'2026-10-15',hidden:false,locked:false,pinned:false,score:0,voted:false}]};
beforeEach(()=>{call.mockReset();call.mockResolvedValue({});});
const show=(value=data)=>render(<MemoryRouter><WritingDiscussionPanel sessionId="writing" data={value} refresh={vi.fn(async()=>{})}/></MemoryRouter>);
it('links teacher settings to the writing target and uses submission assignment labels',async()=>{
 show();expect(screen.getByText('Assign submissions')).toBeInTheDocument();fireEvent.click(screen.getByLabelText('Students can see submissions'));await waitFor(()=>expect(call).toHaveBeenCalledWith('setWritingDiscussionSettings',{kind:'writing',sessionId:'writing'},{studentsCanView:false}));
});
it('presentation hides names and keeps replies collapsed, Escape exits without fullscreen support',()=>{
 show();expect(screen.getByText('Response A · Alice')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Present'}));expect(screen.queryByText(/Alice/)).not.toBeInTheDocument();expect(screen.queryByText('Helpful feedback')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:/See replies/}));expect(screen.getByText('Helpful feedback')).toBeInTheDocument();expect(screen.queryByText(/Bob/)).not.toBeInTheDocument();fireEvent.keyDown(document,{key:'Escape'});expect(screen.getByRole('button',{name:'Present'})).toBeInTheDocument();
});
it('reply editor omits text quotation controls',()=>{show();fireEvent.click(screen.getByRole('button',{name:'Reply'}));expect(screen.getByRole('textbox',{name:'Your reply'})).toBeInTheDocument();expect(screen.queryByRole('textbox',{name:'Quotation'})).not.toBeInTheDocument();});
it('exports are anonymous by default and offer both formats',()=>{show();fireEvent.click(screen.getByRole('button',{name:'Export Responses'}));expect(screen.getByLabelText('Include replies')).not.toBeChecked();expect(screen.getByLabelText('Include student names')).not.toBeChecked();fireEvent.change(screen.getByLabelText('Format'),{target:{value:'csv'}});expect(screen.getByRole('button',{name:'Download CSV'})).toBeInTheDocument();});
it('students cannot export or configure; hidden responses are not rendered',()=>{show({...data,teacher:false,studentsCanView:false,posts:[],canWrite:false});expect(screen.queryByRole('button',{name:'Export Responses'})).not.toBeInTheDocument();expect(screen.queryByLabelText('Discussion Mode')).not.toBeInTheDocument();expect(screen.getByText(/has not shared/)).toBeInTheDocument();});
