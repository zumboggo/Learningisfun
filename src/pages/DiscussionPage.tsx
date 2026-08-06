import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ID } from 'appwrite';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { getTimestamp } from '@/utils/helpers';
import { addToQueue } from '@/services/sync.service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import type {
  DiscussionQuestion,
  DiscussionAnswer,
  QuestionVote,
  ClassSession,
  Class,
  TeacherSettings,
} from '@/types';

export function DiscussionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, isTeacher } = useAuth();

  const [questionText, setQuestionText] = useState('');
  const [selectedPassage, setSelectedPassage] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [answerSubmitting, setAnswerSubmitting] = useState<Set<string>>(new Set());

  const [votesPerStudent, setVotesPerStudent] = useState<number | null>(null);
  const [allowStackedVotes, setAllowStackedVotes] = useState<boolean | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const session = useLiveQuery(
    () => (sessionId ? db.class_sessions.get(sessionId) : undefined),
    [sessionId, refreshKey],
  );

  const cls = useLiveQuery(
    () => (session ? db.classes.get(session.classId) : undefined),
    [session?.classId],
  );

  const teacherSettings = useLiveQuery(
    () => (cls ? db.teacher_settings.where('classId').equals(cls.$id).first() : undefined),
    [cls?.$id],
  );

  const allQuestions = useLiveQuery(
    async () => {
      if (!sessionId) return [];
      if (isTeacher) {
        return db.discussion_questions
          .where('classSessionId')
          .equals(sessionId)
          .toArray();
      }
      const questions = await db.discussion_questions
        .where('classSessionId')
        .equals(sessionId)
        .and(q => q.moderationStatus === 'visible' || q.authorId === user?.$id)
        .toArray();
      return questions;
    },
    [sessionId, isTeacher, user?.$id, refreshKey],
  );

  const userVotes = useLiveQuery(
    () =>
      sessionId && user
        ? db.question_votes
            .where('classSessionId')
            .equals(sessionId)
            .and(v => v.userId === user.$id)
            .toArray()
        : [],
    [sessionId, user?.$id, refreshKey],
  );

  const authorNames = useLiveQuery(async () => {
    if (!allQuestions) return new Map<string, string>();
    const ids = [...new Set(allQuestions.map(q => q.authorId))];
    const names = new Map<string, string>();
    for (const id of ids) {
      const u = await db.users.get(id);
      names.set(id, u?.name || 'Unknown');
    }
    return names;
  }, [allQuestions]);

  const answersByQuestion = useLiveQuery(async () => {
    if (!allQuestions) return new Map<string, DiscussionAnswer[]>();
    const map = new Map<string, DiscussionAnswer[]>();
    for (const q of allQuestions) {
      const answers = await db.discussion_answers
        .where('questionId')
        .equals(q.$id)
        .toArray();
      map.set(
        q.$id,
        answers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
    }
    return map;
  }, [allQuestions, refreshKey]);

  const answerAuthorNames = useLiveQuery(async () => {
    if (!answersByQuestion) return new Map<string, string>();
    const allAnswers = [...answersByQuestion.values()].flat();
    const ids = [...new Set(allAnswers.map(a => a.authorId))];
    const names = new Map<string, string>();
    for (const id of ids) {
      const u = await db.users.get(id);
      names.set(id, u?.name || 'Unknown');
    }
    return names;
  }, [answersByQuestion]);

  const voteByQuestion = useMemo(() => {
    const map = new Map<string, QuestionVote>();
    for (const vote of userVotes || []) {
      map.set(vote.questionId, vote);
    }
    return map;
  }, [userVotes]);

  const usedVotes = useMemo(() => {
    return (userVotes || []).reduce((sum, v) => sum + Math.max(1, v.weight || 1), 0);
  }, [userVotes]);

  const voteBudget = useMemo(() => session?.votesPerStudent ?? 4, [session?.votesPerStudent]);

  const sortedQuestions = useMemo(() => {
    if (!allQuestions) return [];
    return [...allQuestions].sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [allQuestions]);

  const getAuthorDisplayName = (authorId: string, isTeacherPost: boolean): string => {
    if (isTeacher) return authorNames?.get(authorId) || 'Unknown';
    if (isTeacherPost) return authorNames?.get(authorId) || 'Unknown';
    if (teacherSettings?.hideStudentNicknames) return 'Student';
    return authorNames?.get(authorId) || 'Student';
  };

  const getAnswerAuthorName = (authorId: string): string => {
    if (isTeacher) return answerAuthorNames?.get(authorId) || 'Unknown';
    if (teacherSettings?.hideStudentNicknames) return 'Student';
    return answerAuthorNames?.get(authorId) || 'Student';
  };

  const handleSubmitQuestion = async () => {
    if (!user || !sessionId || !session || !questionText.trim()) return;
    setBusy(true);
    try {
      const id = ID.unique();
      const now = getTimestamp();
      const question: DiscussionQuestion = {
        $id: id,
        classSessionId: sessionId,
        authorId: user.$id,
        questionText: questionText.trim(),
        selectedPassage: selectedPassage.trim(),
        voteCount: 0,
        moderationStatus: 'visible',
        discussionStatus: 'none',
        discussionNotesMarkdown: '',
        notesUpdatedAt: null,
        isTeacherQuestion: isTeacher,
        teacherVisibleBeforeSubmission: false,
        createdAt: now,
        syncStatus: 'local',
      };
      await db.discussion_questions.put(question);
      await addToQueue(user.$id, 'question', id, 'create', question);
      setQuestionText('');
      setSelectedPassage('');
      setRefreshKey(k => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleVote = async (questionId: string) => {
    if (!user || !sessionId || !session) return;
    const question = allQuestions?.find(q => q.$id === questionId);
    if (!question || question.authorId === user.$id) return;

    const existingVote = voteByQuestion.get(questionId);
    const stacked = session.allowStackedVotes;

    if (existingVote && !stacked) {
      await db.question_votes.delete(existingVote.$id);
      await updateQuestionVoteCount(questionId);
      await addToQueue(user.$id, 'vote', existingVote.$id, 'delete', existingVote);
      setRefreshKey(k => k + 1);
      return;
    }

    if (usedVotes >= voteBudget) return;

    const now = getTimestamp();
    if (existingVote && stacked) {
      await db.question_votes.update(existingVote.$id, {
        weight: existingVote.weight + 1,
        updatedAt: now,
        syncStatus: 'local',
      });
      const updated = await db.question_votes.get(existingVote.$id);
      if (updated) await addToQueue(user.$id, 'vote', existingVote.$id, 'update', updated);
      await updateQuestionVoteCount(questionId);
      setRefreshKey(k => k + 1);
      return;
    }

    const voteId = ID.unique();
    const vote: QuestionVote = {
      $id: voteId,
      questionId,
      classSessionId: sessionId,
      userId: user.$id,
      weight: 1,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };
    await db.question_votes.put(vote);
    await addToQueue(user.$id, 'vote', voteId, 'create', vote);
    await updateQuestionVoteCount(questionId);
    setRefreshKey(k => k + 1);
  };

  const handleRemoveVote = async (questionId: string) => {
    if (!user) return;
    const existingVote = voteByQuestion.get(questionId);
    if (!existingVote) return;

    if (existingVote.weight <= 1) {
      await db.question_votes.delete(existingVote.$id);
      await addToQueue(user.$id, 'vote', existingVote.$id, 'delete', existingVote);
    } else {
      const now = getTimestamp();
      await db.question_votes.update(existingVote.$id, {
        weight: existingVote.weight - 1,
        updatedAt: now,
        syncStatus: 'local',
      });
      const updated = await db.question_votes.get(existingVote.$id);
      if (updated) await addToQueue(user.$id, 'vote', existingVote.$id, 'update', updated);
    }
    await updateQuestionVoteCount(questionId);
    setRefreshKey(k => k + 1);
  };

  const handleModerate = async (questionId: string, status: 'visible' | 'hidden' | 'removed') => {
    if (!user) return;
    await db.discussion_questions.update(questionId, {
      moderationStatus: status,
      syncStatus: 'local',
    });
    try {
      const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite');
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.discussion_questions, questionId, {
        moderationStatus: status,
      });
      await db.discussion_questions.update(questionId, { syncStatus: 'synced' });
    } catch {
      const question = await db.discussion_questions.get(questionId);
      if (question) await addToQueue(user.$id, 'question', questionId, 'update', question);
    }
    setRefreshKey(k => k + 1);
  };

  const handleDiscussionStatus = async (
    questionId: string,
    status: 'none' | 'selected' | 'discussed' | 'archived',
  ) => {
    if (!user) return;
    await db.discussion_questions.update(questionId, {
      discussionStatus: status,
      syncStatus: 'local',
    });
    try {
      const { databases, DATABASE_ID, COLLECTIONS } = await import('@/lib/appwrite');
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.discussion_questions, questionId, {
        discussionStatus: status,
      });
      await db.discussion_questions.update(questionId, { syncStatus: 'synced' });
    } catch {
      const question = await db.discussion_questions.get(questionId);
      if (question) await addToQueue(user.$id, 'question', questionId, 'update', question);
    }
    setRefreshKey(k => k + 1);
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!user || !session) return;
    const text = answerTexts[questionId]?.trim();
    if (!text) return;

    setAnswerSubmitting(prev => new Set(prev).add(questionId));
    try {
      const now = getTimestamp();
      const answer: DiscussionAnswer = {
        $id: ID.unique(),
        questionId,
        authorId: user.$id,
        authorName: user.name,
        answerText: text,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
      };
      await db.discussion_answers.put(answer);
      await addToQueue(user.$id, 'discussion_answer', answer.$id, 'create', answer);
      setAnswerTexts(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      setRefreshKey(k => k + 1);
    } finally {
      setAnswerSubmitting(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  };

  const toggleAnswersExpanded = (questionId: string) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleSaveSessionSettings = async () => {
    if (!user || !sessionId) return;
    const updates: Partial<ClassSession> = { syncStatus: 'local' };
    if (votesPerStudent !== null) updates.votesPerStudent = votesPerStudent;
    if (allowStackedVotes !== null) updates.allowStackedVotes = allowStackedVotes;
    if (sessionStatus !== null) updates.status = sessionStatus as ClassSession['status'];
    await db.class_sessions.update(sessionId, updates);
    await addToQueue(user.$id, 'class_session', sessionId, 'update', updates);
    setRefreshKey(k => k + 1);
    setSettingsOpen(false);
  };

  if (!session) {
    return <div className="p-4 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div>
        <Link to={`/sessions/${sessionId}`} className="text-sm text-gray-500 mb-2 inline-block">
          &larr; Back to session
        </Link>
        <h1 className="text-2xl font-bold">{session.title}</h1>
        <p className="text-sm text-gray-500">
          {cls?.name || 'Class'} &middot; {session.sessionDate}
        </p>
      </div>

      {isTeacher && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Teacher controls</h2>
              <p className="text-sm text-gray-500">
                {session.votesPerStudent} votes each
                {session.allowStackedVotes ? ' · stacked on' : ' · stacked off'}
                {' · '}
                <StatusBadge status={session.status} />
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => {
              setVotesPerStudent(session.votesPerStudent);
              setAllowStackedVotes(session.allowStackedVotes);
              setSessionStatus(session.status);
              setSettingsOpen(true);
            }}>
              Settings
            </Button>
          </div>
        </Card>
      )}

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Session settings">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Votes per student</span>
            <input
              type="number"
              min={1}
              max={20}
              value={votesPerStudent ?? session?.votesPerStudent ?? 4}
              onChange={e => setVotesPerStudent(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowStackedVotes ?? session?.allowStackedVotes ?? false}
              onChange={e => setAllowStackedVotes(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Allow stacked votes</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Session status</span>
            <select
              value={sessionStatus ?? session?.status ?? 'draft'}
              onChange={e => setSessionStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <Button onClick={() => void handleSaveSessionSettings()} className="w-full">
            Save settings
          </Button>
        </div>
      </Modal>

      {!isTeacher && (
        <VoteBudgetMeter
          usedVotes={usedVotes}
          voteBudget={voteBudget}
          allowStackedVotes={session.allowStackedVotes}
        />
      )}

      <Card>
        <h2 className="mb-3 font-semibold">Ask a question</h2>
        <textarea
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="What would you like to discuss?"
        />
        <textarea
          value={selectedPassage}
          onChange={e => setSelectedPassage(e.target.value)}
          rows={2}
          className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
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

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Questions{' '}
          <span className="text-sm font-normal text-gray-500">
            ({sortedQuestions.length} total, sorted by votes)
          </span>
        </h2>

        {sortedQuestions.length > 0 ? (
          sortedQuestions.map(question => (
            <QuestionCard
              key={question.$id}
              question={question}
              currentUserId={user?.$id || ''}
              isTeacher={isTeacher}
              authorDisplayName={getAuthorDisplayName(
                question.authorId,
                question.isTeacherQuestion,
              )}
              voteWeight={voteByQuestion.get(question.$id)?.weight || 0}
              usedVotes={usedVotes}
              voteBudget={voteBudget}
              allowStackedVotes={session.allowStackedVotes}
              answers={answersByQuestion?.get(question.$id) || []}
              answerAuthorNames={answerAuthorNames || new Map()}
              getAnswerAuthorName={getAnswerAuthorName}
              isAnswersExpanded={expandedAnswers.has(question.$id)}
              answerText={answerTexts[question.$id] || ''}
              isSubmittingAnswer={answerSubmitting.has(question.$id)}
              onVote={() => void handleVote(question.$id)}
              onRemoveVote={() => void handleRemoveVote(question.$id)}
              onToggleAnswers={() => toggleAnswersExpanded(question.$id)}
              onAnswerTextChange={text =>
                setAnswerTexts(prev => ({ ...prev, [question.$id]: text }))
              }
              onSubmitAnswer={() => void handleSubmitAnswer(question.$id)}
              onModerate={status => void handleModerate(question.$id, status)}
              onDiscussionStatus={status =>
                void handleDiscussionStatus(question.$id, status)
              }
            />
          ))
        ) : (
          <EmptyState
            title="No questions yet"
            message={
              isTeacher
                ? 'No questions have been submitted for this session yet.'
                : 'Be the first to ask a question!'
            }
          />
        )}
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
            {usedVotes} of {voteBudget} used
            {allowStackedVotes ? ' · multiple votes per question allowed' : ''}
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: Math.max(voteBudget, 1) }).map((_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-full ${
                index < usedVotes
                  ? 'bg-blue-700'
                  : 'bg-white border border-blue-200'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      {remaining === 0 && (
        <p className="mt-3 rounded bg-white px-3 py-2 text-sm text-blue-800">
          You have used all your votes. Remove a vote to reassign it.
        </p>
      )}
    </Card>
  );
}

function QuestionCard({
  question,
  currentUserId,
  isTeacher,
  authorDisplayName,
  voteWeight,
  usedVotes,
  voteBudget,
  allowStackedVotes,
  answers,
  answerAuthorNames,
  getAnswerAuthorName,
  isAnswersExpanded,
  answerText,
  isSubmittingAnswer,
  onVote,
  onRemoveVote,
  onToggleAnswers,
  onAnswerTextChange,
  onSubmitAnswer,
  onModerate,
  onDiscussionStatus,
}: {
  question: DiscussionQuestion;
  currentUserId: string;
  isTeacher: boolean;
  authorDisplayName: string;
  voteWeight: number;
  usedVotes: number;
  voteBudget: number;
  allowStackedVotes: boolean;
  answers: DiscussionAnswer[];
  answerAuthorNames: Map<string, string>;
  getAnswerAuthorName: (authorId: string) => string;
  isAnswersExpanded: boolean;
  answerText: string;
  isSubmittingAnswer: boolean;
  onVote: () => void;
  onRemoveVote: () => void;
  onToggleAnswers: () => void;
  onAnswerTextChange: (text: string) => void;
  onSubmitAnswer: () => void;
  onModerate: (status: 'visible' | 'hidden' | 'removed') => void;
  onDiscussionStatus: (status: 'none' | 'selected' | 'discussed' | 'archived') => void;
}) {
  const isAuthor = question.authorId === currentUserId;
  const canAddVote = !isAuthor && usedVotes < voteBudget;
  const canRemoveVote = voteWeight > 0;
  const noVotesLeft = usedVotes >= voteBudget;

  const modBadge = question.moderationStatus !== 'visible' ? question.moderationStatus : null;
  const discBadge =
    question.discussionStatus !== 'none' ? question.discussionStatus : null;

  return (
    <Card
      className={
        question.discussionStatus === 'selected'
          ? 'ring-2 ring-blue-500'
          : question.moderationStatus === 'hidden'
            ? 'opacity-60'
            : ''
      }
    >
      <div className="flex gap-3">
        <div className="flex w-14 shrink-0 flex-col items-center gap-1">
          {!isTeacher && (
            <>
              {isAuthor ? (
                <span
                  className="h-10 w-10 rounded-lg bg-gray-100 text-[10px] font-medium text-gray-500 flex items-center justify-center"
                  title="You can't vote on your own question"
                >
                  Yours
                </span>
              ) : allowStackedVotes ? (
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={onVote}
                    disabled={!canAddVote}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                      canAddVote
                        ? 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                    title={noVotesLeft ? 'No votes left' : 'Add one vote'}
                  >
                    +1
                  </button>
                  {canRemoveVote && (
                    <button
                      onClick={onRemoveVote}
                      className="h-8 w-8 rounded-lg bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                      title="Remove one vote"
                    >
                      -1
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={onVote}
                  disabled={!canAddVote && !canRemoveVote}
                  className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors ${
                    voteWeight > 0
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : canAddVote
                        ? 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                  title={
                    voteWeight > 0
                      ? 'Remove vote'
                      : noVotesLeft
                        ? 'No votes left'
                        : 'Vote'
                  }
                >
                  {voteWeight > 0 ? '✓' : 'Vote'}
                </button>
              )}
            </>
          )}
          <span className="text-lg font-bold text-gray-800">{question.voteCount}</span>
          {voteWeight > 0 && (
            <span className="text-xs text-blue-700">x{voteWeight}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap text-gray-900">{question.questionText}</p>

          {question.selectedPassage && (
            <blockquote className="mt-3 border-l-4 border-gray-200 pl-3 text-sm text-gray-500">
              &ldquo;{question.selectedPassage}&rdquo;
            </blockquote>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-gray-100 px-2 py-1 text-gray-600">
              {authorDisplayName}
            </span>
            {isAuthor && !isTeacher && (
              <StatusBadge status="selected" label="Your question" />
            )}
            {modBadge && <StatusBadge status={modBadge} />}
            {discBadge && <StatusBadge status={discBadge} />}
          </div>

          {isTeacher && (
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap gap-2">
                {question.moderationStatus === 'visible' ? (
                  <Button size="sm" variant="ghost" onClick={() => onModerate('hidden')}>
                    Hide
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => onModerate('visible')}>
                    Show
                  </Button>
                )}
                {question.moderationStatus !== 'removed' && (
                  <Button size="sm" variant="ghost" onClick={() => onModerate('removed')}>
                    Remove
                  </Button>
                )}
                {question.discussionStatus !== 'selected' && (
                  <Button size="sm" variant="secondary" onClick={() => onDiscussionStatus('selected')}>
                    Select for discussion
                  </Button>
                )}
                {question.discussionStatus === 'selected' && (
                  <Button size="sm" variant="secondary" onClick={() => onDiscussionStatus('discussed')}>
                    Mark discussed
                  </Button>
                )}
                {question.discussionStatus !== 'none' && (
                  <Button size="sm" variant="ghost" onClick={() => onDiscussionStatus('none')}>
                    Clear status
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 border-t border-gray-100 pt-3">
            <button
              onClick={onToggleAnswers}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className={`h-4 w-4 transition-transform ${isAnswersExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Answers ({answers.length})
            </button>

            {isAnswersExpanded && (
              <div className="mt-3 space-y-3">
                {answers.length > 0 ? (
                  answers.map(answer => (
                    <div
                      key={answer.$id}
                      className="rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          {answer.authorName || getAnswerAuthorName(answer.authorId)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(answer.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {answer.answerText}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No answers yet.</p>
                )}

                <div className="flex gap-2">
                  <textarea
                    value={answerText}
                    onChange={e => onAnswerTextChange(e.target.value)}
                    rows={2}
                    className="flex-1 resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Write an answer..."
                  />
                  <Button
                    size="sm"
                    onClick={onSubmitAnswer}
                    loading={isSubmittingAnswer}
                    disabled={!answerText.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

async function updateQuestionVoteCount(questionId: string): Promise<void> {
  const votes = await db.question_votes
    .where('questionId')
    .equals(questionId)
    .toArray();
  const voteCount = votes.reduce((sum, vote) => sum + Math.max(1, vote.weight || 1), 0);
  await db.discussion_questions.update(questionId, { voteCount, syncStatus: 'local' });
}
