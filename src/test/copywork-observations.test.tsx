import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CopyworkPanel } from '@/components/student/CopyworkPanel';
import { copyworkMarkdown } from '@/services/copywork.service';
import { executeLearningContent } from '@/services/learning-content.service';
// @ts-expect-error Backend JavaScript is deployed separately.
import { validateObservations } from '../../functions/learning-content/src/copywork.js';

vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: vi.fn() }));
vi.mock('@/components/student/AssignedCopywork', () => ({ AssignedCopywork: () => null }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const entry = { $id: 'entry', userId: 'student', content: 'A passage.', createdAt: '2026-09-08T00:00:00Z', updatedAt: '2026-09-08T00:00:00Z' };
describe('copywork observations', () => {
  it('allows no observations and validates the limit on the server', () => {
    expect(validateObservations(undefined)).toEqual([]);
    expect(validateObservations([' A pattern ', '  '])).toEqual(['A pattern']);
    for (const bad of [['a', 'b', 'c', 'd'], [123], ['a'.repeat(2001)], 'a', null]) expect(() => validateObservations(bad)).toThrow('three observations');
  });
  it('includes observations in exports without changing older entries', () => {
    expect(copyworkMarkdown([entry])).not.toContain('My observations');
    const result = copyworkMarkdown([{ ...entry, observations: ['Repeated sounds.', 'Short sentences.'] }]);
    expect(result).toContain('### My observations\n\n1. Repeated sounds.\n2. Short sentences.');
    expect(result).toContain('A passage.');
  });
  it('adds up to three optional fields, saves them, and displays the saved observations', async () => {
    vi.mocked(executeLearningContent).mockImplementation(async body => body.action === 'readCopywork' ? { entries: [] } : { entry: { ...entry, observations: ['Repeated sounds.'] } });
    render(<CopyworkPanel/>);
    await waitFor(() => expect(executeLearningContent).toHaveBeenCalledWith({ action: 'readCopywork' }));
    fireEvent.click(screen.getByText('Copywork', { exact: true }));
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText('+ Add observation'));
    expect(screen.queryByText('+ Add observation')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Observation 1'), { target: { value: 'Repeated sounds.' } });
    fireEvent.change(screen.getByPlaceholderText(/Paste a quote/), { target: { value: 'A passage.' } });
    fireEvent.click(screen.getByText('Save copywork'));
    await screen.findByText('My observations');
    expect(executeLearningContent).toHaveBeenCalledWith({ action: 'addCopywork', content: 'A passage.', sourceTitle: '', sourceUrl: '', observations: ['Repeated sounds.'] });
    expect(screen.getByText('Repeated sounds.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Observation 1')).not.toBeInTheDocument();
  });
});
