import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const generate = vi.fn();
const append = vi.fn();
const auth = vi.hoisted(() => ({ role: 'student' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { $id: 'student-1', role: auth.role }, isTeacher: auth.role === 'teacher', isParent: false }) }));
vi.mock('@/services/writing-feedback.service', () => ({ generatePersonalWritingFeedback: (...args: unknown[]) => generate(...args) }));
vi.mock('@/services/error-log.service', () => ({ appendErrorLogSuggestions: (...args: unknown[]) => append(...args) }));

describe('Writing feedback page', () => {
  beforeEach(() => { generate.mockReset(); append.mockReset(); auth.role = 'student'; });
  it.each(['student', 'teacher'])('offers Dangerous Writing to a %s and preserves the feedback draft when switching', async role => {
    auth.role = role;
    const { WritingPage } = await import('@/pages/WritingPage');
    render(<MemoryRouter><WritingPage /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/paste or write/i), 'My original draft');
    await userEvent.click(screen.getByRole('button', { name: 'Dangerous Writing' }));
    expect(screen.getByRole('textbox', { name: 'Dangerous writing text' })).toBeVisible();
    expect(screen.getByLabelText('Writing duration')).toHaveValue('5');
    await userEvent.click(screen.getByRole('button', { name: 'Writing Feedback' }));
    expect(screen.getByPlaceholderText(/paste or write/i)).toHaveValue('My original draft');
  });
  it('contains no assignment or peer-review workflow and sends the requested focus', async () => {
    generate.mockResolvedValue({ www: 'Clear central idea.', improvements: ['Add evidence.', 'Improve transitions.', 'Vary sentences.'], errorLogSuggestions: [], generatedAt: '2026-08-20T00:00:00.000Z' });
    const { WritingPage } = await import('@/pages/WritingPage');
    render(<MemoryRouter><WritingPage /></MemoryRouter>);
    expect(screen.queryByText(/peer review/i)).not.toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/paste or write/i), 'This is my draft.');
    await userEvent.type(screen.getByPlaceholderText(/is my argument clear/i), 'Focus on evidence.');
    await userEvent.click(screen.getByRole('button', { name: /generate ai feedback/i }));
    await waitFor(() => expect(generate).toHaveBeenCalledWith('This is my draft.', 'Focus on evidence.'));
    expect(await screen.findByText('Clear central idea.')).toBeInTheDocument();
  });

  it('lets a student add an AI-identified recurring pattern to the error log', async () => {
    const suggestion = { problem: 'I join complete sentences with a comma.', fix: 'Use a period, semicolon, or conjunction.' };
    generate.mockResolvedValue({ www: 'Strong voice.', improvements: ['Check sentence boundaries.'], errorLogSuggestions: [suggestion], generatedAt: '2026-08-20T00:00:00.000Z' });
    append.mockResolvedValue({ added: 1, synced: true });
    const { WritingPage } = await import('@/pages/WritingPage');
    render(<MemoryRouter><WritingPage /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/paste or write/i), 'A draft.');
    await userEvent.click(screen.getByRole('button', { name: /generate ai feedback/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add to Error Log' }));
    await waitFor(() => expect(append).toHaveBeenCalledWith('student-1', [suggestion]));
    expect(screen.getByRole('button', { name: 'Added' })).toBeDisabled();
  });
});
