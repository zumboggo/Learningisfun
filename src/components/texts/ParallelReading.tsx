import { useCallback, useEffect, useState } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
import { ParagraphCard } from '@/pages/TextReaderPage';
import { Button } from '@/components/common/Button';
import type { LearningText, TextParagraph } from '@/types';

export function ParallelReading({ textId, classId }: { textId: string; classId: string }) {
  const [text, setText] = useState<LearningText>();
  const [paragraphs, setParagraphs] = useState<TextParagraph[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await executeLearningContent<{ texts: LearningText[]; paragraphs: TextParagraph[] }>({ action: 'readTexts', classIds: [classId], textId, includeContent: true });
      const selected = result.texts.find(row => row.$id === textId);
      if (!selected) throw new Error('This reading is not available.');
      setText(selected);
      setParagraphs(result.paragraphs.filter(row => row.textId === textId).sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load the text.'); }
    finally { setLoading(false); }
  }, [textId, classId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  return <aside aria-label="Reading text" className="parallel-reading">
    <div className="parallel-reading-heading"><span>THE TEXT</span><p>Select a passage to copy a quote.</p></div>
    {loading && <p role="status" className="p-6 text-sm text-slate-500">Loading reading…</p>}
    {error && <div className="p-6"><p role="alert" className="mb-3 text-sm text-red-700">{error}</p><Button size="sm" variant="secondary" onClick={() => void load()}>Retry reading</Button></div>}
    {!loading && !error && text && <div className="parallel-reading-content">
      <h2 className="reader-title mb-2 text-3xl">{text.title}</h2>
      <p className="mb-7 text-sm text-slate-500">{text.author}</p>
      {text.contentMode === 'link' ? <p className="text-sm text-slate-600">This reading is hosted on another website. <a href={text.externalUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">Open the original text ↗</a></p> : paragraphs.length ? paragraphs.map((paragraph, index) => <div key={paragraph.$id} className="reader-prose mb-7 text-lg"><ParagraphCard paragraph={paragraph} index={index} /></div>) : <p className="text-sm text-slate-500">No text paragraphs are available yet.</p>}
    </div>}
  </aside>;
}
