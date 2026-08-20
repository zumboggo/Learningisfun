import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const generate = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isParent: false }) }));
vi.mock('@/services/writing.service', () => ({ generatePersonalWritingFeedback: (...args: unknown[]) => generate(...args) }));

describe('Writing feedback page', () => {
  beforeEach(() => { generate.mockReset(); });
  it('contains no assignment or peer-review workflow and sends the requested focus', async () => {
    generate.mockResolvedValue({ www: 'Clear central idea.', improvements: ['Add evidence.', 'Improve transitions.', 'Vary sentences.'], generatedAt: '2026-08-20T00:00:00.000Z' });
    const { WritingPage } = await import('@/pages/WritingPage');
    render(<MemoryRouter><WritingPage /></MemoryRouter>);
    expect(screen.queryByText(/peer review/i)).not.toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/paste or write/i), 'This is my draft.');
    await userEvent.type(screen.getByPlaceholderText(/is my argument clear/i), 'Focus on evidence.');
    await userEvent.click(screen.getByRole('button', { name: /generate ai feedback/i }));
    await waitFor(() => expect(generate).toHaveBeenCalledWith('This is my draft.', 'Focus on evidence.'));
    expect(await screen.findByText('Clear central idea.')).toBeInTheDocument();
  });
});
