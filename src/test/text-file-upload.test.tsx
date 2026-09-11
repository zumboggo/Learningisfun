import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('@/services/text.service', () => ({ paragraphsFromFile: mock.read }));
import { TextFileUpload } from '@/components/texts/TextFileUpload';
afterEach(cleanup);
describe('text file upload control', () => {
  it('opens the file picker from a visible bordered button',()=>{
    render(<TextFileUpload onImport={vi.fn()}/>);
    const input=screen.getByLabelText('Upload a document');
    const click=vi.spyOn(input,'click');
    const button=screen.getByRole('button',{name:'Upload a document'});
    expect(button).toHaveClass('border-2');
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
  });
  it('accepts every supported extension and imports an editable preview', async () => {
    mock.read.mockResolvedValue(['First', 'Second']);
    const onImport = vi.fn(), busy = vi.fn();
    render(<TextFileUpload onImport={onImport} onBusyChange={busy}/>);
    const input = screen.getByLabelText('Upload a document');
    expect(input).toHaveAttribute('accept', '.doc,.docx,.pdf,.md,.txt');
    fireEvent.change(input, { target: { files: [new File(['text'], 'reading.md')] } });
    await waitFor(() => expect(onImport).toHaveBeenCalledWith('First\n\nSecond', undefined));
    expect(busy.mock.calls).toEqual([[true], [false]]);
    expect(screen.getByRole('status')).toHaveTextContent('check the text');
  });
  it('keeps the existing draft untouched on failure and allows retry', async () => {
    mock.read.mockRejectedValue(new Error('This PDF needs OCR.'));
    const onImport = vi.fn();
    render(<TextFileUpload onImport={onImport}/>);
    const input = screen.getByLabelText('Upload a document');
    const pdf = new File(['%PDF-1.4'], 'scan.pdf');
    Object.defineProperty(pdf, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4').buffer });
    fireEvent.change(input, { target: { files: [pdf] } });
    await screen.findByText('This PDF needs OCR.');
    expect(onImport).not.toHaveBeenCalled();
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue('');
  });
  it('retains a scanned original without attempting text extraction in PDF-only mode', async () => {
    mock.read.mockClear(); const onImport = vi.fn();
    render(<TextFileUpload onImport={onImport}/>);
    fireEvent.click(screen.getByLabelText(/PDF only/));
    const pdf = new File(['%PDF-1.4'], 'scan.pdf');
    Object.defineProperty(pdf, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4').buffer });
    fireEvent.change(screen.getByLabelText('Upload a document'), { target: { files: [pdf] } });
    await waitFor(() => expect(onImport).toHaveBeenCalledWith('', pdf));
    expect(mock.read).not.toHaveBeenCalled();
  });
});
