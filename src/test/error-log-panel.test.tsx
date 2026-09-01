import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const refresh = vi.fn();
const save = vi.fn();
let sequence = 0;
vi.mock('@/services/error-log.service', () => ({
  refreshErrorLog: (...args: unknown[]) => refresh(...args),
  saveErrorLog: (...args: unknown[]) => save(...args),
  newErrorLogEntry: () => ({ id: `row-${++sequence}`, problem: '', fix: '', source: 'manual', createdAt: '2026-09-01T00:00:00.000Z' }),
}));

describe('Student error log', () => {
  beforeEach(() => { sequence = 0; refresh.mockReset(); save.mockReset(); refresh.mockResolvedValue([]); });

  it('adds and saves a problem-and-fix row', async () => {
    save.mockImplementation(async (_userId: string, rows: unknown[]) => ({ rows, synced: true }));
    const { ErrorLogPanel } = await import('@/components/student/ErrorLogPanel');
    render(<ErrorLogPanel userId="student-1" />);
    await screen.findByText(/log is empty/i);
    await userEvent.click(screen.getByRole('button', { name: /add row/i }));
    await userEvent.type(screen.getByPlaceholderText(/mistake or habit/i), 'I use comma splices.');
    await userEvent.type(screen.getByPlaceholderText(/try next time/i), 'Split the sentences or use a semicolon.');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('student-1', [expect.objectContaining({ problem: 'I use comma splices.', fix: 'Split the sentences or use a semicolon.' })]));
    expect(await screen.findByText('Error log saved.')).toBeInTheDocument();
  });
});
