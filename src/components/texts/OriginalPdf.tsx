import { useState } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
import { Button } from '@/components/common/Button';

export function OriginalPdf({ textId }: { textId: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function open(download: boolean) {
    // Open synchronously to avoid popup blockers while authorization is checked.
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    setBusy(true); setError('');
    try {
      const result = await executeLearningContent<{ url: string }>({ action: 'readOriginalPdf', textId, download });
      if (tab) tab.location.replace(result.url);
      else window.location.assign(result.url);
    } catch (cause) {
      tab?.close(); setError(cause instanceof Error ? cause.message : 'Could not open the PDF.');
    } finally { setBusy(false); }
  }
  return <section aria-label="Original file" className="rounded-xl border bg-white p-3"><div className="flex flex-wrap items-center gap-2"><div className="mr-auto"><p className="text-sm font-medium">Original file · PDF</p><p className="text-xs text-slate-600">Read the extracted text below, or open the original with its layout and images.</p></div><Button size="sm" variant="secondary" disabled={busy} onClick={() => void open(false)}>View Original ↗</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => void open(true)}>Download Original</Button></div>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</section>;
}
