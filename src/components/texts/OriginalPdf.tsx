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
  return <section className="rounded-xl border bg-white p-3"><div className="flex flex-wrap items-center gap-2"><span className="mr-auto text-sm font-medium">Original PDF · original layout and images</span><Button size="sm" variant="secondary" disabled={busy} onClick={() => void open(false)}>Open PDF ↗</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => void open(true)}>Download PDF</Button></div>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</section>;
}
