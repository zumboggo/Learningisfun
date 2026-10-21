import './dialog-mock';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { StudentPicker } from '@/components/discussions/StudentPicker';
import { PresentQuestions } from '@/components/discussions/PresentQuestions';
const mocks = vi.hoisted(() => ({ sync: vi.fn(), members: vi.fn(), users: vi.fn(), filter: vi.fn() }));
vi.mock('@/services/class.service', () => ({ syncClassRosterFromServer: mocks.sync }));
vi.mock('@/db/schema', () => ({ db: {
  class_members: { where: () => ({ equals: () => ({ filter: mocks.filter }) }) },
  users: { bulkGet: mocks.users },
} }));
const students = [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Bo' }, { id: 'c', name: 'Chen' }];
const pick = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Pick Student' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pick Student' })).toBeEnabled());
  return screen.getByRole('status', { name: 'Selected student' }).textContent;
};
beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('draws every student once before starting a new random round', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(.5);
  render(<StudentPicker classId="blue" students={students} />);
  const round = [await pick(), await pick(), await pick()];
  expect(new Set(round)).toEqual(new Set(['Alex', 'Bo', 'Chen']));
  expect(mocks.sync).not.toHaveBeenCalled();
  expect(await pick()).toBe('Bo');
  expect(JSON.parse(sessionStorage.getItem('discussion-student-picker:blue')!)).toEqual(['b']);
});
it('retains the class round on reopening while keeping different classes separate', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  let view = render(<StudentPicker classId="blue" students={students} />);
  expect(await pick()).toBe('Alex'); view.unmount();
  view = render(<StudentPicker classId="blue" students={students} />);
  expect(await pick()).toBe('Bo'); view.unmount();
  render(<StudentPicker classId="red" students={students} />);
  expect(await pick()).toBe('Alex');
});
it('uses student IDs for duplicate names and handles roster changes', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const roster = [{ id:'a',name:'Alex' },{ id:'b',name:'Alex' },{ id:'a',name:'Alex' }];
  const { rerender } = render(<StudentPicker classId="blue" students={roster} />);
  await pick(); await pick();
  expect(JSON.parse(sessionStorage.getItem('discussion-student-picker:blue')!)).toEqual(['a','b']);
  rerender(<StudentPicker classId="blue" students={[...roster,{id:'c',name:'Chen'}]} />);
  expect(await pick()).toBe('Chen');
});
it('loads the full class roster on demand and excludes non-student memberships', async () => {
  mocks.sync.mockResolvedValue(undefined);
  mocks.filter.mockImplementation(predicate => ({ toArray: async () => [{userId:'teacher',role:'teacher'},{userId:'a',role:'student'},{userId:'b',role:'student'}].filter(predicate) }));
  mocks.users.mockResolvedValue([{$id:'a',name:'Alex'},{$id:'b',name:'Bo'}]);
  render(<StudentPicker classId="blue" />);
  expect(mocks.sync).not.toHaveBeenCalled();
  await pick();
  expect(mocks.sync).toHaveBeenCalledWith('blue');
  expect(mocks.users).toHaveBeenCalledWith(['a','b']);
  await pick(); expect(mocks.sync).toHaveBeenCalledTimes(1);
});
it('reports empty rosters and load failures without consuming a draw', async () => {
  mocks.sync.mockRejectedValueOnce(new Error('Offline'));
  render(<StudentPicker classId="blue" />);
  await pick(); expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
  mocks.sync.mockResolvedValue(undefined);
  mocks.filter.mockReturnValue({toArray:async()=>[]}); mocks.users.mockResolvedValue([]);
  await pick(); expect(screen.getByRole('alert')).toHaveTextContent('No students');
  expect(sessionStorage.getItem('discussion-student-picker:blue')).toBeNull();
});
it('picking a student leaves the question unchanged and navigation retains the name', async () => {
  render(<PresentQuestions questions={['First question','Second question']} picker={{classId:'blue',students}} />);
  fireEvent.click(screen.getByText('Present Questions'));
  const dialog = within(screen.getByRole('dialog'));
  const name = await pick();
  expect(dialog.getByText('First question')).toBeInTheDocument();
  fireEvent.keyDown(document,{key:'ArrowRight'});
  expect(dialog.getByText('Second question')).toBeInTheDocument();
  expect(screen.getByRole('status',{name:'Selected student'})).toHaveTextContent(name!);
  const event = new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true});
  screen.getByRole('button',{name:'Pick Student'}).dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
});
