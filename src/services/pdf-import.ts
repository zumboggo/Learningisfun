import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export type PdfTextRun = { str: string; transform: number[]; width: number; height: number; hasEOL?: boolean };

// PDF text is positioned glyphs, not paragraphs. Preserve reading-order lines
// and use larger vertical gaps to identify paragraph breaks for the preview.
export function pdfPageText(items: PdfTextRun[]): string {
  let result = '', previous: PdfTextRun | undefined;
  for (const item of items) {
    if (!item.str) continue;
    if (previous) {
      const height = Math.max(Math.abs(item.height), Math.abs(previous.height), 1);
      const gap = Math.abs(item.transform[5] - previous.transform[5]);
      if (gap > height * 1.8) result += '\n\n';
      else if (gap > height * 0.5 || previous.hasEOL) result += '\n';
      else if (!/\s$/.test(result) && !/^\s/.test(item.str) && item.transform[4] - (previous.transform[4] + previous.width) > height * 0.1) result += ' ';
    }
    result += item.str;
    previous = item;
  }
  return result.trim();
}

export async function textFromPdf(file: File): Promise<string> {
  const task = getDocument({ data: await file.arrayBuffer(), useSystemFonts: true });
  try {
    const document = await task.promise;
    if (document.numPages > 200) throw new Error('Please upload a PDF of 200 pages or fewer.');
    const pages: string[] = [];
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      const text = pdfPageText(content.items.filter(item => 'str' in item));
      if (!text) throw new Error(`Page ${index} has no readable text. Scanned/image-only pages need OCR first; please upload a text-based PDF or Word file.`);
      pages.push(text);
      page.cleanup();
    }
    return pages.join('\n\n');
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') throw new Error('This PDF is password-protected. Save an unlocked copy and try again.', { cause: error });
    throw error;
  } finally {
    await task.destroy();
  }
}
