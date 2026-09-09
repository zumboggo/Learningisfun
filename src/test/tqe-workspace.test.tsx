import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TqeWorkspace } from '@/components/texts/TqeWorkspace';

const execute = vi.fn();
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:(body:unknown)=>execute(body)}));
vi.mock('@/services/text.service',()=>({syncTextFromServer:vi.fn().mockResolvedValue(true)}));
describe('TQE workspace',()=>{
  beforeEach(()=>{execute.mockReset();execute.mockResolvedValue({records:[],roster:[],unlocked:false});});
  it('keeps the student exit draft and focus when switching participation preference',async()=>{
    render(<TqeWorkspace textId="text" classId="class" userId="student" teacher={false} annotations={[]}/>);
    await waitFor(()=>expect(execute).toHaveBeenCalled());
    const editor=screen.getByPlaceholderText('One sentence, in your own words.');
    editor.focus();fireEvent.change(editor,{target:{value:'I changed my reading.'}});
    fireEvent.click(screen.getByRole('radio',{name:'Show my annotations'}));
    await waitFor(()=>expect(execute).toHaveBeenCalledWith(expect.objectContaining({action:'saveTqe',kind:'door',choice:'annotations'})));
    expect(editor).toHaveValue('I changed my reading.');
  });
  it('does not offer teacher moderation or participation logs to students',async()=>{
    render(<TqeWorkspace textId="text" classId="class" userId="student" teacher={false} annotations={[]}/>);
    await waitFor(()=>expect(execute).toHaveBeenCalled());
    expect(screen.queryByRole('button',{name:'Present board'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Participation'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'groups'}));
    expect(screen.getByText(/Post a Thought, Question, and Epiphany/)).toBeInTheDocument();
  });
});
