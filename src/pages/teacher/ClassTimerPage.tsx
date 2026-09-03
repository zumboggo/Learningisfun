import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';

export function ClassTimerPage() {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const suppliedMinutes = Number(searchParams.get('minutes'));
  const initialMinutes = Math.min(90, Math.max(0, Number.isFinite(suppliedMinutes) ? suppliedMinutes : 5));
  const initialSeconds = Math.round(initialMinutes * 60);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);
  const page = useRef<HTMLElement>(null);
  const cls = useLiveQuery(() => classId ? db.classes.get(classId) : undefined, [classId]);

  useEffect(() => {
    if (!running) return;
    const update = () => {
      const next = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) setRunning(false);
    };
    const interval = window.setInterval(update, 200);
    return () => window.clearInterval(interval);
  }, [running]);

  const toggle = () => {
    if (remaining === 0) { setRemaining(initialSeconds); endAt.current = Date.now() + initialSeconds * 1000; setRunning(true); return; }
    if (running) { setRunning(false); return; }
    endAt.current = Date.now() + remaining * 1000;
    setRunning(true);
  };
  const reset = () => { setRunning(false); setRemaining(initialSeconds); };
  const fullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await page.current?.requestFullscreen();
  };
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const finished = remaining === 0;

  return <main ref={page} className="flex min-h-screen flex-col bg-white text-gray-950">
    <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <Link to={`/classes/${classId}`} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">← Class</Link>
      <p className="truncate text-sm font-medium text-gray-400">{cls ? `${cls.courseName} · ${cls.name}` : 'Class timer'}</p>
      <button type="button" onClick={()=>void fullscreen()} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50">Fullscreen</button>
    </header>
    <section className="flex flex-1 flex-col items-center justify-center px-5 pb-16 text-center">
      <p className={`font-sans text-[clamp(6rem,25vw,18rem)] font-light leading-none tracking-[-0.07em] tabular-nums ${finished?'text-red-600':'text-gray-950'}`} aria-live="polite" aria-label={`${minutes} minutes ${seconds} seconds remaining`}>{String(minutes).padStart(2,'0')}<span className="mx-[0.02em] text-gray-300">:</span>{String(seconds).padStart(2,'0')}</p>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.28em] text-gray-400">{finished?'Time is up':running?'Time remaining':'Ready'}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={toggle} className="min-w-32 rounded-full bg-gray-950 px-7 py-3 text-base font-semibold text-white shadow-sm hover:bg-gray-800">{finished?'Again':running?'Pause':'Start'}</button>
        <button type="button" onClick={reset} className="rounded-full border border-gray-300 px-7 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50">Reset</button>
      </div>
    </section>
  </main>;
}
