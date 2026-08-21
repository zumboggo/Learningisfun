import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { controlLivePresentation, readLivePresentation, submitLiveAnswer, type LivePresentationState } from '@/services/presentation.service';

export function LivePresentationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<LivePresentationState | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedResponse, setSelectedResponse] = useState('');
  const editing = useRef(false);

  const refresh = useCallback(async () => {
    if (!sessionId || editing.current) return;
    try { setState(await readLivePresentation(sessionId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load the writing prompt.'); }
  }, [sessionId]);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 1200);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);

  const responses = useMemo(
    () => (state?.responses || []).filter(item => item.answer.toLowerCase().includes(filter.toLowerCase())),
    [state?.responses, filter],
  );

  const submit = async () => {
    if (!sessionId || !answer.trim()) return;
    setBusy(true); setError(''); editing.current = false;
    try { await submitLiveAnswer(sessionId, answer); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit your response.'); }
    finally { setBusy(false); }
  };

  const finish = async () => {
    if (!sessionId || !state) return;
    setBusy(true);
    await controlLivePresentation(sessionId, 'end');
    navigate(`/classes/${state.session.classId}`);
  };

  if (!state) return <main className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white">{error || 'Opening writing prompt…'}</main>;
  const question = state.activeQuestion;

  if (state.isTeacher) {
    return <main className="min-h-screen bg-gray-100 p-4 sm:p-6"><div className="mx-auto max-w-6xl space-y-4"><header className="flex flex-wrap items-center justify-between gap-3"><div><Link to={`/classes/${state.session.classId}`} className="text-sm text-gray-500">← Class</Link><h1 className="text-2xl font-bold">Writing Prompt</h1></div><Button variant="danger" loading={busy} onClick={() => window.confirm('Finish this prompt and add its responses to this week?') && void finish()}>Finish and save to week</Button></header><section className="rounded-2xl bg-gray-950 p-6 text-white sm:p-10"><h2 className="text-3xl font-bold leading-tight sm:text-5xl">{question?.text || state.session.promptMarkdown}</h2><p className="mt-6 text-lg text-gray-300">{state.answeredCount} of {state.enrolledCount} students submitted</p></section><section className="grid gap-4 lg:grid-cols-[20rem_1fr]"><div className="rounded-2xl bg-white p-4"><input className="mb-3 w-full rounded-lg border px-3 py-2" placeholder="Filter responses…" value={filter} onChange={event => setFilter(event.target.value)}/><div className="max-h-[30rem] space-y-2 overflow-auto">{responses.length ? responses.map(item => <button key={item.id} className="w-full rounded-lg border p-3 text-left hover:bg-gray-50" onClick={() => setSelectedResponse(item.answer)}><strong className="block text-xs text-gray-500">{item.label}</strong><span className="line-clamp-3 whitespace-pre-wrap text-sm">{item.answer}</span></button>) : <p className="p-4 text-sm text-gray-500">Waiting for responses…</p>}</div></div><div className="flex min-h-80 items-center justify-center rounded-2xl bg-white p-8 text-center"><p className="whitespace-pre-wrap text-2xl leading-relaxed sm:text-4xl">{selectedResponse || 'Select an anonymous response to present it.'}</p></div></section></div></main>;
  }

  if (!question || state.session.status !== 'active') return <main className="flex min-h-screen items-center justify-center bg-gray-950 p-8 text-center text-white"><div><h1 className="text-3xl font-bold">This writing prompt is finished</h1><Link to={`/classes/${state.session.classId}`} className="mt-5 inline-block underline">Back to class</Link></div></main>;

  return <main className="min-h-screen bg-gray-950 p-4 text-white sm:p-8"><div className="mx-auto max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Writing Prompt</p><h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">{question.text}</h1>{state.ownAnswer !== null ? <div className="mt-8 space-y-5"><div className="rounded-xl bg-white/10 p-5"><p className="mb-2 text-sm text-gray-400">Your response</p><p className="whitespace-pre-wrap text-lg leading-8">{state.ownAnswer}</p></div><p className="text-center text-gray-400">Submitted. Your teacher can share it anonymously.</p></div> : <div className="mt-8"><textarea rows={12} className="w-full rounded-xl bg-white p-4 text-base leading-7 text-gray-950 focus:outline-none focus:ring-4 focus:ring-blue-400" placeholder="Write your paragraph response…" value={answer} onFocus={() => { editing.current = true; }} onBlur={() => { editing.current = false; void refresh(); }} onChange={event => setAnswer(event.target.value)}/><Button className="mt-4 w-full" size="lg" loading={busy} disabled={!answer.trim()} onMouseDown={() => { editing.current = false; }} onClick={() => void submit()}>Submit response</Button></div>}{error && <p className="mt-4 text-red-300">{error}</p>}</div></main>;
}
