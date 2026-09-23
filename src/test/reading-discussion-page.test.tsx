import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReadingDiscussionPage } from '@/pages/ReadingDiscussionPage';
const fixture=vi.hoisted(()=>({teacher:false,canWrite:true,score:2,showStudentNames:false}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'student'}})}));
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn(async()=>({
  title:'Reading example',className:'Literature · Blue',teacher:fixture.teacher,canWrite:fixture.canWrite,showStudentNames:fixture.showStudentNames,
  posts:[{id:'q',parentId:null,category:'question',content:'Why does the narrator change?',quotation:'The world changed.',paragraph:3,username:'Student name',label:'Reader 123ABC',teacher:false,mine:false,createdAt:'2026-09-15T01:00:00Z',hidden:false,locked:false,pinned:false,score:fixture.score,voted:false}],participation:[],
}))}));
beforeEach(()=>{fixture.teacher=false;fixture.canWrite=true;fixture.score=2;fixture.showStudentNames=false;localStorage.clear();});afterEach(cleanup);
const mount=()=>render(<MemoryRouter initialEntries={['/discussions/texts/text/blue']}><Routes><Route path="/discussions/texts/:textId/:classId" element={<ReadingDiscussionPage/>}/></Routes></MemoryRouter>);
it('student sees peer questions immediately with upvotes and replies, but no teacher controls',async()=>{
  mount();await screen.findByRole('heading',{name:'Reading example'});
  expect(screen.queryByRole('button',{name:'Present'})).not.toBeInTheDocument();

  expect(screen.getByText('Why does the narrator change?')).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Read paragraph 3 ↗'})).toHaveAttribute('href','/texts/text?classId=blue&paragraph=3');
  expect(screen.queryByRole('button',{name:'hide'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/downvote/i})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Reply'}));expect(screen.getByRole('textbox',{name:'Your reply'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Cancel'}));expect(screen.queryByRole('textbox',{name:'Your reply'})).not.toBeInTheDocument();
});
it('refresh updates vote totals without replacing the composer or losing typing',async()=>{
  mount();await screen.findByRole('heading',{name:'Reading example'});
  const input=screen.getByRole('textbox',{name:'Your question'});fireEvent.change(input,{target:{value:'Another question'}});input.focus();
  fixture.score=5;fireEvent.click(screen.getByRole('button',{name:'Refresh'}));
  await screen.findByRole('button',{name:'Upvote: 5'});expect(screen.getByRole('textbox',{name:'Your question'})).toBe(input);expect(input).toHaveValue('Another question');
});
it('parent has read-only access and teacher has moderation/presentation controls',async()=>{
  fixture.canWrite=false;const {unmount}=mount();await screen.findByRole('heading',{name:'Reading example'});
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
 fixture.showStudentNames=true;mount();await screen.findByRole('heading',{name:'Reading example'});

 expect(screen.getByText('Student name')).toBeInTheDocument();
 expect(screen.queryByRole('checkbox',{name:'Show usernames to classmates'})).not.toBeInTheDocument();
 expect(screen.getByText('Classmates can see usernames on posts and replies.')).toBeInTheDocument();
});
