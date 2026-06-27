import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import {
  publishClassNotes,
  updateClassSession,
} from '@/services/class-session.service';
import {
  getSessionQuestions,
  getSessionQuestionsWithAuthorship,
  getSessionVoteCount,
  markForDiscussion,
  submitSessionQuestion,
  toggleSessionVote,
  updateQuestionDiscussionNotes,
} from '@/services/question.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Markdown } from '@/components/common/Markdown';
import { MarkdownToolbar } from '@/components/common/MarkdownToolbar';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { DiscussionQuestion } from '@/types';

export function ClassSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [questionText, setQuestionText] = useState('');
  const [selectedPassage, setSelectedPassage] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const sessionNotesRef = useRef<HTMLTextAreaElement>(null);

  const session = useLiveQuery(() => (sessionId ? db.class_sessions.get(sessionId) : undefined), [sessionId]);
  const cls = useLiveQuery(() => (session ? db.classes.get(session.classId) : undefined), [session?.classId]);
  const assignment = useLiveQuery(
    () => (session?.assignmentId ? db.reading_assignments.get(session.assignmentId) : undefined),
    [session?.assignmentId],
  );
  const reading = useLiveQuery(
    () => (assignment ? db.readings.get(assignment.readingId) : undefined),
    [assignment?.readingId],
  );

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || cls?.teacherId === user?.$id;

  const questions = useLiveQuery(
    () => (sessionId ? (isTeacher ? getSessionQuestionsWithAuthorship(sessionId) : getSessionQuestions(sessionId)) : []),
    [sessionId, isTeacher, refreshKey],
  );

  const userVotes = useLiveQuery(
    () => (sessionId && user
      ? db.question_votes.where('classSessionId').equals(sessionId).and(v => v.userId === user.$id).toArray()
      : []),
    [sessionId, user?.$id, refreshKey],
  );

  const usedVotes = useLiveQuery(
    () => (sessionId && user ? getSessionVoteCount(user.$id, sessionId) : 0),
    [sessionId, user?.$id, refreshKey],
  );

  useEffect(() => {
    if (session) setSessionNotes(session.notesMarkdown);
  }, [session?.$id, session?.notesMarkdown]);

  const voteByQuestion = useMemo(() => {
    const map = new Map<string, number>();
    for (const vote of userVotes || []) map.set(vote.questionId, vote.weight || 1);
    return map;
  }, [userVotes]);

  const handleSubmitQuestion = async () => {
    if (!user || !sessionId || !questionText.trim()) return;
    setBusy(true);
    try {
      await submitSessionQuestion(user.$id, sessionId, questionText.trim(), selectedPassage.trim());
      setQuestionText('');
      setSelectedPassage('');
      setRefreshKey(key => key + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleVote = async (questionId: string) => {
    if (!user) return;
    await toggleSessionVote(user.$id, questionId);
    setRefreshKey(key => key + 1);
  };

  const saveSessionNotes = async () => {
    if (!user || !sessionId) return;
    await updateClassSession(sessionId, user.$id, { notesMarkdown: sessionNotes });
  };

  const saveQuestionNotes = async (question: DiscussionQuestion) => {
    if (!user) return;
    const notes = notesDrafts[question.$id] ?? question.discussionNotesMarkdown;
    await updateQuestionDiscussionNotes(question.$id, user.$id, notes);
    setRefreshKey(key => key + 1);
  };

  const publishNotes = async () => {
    if (!user || !sessionId) return;
    await publishClassNotes(sessionId, user.$id);
  };

  if (!session) {
    return <div className="p-4 text-gray-400">Loading class period...</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 mb-2">Back</button>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-gray-500 text-sm">
            {cls?.name || 'Class'} | {session.sessionDate} | {session.votesPerStudent} votes each
            {session.allowStackedVotes ? ' | stacked votes on' : ''}
          </p>
          {reading && (
            <p className="text-sm text-gray-500 mt-1">
              Linked reading: <Link to={`/readings/${reading.$id}`} className="text-blue-600">{reading.title}</Link>
            </p>
          )}
        </div>
        {isTeacher && (
          <div className="flex flex-wrap gap-2">
            {assignment && (
              <Link to={`/assignments/${assignment.$id}/submissions`}>
                <Button size="sm" variant="secondary">Submissions</Button>
              </Link>
            )}
            <Button size="sm" variant="secondary" onClick={() => setRefreshKey(key => key + 1)}>
              Refresh sort
            </Button>
            <Button size="sm" onClick={() => void publishNotes()}>
              Publish notes
            </Button>
          </div>
        )}
      </div>

      {session.publishedNotesMarkdown && !isTeacher && (
        <Card>
          <h2 className="font-semibold mb-3">Published notes</h2>
          <Markdown content={session.publishedNotesMarkdown} className="text-sm text-gray-700" />
        </Card>
      )}

      {assignment?.promptMarkdown && (
        <Card>
          <h2 className="font-semibold mb-2">Writing prompt</h2>
          <Markdown content={assignment.promptMarkdown} className="text-gray-700" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/assignments/${assignment.$id}/respond`}>
              <Button size="sm">Open response</Button>
            </Link>
            {assignment.minResponseWords > 0 && (
              <StatusBadge status="ready" label={`${assignment.minResponseWords}+ words`} />
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Question board</h2>
              <p className="text-sm text-gray-500">{questions?.length || 0} questions</p>
            </div>
          </div>

          {!isTeacher && (
            <VoteBudgetMeter
              usedVotes={usedVotes || 0}
              voteBudget={session.votesPerStudent}
              allowStackedVotes={session.allowStackedVotes}
            />
          )}

          {questions && questions.length > 0 ? (
            questions.map(question => (
              <QuestionSessionCard
                key={question.$id}
                question={question}
                currentUserId={user?.$id || ''}
                isTeacher={Boolean(isTeacher)}
                voteWeight={voteByQuestion.get(question.$id) || 0}
                usedVotes={usedVotes || 0}
                voteBudget={session.votesPerStudent}
                allowStackedVotes={session.allowStackedVotes}
                notesDraft={notesDrafts[question.$id] ?? question.discussionNotesMarkdown}
                onNotesDraftChange={value => setNotesDrafts(prev => ({ ...prev, [question.$id]: value }))}
                onVote={() => void handleVote(question.$id)}
                onSaveNotes={() => void saveQuestionNotes(question)}
                onStatusChange={status => {
                  void markForDiscussion(question.$id, status, user?.$id || '').then(() => setRefreshKey(key => key + 1));
                }}
              />
            ))
          ) : (
            <EmptyState
              title="No questions yet"
              message={isTeacher ? 'Start with a teacher question, or ask students to add one from the panel.' : 'Add the first question so the class has something to discuss and vote on.'}
              action={!isTeacher && <Button onClick={() => document.getElementById('session-question-input')?.focus()} variant="secondary">Ask first question</Button>}
            />
          )}
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Add a question</h2>
            <textarea
              id="session-question-input"
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-y text-sm"
              placeholder="What should the class discuss?"
            />
            <textarea
              value={selectedPassage}
              onChange={e => setSelectedPassage(e.target.value)}
              rows={3}
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg resize-y text-sm"
              placeholder="Quoted passage (optional)"
            />
            <Button
              onClick={() => void handleSubmitQuestion()}
              loading={busy}
              disabled={!questionText.trim()}
              className="mt-3 w-full"
            >
              Submit question
            </Button>
          </Card>

          {isTeacher && (
            <Card>
              <h2 className="font-semibold mb-3">Class notes</h2>
              <MarkdownToolbar textareaRef={sessionNotesRef} value={sessionNotes} onChange={setSessionNotes} />
              <textarea
                ref={sessionNotesRef}
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-b-lg resize-y font-mono text-sm"
                placeholder="Markdown notes for the day"
              />
              <Button onClick={() => void saveSessionNotes()} className="mt-3 w-full" variant="secondary">
                Save notes
              </Button>
              {session.publishedNotesMarkdown && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold mb-2">Published preview</h3>
                  <Markdown content={session.publishedNotesMarkdown} className="text-sm text-gray-700" />
                </div>
              )}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function VoteBudgetMeter({
  usedVotes,
  voteBudget,
  allowStackedVotes,
}: {
  usedVotes: number;
  voteBudget: number;
  allowStackedVotes: boolean;
}) {
  const remaining = Math.max(0, voteBudget - usedVotes);
  return (
    <Card className="bg-blue-50 border-blue-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">{remaining} votes left</h3>
          <p className="text-sm text-blue-700">
            {usedVotes} of {voteBudget} used{allowStackedVotes ? ' | multiple votes per question allowed' : ''}
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: Math.max(voteBudget, 1) }).map((_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-full ${index < usedVotes ? 'bg-blue-700' : 'bg-white border border-blue-200'}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      {remaining === 0 && (
        <p className="mt-3 rounded bg-white px-3 py-2 text-sm text-blue-800">
          You have used all your votes. Tap a question you already voted for to change your mind.
        </p>
      )}
    </Card>
  );
}

function QuestionSessionCard({
  question,
  currentUserId,
  isTeacher,
  voteWeight,
  usedVotes,
  voteBudget,
  allowStackedVotes,
  notesDraft,
  onNotesDraftChange,
  onVote,
  onSaveNotes,
  onStatusChange,
}: {
  question: DiscussionQuestion;
  currentUserId: string;
  isTeacher: boolean;
  voteWeight: number;
  usedVotes: number;
  voteBudget: number;
  allowStackedVotes: boolean;
  notesDraft: string;
  onNotesDraftChange: (value: string) => void;
  onVote: () => void;
  onSaveNotes: () => void;
  onStatusChange: (status: DiscussionQuestion['discussionStatus']) => void;
}) {
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const isAuthor = question.authorId === currentUserId;
  const canAddVote = !isAuthor && usedVotes < voteBudget;
  const canClickVote = voteWeight > 0 || canAddVote;
  const voteHelp = isAuthor
    ? 'You cannot vote on your own question.'
    : usedVotes >= voteBudget && voteWeight === 0
      ? 'All votes used. Remove a vote from another question to choose this one.'
      : allowStackedVotes
        ? 'Add one vote to this question.'
        : voteWeight > 0
          ? 'Remove your vote.'
          : 'Vote for this question.';

  return (
    <Card className={question.discussionStatus === 'selected' ? 'ring-2 ring-blue-500' : ''}>
      <div className="flex gap-3">
        <div className="flex w-14 flex-col items-center gap-1">
          {!isTeacher && (
            <button
              onClick={onVote}
              disabled={!canClickVote}
              className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors ${
                voteWeight > 0
                  ? 'bg-blue-100 text-blue-700'
                  : canAddVote
                    ? 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                    : 'bg-gray-50 text-gray-300'
              }`}
              title={allowStackedVotes ? 'Add one vote' : voteWeight ? 'Remove vote' : 'Vote'}
            >
              {allowStackedVotes ? '+1' : 'Vote'}
            </button>
          )}
          <span className="text-lg font-bold text-gray-800">{question.voteCount}</span>
          {voteWeight > 0 && <span className="text-xs text-blue-700">yours {voteWeight}</span>}
        </div>

        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap text-gray-900">{question.questionText}</p>
          {question.selectedPassage && (
            <blockquote className="mt-3 border-l-4 border-gray-200 pl-3 text-sm text-gray-500">
              {question.selectedPassage}
            </blockquote>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {isTeacher && <span className="rounded bg-gray-100 px-2 py-1 text-gray-600">Author: {question.authorId}</span>}
            {isAuthor && <StatusBadge status="selected" label="Your question" />}
            <StatusBadge status={question.discussionStatus} />
          </div>
          {!isTeacher && <p className="mt-2 text-xs text-gray-400">{voteHelp}</p>}

          {question.discussionNotesMarkdown && !isTeacher && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Discussion notes</h3>
              <Markdown content={question.discussionNotesMarkdown} className="text-sm text-gray-700" />
            </div>
          )}

          {isTeacher && (
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => onStatusChange('selected')}>
                  Select
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onStatusChange('discussed')}>
                  Discussed
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onStatusChange('none')}>
                  Clear
                </Button>
                <StatusBadge status={question.discussionStatus} />
              </div>
              <MarkdownToolbar textareaRef={notesRef} value={notesDraft} onChange={onNotesDraftChange} />
              <textarea
                ref={notesRef}
                value={notesDraft}
                onChange={e => onNotesDraftChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-b-lg resize-y font-mono text-sm"
                placeholder="Markdown notes under this question"
              />
              <Button size="sm" onClick={onSaveNotes}>Save question notes</Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
