import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Markdown } from '@/components/common/Markdown';

export function TextPresentPage() {
  const { textId } = useParams<{ textId: string }>();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const text = useLiveQuery(() => textId ? db.texts.get(textId) : undefined, [textId]);
  const paragraphs = useLiveQuery(
    () => textId ? db.text_paragraphs.where('textId').equals(textId).sortBy('sortOrder') : [],
    [textId],
  );

  const total = paragraphs?.length || 0;
  const previous = useCallback(() => setSlide(value => Math.max(0, value - 1)), []);
  const next = useCallback(() => setSlide(value => Math.min(Math.max(0, total - 1), value + 1)), [total]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        next();
      }
      if (event.key === 'Escape') navigate('/texts');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, next, previous]);

  if (!text || !paragraphs) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading text…</div>;

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="px-[clamp(1.5rem,5vw,5rem)] pt-[clamp(1.5rem,4vh,3rem)] text-center">
        <h1 className="text-[clamp(1.25rem,2.5vw,2rem)] font-semibold">{text.title}</h1>
        {text.author && <p className="mt-1 text-[clamp(.85rem,1.5vw,1.1rem)] text-slate-400">{text.author}</p>}
      </header>

      <section className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-[clamp(1.5rem,8vw,8rem)] py-[clamp(2rem,6vh,5rem)]">
        {total > 0 ? (
          <article className="mx-auto w-full max-w-6xl text-left text-[clamp(1.5rem,3.2vw,3rem)] leading-[1.55] tracking-[-0.01em]">
            <Markdown content={paragraphs[slide]?.content||''}/>
          </article>
        ) : (
          <p className="text-xl text-slate-400">This text has no paragraphs.</p>
        )}
      </section>

      <footer className="grid grid-cols-3 items-center border-t border-white/10 bg-slate-950/95 px-5 py-4">
        <button onClick={previous} disabled={slide === 0} className="justify-self-start rounded-xl px-6 py-2 text-4xl hover:bg-white/10 disabled:opacity-20" aria-label="Previous paragraph">&lt;</button>
        <button onClick={() => navigate('/texts')} className="justify-self-center rounded-xl px-5 py-3 text-sm font-semibold hover:bg-white/10">Home</button>
        <button onClick={next} disabled={slide >= total - 1} className="justify-self-end rounded-xl px-6 py-2 text-4xl hover:bg-white/10 disabled:opacity-20" aria-label="Next paragraph">&gt;</button>
        <span className="col-start-2 mt-1 justify-self-center text-xs text-slate-500">{total ? `${slide + 1} / ${total}` : '0 / 0'}</span>
      </footer>
    </main>
  );
}
