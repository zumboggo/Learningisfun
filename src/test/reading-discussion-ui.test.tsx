import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DiscussionComposer } from '@/pages/ReadingDiscussionPage';
import { ParagraphCard } from '@/pages/TextReaderPage';
import { readingWeek, sortedReadingPosts, type ReadingDiscussionPost } from '@/services/reading-discussion.service';
beforeEach(()=>localStorage.clear());afterEach(cleanup);
it('preserves draft, quote and reference across unmounts and category-specific storage',()=>{
  const props={storageKey:'user:text:blue:thought',category:'thought' as const,busy:false,onSubmit:vi.fn()};
  const {unmount}=render(<DiscussionComposer {...props}/>);
  fireEvent.change(screen.getByRole('textbox',{name:'Your contribution'}),{target:{value:'My thought'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Quotation'}),{target:{value:'Exact words'}});
  fireEvent.change(screen.getByRole('spinbutton',{name:/Paragraph/}),{target:{value:'3'}});
  unmount();render(<DiscussionComposer {...props}/>);
  expect(screen.getByRole('textbox',{name:'Your contribution'})).toHaveValue('My thought');
  expect(screen.getByRole('textbox',{name:'Quotation'})).toHaveValue('Exact words');
  expect(screen.getByRole('spinbutton')).toHaveValue(3);
  expect(localStorage.getItem('user:text:red:thought')).toBeNull();
});
it('retains the input node/focus on updates and clears the draft only on successful post',async()=>{
  const onSubmit=vi.fn().mockRejectedValueOnce(Error('Offline')).mockResolvedValueOnce({});
  const props={storageKey:'draft',category:'question' as const,busy:false,onSubmit};
  const {rerender}=render(<DiscussionComposer {...props}/>);
  const input=screen.getByRole('textbox',{name:'Your contribution'});input.focus();fireEvent.change(input,{target:{value:'Why?'}});
  rerender(<DiscussionComposer {...props} busy/>);expect(screen.getByRole('textbox',{name:'Your contribution'})).toBe(input);expect(input).toHaveFocus();
  rerender(<DiscussionComposer {...props}/>);
  fireEvent.submit(input.closest('form')!);await waitFor(()=>expect(onSubmit).toHaveBeenCalledTimes(1));expect(input).toHaveValue('Why?');expect(localStorage.getItem('draft')).toContain('Why?');
  fireEvent.submit(input.closest('form')!);await waitFor(()=>expect(input).toHaveValue(''));expect(localStorage.getItem('draft')).toBeNull();
});
it('supports cancelling replies without erasing the draft',()=>{
  const onCancel=vi.fn();render(<DiscussionComposer storageKey="reply" category="thought" busy={false} onSubmit={vi.fn()} onCancel={onCancel}/>);
  fireEvent.change(screen.getByRole('textbox',{name:'Your reply'}),{target:{value:'A reply'}});fireEvent.click(screen.getByRole('button',{name:'Cancel'}));expect(onCancel).toHaveBeenCalled();expect(localStorage.getItem('reply')).toContain('A reply');
});
it('copies the selected words and paragraph number using keyboard-capable selection events',async()=>{
  const writeText=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{value:{writeText},configurable:true});
  render(<MemoryRouter><ParagraphCard paragraph={{$id:'p',textId:'t',sortOrder:0,content:'Exact original words.'}} index={2}/></MemoryRouter>);
  const text=screen.getByText('Exact original words.').firstChild!;
  const range=document.createRange();range.setStart(text,0);range.setEnd(text,5);window.getSelection()?.removeAllRanges();window.getSelection()?.addRange(range);
  fireEvent(document,new Event('selectionchange'));fireEvent.click(screen.getByRole('button',{name:'Copy quote + paragraph'}));
  await waitFor(()=>expect(writeText).toHaveBeenCalledWith('“Exact” — paragraph 3'));
  expect(screen.queryByRole('button',{name:/Annotate/})).not.toBeInTheDocument();
});
it('sorts by new/top/unanswered and resolves Monday without local-time shifts',()=>{
  const base={category:'question',parentId:null,pinned:false,hidden:false} as ReadingDiscussionPost;
  const posts=[{...base,id:'old',createdAt:'2026-09-01',score:9},{...base,id:'new',createdAt:'2026-09-02',score:1},{...base,id:'reply',parentId:'old',createdAt:'2026-09-03',score:0}];
  expect(sortedReadingPosts(posts,'question','new').map(p=>p.id)).toEqual(['new','old']);
  expect(sortedReadingPosts(posts,'question','top')[0].id).toBe('old');
  expect(sortedReadingPosts(posts,'question','unanswered').map(p=>p.id)).toEqual(['new']);
  expect(readingWeek('2026-09-15')).toBe('2026-09-14');
});
