import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReadingDiscussionPage } from '@/pages/ReadingDiscussionPage';
import { currentReadingWeek, type ReadingDiscussionPost } from '@/services/reading-discussion.service';
const state = vi.hoisted(() => ({ posts: [] as ReadingDiscussionPost[], voteGate: null as Promise<void> | null, readGate: null as Promise<void> | null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { $id: 'student' } }) }));
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: vi.fn(async (request) => {
  if (request.action === 'readTexts') return { texts: [{ $id: 'text', title: 'The reading', author: 'Author', contentMode: 'full' }], paragraphs: [{ $id: 'p', textId: 'text', content: 'An exact paragraph from the reading.', sortOrder: 0 }] };
  if (request.action === 'readReadingDiscussion' && state.readGate) {
    const snapshot = state.posts.map(p => ({ ...p }));
    await state.readGate;
    return { title: 'The reading', className: 'Ethics', teacher: false, canWrite: true, posts: snapshot, participation: [] };
  }
  if (request.action === 'voteReadingDiscussion') {
    if (state.voteGate) await state.voteGate;
    const post = state.posts.find(p => p.id === request.postId)!;
    if (request.upvoted !== post.voted) post.score += request.upvoted ? 1 : -1;
    post.voted = request.upvoted;
  }
  return { title: 'The reading', className: 'Ethics', teacher: false, canWrite: true, posts: state.posts.map(p => ({ ...p })), participation: [] };
}) }));
const makePost = (id: string, score: number, parentId: string | null = null): ReadingDiscussionPost => ({ id, score, parentId, content: id, category: 'question', quotation: '', paragraph: null, label: 'Reader', teacher: false, mine: false, createdAt: '2026-09-22T12:00:00Z', hidden: false, locked: false, pinned: false, voted: false });
beforeEach(() => {
  localStorage.clear(); state.voteGate = null; state.readGate = null;
  state.posts = [makePost('First question?', 3), makePost('Second question?', 3), makePost('Low reply', 1, 'First question?'), makePost('High reply', 4, 'First question?'), { ...makePost('Earlier thought', 0), category: 'thought' }];
});
afterEach(cleanup);
const mount = () => render(<MemoryRouter initialEntries={['/discussions/texts/text/class']}><Routes><Route path="/discussions/texts/:textId/:classId" element={<ReadingDiscussionPage />} /></Routes></MemoryRouter>);
it('shows questions only, ranks a voted question first, and reveals replies in score order', async () => {
  mount(); await screen.findByRole('heading', { name: 'The reading', level: 1 });
  expect(screen.queryByText('Low reply')).not.toBeInTheDocument();
  const first = screen.getByText('First question?').closest('article')!;
  fireEvent.click(within(first).getByRole('button', { name: /See replies/ }));
  expect(within(first).getAllByRole('article').map(node => node.textContent)).toEqual([expect.stringContaining('High reply'), expect.stringContaining('Low reply')]);
  const second = screen.getByText('Second question?').closest('article')!;
  fireEvent.click(within(second).getByRole('button', { name: 'Upvote: 3' }));
  await within(second).findByRole('button', { name: 'Remove upvote: 4' });
  expect(screen.getAllByRole('article')[0]).toBe(second);
  await waitFor(() => expect(within(second).getByRole('button', { name: 'Remove upvote: 4' })).toBeEnabled());
  fireEvent.click(within(second).getByRole('button', { name: 'Remove upvote: 4' }));
  await within(second).findByRole('button', { name: 'Upvote: 3' });
});
it('only shows the simple quote input on reply and preserves it after cancelling', async () => {
  mount(); await screen.findByRole('heading', { name: 'The reading', level: 1 });
  expect(screen.queryByPlaceholderText('Paste quote here')).not.toBeInTheDocument();
  const question = screen.getByText('First question?').closest('article')!;
  fireEvent.click(within(question).getByRole('button', { name: 'Reply' }));
  fireEvent.change(screen.getByPlaceholderText('Paste quote here'), { target: { value: 'A passage worth discussing.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(within(question).getByRole('button', { name: 'Reply' }));
  expect(screen.getByPlaceholderText('Paste quote here')).toHaveValue('A passage worth discussing.');
});
it('loads the actual reading beside the discussion without replacing the question draft', async () => {
  mount(); await screen.findByRole('heading', { name: 'The reading', level: 1 });
  const input = screen.getByRole('textbox', { name: 'Your question' });
  fireEvent.change(input, { target: { value: 'My unfinished question' } });
  fireEvent.click(screen.getByRole('button', { name: 'Parallel' }));
  expect(await screen.findByText('An exact paragraph from the reading.')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Your question' })).toBe(input);
  expect(input).toHaveValue('My unfinished question');
  fireEvent.click(screen.getByRole('button', { name: 'Discussion only' }));
  expect(screen.queryByRole('complementary', { name: 'Reading text' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Text only' }));
  expect(screen.getByRole('complementary', { name: 'Reading text' })).toBeVisible();
  expect(screen.queryByRole('textbox', { name: 'Your question' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Parallel' }));
  expect(screen.getByRole('textbox', { name: 'Your question' })).toBe(input);
  expect(input).toHaveValue('My unfinished question');
});
it('uses the Shanghai Monday boundary for Current Week', () => {
  expect(currentReadingWeek(new Date('2026-09-20T15:59:00Z'))).toBe('2026-09-14');
  expect(currentReadingWeek(new Date('2026-09-20T16:00:00Z'))).toBe('2026-09-21');
  expect(currentReadingWeek(new Date('2027-01-01T00:00:00Z'))).toBe('2026-12-28');
});

it('defaults to Parallel, updates votes immediately, and allows another item to save concurrently', async () => {
  let finish!: () => void;
  state.voteGate = new Promise<void>(resolve => { finish = resolve; });
  mount(); await screen.findByRole('heading', { name: 'The reading', level: 1 });
  expect(screen.getByRole('button', { name: 'Parallel' })).toHaveAttribute('aria-pressed', 'true');
  expect(await screen.findByText('An exact paragraph from the reading.')).toBeVisible();
  const second = screen.getByText('Second question?').closest('article')!;
  const first = screen.getByText('First question?').closest('article')!;
  fireEvent.click(within(second).getByRole('button', { name: 'Upvote: 3' }));
  expect(within(second).getByRole('button', { name: 'Remove upvote: 4' })).toHaveAttribute('aria-pressed', 'true');
  expect(state.posts.find(p => p.id === 'Second question?')!.score).toBe(3);
  expect(screen.getAllByRole('article')[0]).toBe(second);
  expect(within(first).getByRole('button', { name: 'Upvote: 3' })).toBeEnabled();
  fireEvent.click(within(first).getByRole('button', { name: 'Upvote: 3' }));
  expect(within(first).getByRole('button', { name: 'Remove upvote: 4' })).toBeInTheDocument();
  await act(async () => finish());
  expect(within(second).getByRole('button', { name: 'Remove upvote: 4' })).toBeEnabled();
  expect(within(first).getByRole('button', { name: 'Remove upvote: 4' })).toBeEnabled();
});
it('restores a failed optimistic vote and supports retrying it', async () => {
  let fail!: (error: Error) => void;
  state.voteGate = new Promise<void>((_, reject) => { fail = reject; });
  mount(); await screen.findByRole('heading', { name: 'The reading', level: 1 });
  const post = screen.getByText('Second question?').closest('article')!;
  fireEvent.click(within(post).getByRole('button', { name: 'Upvote: 3' }));
  expect(within(post).getByRole('button', { name: 'Remove upvote: 4' })).toBeInTheDocument();
  await act(async () => fail(new Error('Offline')));
  expect(within(post).getByRole('button', { name: 'Upvote: 3' })).toBeEnabled();
  expect(within(post).getByRole('alert')).toHaveTextContent('Could not update your vote');
  state.voteGate = null;
  fireEvent.click(within(post).getByRole('button', { name: 'Upvote: 3' }));
  await waitFor(() => expect(within(post).getByRole('button', { name: 'Remove upvote: 4' })).toBeEnabled());
});
it('preserves a saved vote and newly loaded posts when an older refresh finishes', async () => {
  let finishRead!: () => void;
  let finishVote!: () => void;
  mount(); await screen.findByRole('heading', { name: 'The reading', level: 1 });
  state.readGate = new Promise<void>(resolve => { finishRead = resolve; });
  state.voteGate = new Promise<void>(resolve => { finishVote = resolve; });
  const post = screen.getByText('Second question?').closest('article')!;
  fireEvent.click(within(post).getByRole('button', { name: 'Upvote: 3' }));
  state.posts.push(makePost('A newly posted question', 0));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await act(async () => finishVote());
  await act(async () => finishRead());
  expect(screen.getByText('A newly posted question')).toBeInTheDocument();
  expect(within(post).getByRole('button', { name: 'Remove upvote: 4' })).toBeEnabled();
});
