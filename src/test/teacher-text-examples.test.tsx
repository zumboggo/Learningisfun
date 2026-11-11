import {render, screen, fireEvent} from '@testing-library/react';
import {beforeAll, describe, it, expect, vi} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import TeacherExamples from '@/components/teachers/TeacherExamples';
vi.mock('@/services/learning-content.service', () => ({executeLearningContent: vi.fn()}));
// Load the real preview before timing UI assertions; CI transforms its large
// story-player dependency graph more slowly than a warm local run.
beforeAll(async () => { await import('@/components/teachers/TeacherExamplePreview'); }, 30000);
describe('teacher text examples', () => {
  it('offers the four requested readings', () => {
    render(<TeacherExamples section="texts"/>);
    fireEvent.click(screen.getByText("Examples for teachers"));
    for (const title of ['Part 1', 'The World Behind the Alchemist', 'Learned Helplessness']) expect(screen.getByRole('button', {name: new RegExp(title)})).toBeVisible();
    expect(screen.getByRole('link', {name: /Please Stop Improving My Life/})).toHaveAttribute('href', import.meta.env.BASE_URL + 'teacher-examples/please-stop-improving-my-life.pdf');
    expect(screen.queryByRole('button', {name: /Part 2/})).not.toBeInTheDocument();
  });
  it('opens Alchemist alongside illustrative discussion and can switch to text only', async () => {
    render(<TeacherExamples section="texts"/>);
    fireEvent.click(screen.getByText("Examples for teachers"));
    fireEvent.click(screen.getByRole('button', {name: /The World Behind the Alchemist/}));
    expect(await screen.findByRole('complementary', {name: 'Sample discussion'})).toBeVisible();
    expect(await screen.findByRole('img', {name: /seventeenth-century alchemist/})).toHaveAttribute('src', expect.stringMatching(/^https?:\/\//));
    expect(screen.getAllByText(/Sample reply:/)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', {name: 'Text only'}));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});

 it('opens every episode example through its dedicated player route', () => {
    render(<MemoryRouter><TeacherExamples section="game"/></MemoryRouter>);
    fireEvent.click(screen.getByText('Examples for teachers'));
    for (const [title, path] of [
      ['Today, You’re the Teacher', '/game/chinese/today-youre-the-teacher'],
      ['A Message from Tomorrow', '/game/chinese/a-message-from-tomorrow'],
      ['The People Who Told Him to Wait', '/game/examples/the-people-who-told-him-to-wait'],
      ['One More Step Toward Peace', '/game/examples/one-more-step-toward-peace'],
    ]) expect(screen.getByRole('link', {name: new RegExp(title)})).toHaveAttribute('href', path);
    expect(screen.queryByRole('button', {name: /All examples/})).not.toBeInTheDocument();
 });
