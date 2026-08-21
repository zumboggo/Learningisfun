import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const read = vi.fn();
vi.mock('@/services/presentation.service', () => ({
  readLivePresentation: (...args: unknown[]) => read(...args),
  submitLiveAnswer: vi.fn(),
  controlLivePresentation: vi.fn(),
}));

const state = {
  session: { $id: 'session-1', classId: 'class-1', title: 'Writing Prompt', promptMarkdown: 'Explain the ending.', status: 'active' },
  questions: [],
  activeQuestion: { id: 'question-1', type: 'paragraph', text: 'Explain the ending.', options: [], answer: '', sortOrder: 0 },
  ownAnswer: null,
  answeredCount: 2,
  enrolledCount: 20,
  mcCounts: [],
  reveal: false,
  responses: [],
  isTeacher: false,
};

describe('Live writing prompt', () => {
  beforeEach(() => { vi.useFakeTimers(); read.mockReset(); read.mockResolvedValue(state); });
  afterEach(() => { vi.useRealTimers(); });
  it('pauses server polling while the student is typing so focus is preserved', async () => {
    const { LivePresentationPage } = await import('@/pages/LivePresentationPage');
    render(<MemoryRouter initialEntries={['/presentations/session-1/live']}><Routes><Route path="/presentations/:sessionId/live" element={<LivePresentationPage />}/></Routes></MemoryRouter>);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    const editor = screen.getByPlaceholderText(/paragraph response/i);
    act(() => { editor.focus(); });
    fireEvent.change(editor, { target: { value: 'My developing paragraph' } });
    const callsWhileFocused = read.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(read).toHaveBeenCalledTimes(callsWhileFocused);
    expect(editor).toHaveFocus();
    expect(editor).toHaveValue('My developing paragraph');
    fireEvent.blur(editor);
    await act(async () => { await Promise.resolve(); });
    expect(read.mock.calls.length).toBeGreaterThan(callsWhileFocused);
  });
});
