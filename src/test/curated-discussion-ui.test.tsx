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
it('compares account drafts, limits selection to remaining spaces, and explicitly publishes',async()=>{
 const mutate=vi.fn().mockResolvedValue(undefined);render(<QuestionNotebook data={data} storageKey="notebook" busy={false} mutate={mutate}/>);
 expect(screen.getByText('2 of 3 questions published')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('checkbox',{name:'Select Why this image?'}));expect(screen.getByRole('checkbox',{name:'Select Why this ending?'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Publish selected questions (1)'}));await waitFor(()=>expect(mutate).toHaveBeenCalledWith('publishReadingQuestions',{draftIds:['d1']}));
});
it('retains unsaved draft after a failed save and recovers it after reopening',async()=>{
 const mutate=vi.fn().mockRejectedValue(Error('offline'));const props={data,storageKey:'notebook',busy:false,mutate};const {unmount}=render(<QuestionNotebook {...props}/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Draft question'}),{target:{value:'My best idea'}});fireEvent.click(screen.getByRole('button',{name:'Save private draft'}));await waitFor(()=>expect(mutate).toHaveBeenCalled());
 unmount();render(<QuestionNotebook {...props}/>);expect(screen.getByRole('textbox',{name:'Draft question'})).toHaveValue('My best idea');
 fireEvent.click(screen.getAllByRole('button',{name:'Edit draft'})[0]);expect(screen.getByRole('textbox',{name:'Draft question'})).toHaveValue('My best idea');expect(screen.getByRole('alert')).toHaveTextContent('Save your current draft');
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
