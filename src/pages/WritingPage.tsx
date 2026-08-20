import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { generatePersonalWritingFeedback } from '@/services/writing.service';

export function WritingPage() {
  const { isParent } = useAuth();
  const [text, setText] = useState('');
  const [request, setRequest] = useState('');
  const [feedback, setFeedback] = useState<{ www: string; improvements: string[]; generatedAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (isParent) return <div className="mx-auto max-w-2xl p-4"><Card><p className="text-gray-600">Writing feedback is a private student tool.</p><Link to="/classes" className="mt-3 inline-block text-blue-700">Back to classes</Link></Card></div>;
  const generate = async () => { setBusy(true); setError(''); try { setFeedback(await generatePersonalWritingFeedback(text, request)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not generate feedback.'); } finally { setBusy(false); } };
  return <div className="student-page mx-auto max-w-4xl space-y-5 p-4"><header><h1 className="text-2xl font-bold">Writing Feedback</h1><p className="text-sm text-gray-500">Bring any writing and get private, specific ideas for revision.</p></header><Card className="border-gray-300"><div className="space-y-4"><label className="block text-sm font-medium text-gray-700">Your writing<textarea value={text} onChange={event => setText(event.target.value)} rows={14} maxLength={30000} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-base leading-7 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Paste or write anything you would like feedback on…" /></label><label className="block text-sm font-medium text-gray-700">What would you especially like feedback on? <span className="font-normal text-gray-400">(optional)</span><input value={request} onChange={event => setRequest(event.target.value)} maxLength={1000} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="For example: Is my argument clear? Focus on sentence variety." /></label><p className="text-xs text-gray-400">Your writing is sent securely for analysis and is not submitted to a class or peer-review system.</p>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button className="w-full sm:w-auto" loading={busy} disabled={!text.trim()} onClick={() => void generate()}>Generate AI Feedback</Button>{feedback && <div className="space-y-4 rounded-xl bg-gray-50 p-4" aria-live="polite"><div><h2 className="font-semibold text-green-800">What is working well</h2><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{feedback.www}</p></div><div><h2 className="font-semibold text-amber-800">Ideas for revision</h2><ol className="mt-1 list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-700">{feedback.improvements.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol></div><p className="text-xs text-gray-400">Fresh feedback generated {new Date(feedback.generatedAt).toLocaleString()}</p></div>}</div></Card></div>;
}
