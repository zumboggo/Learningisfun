import { describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ getDocument: vi.fn() }));
vi.mock('pdfjs-dist', () => ({ getDocument: mock.getDocument, GlobalWorkerOptions: {} }));
import { pdfPageText, textFromPdf } from '@/services/pdf-import';
const run = (str: string, x: number, y: number, width = 30) => ({ str, transform: [1, 0, 0, 1, x, y], width, height: 10 });
describe('PDF text extraction', () => {
  it('joins positioned words and separates paragraphs without dropping Unicode', () => {
    expect(pdfPageText([run('Hello', 0, 100), run('world', 34, 100), run('中文', 0, 88), run('Next', 0, 50)])).toBe('Hello world\n中文\n\nNext');
  });
  it('extracts all pages and releases the worker', async () => {
    const destroy = vi.fn(), cleanup = vi.fn();
    mock.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage: async (n: number) => ({ getTextContent: async () => ({ items: [run(`Page ${n}`, 0, 100)] }), cleanup }) }), destroy });
    expect(await textFromPdf({ arrayBuffer: async () => new ArrayBuffer(1) } as File)).toBe('Page 1\n\nPage 2');
    expect(cleanup).toHaveBeenCalledTimes(2);
    expect(destroy).toHaveBeenCalledOnce();
  });
  it('explains scanned and password-protected PDFs instead of importing an empty text', async () => {
    const destroy = vi.fn();
    mock.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 1, getPage: async () => ({ getTextContent: async () => ({ items: [] }) }) }), destroy });
    await expect(textFromPdf({ arrayBuffer: async () => new ArrayBuffer(1) } as File)).rejects.toThrow('OCR');
    mock.getDocument.mockReturnValue({ promise: Promise.reject(Object.assign(new Error('Locked'), { name: 'PasswordException' })), destroy });
    await expect(textFromPdf({ arrayBuffer: async () => new ArrayBuffer(1) } as File)).rejects.toThrow('password-protected');
    expect(destroy).toHaveBeenCalledTimes(2);
  });
});
