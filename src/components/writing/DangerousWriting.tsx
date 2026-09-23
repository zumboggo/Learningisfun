import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/common/Button';
import './dangerous-writing.css';

const DURATIONS = [1, 3, 5, 8, 10, 15, 20];
const IDLE_LIMIT = 5000;
type Phase = 'ready' | 'writing' | 'lost' | 'complete';

export function DangerousWriting() {
  const [minutes, setMinutes] = useState(5);
  const [phase, setPhase] = useState<Phase>('ready');
  const [text, setText] = useState('');
  const [remaining, setRemaining] = useState(5 * 60_000);
  const [idle, setIdle] = useState(0);
  const [copyMessage, setCopyMessage] = useState('');
  const session = useRef({ phase: 'ready' as Phase, end: 0, lastInput: 0 });
  const editor = useRef<HTMLTextAreaElement>(null);

  // Compare deadlines, not interval counts: background tabs may throttle timers.
  function advance(now: number): Phase {
    const current = session.current;
    if (current.phase !== 'writing') return current.phase;
    const idleDeadline = current.lastInput + IDLE_LIMIT;
    if (now >= Math.min(current.end, idleDeadline)) {
      current.phase = current.end <= idleDeadline ? 'complete' : 'lost';
      setPhase(current.phase);
      setIdle(0);
      setRemaining(Math.max(0, current.end - Math.min(current.end, idleDeadline)));
    } else {
      setRemaining(current.end - now);
      setIdle(now - current.lastInput);
    }
    return current.phase;
  }

  useEffect(() => {
    if (phase !== 'writing') return;
    const tick = () => advance(Date.now());
    const timer = window.setInterval(tick, 50);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [phase]);

  function changeText(value: string) {
    const now = Date.now();
    const currentPhase = advance(now);
    if (currentPhase === 'lost') return;
    if (currentPhase === 'ready' && value.length > 0) {
      session.current = { phase: 'writing', end: now + minutes * 60_000, lastInput: now };
      setPhase('writing');
    }
    // Real edits (including mobile/IME input) count; arrows and modifiers do not.
    if (value !== text) {
      session.current.lastInput = now;
      setIdle(0);
      setText(value);
      setCopyMessage('');
    }
  }

  async function copyText() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setCopyMessage('Copied!');
    } catch {
      const fallback = document.createElement('textarea');
      fallback.value = text;
      fallback.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(fallback);
      fallback.select();
      try {
        setCopyMessage(document.execCommand('copy') ? 'Copied!' : 'Select the text below to copy it.');
      } catch {
        setCopyMessage('Select the text below to copy it.');
      } finally {
        fallback.remove();
      }
    }
  }

  function restart() {
    session.current = { phase: 'ready', end: 0, lastInput: 0 };
    setPhase('ready');
    setText('');
    setRemaining(minutes * 60_000);
    setIdle(0);
    setCopyMessage('');
    window.requestAnimationFrame(() => editor.current?.focus());
  }

  const danger = phase === 'writing' ? Math.max(0, Math.min(1, (idle - 1500) / 3500)) : 0;
  const seconds = Math.ceil(remaining / 1000);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return <section className="dangerous-writing overflow-hidden rounded-2xl border border-gray-200 bg-white" aria-label="Dangerous Writing">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
      <div><h2 className="text-lg font-bold">Dangerous Writing</h2><p className="mt-1 text-sm text-gray-500">Keep writing. A five-second pause ends your attempt.</p></div>
      {phase === 'complete' ? <Button onClick={() => void copyText()}>Copy Text</Button> :
        <label className="text-sm font-medium text-gray-600">Write for <select aria-label="Writing duration" value={minutes} disabled={phase !== 'ready'} onChange={event => { const value = Number(event.target.value); setMinutes(value); setRemaining(value * 60_000); }} className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-2 disabled:opacity-60">
          {DURATIONS.map(value => <option key={value} value={value}>{value} {value === 1 ? 'minute' : 'minutes'}</option>)}
        </select></label>}
    </div>
    <div className="flex items-center justify-between px-5 pt-4 text-sm text-gray-500">
      <span role="status">{phase === 'ready' ? 'Your first keystroke starts the timer.' : phase === 'complete' ? 'You made it! Your writing is safe to edit and copy.' : phase === 'lost' ? 'Session ended' : idle >= 3000 ? 'Keep typing!' : 'Keep going — one thought at a time.'}</span>
      <span role="timer" aria-label="Time remaining" className="ml-3 shrink-0 font-mono text-lg tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
    </div>
    <div className="mx-5 mt-3 h-1 overflow-hidden rounded-full bg-gray-100" aria-hidden="true"><div className="h-full bg-red-500 transition-[width] duration-75" style={{ width: `${danger * 100}%` }} /></div>
    {phase === 'lost' ? <div className="flex min-h-80 flex-col items-center justify-center gap-5 px-5 py-12 text-center">
      <h3 role="alert" className="text-3xl font-extrabold sm:text-4xl">You lost your progress!</h3>
      <Button variant="secondary" onClick={restart}>Try again</Button>
      <button type="button" onClick={() => void copyText()} className="text-[10px] text-gray-300 hover:text-gray-500 focus-visible:text-gray-600 focus-visible:outline-2 focus-visible:outline-blue-500">Copy text so far</button>
    </div> : <div className="p-5">
      <textarea ref={editor} aria-label="Dangerous writing text" value={text} onChange={event => changeText(event.target.value)} rows={14} spellCheck={false}
        placeholder="Stuck on what to say next? Start writing and don't stop — you might be surprised by what you come up with."
        className={`dangerous-writing-editor w-full resize-y rounded-xl border border-gray-200 p-4 text-lg leading-relaxed placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 ${danger > 0.55 ? 'dangerous-writing-shake' : ''}`}
        style={{ color: danger > 0 ? `rgb(${Math.round(31 + 189 * danger)}, ${Math.round(41 - 3 * danger)}, ${Math.round(55 - 17 * danger)})` : undefined, opacity: 1 - danger * 0.8, animationDuration: `${0.35 - danger * 0.23}s` }} />
      <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-gray-400">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>{phase === 'complete' && <Button variant="secondary" onClick={restart}>Start another session</Button>}</div>
    </div>}
    {copyMessage && <p role="status" className="px-5 pb-4 text-sm text-gray-500">{copyMessage}</p>}
    {copyMessage.startsWith('Select') && <textarea aria-label="Text to copy manually" readOnly value={text} onFocus={event => event.target.select()} className="mx-5 mb-5 w-[calc(100%-2.5rem)] rounded-lg border p-3" rows={6} />}
  </section>;
}
