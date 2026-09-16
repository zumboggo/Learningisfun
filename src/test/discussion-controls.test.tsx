import { useState } from 'react';
import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiscussionVote, DiscussionModeration, DiscussionTextInput, SimpleDiscussionComposer } from '@/components/discussions/DiscussionControls';
beforeEach(()=>localStorage.clear());
it('keeps cancelled or failed replies and clears only a successfully posted draft',async()=>{
  const submit=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined),cancel=vi.fn();
  const props={storageKey:'user:class:post',onSubmit:submit,onCancel:cancel};
  const {unmount}=render(<SimpleDiscussionComposer {...props}/>);
  fireEvent.change(screen.getByRole('textbox',{name:'Your contribution'}),{target:{value:'Keep this'}});
  fireEvent.click(screen.getByRole('button',{name:'Cancel'}));expect(localStorage.getItem(props.storageKey)).toBe('Keep this');
  unmount();render(<SimpleDiscussionComposer {...props}/>);
  expect(screen.getByRole('textbox')).toHaveValue('Keep this');
  fireEvent.click(screen.getByRole('button',{name:'Post'}));
  await screen.findByRole('alert');expect(localStorage.getItem(props.storageKey)).toBe('Keep this');
  fireEvent.click(screen.getByRole('button',{name:'Post'}));
  await waitFor(()=>expect(localStorage.getItem(props.storageKey)).toBeNull());
});
it('offers no downvote for text discussions and supports vote removal and failed retries',async()=>{
  const vote=vi.fn().mockRejectedValueOnce(new Error('offline'));
  render(<DiscussionVote score={2} value={1} onVote={vote}/>);
  expect(screen.queryByRole('button',{name:'Downvote'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Remove upvote'}));
  await screen.findByRole('alert');expect(vote).toHaveBeenCalledWith(0);
  expect(screen.getByRole('button',{name:'Remove upvote'})).not.toBeDisabled();
});
it('requires explicit confirmation before permanent moderation deletion',()=>{
  const run=vi.fn(),confirm=vi.spyOn(window,'confirm').mockReturnValue(false);
  render(<DiscussionModeration actions={[{label:'Delete',run,confirm:'Delete permanently?'}]}/>);
  fireEvent.click(screen.getByText('Moderate ▾'));fireEvent.click(screen.getByRole('button',{name:'Delete'}));
  expect(confirm).toHaveBeenCalled();expect(run).not.toHaveBeenCalled();confirm.mockRestore();
});
it('uses one validated link editor and inserts a named link in the draft',()=>{
  function Harness(){const[value,setValue]=useState('Quote');return <DiscussionTextInput value={value} onChange={setValue} label="Reply"/>;}
  render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:/Add link/}));
  fireEvent.change(screen.getByLabelText('Page title'),{target:{value:'Source'}});
  fireEvent.change(screen.getByLabelText('Link'),{target:{value:'javascript:alert(1)'}});
  expect(screen.getByRole('button',{name:'Insert link'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Link'),{target:{value:'https://example.com/article'}});
  fireEvent.click(screen.getByRole('button',{name:'Insert link'}));
  expect(screen.getByRole('textbox',{name:'Reply'})).toHaveValue('Quote\n[Source](https://example.com/article)');
});
