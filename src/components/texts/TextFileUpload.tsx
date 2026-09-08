import { useRef, useState } from 'react';
import { paragraphsFromFile } from '@/services/text.service';

export function TextFileUpload({ onImport, onBusyChange }: { onImport: (content: string) => void; onBusyChange?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const current = useRef(0);
  return <div className="space-y-1">
    <label className="block text-sm font-medium">Upload a document
      <input className="mt-1 block w-full text-sm" type="file" accept=".doc,.docx,.pdf,.md,.txt" disabled={busy} onChange={async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        const request = ++current.current;
        setBusy(true); onBusyChange?.(true); setMessage('Reading document…');
        try {
          const paragraphs = await paragraphsFromFile(file);
          if (request !== current.current) return;
          onImport(paragraphs.join('\n\n'));
          setMessage(`Imported ${paragraphs.length} paragraphs. Please check the text and paragraph breaks before saving.`);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Could not read this file. Please try another format.');
        } finally { setBusy(false); onBusyChange?.(false); }
      }}/>
    </label>
    <p className="text-xs text-gray-500">DOC, DOCX, PDF, Markdown or TXT. Maximum 10 MB (DOC: 2 MB). PDF and DOC import text, not exact page layouts. DOC needs an internet connection and is read by the app’s private backend; other formats are read on this device.</p>
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
  </div>;
}
