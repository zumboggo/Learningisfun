import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { controlLivePresentation, readLivePresentation, submitLiveAnswer, updateWritingPrompt, type LivePresentationState, type WritingPromptSize } from '@/services/presentation.service';
import { client, COLLECTIONS, DATABASE_ID } from '@/lib/appwrite';

export function LivePresentationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<LivePresentationState | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedResponse, setSelectedResponse] = useState('');
  const [revising, setRevising] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState('');
  const [exampleDraft, setExampleDraft] = useState('');
  const [sizeDraft, setSizeDraft] = useState<WritingPromptSize>('large');
  const [resubmissionDraft, setResubmissionDraft] = useState(false);
  const editing = useRef(false);

  const refresh = useCallback(async () => {
    if (!sessionId || editing.current) return;
    try { setState(await readLivePresentation(sessionId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load the writing prompt.'); }
  }, [sessionId]);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(initial);
  }, [refresh]);

  useEffect(() => {
    if (!state?.isTeacher || !sessionId || !DATABASE_ID) return;
    let timer: number | undefined;
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${COLLECTIONS.discussion_answers}.documents`, event => {
      const payload = event.payload as { classSessionId?: string };
      if (payload.classSessionId !== sessionId) return;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => void refresh(), 500);
    });
    return () => { if (timer !== undefined) window.clearTimeout(timer); unsubscribe(); };
  }, [refresh, sessionId, state?.isTeacher]);

  const responses = useMemo(
    () => (state?.responses || []).filter(item => item.answer.toLowerCase().includes(filter.toLowerCase())),
    [state?.responses, filter],
  );

  const submit = async () => {
    if (!sessionId || !answer.trim()) return;
    setBusy(true); setError(''); editing.current = false;
    try { await submitLiveAnswer(sessionId, answer); setRevising(false); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit your response.'); }
    finally { setBusy(false); }
  };

  const finish = async () => {
    if (!sessionId || !state) return;
    setBusy(true);
    await controlLivePresentation(sessionId, 'end');
    navigate(`/classes/${state.session.classId}`);
  };

  const openPromptEditor = () => {
    if (!state) return;
    editing.current = true;
    setPromptDraft(state.activeQuestion?.text || state.session.promptMarkdown || '');
    setExampleDraft(state.exampleResponse || '');
    setSizeDraft(state.promptSize || 'large');
    setResubmissionDraft(state.allowResubmission);
    setEditingPrompt(true);
  };

  const savePrompt = async () => {
    if (!sessionId || !promptDraft.trim()) return;
    setBusy(true); setError('');
    try {
      await updateWritingPrompt(sessionId, promptDraft, resubmissionDraft, sizeDraft, exampleDraft);
      setEditingPrompt(false); editing.current = false;
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update the writing prompt.'); }
    finally { setBusy(false); }
  };

  const closePromptEditor = () => { if (busy) return; setEditingPrompt(false); editing.current = false; };

  if (!state) return <main className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white">{error || 'Opening writing prompt…'}</main>;
  const question = state.activeQuestion;

  if (state.isTeacher) {
    return <main className="min-h-screen bg-gray-100 p-4 sm:p-6"><div className="mx-auto max-w-6xl space-y-4"><header className="flex flex-wrap items-center justify-between gap-3"><div><Link to={`/classes/${state.session.classId}`} className="text-sm text-gray-500">← Class</Link><h1 className="text-2xl font-bold">Writing Prompt</h1></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={openPromptEditor}>Edit prompt</Button><Button variant="danger" loading={busy} onClick={() => window.confirm('Finish this prompt and add its responses to this week?') && void finish()}>Finish and save to week</Button></div></header><section className="rounded-2xl bg-gray-950 p-6 text-white sm:p-10"><h2 className={`${promptHeadingClass(state.promptSize||'large')} font-bold leading-tight !text-white`}>{question?.text || state.session.promptMarkdown}</h2>{state.exampleResponse && <div className="mt-6 rounded-xl border border-white/20 bg-white/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Example response</p><p className="mt-2 whitespace-pre-wrap text-base leading-7 text-white">{state.exampleResponse}</p></div>}<p className="mt-6 text-lg text-gray-300">{state.answeredCount} of {state.enrolledCount} students submitted</p></section><section className="grid gap-4 lg:grid-cols-[20rem_1fr]"><div className="rounded-2xl bg-white p-4"><input className="mb-3 w-full rounded-lg border px-3 py-2" placeholder="Filter responses…" value={filter} onChange={event => setFilter(event.target.value)}/><div className="max-h-[30rem] space-y-2 overflow-auto">{responses.length ? responses.map(item => <button key={item.id} className="w-full rounded-lg border p-3 text-left hover:bg-gray-50" onClick={() => setSelectedResponse(item.answer)}><strong className="block text-xs text-gray-500">{item.label}</strong><span className="line-clamp-3 whitespace-pre-wrap text-sm">{item.answer}</span></button>) : <p className="p-4 text-sm text-gray-500">Waiting for responses…</p>}</div></div><div className="flex min-h-80 items-center justify-center rounded-2xl bg-white p-8 text-center"><p className="whitespace-pre-wrap text-2xl leading-relaxed sm:text-4xl">{selectedResponse || 'Select an anonymous response to present it.'}</p></div></section></div>{editingPrompt&&<WritingPromptEditor prompt={promptDraft} setPrompt={setPromptDraft} example={exampleDraft} setExample={setExampleDraft} size={sizeDraft} setSize={setSizeDraft} allowResubmission={resubmissionDraft} setAllowResubmission={setResubmissionDraft} busy={busy} error={error} onClose={closePromptEditor} onSave={()=>void savePrompt()}/>}</main>;
  }

  if (!question || state.session.status !== 'active') return <main className="flex min-h-screen items-center justify-center bg-gray-950 p-8 text-center text-white"><div><h1 className="text-3xl font-bold">This writing prompt is finished</h1><Link to={`/classes/${state.session.classId}`} className="mt-5 inline-block underline">Back to class</Link></div></main>;

  return <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8"><div className="mx-auto max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wide text-blue-200">Writing Prompt</p><h1 className={`mt-3 ${promptHeadingClass(state.promptSize||'large')} font-bold leading-tight !text-white`}>{question.text}</h1>{state.exampleResponse&&<details className="mt-6 rounded-xl border border-white/20 bg-white/10"><summary className="cursor-pointer px-4 py-3 font-semibold text-blue-100">See an example response</summary><p className="border-t border-white/20 px-4 py-4 whitespace-pre-wrap text-base leading-7 text-white">{state.exampleResponse}</p></details>}{state.ownAnswer !== null && !revising ? <div className="mt-8 space-y-5"><div className="rounded-xl border border-white/20 bg-white/10 p-5 text-white"><p className="mb-2 text-sm text-blue-100">Your response</p><p className="whitespace-pre-wrap text-lg leading-8 text-white">{state.ownAnswer}</p></div><p className="text-center text-blue-100">Submitted. Your teacher can share it anonymously.</p>{state.allowResubmission&&<Button className="w-full" size="lg" variant="secondary" onClick={()=>{setAnswer(state.ownAnswer||'');setRevising(true);editing.current=true}}>Revise and resubmit</Button>}</div> : <div className="mt-8"><textarea autoFocus={revising} rows={12} className="w-full rounded-xl bg-white p-4 text-base leading-7 text-gray-950 focus:outline-none focus:ring-4 focus:ring-blue-400" placeholder="Write your paragraph response…" value={answer} onFocus={() => { editing.current = true; }} onBlur={() => { editing.current = false; void refresh(); }} onChange={event => setAnswer(event.target.value)}/><Button className="mt-4 w-full" size="lg" loading={busy} disabled={!answer.trim()} onMouseDown={() => { editing.current = false; }} onClick={() => void submit()}>{revising?'Update response':'Submit response'}</Button>{revising&&<button className="mt-3 w-full text-sm text-blue-200" onClick={()=>{setRevising(false);editing.current=false;setAnswer('')}}>Cancel revision</button>}</div>}{error && <p className="mt-4 text-red-300">{error}</p>}</div></main>;
}

function promptHeadingClass(size: WritingPromptSize): string {
  if (size === 'standard') return 'text-2xl sm:text-3xl';
  if (size === 'extra-large') return 'text-4xl sm:text-6xl';
  return 'text-3xl sm:text-5xl';
}

function WritingPromptEditor({prompt,setPrompt,example,setExample,size,setSize,allowResubmission,setAllowResubmission,busy,error,onClose,onSave}:{prompt:string;setPrompt:(value:string)=>void;example:string;setExample:(value:string)=>void;size:WritingPromptSize;setSize:(value:WritingPromptSize)=>void;allowResubmission:boolean;setAllowResubmission:(value:boolean)=>void;busy:boolean;error:string;onClose:()=>void;onSave:()=>void}) {
  return <Modal open onClose={onClose} title="Edit writing prompt"><div className="space-y-4">{error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium">Prompt<textarea autoFocus rows={5} className="mt-1 w-full rounded-lg border px-3 py-3 text-base" value={prompt} onChange={event=>setPrompt(event.target.value)}/></label><label className="block text-sm font-medium">Prompt text size<select className="mt-1 w-full rounded-lg border px-3 py-2" value={size} onChange={event=>setSize(event.target.value as WritingPromptSize)}><option value="standard">Standard</option><option value="large">Large</option><option value="extra-large">Extra large</option></select></label><label className="block text-sm font-medium">Example response <span className="font-normal text-gray-500">(optional)</span><textarea rows={6} className="mt-1 w-full rounded-lg border px-3 py-3 text-base" value={example} onChange={event=>setExample(event.target.value)} placeholder="Show students what a strong response might look like…"/></label><label className="flex items-start gap-3 rounded-lg border p-3"><input type="checkbox" className="mt-1 h-4 w-4" checked={allowResubmission} onChange={event=>setAllowResubmission(event.target.checked)}/><span><strong className="block text-sm">Allow students to revise and resubmit</strong><span className="text-xs text-gray-500">Their newest response replaces the previous version.</span></span></label><Button className="w-full" loading={busy} disabled={!prompt.trim()} onClick={onSave}>Save prompt</Button></div></Modal>;
}
