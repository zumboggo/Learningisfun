import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Markdown } from '@/components/common/Markdown';
import { SpeechPlayer, speechText, type SpeechStatus } from '@/utils/read-aloud';

export function ReadingTools({ title, paragraphs, unavailable }: { title: string; paragraphs: string[]; unavailable?: string }) {
  const content = paragraphs.join('\n\n');
  // Remount only when actual reading content changes, not on annotation sync.
  return <ReadingToolsSession key={content} title={title} paragraphs={paragraphs} content={content} unavailable={unavailable}/>;
}

function ReadingToolsSession({ title, paragraphs, content, unavailable }: { title: string; paragraphs: string[]; content: string; unavailable?: string }) {
  const engine = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : undefined;
  const [voices, setVoices] = useState(() => engine?.getVoices() || []);
  const [voiceId, setVoiceId] = useState('');
  const [rate, setRate] = useState(1);
  const [reader, setReader] = useState(false);
  const [size, setSize] = useState(24);
  const [status, setStatus] = useState<SpeechStatus>({ phase: 'idle', current: 0, total: 0 });
  const player = useRef<SpeechPlayer | null>(null);
  useEffect(() => {
    if (!engine) return;
    const instance = new SpeechPlayer(engine, setStatus); player.current = instance;
    const refresh = () => setVoices(engine.getVoices());
    engine.addEventListener('voiceschanged', refresh);
    return () => { instance.stop(false); player.current = null; engine.removeEventListener('voiceschanged', refresh); };
  }, [engine]);
  const readable = Boolean(speechText(content)), active = status.phase !== 'idle';
  const voice = voices.find(item => item.voiceURI === voiceId) || voices.find(item => item.localService && /^en\b/i.test(item.lang)) || voices.find(item => /^en\b/i.test(item.lang));
  const controls = <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <button className={button} disabled={!engine || !readable} onClick={() => status.phase === 'playing' ? player.current?.pause() : status.phase === 'paused' ? player.current?.resume() : player.current?.play(content, rate, voice)}>{status.phase === 'playing' ? 'Ⅱ Pause' : status.phase === 'paused' ? '▶ Resume' : '▶ Play'}</button>
      <button className={button} disabled={!active} onClick={() => player.current?.stop()}>■ Stop</button>
      <label className="flex items-center gap-1 text-sm">Speed<select aria-label="Reading speed" className="rounded-lg border bg-white p-2" disabled={active} value={rate} onChange={event => setRate(Number(event.target.value))}>{[0.6, 0.75, 1, 1.25, 1.5].map(value => <option key={value} value={value}>{value}×</option>)}</select></label>
      <button className={`${button} ml-auto`} disabled={!readable && !reader} onClick={() => setReader(value => !value)}>{reader ? 'Exit fullscreen' : 'Fullscreen reading'}</button>
    </div>
    <details className="text-sm"><summary className="cursor-pointer text-slate-600">Voice and browser reading tips</summary><div className="mt-3 space-y-3">
      {engine && <label className="block">Voice<select className="mt-1 block w-full rounded-lg border bg-white p-2" value={voiceId} disabled={active} onChange={event => setVoiceId(event.target.value)}><option value="">Automatic English voice (prefers on-device)</option>{voices.map(item => <option key={item.voiceURI} value={item.voiceURI}>{item.name} · {item.lang}{item.localService ? ' · on-device' : ' · online'}</option>)}</select></label>}
      <p className="text-slate-600">Uses your browser’s built-in speech, not the app’s AI API. Voice availability varies by device; online voices may send text to the browser’s speech provider. Stop playback to change voice or speed.</p>
      <BrowserReaderTips/>
    </div></details>
    {!engine && <p className="text-sm text-slate-600">This browser does not offer built-in speech here. Try the browser reading tools below.</p>}
    {!readable && <p className="text-sm text-slate-600">{unavailable || 'No readable text is available yet.'}</p>}
    <p role="status" className="text-sm text-slate-600">{status.error || (active ? `${status.phase === 'paused' ? 'Paused' : 'Reading'} · part ${status.current} of ${status.total}` : status.total ? 'Finished reading.' : '')}</p>
  </div>;
  return reader ? <ReaderDialog onClose={() => setReader(false)}>{controls}<div className="my-5 flex items-center justify-end gap-2"><span className="mr-auto text-sm text-slate-500">Reading view · return to the reader to annotate</span><button aria-label="Smaller reader text" className={button} disabled={size <= 18} onClick={() => setSize(value => value - 2)}>A−</button><button aria-label="Larger reader text" className={button} disabled={size >= 36} onClick={() => setSize(value => value + 2)}>A+</button></div><article className="reader-prose mx-auto max-w-[65ch] space-y-7 text-left text-slate-900" style={{ fontSize: size, lineHeight: 1.8 }}><h1 className="text-[1.35em] font-semibold">{title}</h1>{paragraphs.map((paragraph, index) => <Markdown key={index} content={paragraph} className="[&_table]:text-[1em] [&_code]:text-[.9em]"/>)}</article></ReaderDialog> : <section aria-label="Read aloud and reader mode" className="rounded-2xl border bg-white p-3 sm:p-4">{controls}</section>;
}

function ReaderDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const target = dialog.current; const previous = document.body.style.overflow;
    target?.showModal(); document.body.style.overflow = 'hidden';
    return () => { target?.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={dialog} aria-label="Reader Mode" onCancel={event => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-[#faf9f6] p-4 text-slate-900 sm:p-8"><div className="mx-auto max-w-4xl pb-12">{children}</div></dialog>;
}

function BrowserReaderTips() {
  return <div className="space-y-2 border-t pt-3"><p className="font-medium">Your browser’s own Reader Mode</p><p><strong>Chrome on a computer:</strong> right-click the reading and choose “Open in reading mode,” or use ⋮ → More tools → Reading mode. <a className="underline" href="https://support.google.com/chrome/answer/14218344?hl=en" target="_blank" rel="noreferrer">Chrome help</a></p><p><strong>Edge:</strong> press F9 on a supported page, or select the text and right-click to open the selection in Reading mode (also called Immersive Reader). <a className="underline" href="https://support.microsoft.com/en-US/edge/use-immersive-reader-in-microsoft-edge" target="_blank" rel="noreferrer">Edge help</a></p><p><strong>Safari:</strong> click or tap the Page menu beside the address bar, then choose “Show Reader” when available. <a className="underline" href="https://support.apple.com/guide/safari/hide-distractions-when-reading-sfri32632/mac" target="_blank" rel="noreferrer">Mac help</a> · <a className="underline" href="https://support.apple.com/en-gb/guide/iphone/iphdc30e3b86/ios" target="_blank" rel="noreferrer">iPhone help</a></p><p className="text-slate-600">These menus vary by browser version and device. Native Reader Mode may not recognize this interactive app; use the app’s Reader Mode above instead. For linked articles, open the original website first. PDF viewers have separate reading tools; image-only scans need OCR for speech.</p></div>;
}
const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40';
