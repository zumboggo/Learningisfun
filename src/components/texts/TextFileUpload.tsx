import { useRef, useState } from 'react';
import { paragraphsFromFile } from '@/services/text.service';

export function TextFileUpload({ onImport, onBusyChange }: { onImport: (content: string, originalPdf?: File) => void; onBusyChange?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pdfOnly, setPdfOnly] = useState(false);
  const current = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  return <div className="space-y-1">
    <div className="flex justify-center py-3"><button type="button" disabled={busy} onClick={()=>fileInput.current?.click()} className="min-h-16 w-full max-w-sm rounded-xl border-2 border-blue-600 bg-blue-50 px-6 py-4 text-lg font-semibold text-blue-800 shadow-sm hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50">{busy?'Reading document…':'Upload a document'}</button></div>
    <label className="sr-only">Upload a document
      <input ref={fileInput} className="sr-only" tabIndex={-1} type="file" accept=".doc,.docx,.pdf,.md,.txt" disabled={busy} onChange={async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        const request = ++current.current;
        setBusy(true); onBusyChange?.(true); setMessage('Reading document…');
        try {
          const isPdf = file.name.toLowerCase().endsWith('.pdf');
          if (isPdf && file.size > 5 * 1024 * 1024) throw new Error('Original PDFs must be 5 MB or smaller.');
          if (isPdf && new TextDecoder().decode((await file.arrayBuffer()).slice(0, 5)) !== '%PDF-') throw new Error('This file is not a valid PDF.');
          const paragraphs = isPdf && pdfOnly ? [] : await paragraphsFromFile(file);
          if (request !== current.current) return;
          onImport(paragraphs.join('\n\n'), isPdf ? file : undefined);
          setMessage(isPdf && pdfOnly ? 'Original PDF selected. It will be stored privately when you save; no OCR will be performed.' : `Imported ${paragraphs.length} paragraphs. Please check the text and paragraph breaks before saving.${isPdf ? ' The original PDF will also be kept when you save.' : ''}`);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Could not read this file. Please try another format.');
        } finally { setBusy(false); onBusyChange?.(false); }
      }}/>
    </label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={pdfOnly} onChange={event => setPdfOnly(event.target.checked)}/>PDF only — keep the original without extracting text (for scans)</label>
    <p className="text-xs text-gray-500">Maximum 10 MB (PDF: 5 MB; DOC: 2 MB). Original PDFs are stored privately when you save and require internet access. DOC is read by the app’s private backend. Other text extraction happens on this device.</p>
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
  </div>;
}
