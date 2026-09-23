import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DangerousWriting } from '@/components/writing/DangerousWriting';

const input = () => screen.getByRole('textbox', { name: 'Dangerous writing text' });
const write = (value: string) => fireEvent.change(input(), { target: { value } });
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('Dangerous Writing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T00:00:00Z'));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('defaults to five minutes, offers all durations, and waits for actual writing', () => {
    render(<DangerousWriting />);
    expect(screen.getByLabelText('Writing duration')).toHaveValue('5');
    expect(screen.getAllByRole('option').map(option => option.getAttribute('value'))).toEqual(['1', '3', '5', '8', '10', '15', '20']);
    advance(60_000);
    expect(screen.getByRole('timer')).toHaveTextContent('5:00');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    write('First thought');
    expect(screen.getByLabelText('Writing duration')).toBeDisabled();
    advance(1000);
    expect(screen.getByRole('timer')).toHaveTextContent('4:59');
  });

  it('warns progressively, clears warnings on edits, and locks the editor at five seconds', () => {
    render(<DangerousWriting />);
    write('A thought');
    advance(4000);
    expect(input()).toHaveClass('dangerous-writing-shake');
    expect(Number(input().style.opacity)).toBeLessThan(0.5);
    write('A thought grows');
    expect(input()).not.toHaveClass('dangerous-writing-shake');
    expect(input()).toHaveStyle({ opacity: '1' });
    advance(4999);
    expect(input()).toBeInTheDocument();
    advance(1);
    expect(screen.getByRole('alert')).toHaveTextContent('You lost your progress!');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('recovers the exact lost text using the subtle copy action', async () => {
    render(<DangerousWriting />);
    write('A valuable idea\n值得保留。');
    advance(5000);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy text so far' })));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('A valuable idea\n值得保留。');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(input()).toHaveValue('');
    expect(screen.getByRole('timer')).toHaveTextContent('5:00');
  });

  it('unlocks Copy Text at the goal and stops penalizing inactivity', async () => {
    render(<DangerousWriting />);
    fireEvent.change(screen.getByLabelText('Writing duration'), { target: { value: '1' } });
    write('Start');
    for (let second = 4; second < 60; second += 4) { advance(4000); write(`Draft at ${second}`); }
    expect(screen.queryByRole('button', { name: 'Copy Text' })).not.toBeInTheDocument();
    advance(4000);
    expect(screen.getByRole('timer')).toHaveTextContent('0:00');
    advance(60_000);
    write('Finished and revised');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy Text' })));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Finished and revised');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not let delayed timers or late input revive an expired session', () => {
    render(<DangerousWriting />);
    write('Original');
    vi.setSystemTime(Date.now() + 6000);
    write('Too late');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses the earlier deadline when a background tab wakes after both deadlines', () => {
    render(<DangerousWriting />);
    fireEvent.change(screen.getByLabelText('Writing duration'), { target: { value: '1' } });
    write('Original');
    vi.setSystemTime(Date.now() + 120_000);
    fireEvent(document, new Event('visibilitychange'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy Text' })).not.toBeInTheDocument();
  });

  it('does not count arrow keys as writing', () => {
    render(<DangerousWriting />);
    write('Original');
    advance(4000);
    fireEvent.keyDown(input(), { key: 'ArrowLeft' });
    advance(1000);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('offers manual recovery when clipboard access is blocked', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Blocked'));
    render(<DangerousWriting />);
    write('Keep this');
    advance(5000);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy text so far' })));
    expect(screen.getByLabelText('Text to copy manually')).toHaveValue('Keep this');
  });
});
