import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OriginalPdf } from '@/components/texts/OriginalPdf';
import { executeLearningContent } from '@/services/learning-content.service';

vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: vi.fn() }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.resetAllMocks(); });

describe('student original file controls', () => {
  it.each([['View Original', false], ['Download Original', true]] as const)('authorizes %s only on request', async (label, download) => {
    const replace = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({ location: { replace }, opener: null } as unknown as Window);
    vi.mocked(executeLearningContent).mockResolvedValue({ url: 'https://example.com/private-file' });
    render(<OriginalPdf textId="reading-1"/>);
    expect(executeLearningContent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('https://example.com/private-file'));
    expect(executeLearningContent).toHaveBeenCalledWith({ action: 'readOriginalPdf', textId: 'reading-1', download });
    expect(screen.getByText(/Read the extracted text below/)).toBeInTheDocument();
  });

  it('shows authorization errors and closes the empty tab', async () => {
    const close = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({ close, opener: null } as unknown as Window);
    vi.mocked(executeLearningContent).mockRejectedValue(new Error('This PDF is not available to your class.'));
    render(<OriginalPdf textId="reading-1"/>);
    fireEvent.click(screen.getByRole('button', { name: /View Original/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not available to your class');
    expect(close).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /View Original/ })).not.toBeDisabled();
  });
});
