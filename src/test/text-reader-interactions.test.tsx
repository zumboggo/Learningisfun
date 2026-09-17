import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TextReaderPage } from '@/pages/TextReaderPage';
import type { ReactNode } from 'react';
const notes = vi.hoisted(()=>[{$id:'note',textId:'text',classId:'class',paragraphId:'p1',authorId:'student',anonymousLabel:'Reader',type:'observation',content:'The contrast suggests that the narrator feels uncertain about the journey.',selectedText:'quiet light',kind:'annotation',visibility:'class',moderationStatus:'visible',createdAt:'2026-09-10T01:00:00Z'}]);
vi.mock('react-router-dom',()=>({useParams:()=>({textId:'text'}),useSearchParams:()=>[new URLSearchParams(),vi.fn()],Link:({children,to}:{children:ReactNode;to:string})=><a href={to}>{children}</a>}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'student'},isTeacher:false,isParent:false})}));
vi.mock('@/services/sync-policy',()=>({runCachedSync:vi.fn()}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:(fn:()=>unknown)=>{
  const code=fn.toString();
  if(code.includes('db.texts.get'))return {$id:'text',title:'The road beyond the window',author:'A reading sample',annotationMode:'regular',contentMode:'full',status:'published'};
  if(code.includes('db.text_paragraphs'))return [{$id:'p1',textId:'text',sortOrder:0,content:'There was a **quiet light** over the hills that morning. The path curved away from the house, towards a place she had only imagined. She stood at the window and wondered whether leaving was another way of coming home.'},{$id:'p2',textId:'text',sortOrder:1,content:'Outside, the trees moved slowly in the wind. Nothing hurried her, and yet everything seemed to be waiting. She opened the door.'}];
  if(code.includes('db.classes.bulkGet'))return [{$id:'class',courseName:'Literature',name:'Blue'}];
  if(code.includes('[textId+classId]'))return {isAssignedReading:true};
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
it('offers discussion navigation, numbered paragraphs and no annotation workspace',()=>{
  render(<TextReaderPage/>);
  expect(screen.getAllByLabelText('Reading text')).toHaveLength(1);
  expect(screen.getByLabelText('Paragraph 1')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/TQE|Notes|annotation/i})).not.toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Discuss text →'})).toHaveAttribute('href','/discussions/texts/text/class');
  fireEvent.click(screen.getByRole('button',{name:/More/}));
  expect(screen.getByRole('link',{name:/legacy/})).toHaveAttribute('href','/texts/text/legacy?classId=class');
});
