import {executeLearningContent} from '@/services/learning-content.service';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { QuestionVoting } from '@/services/reading-discussion.service';
import { ReadingDiscussionPage } from '@/pages/ReadingDiscussionPage';
const fixture=vi.hoisted(()=>({teacher:false,canWrite:true,score:2,showStudentNames:false,curatedReady:false,voting:undefined as QuestionVoting|undefined}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'student'}})}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn(async(request)=>request.action==='readTexts'?{texts:[{$id:'text',title:'Reading example',author:'Author',contentMode:'full'}],paragraphs:[]}:({
  title:'Reading example',className:'Literature · Blue',teacher:fixture.teacher,canWrite:fixture.canWrite,showStudentNames:fixture.showStudentNames,curatedReady:fixture.curatedReady,voting:fixture.voting,
  posts:[{id:'q',parentId:null,category:'question',content:'Why does the narrator change?',quotation:'The world changed.',paragraph:3,username:'Student name',label:'Reader 123ABC',teacher:false,mine:false,createdAt:'2026-09-15T01:00:00Z',hidden:false,locked:false,pinned:false,score:fixture.score,voted:false}],participation:[],
}))}));
beforeEach(()=>{fixture.teacher=false;fixture.canWrite=true;fixture.score=2;fixture.showStudentNames=false;fixture.curatedReady=false;fixture.voting=undefined;localStorage.clear();});afterEach(()=>{cleanup();vi.useRealTimers();});
const mount=()=>render(<MemoryRouter initialEntries={['/discussions/texts/text/blue']}><Routes><Route path="/discussions/texts/:textId/:classId" element={<ReadingDiscussionPage/>}/></Routes></MemoryRouter>);
it('student sees peer questions immediately with upvotes and replies, but no teacher controls',async()=>{
  mount();await screen.findByRole('heading',{name:'Reading example',level:1});
  expect(screen.queryByRole('button',{name:'Present'})).not.toBeInTheDocument();

  expect(screen.getByText('Why does the narrator change?')).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Read paragraph 3 ↗'})).toHaveAttribute('href','/texts/text?classId=blue&paragraph=3');
  expect(screen.queryByRole('button',{name:'hide'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/downvote/i})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Reply'}));expect(screen.getByRole('textbox',{name:'Your reply'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Cancel'}));expect(screen.queryByRole('textbox',{name:'Your reply'})).not.toBeInTheDocument();
});
it('refresh updates vote totals without replacing the composer or losing typing',async()=>{
  mount();await screen.findByRole('heading',{name:'Reading example',level:1});
  const input=screen.getByRole('textbox',{name:'Your question'});fireEvent.change(input,{target:{value:'Another question'}});input.focus();
  fixture.score=5;fireEvent.click(screen.getByRole('button',{name:'Refresh discussion'}));
  await screen.findByRole('button',{name:'Upvote: 5'});expect(screen.getByRole('textbox',{name:'Your question'})).toBe(input);expect(input).toHaveValue('Another question');
});
it('parent has read-only access and teacher has moderation/presentation controls',async()=>{
  fixture.canWrite=false;const {unmount}=mount();await screen.findByRole('heading',{name:'Reading example',level:1});
  expect(screen.queryByRole('textbox',{name:'Your question'})).not.toBeInTheDocument();unmount();
  fixture.teacher=true;fixture.canWrite=true;mount();await screen.findByRole('button',{name:'Present'});
  fireEvent.click(screen.getByText('Moderate ▾'));expect(screen.getByRole('button',{name:'hide'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Present'}));await waitFor(()=>expect(screen.queryByRole('textbox',{name:'Your question'})).not.toBeInTheDocument());expect(screen.getByRole('button',{name:'Exit presentation'})).toBeInTheDocument();
});

it('teachers see usernames by default and can switch back to anonymous labels',async()=>{
 fixture.teacher=true;mount();await screen.findByRole('button',{name:'Present'});

 expect(screen.getByText('Student name')).toBeInTheDocument();
 fireEvent.click(screen.getByText('Teacher settings'));fireEvent.click(screen.getByRole('checkbox',{name:'Anonymous names in my view'}));
 expect(screen.getByText('Reader 123ABC')).toBeInTheDocument();
 expect(screen.queryByText('Student name')).not.toBeInTheDocument();
});

it('students see usernames only when the teacher enables classmate names',async()=>{
 fixture.showStudentNames=true;mount();await screen.findByRole('heading',{name:'Reading example',level:1});

 expect(screen.getByText('Student name')).toBeInTheDocument();
 expect(screen.queryByRole('checkbox',{name:'Show usernames to classmates'})).not.toBeInTheDocument();
 expect(screen.getByText('Classmates can see usernames on posts and replies.')).toBeInTheDocument();
});


it('places Vote on Questions before Assign questions for the teacher',async()=>{
 fixture.teacher=true;fixture.curatedReady=true;mount();
 const button=await screen.findByRole('button',{name:'Vote on Questions'});
 const assign=screen.getByText('Assign questions');
 expect(button.compareDocumentPosition(assign)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('keeps class questions and posting available during voting',async()=>{
 fixture.curatedReady=true;fixture.voting={sessionId:'session',active:true,questionsPerRound:3,totalRounds:3,completedRounds:0,completed:false,choices:[],questionIds:['q']};
 mount();await screen.findByRole('button',{name:'Choose this question'});
 expect(screen.getAllByText('Why does the narrator change?')).toHaveLength(2);
 expect(screen.getByRole('button',{name:'Reply'})).toBeVisible();
 expect(screen.queryByRole('textbox',{name:'Draft question'})).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:/Upvote/})).toBeVisible();
 expect(screen.getByRole('textbox',{name:'Your question'})).toBeVisible();
});

it('focus and elapsed time update no server data until manual refresh',async()=>{
 vi.useFakeTimers();await act(async()=>{mount();});
 const readCount=()=>vi.mocked(executeLearningContent).mock.calls.filter(([p])=>p.action==='readReadingDiscussion').length;
 const before=readCount();
 act(()=>{vi.advanceTimersByTime(120000);window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
 expect(readCount()).toBe(before);expect(screen.getByText(/Updated 2 minutes ago/)).toBeInTheDocument();
 vi.useRealTimers();fireEvent.click(screen.getByRole('button',{name:'Refresh discussion'}));await waitFor(()=>expect(readCount()).toBe(before+1));
});
