import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QuestionNotebook} from '@/components/discussions/QuestionNotebook';
import {DiscussionComposer} from '@/pages/ReadingDiscussionPage';
import {ParagraphCard} from '@/pages/TextReaderPage';
import {ReplyAssignments} from '@/components/discussions/ReplyAssignments';
import type {ReadingDiscussion} from '@/services/reading-discussion.service';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn()}));
beforeEach(()=>localStorage.clear());afterEach(cleanup);
const data:ReadingDiscussion={title:'Text',className:'Blue',teacher:false,canWrite:true,curatedReady:true,posts:[],participation:[],publishedCount:2,remainingSpaces:1,notebook:[{id:'d1',draftId:'original1',content:'Why this image?',updatedAt:'now'},{id:'d2',draftId:'original2',content:'Why this ending?',updatedAt:'now'}]};
it('recovers older saved questions with direct posting',async()=>{
 const mutate=vi.fn().mockResolvedValue(undefined);render(<QuestionNotebook data={data} storageKey="notebook" busy={false} mutate={mutate}/>);
 fireEvent.click(screen.getByText('Previously saved questions (2)'));
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
 fireEvent.click(screen.getAllByRole('button',{name:'Post question to class'})[0]);
 await waitFor(()=>expect(mutate).toHaveBeenCalledWith('publishReadingQuestions',{draftIds:['d1']}));
});
it('retains an unsent question after a failed post and recovers it after reopening',async()=>{
 const onSubmit=vi.fn().mockRejectedValue(Error('offline'));const props={storageKey:'question',category:'question' as const,busy:false,onSubmit};
 const {unmount}=render(<DiscussionComposer {...props}/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Your question'}),{target:{value:'My best idea'}});
 fireEvent.click(screen.getByRole('button',{name:'Post question'}));await waitFor(()=>expect(onSubmit).toHaveBeenCalled());
 unmount();render(<DiscussionComposer {...props}/>);expect(screen.getByRole('textbox',{name:'Your question'})).toHaveValue('My best idea');
});
it('inserts exact quote and reference without replacing reply writing, and does not duplicate on refresh',()=>{
 const props={storageKey:'reply',category:'question' as const,busy:false,onSubmit:vi.fn(),onCancel:vi.fn()};const {rerender}=render(<DiscussionComposer {...props}/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Your reply'}),{target:{value:'My reasoning'}});
 const quote={quotation:'  Exact words. ',paragraph:4,token:'quote1'};rerender(<DiscussionComposer {...props} quote={quote}/>);
 expect(screen.getByRole('textbox',{name:'Your reply'})).toHaveValue('My reasoning');expect(screen.getByRole('textbox',{name:'Quotation'})).toHaveValue('  Exact words. ');expect(screen.getByRole('spinbutton')).toHaveValue(4);
 expect(screen.getByText('Explain how this passage supports or challenges your answer.')).toBeInTheDocument();
 rerender(<DiscussionComposer {...props} quote={quote}/>);expect(screen.getByRole('textbox',{name:'Your reply'})).toHaveValue('My reasoning');
 rerender(<DiscussionComposer {...props} quote={{quotation:'A second passage.',paragraph:7,token:'quote2'}}/>);expect(screen.getByRole('textbox',{name:'Your reply'})).toHaveValue('My reasoning\n\n“A second passage.” — paragraph 7');
});
it('selected passage offers Use in my reply with exact words and paragraph',()=>{
 const useQuote=vi.fn();render(<MemoryRouter><ParagraphCard paragraph={{$id:'p',textId:'t',sortOrder:0,content:'Exact original words.'}} index={2} onUseQuote={useQuote}/></MemoryRouter>);
 const text=screen.getByText('Exact original words.').firstChild!,range=document.createRange();range.setStart(text,0);range.setEnd(text,5);window.getSelection()?.removeAllRanges();window.getSelection()?.addRange(range);fireEvent(document,new Event('selectionchange'));
 fireEvent.click(screen.getByRole('button',{name:'Use in my reply'}));expect(useQuote).toHaveBeenCalledWith({quotation:'Exact',paragraph:3});
});
it('assigned question opens a direct reply and leaves free choice available',()=>{
 const onReply=vi.fn();render(<ReplyAssignments data={{...data,assignments:[{studentId:'me',questionId:'q',roundId:'round',status:'pending'}],posts:[{id:'q',content:'A class question'} as ReadingDiscussion['posts'][number]]}} textId="text" classId="blue" busy={false} mutate={vi.fn()} onReply={onReply}/>);
 expect(screen.getByText(/You can also reply anywhere else/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Answer assigned question'}));expect(onReply).toHaveBeenCalledWith('q');
});
