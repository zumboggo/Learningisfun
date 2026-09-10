import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { TextEditorModal } from '@/components/texts/TextEditorModal';
import type { LearningText, TextParagraph } from '@/types';
const load=vi.hoisted(()=>vi.fn());
vi.mock('@/services/text.service',()=>({loadTextForEditing:load,splitParagraphs:(value:string)=>value.split('\n\n')}));
vi.mock('dexie-react-hooks',()=>({useLiveQuery:()=>[]}));
vi.mock('@/components/common/MarkdownPasteEditor',()=>({MarkdownPasteEditor:({value}:{value:string})=><textarea aria-label="Text body" readOnly value={value}/>}));
afterEach(()=>{cleanup();load.mockReset();});
const text={$id:'text',title:'Reading',teacherId:'teacher',author:'',source:''} as LearningText;
it('waits for the complete server snapshot before initializing the editable draft',async()=>{
  let resolve!:(rows:TextParagraph[])=>void;
  load.mockReturnValue(new Promise<TextParagraph[]>(done=>{resolve=done;}));
  render(<TextEditorModal text={text} teacherId="teacher" classes={[]} onClose={()=>{}}/>);
  expect(screen.getByText('Loading text…')).toBeInTheDocument();
  expect(screen.queryByText('Save all changes')).not.toBeInTheDocument();
  await act(async()=>resolve([{$id:'one',textId:'text',sortOrder:0,content:'First complete paragraph'},{$id:'two',textId:'text',sortOrder:1,content:'Second complete paragraph'}]));
  expect(screen.getByLabelText('Text body')).toHaveValue('First complete paragraph\n\nSecond complete paragraph');
});
it('does not allow edits from an incomplete cache when the server fails',async()=>{
  load.mockRejectedValue(new Error('Offline'));
  render(<TextEditorModal text={text} teacherId="teacher" classes={[]} onClose={()=>{}}/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the complete text');
  expect(screen.queryByText('Save all changes')).not.toBeInTheDocument();
});
