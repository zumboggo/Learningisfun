import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AssignmentRoundProgress } from '@/components/discussions/AssignmentRoundProgress';
import { ReplyAssignments } from '@/components/discussions/ReplyAssignments';
import type { ReadingDiscussion, ReplyAssignment } from '@/services/reading-discussion.service';
const assignments:ReplyAssignment[]=[{studentId:'done',questionId:'q',status:'completed'},{studentId:'pending',questionId:'q',status:'pending'},{studentId:'gap',questionId:null,status:'gap'}];
const names:Record<string,string>={done:'Alex',pending:'Bo',gap:'Chen'};
const studentName=(id:string)=>names[id];
beforeEach(()=>vi.useFakeTimers());
afterEach(()=>{cleanup();vi.useRealTimers();});
it('shows only unfinished names on demand and removes them at exactly three seconds',()=>{
 render(<AssignmentRoundProgress index={0} assignments={assignments} studentName={studentName}/>);
 expect(screen.getByText('Round 1 · 1 of 3 completed')).toBeInTheDocument();
 expect(screen.queryByText('Bo')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Not yet completed'}));
 expect(screen.getByText('Bo')).toBeVisible();expect(screen.getByText('Chen')).toBeVisible();expect(screen.queryByText('Alex')).not.toBeInTheDocument();
 act(()=>vi.advanceTimersByTime(2999));expect(screen.getByText('Bo')).toBeVisible();
 act(()=>vi.advanceTimersByTime(1));expect(screen.queryByText('Bo')).not.toBeInTheDocument();expect(screen.queryByRole('list')).not.toBeInTheDocument();
});
it('a second click restarts the three seconds, while data refresh does not',()=>{
 const {rerender}=render(<AssignmentRoundProgress index={0} assignments={assignments} studentName={studentName}/>);
 fireEvent.click(screen.getByRole('button'));act(()=>vi.advanceTimersByTime(2000));fireEvent.click(screen.getByRole('button'));
 act(()=>vi.advanceTimersByTime(2000));expect(screen.getByText('Bo')).toBeVisible();
 rerender(<AssignmentRoundProgress index={0} assignments={[...assignments]} studentName={studentName}/>);
 act(()=>vi.advanceTimersByTime(1000));expect(screen.queryByRole('list')).not.toBeInTheDocument();
});
it('hides names immediately on losing focus and clears timers on unmount',()=>{
 const {unmount}=render(<AssignmentRoundProgress index={0} assignments={assignments} studentName={studentName}/>);
 fireEvent.click(screen.getByRole('button'));fireEvent.blur(window);expect(screen.queryByRole('list')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button'));unmount();expect(vi.getTimerCount()).toBe(0);
});
it('disables the reveal when everyone has completed',()=>{
 render(<AssignmentRoundProgress index={0} assignments={[assignments[0]]} studentName={studentName}/>);
 expect(screen.getByRole('button')).toBeDisabled();
});
it('keeps the progress accessible with setup closed, without a persistent named status list',()=>{
 const data:ReadingDiscussion={title:'Reading',className:'Class',canWrite:true,teacher:true,posts:[],participation:Object.entries(names).map(([id,name])=>({id,name,thought:0,question:0,connection:0,replies:0})),rounds:[{id:'round',createdAt:'',assignments}]};
 render(<ReplyAssignments data={data} textId="text" classId="class" busy={false} mutate={vi.fn()} onReply={vi.fn()}/>);
 const progress=within(screen.getByRole('group',{name:'Round 1 progress'}));
 expect(progress.getByRole('button',{name:'Not yet completed'})).toBeVisible();
 expect(progress.queryByText('Bo')).not.toBeInTheDocument();
 expect(screen.getByText('Assign questions').closest('details')).not.toHaveAttribute('open');
});
it('never gives students the class progress reveal',()=>{
 const data:ReadingDiscussion={title:'Reading',className:'Class',canWrite:true,teacher:false,posts:[],participation:[],assignments:[],rounds:[{id:'round',createdAt:'',assignments}]};
 render(<ReplyAssignments data={data} textId="text" classId="class" busy={false} mutate={vi.fn()} onReply={vi.fn()}/>);
 expect(screen.queryByRole('button',{name:'Not yet completed'})).not.toBeInTheDocument();
});
