import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import type { ReactNode } from 'react';
import { advanceStory, initialStoryState, settleStory, validatePackage, type StoryPackage } from '../../functions/learning-content/src/story-engine.js';
import AnimatedEpisodePage from '@/pages/AnimatedEpisodePage';
import EthicsDecisionNote from '@/components/animated/EthicsDecisionNote';

const api = vi.hoisted(() => ({ animatedCall: vi.fn(), loadStoryCache: vi.fn(), saveStoryCache: vi.fn() }));
vi.mock('@/services/animated-stories', () => api);
vi.mock('@/services/use-animated-library', () => ({ invalidateAnimatedLibrary: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { $id: 'student' } }) }));
vi.mock('@/components/GameDisplay', () => ({ GameDisplay: ({ children }: { children: ReactNode }) => <>{children}</> }));
const pack: StoryPackage = JSON.parse(readFileSync('public/stories/animated/the-measure-that-changed/episode.json', 'utf8'));
const assignment = { id: 'measure-that-changed-ethics', classId: 'e24ec8d9-21d7-4c32-a30e-08655c2f4e65' };
function route(last: boolean) {
  const { story, errors } = validatePackage(pack);
  expect(errors).toEqual([]);
  let state = settleStory(story, initialStoryState(story, 1));
  const steps: (string | null)[] = [];
  while (!state.ended) {
    const node = story.nodes[state.cursor];
    const step = node.type === 'choice' ? node.options[last ? node.options.length - 1 : 0].id : null;
    steps.push(step);
    state = advanceStory(story, state, step);
  }
  return steps;
}
function open(steps: (string | null)[], quizzes: number[][]) {
  api.animatedCall.mockResolvedValue({ pack, assignment, preview: false, attempts: [] });
  api.loadStoryCache.mockResolvedValue({ current: { id: 'saved', steps, quizzes, seed: 1 } });
  api.saveStoryCache.mockResolvedValue(undefined);
  return render(<MemoryRouter initialEntries={['/game/play/assigned']}><Routes><Route path="/game/play/:assignmentId" element={<AnimatedEpisodePage />} /></Routes></MemoryRouter>);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it.each([false, true])('shows all five assignment prompts at the end of a saved route (last options: %s)', async last => {
  open(route(last), []);
  const note = await screen.findByRole('region', { name: 'Your Decision Note · Ethics and Leadership' });
  expect(within(note).getAllByRole('listitem')).toHaveLength(5);
  expect(within(note).getByText(/What should Seneb do/)).toBeInTheDocument();
  expect(within(note).getByText(/his stated value of ma’at/)).toBeInTheDocument();
  expect(screen.getAllByRole('radio')).toHaveLength(16);
  expect(api.animatedCall).toHaveBeenCalledWith('animatedRead', { assignmentId: 'assigned' });
  expect(api.animatedCall).toHaveBeenCalledTimes(1);
});
it('keeps the Decision Note visible when reopening a completed quiz without changing saved progress', async () => {
  const steps = route(false), quizzes = [pack.quiz.map(question => question.answer)];
  open(steps, quizzes);
  await screen.findByRole('heading', { name: 'Home again' });
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
  expect(screen.queryByRole('button', { name: 'Check answers' })).not.toBeInTheDocument();
  expect(api.saveStoryCache.mock.lastCall?.[1].current).toMatchObject({ steps, quizzes });
  expect(api.animatedCall).toHaveBeenCalledTimes(1);
});
it('does not show the end questions before the story ends', async () => {
  open([null], []);
  await screen.findByRole('button', { name: 'Next →' });
  expect(screen.queryByRole('region', { name: /Your Decision Note/ })).not.toBeInTheDocument();
});
it('keeps these prompts scoped to the requested episode and class', () => {
  const { container, rerender } = render(<EthicsDecisionNote {...{ episodeId: 'another-episode', classId: assignment.classId }} />);
  expect(container).toBeEmptyDOMElement();
  rerender(<EthicsDecisionNote episodeId={assignment.id} classId="another-class" />);
  expect(container).toBeEmptyDOMElement();
});
