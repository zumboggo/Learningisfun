import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateGroupsModal } from '@/components/teacher/CreateGroupsModal';
const students=[{id:'a',name:'Alex'},{id:'b',name:'Blair'},{id:'c',name:'Casey'}];
vi.mock('@/components/common/CopyButton',()=>({CopyButton:({text}:{text:string})=><pre data-testid="copy">{text}</pre>}));
it('excludes absent students before grouping and from copied output',()=>{
  render(<CreateGroupsModal open students={students} onClose={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Exclude Blair from groups'}));
  fireEvent.click(screen.getByRole('button',{name:'Make groups'}));
  expect(screen.getByTestId('copy')).not.toHaveTextContent('Blair');
  expect(screen.getByTestId('copy')).toHaveTextContent('Alex');
  expect(students).toHaveLength(3);
});
it('removes a student after grouping, excludes them on reshuffle, and allows restoring',()=>{
  render(<CreateGroupsModal open students={students} onClose={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:'Make groups'}));
  fireEvent.click(screen.getByRole('button',{name:'Mark Alex absent'}));
  expect(screen.getByTestId('copy')).not.toHaveTextContent('Alex');
  fireEvent.click(screen.getByRole('button',{name:'Shuffle again'}));
  expect(screen.getByTestId('copy')).not.toHaveTextContent('Alex');
  fireEvent.click(screen.getByRole('button',{name:'Restore Alex to groups'}));
  fireEvent.click(screen.getByRole('button',{name:'Make groups'}));
  expect(screen.getByTestId('copy')).toHaveTextContent('Alex');
});
it('disables grouping when everyone is absent and resets attendance on reopening',()=>{
  const props={students,onClose:()=>{}};
  const {rerender}=render(<CreateGroupsModal open {...props}/>);
  for(const student of students)fireEvent.click(screen.getByRole('button',{name:`Exclude ${student.name} from groups`}));
  expect(screen.getByRole('button',{name:'Make groups'})).toBeDisabled();
  rerender(<CreateGroupsModal open={false} {...props}/>);
  rerender(<CreateGroupsModal open {...props}/>);
  expect(screen.getByRole('button',{name:'Make groups'})).not.toBeDisabled();
  expect(screen.getByRole('button',{name:'Exclude Alex from groups'})).toBeInTheDocument();
});

it('splits odd groups into A/B without reshuffling and includes sides in copy',()=>{
 render(<CreateGroupsModal open students={students} onClose={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Make groups'}));
 const original=screen.getByTestId('copy').textContent!;
 fireEvent.click(screen.getByRole('checkbox',{name:'A and B sides'}));
 const copied=screen.getByTestId('copy').textContent!;
 expect(copied).toMatch(/A: [^\n]+, [^\n]+\nB: [^\n]+/);
 for(const student of students)expect(copied).toContain(student.name);
 fireEvent.click(screen.getByRole('checkbox',{name:'A and B sides'}));
 expect(screen.getByTestId('copy').textContent).toBe(original);
});
