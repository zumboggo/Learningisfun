import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('@/services/text.service', () => ({ paragraphsFromFile: mock.read }));
import { TextFileUpload } from '@/components/texts/TextFileUpload';
afterEach(cleanup);
describe('text file upload control', () => {
  it('accepts every supported extension and imports an editable preview', async () => {
    mock.read.mockResolvedValue(['First', 'Second']);
    const onImport = vi.fn(), busy = vi.fn();
    render(<TextFileUpload onImport={onImport} onBusyChange={busy}/>);
    const input = screen.getByLabelText('Upload a document');
    expect(input).toHaveAttribute('accept', '.doc,.docx,.pdf,.md,.txt');
    fireEvent.change(input, { target: { files: [new File(['text'], 'reading.md')] } });
    await waitFor(() => expect(onImport).toHaveBeenCalledWith('First\n\nSecond'));
    expect(busy.mock.calls).toEqual([[true], [false]]);
    expect(screen.getByRole('status')).toHaveTextContent('check the text');
  });
  it('keeps the existing draft untouched on failure and allows retry', async () => {
    mock.read.mockRejectedValue(new Error('This PDF needs OCR.'));
    const onImport = vi.fn();
    render(<TextFileUpload onImport={onImport}/>);
    const input = screen.getByLabelText('Upload a document');
    fireEvent.change(input, { target: { files: [new File(['pdf'], 'scan.pdf')] } });
    await screen.findByText('This PDF needs OCR.');
    expect(onImport).not.toHaveBeenCalled();
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue('');
  });
});
