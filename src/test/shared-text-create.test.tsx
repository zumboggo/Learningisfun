import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const create=vi.hoisted(()=>vi.fn(async()=>({$id:'new'})));
vi.mock('@/services/text.service',()=>({createText:create,splitParagraphs:(s:string)=>s.split('\n\n').filter(Boolean)}));
vi.mock('@/components/texts/TextFileUpload',()=>({TextFileUpload:()=>null}));
vi.mock('@/components/texts/TextPublicSharing',()=>({PublicReadingChoice:({enabled}:{enabled:boolean})=><span>{enabled?'Public sharing on':'Private'}</span>}));
vi.mock('@/components/common/MarkdownPasteEditor',()=>({MarkdownPasteEditor:({value,onChange}:{value:string;onChange:(s:string)=>void})=><textarea aria-label="Text content" value={value} onChange={e=>onChange(e.target.value)}/>}));
import { CreateTextModal } from '@/components/texts/CreateTextModal';
it('prefills the class and preserves the selected week for a quick title-only entry',async()=>{
  render(<CreateTextModal teacherId="teacher" classes={[{id:'blue',name:'Blue'},{id:'red',name:'Red'}]} initialClassIds={['blue']} initialMode="link" allowTitleOnly assignedAt="2026-09-21T04:00:00.000Z" onClose={()=>{}}/>);
  expect(screen.getByRole('checkbox',{name:'Blue'})).toBeChecked();
  expect(screen.getByRole('checkbox',{name:'Red'})).not.toBeChecked();
  fireEvent.change(screen.getByPlaceholderText('Title'),{target:{value:'Shared reading'}});
  fireEvent.click(screen.getByRole('checkbox',{name:'Red'}));
  fireEvent.click(screen.getByRole('button',{name:'Save text'}));
  await waitFor(()=>expect(create).toHaveBeenCalledWith(expect.objectContaining({title:'Shared reading',classIds:['blue','red'],schedule:{assignedAt:'2026-09-21T04:00:00.000Z'},publicReadEnabled:true})));
});
it('full-text entry requires content and allows switching to the existing-text picker',()=>{
  const choose=vi.fn();
  render(<CreateTextModal teacherId="teacher" classes={[]} onClose={()=>{}} onChooseExisting={choose}/>);
  fireEvent.change(screen.getByPlaceholderText('Title'),{target:{value:'Essay'}});
  expect(screen.getByRole('button',{name:'Save text'})).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox',{name:'Text content'}),{target:{value:'A paragraph.'}});
  expect(screen.getByRole('button',{name:'Save text'})).not.toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Choose existing text instead'}));
  expect(choose).toHaveBeenCalledOnce();
});
