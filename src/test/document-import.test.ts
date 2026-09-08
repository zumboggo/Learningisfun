import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ execute: vi.fn(), pdf: vi.fn(), word: vi.fn() }));
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: mocks.execute }));
vi.mock('@/services/pdf-import', () => ({ textFromPdf: mocks.pdf }));
vi.mock('mammoth', () => ({ default: { convertToHtml: mocks.word } }));
import { paragraphsFromFile } from '@/services/text.service';
// @ts-expect-error Independently deployed server module.
import { importLegacyWord } from '../../functions/learning-content/src/document-import.js';

function file(name: string, content: string) {
  return { name, size: content.length, text: async () => content, arrayBuffer: async () => new TextEncoder().encode(content).buffer } as File;
}
beforeEach(() => vi.clearAllMocks());
describe('document upload formats', () => {
  it('retains Markdown emphasis, links, headings and tables', async () => {
    expect(await paragraphsFromFile(file('READING.MD', '# Heading\n\n**Bold**, *italic*, [source](https://example.com)\n\n| A | B |\n| --- | --- |\n| 1 | 2 |'))).toEqual(['# Heading', '**Bold**, *italic*, [source](https://example.com)', '| A | B |\n| --- | --- |\n| 1 | 2 |']);
  });
  it('reads TXT with Windows newlines and a BOM', async () => {
    expect(await paragraphsFromFile(file('reading.txt', '\uFEFFFirst\r\n\r\nSecond'))).toEqual(['First', 'Second']);
  });
  it('retains formatted DOCX content', async () => {
    mocks.word.mockResolvedValue({ value: '<p><strong>Bold</strong> <em>italic</em></p><p>Next</p>' });
    expect(await paragraphsFromFile(file('reading.docx', 'zip'))).toEqual(['**Bold** *italic*', 'Next']);
  });
  it('reads PDFs locally and routes DOC only through the authenticated backend', async () => {
    mocks.pdf.mockResolvedValue('First\n\nSecond');
    expect(await paragraphsFromFile(file('reading.pdf', '%PDF'))).toEqual(['First', 'Second']);
    expect(mocks.execute).not.toHaveBeenCalled();
    mocks.execute.mockResolvedValue({ text: 'Legacy\n\nWord' });
    expect(await paragraphsFromFile(file('reading.doc', 'binary'))).toEqual(['Legacy', 'Word']);
    expect(mocks.execute).toHaveBeenCalledWith({ action: 'importLegacyWord', data: btoa('binary') });
  });
  it('rejects unsupported, oversized and empty files', async () => {
    await expect(paragraphsFromFile(file('bad.exe', 'data'))).rejects.toThrow('Please choose');
    await expect(paragraphsFromFile(file('empty.txt', ''))).rejects.toThrow('empty');
    await expect(paragraphsFromFile({ ...file('big.doc', 'a'), size: 3 * 1024 * 1024 } as File)).rejects.toThrow('2 MB');
    await expect(paragraphsFromFile(file('blank.md', '   '))).rejects.toThrow('No readable text');
  });
  it('denies non-teachers and rejects invalid legacy Word data before parsing', async () => {
    for (const role of ['student', 'parent', 'substitute']) await expect(importLegacyWord({ role }, '')).rejects.toThrow('Only teachers');
    await expect(importLegacyWord({ role: 'teacher' }, btoa('not a doc'))).rejects.toThrow('not a supported');
    await expect(importLegacyWord({ role: 'teacher' }, 'x'.repeat(2800001))).rejects.toThrow('2 MB');
  });
});
