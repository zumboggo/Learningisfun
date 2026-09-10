import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { TextViewControls } from '@/components/texts/TextViewControls';
import { Markdown } from '@/components/common/Markdown';

export function TextPresentPage() {
  const { textId } = useParams<{ textId: string }>();
  const navigate = useNavigate();
  const [size, setSize] = useState(32);
  const text = useLiveQuery(() => textId ? db.texts.get(textId) : undefined, [textId]);
  const paragraphs = useLiveQuery(
    () => textId ? db.text_paragraphs.where('textId').equals(textId).sortBy('sortOrder') : [],
    [textId],
  );

  const total = paragraphs?.length || 0;
  if (!text || !paragraphs) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading text…</div>;

  return (
    <main className="flex min-h-screen flex-col bg-[#faf9f6] text-slate-900">
      <header className="px-[clamp(1.5rem,5vw,5rem)] pt-[clamp(1.5rem,4vh,3rem)] text-center">
        <div className="mb-5 text-left"><TextViewControls size={size} onSize={setSize} title={text.title} paragraphs={text.contentMode === 'link' ? [] : paragraphs.map(p => p.content)}/></div><h1 className="text-[clamp(1.25rem,2.5vw,2rem)] font-semibold">{text.title}</h1>
        {text.author && <p className="mt-1 text-[clamp(.85rem,1.5vw,1.1rem)] text-slate-500">{text.author}</p>}
      </header>

      <section className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-[clamp(1.5rem,8vw,8rem)] py-[clamp(2rem,6vh,5rem)]">
        {total > 0 ? (
          <article className="reader-prose mx-auto w-full max-w-[70ch] space-y-7 text-left leading-[1.7]" style={{ fontSize: size }}>
            {paragraphs.map(p => <Markdown key={p.$id} content={p.content} className="[&_table]:text-[1em] [&_code]:text-[.9em]"/>)}
          </article>
        ) : (
          <p className="text-xl text-slate-400">This text has no paragraphs.</p>
        )}
      </section>

      <footer className="sticky bottom-0 grid grid-cols-3 items-center border-t bg-[#faf9f6] px-5 py-4">
        <button onClick={() => navigate('/texts')} className="col-start-2 justify-self-center rounded-xl px-5 py-3 text-sm font-semibold hover:bg-white/10">Home</button>
      </footer>
    </main>
  );
}
