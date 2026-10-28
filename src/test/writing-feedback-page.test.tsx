import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {WritingPage} from '@/pages/WritingPage';
const generate=vi.fn();
vi.mock('@/services/writing-feedback.service',()=>({generatePersonalWritingFeedback:(...args:unknown[])=>generate(...args)}));
afterEach(cleanup);
it('keeps Dangerous Writing without an AI feedback screen or request',()=>{render(<MemoryRouter><WritingPage/></MemoryRouter>);expect(screen.getByRole('textbox',{name:'Dangerous writing text'})).toBeVisible();expect(screen.queryByRole('button',{name:/Generate AI Feedback/})).not.toBeInTheDocument();expect(screen.queryByText('Writing Feedback')).not.toBeInTheDocument();expect(generate).not.toHaveBeenCalled();});
