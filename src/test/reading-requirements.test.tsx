import {expect,it,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {ReadingRequirementsPanel} from '@/components/texts/ReadingRequirements';
import {readingDiscussion,readingCompletion,type ReadingDiscussion} from '@/services/reading-discussion.service';
vi.mock('@/services/reading-discussion.service',async importOriginal=>({...await importOriginal<typeof import('@/services/reading-discussion.service')>(),readingDiscussion:vi.fn()}));
const requirements={questions:2,replies:2,replyQuoteRequired:true};
const student={id:'s',name:'Student',question:2,replies:2,quotedReplies:1,thought:0,connection:0};
const data:ReadingDiscussion={title:'Text',className:'Ethics',teacher:true,canWrite:true,posts:[],requirements,participation:[student]};
beforeEach(()=>vi.clearAllMocks());
it('requires quoted replies for completion only when assigned',()=>{
 expect(readingCompletion(student,requirements)).toBe(false);
 expect(readingCompletion(student,{...requirements,replyQuoteRequired:false})).toBe(true);
 expect(readingCompletion({...student,quotedReplies:2},requirements)).toBe(true);
 expect(readingCompletion(student,{questions:0,replies:0,replyQuoteRequired:true})).toBe(true);
});
it('saves requirements and displays completion evidence',async()=>{
 vi.mocked(readingDiscussion).mockResolvedValue({ok:true});
 const onSaved=vi.fn().mockResolvedValue(undefined);
 render(<ReadingRequirementsPanel textId="t" classId="c" data={data} onSaved={onSaved} showRoster/>);
 expect(screen.getByText('Incomplete')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Questions required'),{target:{value:'4'}});
 fireEvent.click(screen.getByLabelText('Replies must include a quote'));
 fireEvent.click(screen.getByText('Save requirements'));
 await waitFor(()=>expect(readingDiscussion).toHaveBeenCalledWith('setReadingRequirements','t','c',{requirements:{questions:4,replies:2,replyQuoteRequired:false}}));
 await waitFor(()=>expect(onSaved).toHaveBeenCalled());
});
it('shows students the saved instructions without editing controls',()=>{
 render(<ReadingRequirementsPanel textId="t" classId="c" data={{...data,teacher:false}}/>);
 expect(screen.getByText(/2 questions · 2 replies/)).toBeInTheDocument();
 expect(screen.queryByText('Save requirements')).not.toBeInTheDocument();
});
