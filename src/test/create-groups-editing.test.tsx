import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CreateGroupsModal } from '@/components/teacher/CreateGroupsModal';
import { moveGroupStudent } from '@/services/class-picker';

vi.mock('@/components/common/CopyButton', () => ({ CopyButton: ({ text }: { text: string }) => <pre data-testid="copy">{text}</pre> }));
const students = Array.from({ length: 8 }, (_, i) => ({ id: String(i), name: `Student ${i}` }));
function setup() {
  render(<CreateGroupsModal open students={students} onClose={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Make groups' }));
  const source = screen.getByRole('region', { name: 'Group 1' });
  const target = screen.getByRole('region', { name: 'Group 2' });
  const select = within(source).getAllByRole('combobox')[0];
  const name = select.getAttribute('aria-label')!.replace('Move ', '').replace(' to group', '');
  return { source, target, select, name };
}
it('moves students with the dropdown and updates counts, sides and copied output', () => {
  const { source, target, select, name } = setup();
  fireEvent.click(screen.getByRole('checkbox', { name: 'A and B sides' }));
  fireEvent.change(select, { target: { value: '1' } });
  expect(within(source).queryByRole('combobox', { name: `Move ${name} to group` })).toBeNull();
  expect(within(target).getAllByRole('combobox')).toHaveLength(5);
  expect(within(source).getByRole('heading')).toHaveTextContent('(3)');
  expect(screen.getByRole('status')).toHaveTextContent(`${name} moved to Group 2`);
  expect(screen.getByTestId('copy').textContent!.split('Group 2')[1]).toContain(name);
  expect(screen.getByTestId('copy').textContent!.split('Group 2')[0]).not.toContain(name);
});
it('accepts dragging a name into another group', () => {
  const { source, target, name } = setup();
  const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' };
  fireEvent.dragStart(within(source).getByText(name), { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  expect(target).toHaveClass('border-blue-500');
  fireEvent.drop(target, { dataTransfer });
  expect(within(target).getByRole('combobox', { name: `Move ${name} to group` })).toBeInTheDocument();
  expect(target).not.toHaveClass('border-blue-500');
});
it('keeps emptied groups available and moves back without duplicates or mutating the original', () => {
  const original = [[students[0]], [students[1]]];
  const moved = moveGroupStudent(original, '0', 1);
  expect(moved[0]).toEqual([]);
  expect(moved[1]).toEqual([students[1], students[0]]);
  expect(original[0]).toEqual([students[0]]);
  expect(moveGroupStudent(moved, '0', 0)).toEqual(original);
  expect(moveGroupStudent(moved, '0', 1)).toBe(moved);
  expect(moveGroupStudent(moved, 'missing', 0)).toBe(moved);
  expect(moveGroupStudent(moved, '0', -1)).toBe(moved);
});
