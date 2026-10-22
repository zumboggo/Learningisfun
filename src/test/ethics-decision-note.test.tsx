import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import type { ReactNode } from 'react';
import { advanceStory, initialStoryState, settleStory, validatePackage, type StoryPackage } from '../../functions/learning-content/src/story-engine.js';
import AnimatedEpisodePage from '@/pages/AnimatedEpisodePage';
vi.mock('@/services/learning-content.service',()=>({executeLearningContent:vi.fn(async()=>({teacher:false,settings:{open:false},entries:[]}))}));

const api = vi.hoisted(() => ({ animatedCall: vi.fn(), loadStoryCache: vi.fn(), saveStoryCache: vi.fn() }));
vi.mock('@/services/animated-stories', () => api);
vi.mock('@/services/use-animated-library', () => ({ invalidateAnimatedLibrary: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { $id: 'student' } }) }));
vi.mock('@/components/GameDisplay', () => ({ GameDisplay: ({ children }: { children: ReactNode }) => <>{children}</> }));
const pack: StoryPackage = JSON.parse(readFileSync('public/stories/animated/the-measure-that-changed/episode.json', 'utf8'));
const assignment = { version:1, id: 'measure-that-changed-ethics', classId: 'e24ec8d9-21d7-4c32-a30e-08655c2f4e65' };
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


async function expandNotebook(){
 fireEvent.click(await screen.findByRole('button',{name:'Notebook'}));
 return await screen.findByRole('region',{name:'Episode principles answers'});
}
it.each([false,true])('offers five editable questions after either saved story route (%s)',async last=>{
 open(route(last),[]);
 const notebook=await expandNotebook();
 expect(await within(notebook).findAllByRole('textbox')).toHaveLength(5);
 expect(screen.getAllByRole('radio')).toHaveLength(16);
 expect(api.animatedCall).toHaveBeenCalledTimes(1);
});
it('keeps completed quiz progress while opening the notebook',async()=>{
 const steps=route(false),quizzes=[pack.quiz.map(q=>q.answer)];open(steps,quizzes);
 await screen.findByRole('heading',{name:'Home again'});await expandNotebook();
 expect(screen.queryByRole('button',{name:'Check answers'})).not.toBeInTheDocument();
 expect(api.saveStoryCache.mock.lastCall?.[1].current).toMatchObject({steps,quizzes});
 expect(api.animatedCall).toHaveBeenCalledTimes(1);
});
it('opens and collapses the notebook before completion without resetting story progress',async()=>{
 open([null],[]);await screen.findByRole('button',{name:'Next →'});
 const before=api.saveStoryCache.mock.lastCall?.[1].current;
 const notebook=await expandNotebook();expect(await within(notebook).findAllByRole('textbox')).toHaveLength(5);
 fireEvent.click(screen.getByRole('button',{name:'Close Notebook'}));
 expect(screen.getByRole('button',{name:'Next →'})).toBeInTheDocument();
 expect(api.saveStoryCache.mock.lastCall?.[1].current).toEqual(before);
 expect(api.animatedCall).toHaveBeenCalledTimes(1);
});
it('offers the notebook before accepting the introduction',async()=>{
 open([],[]);const notebook=await expandNotebook();
 expect(await within(notebook).findAllByRole('textbox')).toHaveLength(5);
 expect(screen.getByRole('button',{name:'Accept'})).toBeInTheDocument();
});
