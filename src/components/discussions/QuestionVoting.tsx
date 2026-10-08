import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import type { ReadingDiscussion } from '@/services/reading-discussion.service';

export function QuestionVoting({ data, busy, mutate }: { data: ReadingDiscussion; busy: boolean; mutate: (action: string, fields: Record<string, unknown>) => Promise<void> }) {
  const [open, setOpen] = useState(false), [roundCount, setRoundCount] = useState(3), [questionsPerRound, setQuestionsPerRound] = useState(3);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [startError, setStartError] = useState('');
  const voting = data.voting;
  if (data.teacher) return <section aria-label="Question voting" className="my-3 space-y-2">
    <Button disabled={busy || voting?.active} onClick={() => { setStartError(''); setOpen(true); }}>Vote on Questions</Button>
    {voting && <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
      <p className="font-semibold">{voting.active ? 'Question voting is open' : 'Question voting ended'}</p>
      <p className="text-sm">{voting.roundCount} rounds · up to {voting.questionsPerRound} questions per round · {voting.progress?.filter(p => p.completed).length || 0} of {voting.progress?.length || 0} students finished</p>
      {voting.active && <Button size="sm" variant="secondary" disabled={busy} onClick={() => void mutate('endReadingQuestionVoting', { sessionId: voting.sessionId }).catch(() => {})}>End voting</Button>}
      <details className="mt-2 text-sm"><summary className="cursor-pointer">Student progress</summary>{voting.progress?.map(p => <p key={p.studentId}>{data.participation.find(s => s.id === p.studentId)?.name || 'Student'} · {p.completedRounds}/{p.totalRounds} rounds</p>)}</details>
    </div>}
    <Modal open={open} onClose={() => !busy && setOpen(false)} title="Vote on Questions">
      <form className="space-y-4" onSubmit={event => {
        event.preventDefault();
        setStartError('');
        void mutate('startReadingQuestionVoting', { roundCount, questionsPerRound, requestId }).then(() => { setOpen(false); setRequestId(crypto.randomUUID()); }).catch(error => setStartError(error instanceof Error ? error.message : 'Could not start voting'));
      }}>
        {startError && <p role="alert" className="text-red-700">{startError}</p>}
        <p className="text-sm text-slate-600">Students choose the most interesting question in each round. Each choice gets an upvote and helps guide their later reply assignment.</p>
        <label className="block font-medium">Rounds per student<input type="number" required min={1} max={10} value={roundCount} onChange={e => setRoundCount(e.target.valueAsNumber)} className="mt-1 block w-full rounded-lg border p-2" /></label>
        <label className="block font-medium">Questions per round<input type="number" required min={2} max={10} value={questionsPerRound} onChange={e => setQuestionsPerRound(e.target.valueAsNumber)} className="mt-1 block w-full rounded-lg border p-2" /></label>
        <p className="text-sm text-slate-500">Each student sees other people’s questions. If there are too few, they receive fewer options or rounds. Their chosen questions will not repeat.</p>
        <Button type="submit" disabled={busy}>Start voting</Button>
      </form>
    </Modal>
  </section>;
  if (!voting || !data.canWrite) return null;
  const options = (voting.questionIds || []).flatMap(id => {
    const post = data.posts.find(p => p.id === id); return post ? [post] : [];
  });
  return <section aria-label="Question voting" className="my-3 space-y-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
    <h3 className="font-semibold text-purple-950">{!voting.active ? 'Question voting ended' : voting.completed ? 'Voting complete' : `Vote on Questions · Round ${(voting.completedRounds || 0) + 1} of ${voting.totalRounds}`}</h3>
    {voting.active && !voting.completed ? <>
      <p className="text-sm text-purple-900">Choose the question you find most interesting. It gets an upvote and may become your assigned question to answer.</p>
      <div className="space-y-3">{options.map(post => <article key={post.id} className="rounded-lg border border-purple-200 bg-white p-3"><p className="mb-3 whitespace-pre-wrap text-slate-900">{post.content}</p><Button disabled={busy} onClick={() => void mutate('chooseReadingQuestionVote', { sessionId: voting.sessionId, roundIndex: voting.completedRounds || 0, postId: post.id }).catch(() => {})}>Choose this question</Button></article>)}</div>
      {!options.length && <p role="status">No eligible questions remain. Refresh to check for updates.</p>}
    </> : <p className="text-sm text-purple-900">You chose {voting.choices?.length || 0} questions. Your choices help guide your teacher’s next question assignments.</p>}
  </section>;
}
