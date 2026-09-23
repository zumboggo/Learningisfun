import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReadingDiscussionPage } from '@/pages/ReadingDiscussionPage';
import { currentReadingWeek, type ReadingDiscussionPost } from '@/services/reading-discussion.service';
const state = vi.hoisted(() => ({ posts: [] as ReadingDiscussionPost[] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { $id: 'student' } }) }));
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: vi.fn(async (request) => {
  if (request.action === 'readTexts') return { texts: [{ $id: 'text', title: 'The reading', author: 'Author', contentMode: 'full' }], paragraphs: [{ $id: 'p', textId: 'text', content: 'An exact paragraph from the reading.', sortOrder: 0 }] };
  if (request.action === 'voteReadingDiscussion') {
    const post = state.posts.find(p => p.id === request.postId)!;
    if (request.upvoted !== post.voted) post.score += request.upvoted ? 1 : -1;
    post.voted = request.upvoted;
  }
  return { title: 'The reading', className: 'Ethics', teacher: false, canWrite: true, posts: state.posts.map(p => ({ ...p })), participation: [] };
}) }));
const makePost = (id: string, score: number, parentId: string | null = null): ReadingDiscussionPost => ({ id, score, parentId, content: id, category: 'question', quotation: '', paragraph: null, label: 'Reader', teacher: false, mine: false, createdAt: '2026-09-22T12:00:00Z', hidden: false, locked: false, pinned: false, voted: false });
beforeEach(() => {
  localStorage.clear();
  state.posts = [makePost('First question?', 3), makePost('Second question?', 3), makePost('Low reply', 1, 'First question?'), makePost('High reply', 4, 'First question?'), { ...makePost('Earlier thought', 0), category: 'thought' }];
});
afterEach(cleanup);
const mount = () => render(<MemoryRouter initialEntries={['/discussions/texts/text/class']}><Routes><Route path="/discussions/texts/:textId/:classId" element={<ReadingDiscussionPage />} /></Routes></MemoryRouter>);
it('shows questions only, ranks a voted question first, and reveals replies in score order', async () => {
  mount(); await screen.findByRole('heading', { name: 'The reading' });
  expect(screen.queryByText('Low reply')).not.toBeInTheDocument();
  const first = screen.getByText('First question?').closest('article')!;
  fireEvent.click(within(first).getByRole('button', { name: /See replies/ }));
  expect(within(first).getAllByRole('article').map(node => node.textContent)).toEqual([expect.stringContaining('High reply'), expect.stringContaining('Low reply')]);
  const second = screen.getByText('Second question?').closest('article')!;
  fireEvent.click(within(second).getByRole('button', { name: 'Upvote: 3' }));
  await within(second).findByRole('button', { name: 'Remove upvote: 4' });
  expect(screen.getAllByRole('article')[0]).toBe(second);
  fireEvent.click(within(second).getByRole('button', { name: 'Remove upvote: 4' }));
  await within(second).findByRole('button', { name: 'Upvote: 3' });
});
it('only shows the simple quote input on reply and preserves it after cancelling', async () => {
  mount(); await screen.findByRole('heading', { name: 'The reading' });
  expect(screen.queryByPlaceholderText('Paste quote here')).not.toBeInTheDocument();
  const question = screen.getByText('First question?').closest('article')!;
  fireEvent.click(within(question).getByRole('button', { name: 'Reply' }));
  fireEvent.change(screen.getByPlaceholderText('Paste quote here'), { target: { value: 'A passage worth discussing.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(within(question).getByRole('button', { name: 'Reply' }));
  expect(screen.getByPlaceholderText('Paste quote here')).toHaveValue('A passage worth discussing.');
});
it('loads the actual reading beside the discussion without replacing the question draft', async () => {
  mount(); await screen.findByRole('heading', { name: 'The reading' });
  const input = screen.getByRole('textbox', { name: 'Your question' });
  fireEvent.change(input, { target: { value: 'My unfinished question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Parallel mode' }));
  expect(await screen.findByText('An exact paragraph from the reading.')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Your question' })).toBe(input);
  expect(input).toHaveValue('My unfinished question');
  fireEvent.click(screen.getByRole('button', { name: 'Parallel mode' }));
  expect(screen.queryByRole('complementary', { name: 'Reading text' })).not.toBeInTheDocument();
});
it('uses the Shanghai Monday boundary for Current Week', () => {
  expect(currentReadingWeek(new Date('2026-09-20T15:59:00Z'))).toBe('2026-09-14');
  expect(currentReadingWeek(new Date('2026-09-20T16:00:00Z'))).toBe('2026-09-21');
  expect(currentReadingWeek(new Date('2027-01-01T00:00:00Z'))).toBe('2026-12-28');
});
