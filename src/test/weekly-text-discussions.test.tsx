import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TextDiscussionButton } from '@/components/texts/TextDiscussionButton';
import { useWeeklyTextDiscussions } from '@/hooks/useWeeklyTextDiscussions';
import type { ReadingDiscussionListing } from '@/services/reading-discussion.service';

const execute = vi.hoisted(() => vi.fn());
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: execute }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const reading: ReadingDiscussionListing = { id: 'reading', textId: 'essay', classId: 'blue', title: 'Essay', className: 'Blue', date: '2026-10-05', available: true, questionCount: 0, replyCount: 0 };

it.each([{ questionCount: 1, replyCount: 0 }, { questionCount: 0, replyCount: 1 }])('darkens for any question or reply: %j', counts => {
  const { rerender } = render(<MemoryRouter><TextDiscussionButton discussion={reading} /></MemoryRouter>);
  const link = screen.getByRole('link', { name: 'Discussion for Essay' });
  expect(link).toHaveTextContent('Discussion');
  expect(link).toHaveAttribute('href', '/discussions/texts/essay/blue');
  expect(link).toHaveClass('bg-purple-100');
  rerender(<MemoryRouter><TextDiscussionButton discussion={{ ...reading, ...counts }} /></MemoryRouter>);
  expect(link).toHaveClass('bg-purple-800', 'text-white');
  expect(link).toHaveAccessibleName('Discussion for Essay · questions or replies available');
});

it('omits the button when a text has no available discussion', () => {
  const { rerender } = render(<MemoryRouter><TextDiscussionButton /></MemoryRouter>);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  rerender(<MemoryRouter><TextDiscussionButton discussion={{ ...reading, available: false }} /></MemoryRouter>);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

function WeeklyTexts({ classId = 'blue' }: { classId?: string }) {
  const discussions = useWeeklyTextDiscussions(classId, 'student');
  return <MemoryRouter>{discussions.map(row => <TextDiscussionButton key={row.id} discussion={row} />)}</MemoryRouter>;
}

it('uses only released discussions in this class and refreshes activity on return', async () => {
  execute.mockResolvedValueOnce({ readings: [reading, { ...reading, id: 'red', classId: 'red', title: 'Other class' }, { ...reading, id: 'later', textId: 'later', title: 'Unreleased', available: false }] });
  render(<WeeklyTexts />);
  const link = await screen.findByRole('link', { name: 'Discussion for Essay' });
  expect(screen.getAllByRole('link')).toHaveLength(1);
  execute.mockResolvedValueOnce({ readings: [{ ...reading, replyCount: 1 }] });
  fireEvent.focus(window);
  await waitFor(() => expect(link).toHaveClass('bg-purple-800'));
  execute.mockRejectedValueOnce(Error('Offline'));
  fireEvent.focus(window);
  await waitFor(() => expect(execute).toHaveBeenCalledTimes(3));
  expect(link).toHaveClass('bg-purple-800');
});

it('discards stale results when changing classes', async () => {
  let resolveBlue!: (result: { readings: ReadingDiscussionListing[] }) => void;
  execute.mockReturnValueOnce(new Promise(resolve => { resolveBlue = resolve; }));
  const { rerender } = render(<WeeklyTexts />);
  execute.mockResolvedValueOnce({ readings: [{ ...reading, classId: 'red', title: 'Red essay' }] });
  rerender(<WeeklyTexts classId="red" />);
  await screen.findByRole('link', { name: 'Discussion for Red essay' });
  resolveBlue({ readings: [reading] });
  await waitFor(() => expect(screen.queryByRole('link', { name: 'Discussion for Essay' })).not.toBeInTheDocument());
});
