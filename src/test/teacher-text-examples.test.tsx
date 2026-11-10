import {render, screen, fireEvent} from '@testing-library/react';
import {describe, it, expect, vi} from 'vitest';
import TeacherExamples from '@/components/teachers/TeacherExamples';
vi.mock('@/services/learning-content.service', () => ({executeLearningContent: vi.fn()}));
describe('teacher text examples', () => {
  it('offers the four requested readings', () => {
    render(<TeacherExamples section="texts"/>);
    for (const title of ['Part 1', 'Please Stop Improving My Life', 'The World Behind the Alchemist', 'Learned Helplessness']) expect(screen.getByRole('button', {name: new RegExp(title)})).toBeVisible();
    expect(screen.queryByRole('button', {name: /Part 2/})).not.toBeInTheDocument();
  });
  it('opens Alchemist alongside illustrative discussion and can switch to text only', async () => {
    render(<TeacherExamples section="texts"/>);
    fireEvent.click(screen.getByRole('button', {name: /The World Behind the Alchemist/}));
    expect(await screen.findByRole('complementary', {name: 'Sample discussion'})).toBeVisible();
    expect(screen.getAllByText(/Sample reply:/)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', {name: 'Text only'}));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
