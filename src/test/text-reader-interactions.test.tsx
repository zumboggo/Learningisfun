import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { TextReaderPage } from '@/pages/TextReaderPage';
import type { ReactNode } from 'react';
const notes = vi.hoisted(()=>[{$id:'note',textId:'text',classId:'class',paragraphId:'p1',authorId:'student',anonymousLabel:'Reader',type:'observation',content:'The contrast suggests that the narrator feels uncertain about the journey.',selectedText:'quiet light',kind:'annotation',visibility:'class',moderationStatus:'visible',createdAt:'2026-09-10T01:00:00Z'}]);
vi.mock('react-router-dom',()=>({useParams:()=>({textId:'text'}),Link:({children,to}:{children:ReactNode;to:string})=><a href={to}>{children}</a>}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'student'},isTeacher:false,isParent:false})}));
vi.mock('@/services/sync-policy',()=>({runCachedSync:vi.fn()}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:(fn:()=>unknown)=>{
  const code=fn.toString();
  if(code.includes('db.texts.get'))return {$id:'text',title:'The road beyond the window',author:'A reading sample',annotationMode:'regular',contentMode:'full'};
  if(code.includes('db.text_paragraphs'))return [{$id:'p1',textId:'text',sortOrder:0,content:'There was a **quiet light** over the hills that morning. The path curved away from the house, towards a place she had only imagined. She stood at the window and wondered whether leaving was another way of coming home.'},{$id:'p2',textId:'text',sortOrder:1,content:'Outside, the trees moved slowly in the wind. Nothing hurried her, and yet everything seemed to be waiting. She opened the door.'}];
  if(code.includes('db.classes.bulkGet'))return [{$id:'class',courseName:'Literature',name:'Blue'}];
  if(code.includes('const assigned'))return 'class';
  if(code.includes('canSeePeerAnnotations'))return notes;
  return [];
}}));
afterEach(cleanup);
it('offers a Home button without removing the return-to-texts link',()=>{
  render(<TextReaderPage/>);
  expect(screen.getByRole('link',{name:'Home'})).toHaveAttribute('href','/dashboard');
  expect(screen.getByRole('link',{name:'← Texts'})).toHaveAttribute('href','/texts');
});
it('opens notes beside a selected passage, closes them, and keeps a single reader',()=>{
  const {container}=render(<TextReaderPage/>);
  expect(screen.queryByText('Cell Phone Mode')).not.toBeInTheDocument();
  expect(screen.getAllByLabelText('Reading text')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button',{name:'Show notes for highlighted passage'}));
  const margin=screen.getByRole('complementary',{name:'Notes for paragraph 1'});
  expect(within(margin).getByText(notes[0].content)).toBeInTheDocument();
  fireEvent.click(within(margin).getByText('Close notes ×'));
  expect(screen.queryByRole('complementary',{name:'Notes for paragraph 1'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('1 passage notes'));
  expect(container.querySelector('.reader-prose')).not.toBeNull();

});
it('opens the annotation editor in the margin rather than a separate reading mode',()=>{
  render(<TextReaderPage/>);
  fireEvent.click(screen.getAllByText('+ Note')[0]);
  expect(screen.getByRole('region',{name:'Annotate passage'})).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Cancel annotation'));
  expect(screen.queryByRole('region',{name:'Annotate passage'})).not.toBeInTheDocument();
});
