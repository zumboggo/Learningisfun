import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReadingTools } from '@/components/texts/ReadingTools';
const synth = { getVoices: vi.fn(() => []), addEventListener: vi.fn(), removeEventListener: vi.fn(), speak: vi.fn(), cancel: vi.fn(), resume: vi.fn(), pause: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; constructor(text: string) { this.text = text; } });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('reading support controls', () => {
  it('never autoplays and stops when the text/version changes or the page closes', () => {
    const { rerender, unmount } = render(<ReadingTools title="Text" paragraphs={['First reading.']}/>);
    expect(synth.speak).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('▶ Play'));
    expect(synth.speak.mock.calls[0][0].text).toBe('First reading.');
    rerender(<ReadingTools title="Text" paragraphs={['Simplified reading.']}/>);
    expect(synth.cancel).toHaveBeenCalled();
    fireEvent.click(screen.getByText('▶ Play'));
    expect(synth.speak.mock.lastCall?.[0].text).toBe('Simplified reading.');
    unmount(); expect(synth.cancel.mock.calls.length).toBeGreaterThan(2);
  });
  it('opens a larger reading view with font controls and browser-specific help', () => {
    render(<ReadingTools title="A calm reading" paragraphs={['**Important** ideas.']}/>);
    fireEvent.click(screen.getByText('Reader Mode'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveStyle({ fontSize: '24px' });
    fireEvent.click(screen.getByLabelText('Larger reader text'));
    expect(screen.getByRole('article')).toHaveStyle({ fontSize: '26px' });
    expect(screen.getByText('Chrome help')).toHaveAttribute('href', expect.stringContaining('support.google.com'));
    fireEvent.click(screen.getByText('Exit Reader Mode'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('explains unavailable link/PDF text without pretending to read it', () => {
    render(<ReadingTools title="Linked text" paragraphs={[]} unavailable="Open the original website first."/>);
    expect(screen.getByText('▶ Play')).toBeDisabled();
    expect(screen.getByText('Open the original website first.')).toBeInTheDocument();
  });
});
