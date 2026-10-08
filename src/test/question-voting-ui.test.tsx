import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QuestionVoting } from '@/components/discussions/QuestionVoting';
import type { ReadingDiscussion } from '@/services/reading-discussion.service';
afterEach(cleanup);
const data: ReadingDiscussion = { title:'Essay',className:'Blue',teacher:true,canWrite:true,posts:[],participation:[] };

it('defaults to 3 by 3 and submits teacher overrides with a stable retry ID',async()=>{
  const mutate=vi.fn().mockRejectedValueOnce(Error('Offline')).mockResolvedValueOnce(undefined);
  render(<QuestionVoting data={data} busy={false} mutate={mutate}/>);
  fireEvent.click(screen.getByRole('button',{name:'Vote on Questions'}));
  const modal=within(screen.getByRole('dialog'));
  expect(modal.getByLabelText('Rounds per student')).toHaveValue(3);
  expect(modal.getByLabelText('Questions per round')).toHaveValue(3);
  fireEvent.change(modal.getByLabelText('Rounds per student'),{target:{value:'4'}});
  fireEvent.change(modal.getByLabelText('Questions per round'),{target:{value:'5'}});
  fireEvent.click(modal.getByRole('button',{name:'Start voting'}));
  await modal.findByRole('alert');expect(modal.getByRole('alert')).toHaveTextContent('Offline');
  expect(mutate).toHaveBeenCalledWith('startReadingQuestionVoting',{roundCount:4,questionsPerRound:5,requestId:expect.any(String)});
  const requestId=mutate.mock.calls[0][1].requestId;
  fireEvent.click(modal.getByRole('button',{name:'Start voting'}));
  await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(mutate.mock.calls[1][1].requestId).toBe(requestId);
});

it('shows only the current three options, submits one choice, and resumes at the next round',async()=>{
  const mutate=vi.fn().mockResolvedValue(undefined);
  const posts=Array.from({length:9},(_,i)=>({id:`q${i}`,content:`Question ${i}?`})) as ReadingDiscussion['posts'];
  const student={...data,teacher:false,posts,voting:{sessionId:'session',active:true,questionsPerRound:3,totalRounds:3,completedRounds:0,completed:false,choices:[],questionIds:['q0','q1','q2']}};
  const {rerender}=render(<QuestionVoting data={student} busy={false} mutate={mutate}/>);
  expect(screen.getAllByRole('button',{name:'Choose this question'})).toHaveLength(3);
  expect(screen.queryByText('Question 3?')).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button',{name:'Choose this question'})[1]);
  await waitFor(()=>expect(mutate).toHaveBeenCalledWith('chooseReadingQuestionVote',{sessionId:'session',roundIndex:0,postId:'q1'}));
  rerender(<QuestionVoting data={{...student,voting:{...student.voting,completedRounds:1,choices:['q1'],questionIds:['q3','q4','q5']}}} busy={false} mutate={mutate}/>);
  expect(screen.getByRole('heading',{name:'Vote on Questions · Round 2 of 3'})).toBeInTheDocument();
  expect(screen.queryByText('Question 1?')).not.toBeInTheDocument();
  rerender(<QuestionVoting data={{...student,voting:{...student.voting,completed:true,completedRounds:3,choices:['q1','q3','q7'],questionIds:[]}}} busy={false} mutate={mutate}/>);
  expect(screen.getByRole('heading',{name:'Voting complete'})).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Choose this question'})).not.toBeInTheDocument();
});

it('shows teacher progress and end control, and keeps parent accounts read-only',()=>{
  const mutate=vi.fn().mockResolvedValue(undefined);
  const voting={sessionId:'session',active:true,roundCount:3,questionsPerRound:3,progress:[{studentId:'s',completedRounds:3,totalRounds:3,completed:true}]};
  const {rerender}=render(<QuestionVoting data={{...data,voting}} busy={false} mutate={mutate}/>);
  expect(screen.getByRole('button',{name:'Vote on Questions'})).toBeDisabled();
  expect(screen.getByText(/1 of 1 students finished/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'End voting'}));
  expect(mutate).toHaveBeenCalledWith('endReadingQuestionVoting',{sessionId:'session'});
  rerender(<QuestionVoting data={{...data,teacher:false,canWrite:false,voting}} busy={false} mutate={mutate}/>);
  expect(screen.queryByRole('region',{name:'Question voting'})).not.toBeInTheDocument();
});
