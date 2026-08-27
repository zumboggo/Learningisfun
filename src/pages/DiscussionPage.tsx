import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ID } from 'appwrite';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { classLabel, getTimestamp } from '@/utils/helpers';
import { addToQueue } from '@/services/sync.service';
import { syncDiscussionFromServer, updateClassSession } from '@/services/class-session.service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CopyButton } from '@/components/common/CopyButton';
import type {
  DiscussionQuestion,
  DiscussionAnswer,
  QuestionVote,
  ClassSession,
} from '@/types';
import { RedditDiscussionPage } from '@/pages/RedditDiscussionPage';
import { client, COLLECTIONS, DATABASE_ID } from '@/lib/appwrite';
import { formatQuestionsForClipboard } from '@/services/question.service';

export function DiscussionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, isTeacher, isParent } = useAuth();

  const [questionText, setQuestionText] = useState('');
  const [selectedPassage, setSelectedPassage] = useState('');
  const [questionSourceTitle, setQuestionSourceTitle] = useState('');
  const [questionSourceUrl, setQuestionSourceUrl] = useState('');
  const [questionLinkOpen, setQuestionLinkOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [answerSubmitting, setAnswerSubmitting] = useState<Set<string>>(new Set());

  const [votesPerStudent, setVotesPerStudent] = useState<number | null>(null);
  const [allowStackedVotes, setAllowStackedVotes] = useState<boolean | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [sessionPrompt, setSessionPrompt] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const session = useLiveQuery(
    () => (sessionId ? db.class_sessions.get(sessionId) : undefined),
    [sessionId, refreshKey],
  );

  const refreshDiscussion = useCallback(async () => {
    if (!sessionId) return;
    setRefreshing(true);
    try {
      await syncDiscussionFromServer(sessionId);
      setRefreshKey(k => k + 1);
    } finally {
      setRefreshing(false);
    }
  }, [sessionId]);

  // Refresh immediately and when returning to the page. The question document
  // is also updated by the server whenever a vote changes, so Realtime can
  // refresh totals without polling (and without consuming reads every few
  // seconds for an entire class).
  useEffect(() => {
    if (!sessionId) return;
    void refreshDiscussion();
    let timer: number | undefined;
    const refreshVisible = () => {
      if (document.visibilityState === 'visible') void refreshDiscussion();
    };
    window.addEventListener('focus', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    const unsubscribe = DATABASE_ID
      ? client.subscribe(`databases.${DATABASE_ID}.collections.${COLLECTIONS.discussion_questions}.documents`, event => {
          const payload = event.payload as { classSessionId?: string };
          if (payload.classSessionId !== sessionId) return;
          if (timer !== undefined) window.clearTimeout(timer);
          timer = window.setTimeout(() => void refreshDiscussion(), 500);
        })
      : () => undefined;
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener('focus', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible);
      unsubscribe();
    };
  }, [sessionId, refreshDiscussion]);

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
    if (!user || !sessionId || !session || !questionText.trim() || !validOptionalSourceLink(questionSourceTitle, questionSourceUrl)) return;
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
        sourceTitle: questionSourceTitle.trim(),
        sourceUrl: questionSourceUrl.trim(),
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
      setQuestionSourceTitle('');
      setQuestionSourceUrl('');
      setQuestionLinkOpen(false);
      setRefreshKey(k => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleVote = async (questionId: string) => {
    if (!user || !sessionId || !session) return;
    const question = allQuestions?.find(q => q.$id === questionId);
    if (!question || (question.authorId === user.$id && !isTeacher)) return;

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

  const handleSubmitAnswer = async (questionId: string, sourceTitle = '', sourceUrl = '') => {
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
        sourceTitle: sourceTitle.trim(),
        sourceUrl: sourceUrl.trim(),
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

  const handleEditQuestion = async (questionId: string, text: string, passage: string, sourceTitle: string, sourceUrl: string) => {
    if (!user || !isTeacher) return;
    const question = await db.discussion_questions.get(questionId);
    if (!question || question.authorId !== user.$id || !question.isTeacherQuestion || !text.trim()) return;
    await db.discussion_questions.update(questionId, { questionText: text.trim(), selectedPassage: passage.trim(), sourceTitle: sourceTitle.trim(), sourceUrl: sourceUrl.trim(), syncStatus: 'local' });
    const updated = await db.discussion_questions.get(questionId);
    if (updated) await addToQueue(user.$id, 'question', questionId, 'update', updated);
    setRefreshKey(key => key + 1);
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

  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleSaveSessionSettings = async () => {
    if (!user || !sessionId) return;
    const updates: Parameters<typeof updateClassSession>[2] = {};
    if (sessionTitle !== null && sessionTitle.trim()) updates.title = sessionTitle.trim();
    if (votesPerStudent !== null) updates.votesPerStudent = votesPerStudent;
    if (allowStackedVotes !== null) updates.allowStackedVotes = allowStackedVotes;
    if (sessionStatus !== null) updates.status = sessionStatus as ClassSession['status'];
    if (sessionPrompt !== null) updates.promptMarkdown = sessionPrompt.trim();
    // Goes through the service so the queued payload is the whole session —
    // a bare patch has no $id for the sync layer to write against.
    await updateClassSession(sessionId, user.$id, updates);
    setRefreshKey(k => k + 1);
    setSettingsOpen(false);
  };

  const openSettings = () => {
    if (!session) return;
    setSessionTitle(session.title);
    setVotesPerStudent(session.votesPerStudent);
    setAllowStackedVotes(session.allowStackedVotes);
    setSessionStatus(session.status);
    setSessionPrompt(session.promptMarkdown || '');
    setSettingsOpen(true);
  };

  if (!session) {
    return <div className="p-4 text-gray-400">Loading...</div>;
  }

  if (session.discussionType && session.discussionType !== 'qft') {
    return <RedditDiscussionPage session={session} />;
  }

  if (isParent) {
    return <div className="p-4 max-w-2xl mx-auto space-y-4"><h1 className="text-2xl font-bold">{session.title}</h1><p className="text-sm text-gray-500">Parent read-only view</p>{sortedQuestions.map(question => <Card key={question.$id}><div className="flex justify-between gap-3"><p>{question.questionText}</p><b>{question.voteCount} votes</b></div><SourceLink title={question.sourceTitle} url={question.sourceUrl}/>{(answersByQuestion?.get(question.$id)||[]).map(answer=><div key={answer.$id} className="mt-2 border-l-2 pl-3 text-sm"><p>{answer.answerText}</p><SourceLink title={answer.sourceTitle} url={answer.sourceUrl}/></div>)}</Card>)}</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div>
        <Link to={`/sessions/${sessionId}`} className="text-sm text-gray-500 mb-2 inline-block">
          &larr; Back to session
        </Link>
        <div className="flex items-start gap-2">
          <h1 className="text-2xl font-bold">{session.title}</h1>
          {isTeacher && (
            <button
              onClick={openSettings}
              className="mt-1.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
              aria-label="Rename this discussion"
            >
              Rename
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {classLabel(cls)} &middot; {session.sessionDate}
        </p>
      </div>

      {session.promptMarkdown && <Card className="border-blue-100 bg-blue-50"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xs font-semibold uppercase tracking-wide text-blue-600">Discussion focus</h2><p className="mt-1 whitespace-pre-wrap text-sm text-blue-950">{session.promptMarkdown}</p></div>{isTeacher && <Button size="sm" variant="secondary" onClick={openSettings}>Edit</Button>}</div></Card>}

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
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" loading={refreshing} onClick={() => void refreshDiscussion()}>
                Refresh totals
              </Button>
              <Button size="sm" variant="secondary" onClick={openSettings}>
                Settings
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Discussion settings">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Discussion name</span>
            <input
              type="text"
              value={sessionTitle ?? session?.title ?? ''}
              onChange={e => setSessionTitle(e.target.value)}
              placeholder="e.g. Chapter 4 — what puzzled you?"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Overall topic or focus</span><textarea rows={3} value={sessionPrompt ?? session?.promptMarkdown ?? ''} onChange={e => setSessionPrompt(e.target.value)} placeholder="Broad context for the many questions teachers and students will add" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Votes per person</span>
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

      <VoteBudgetMeter
        usedVotes={usedVotes}
        voteBudget={voteBudget}
        allowStackedVotes={session.allowStackedVotes}
      />

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
        <div className="mt-2">
          <LinkToggle open={questionLinkOpen} onClick={() => setQuestionLinkOpen(value => !value)} />
          {questionLinkOpen && <SourceLinkFields title={questionSourceTitle} url={questionSourceUrl} onTitleChange={setQuestionSourceTitle} onUrlChange={setQuestionSourceUrl} />}
        </div>
        <Button
          onClick={() => void handleSubmitQuestion()}
          loading={busy}
          disabled={!questionText.trim() || !validOptionalSourceLink(questionSourceTitle, questionSourceUrl)}
          className="mt-3 w-full"
        >
          Submit question
        </Button>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Questions <span className="text-sm font-normal text-gray-500">({sortedQuestions.length} total, sorted by votes)</span></h2>
          {isTeacher && <CopyButton text={formatQuestionsForClipboard(sortedQuestions)} label="Copy Questions" copiedLabel="Questions copied" />}
        </div>

        {sortedQuestions.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <span className="w-8 shrink-0 text-center">Votes</span>
              <span className="min-w-0 flex-1">Question</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {sortedQuestions.map(question => (
                <QuestionRow
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
                  getAnswerAuthorName={getAnswerAuthorName}
                  isExpanded={expandedQuestions.has(question.$id)}
                  isAnswersExpanded={expandedAnswers.has(question.$id)}
                  answerText={answerTexts[question.$id] || ''}
                  isSubmittingAnswer={answerSubmitting.has(question.$id)}
                  onToggleExpanded={() => toggleQuestionExpanded(question.$id)}
                  onVote={() => void handleVote(question.$id)}
                  onRemoveVote={() => void handleRemoveVote(question.$id)}
                  onToggleAnswers={() => {
                    toggleAnswersExpanded(question.$id);
                    setExpandedQuestions(prev => new Set(prev).add(question.$id));
                  }}
                  onAnswerTextChange={text =>
                    setAnswerTexts(prev => ({ ...prev, [question.$id]: text }))
                  }
                  onSubmitAnswer={(sourceTitle, sourceUrl) => handleSubmitAnswer(question.$id, sourceTitle, sourceUrl)}
                  onModerate={status => void handleModerate(question.$id, status)}
                  onDiscussionStatus={status =>
                    void handleDiscussionStatus(question.$id, status)
                  }
                  onEdit={(text, passage, sourceTitle, sourceUrl) => void handleEditQuestion(question.$id, text, passage, sourceTitle, sourceUrl)}
                />
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            title="No questions yet"
            message={
              isTeacher
                ? 'No questions have been submitted for this discussion yet.'
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

/**
 * One question as a single spreadsheet-style row: vote tally, the question
 * itself, and small actions. Everything else — the quoted passage, replies and
 * the teacher's moderation controls — stays folded away until the row is
 * opened, so thirty questions fit on a screen instead of three.
 */
function QuestionRow({
  question,
  currentUserId,
  isTeacher,
  authorDisplayName,
  voteWeight,
  usedVotes,
  voteBudget,
  allowStackedVotes,
  answers,
  getAnswerAuthorName,
  isExpanded,
  isAnswersExpanded,
  answerText,
  isSubmittingAnswer,
  onToggleExpanded,
  onVote,
  onRemoveVote,
  onToggleAnswers,
  onAnswerTextChange,
  onSubmitAnswer,
  onModerate,
  onDiscussionStatus,
  onEdit,
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
  getAnswerAuthorName: (authorId: string) => string;
  isExpanded: boolean;
  isAnswersExpanded: boolean;
  answerText: string;
  isSubmittingAnswer: boolean;
  onToggleExpanded: () => void;
  onVote: () => void;
  onRemoveVote: () => void;
  onToggleAnswers: () => void;
  onAnswerTextChange: (text: string) => void;
  onSubmitAnswer: (sourceTitle: string, sourceUrl: string) => Promise<void>;
  onModerate: (status: 'visible' | 'hidden' | 'removed') => void;
  onDiscussionStatus: (status: 'none' | 'selected' | 'discussed' | 'archived') => void;
  onEdit: (text: string, passage: string, sourceTitle: string, sourceUrl: string) => void;
}) {
  const isAuthor = question.authorId === currentUserId;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(question.questionText);
  const [editPassage, setEditPassage] = useState(question.selectedPassage);
  const [editSourceTitle, setEditSourceTitle] = useState(question.sourceTitle || '');
  const [editSourceUrl, setEditSourceUrl] = useState(question.sourceUrl || '');
  const [answerLinkOpen, setAnswerLinkOpen] = useState(false);
  const [answerSourceTitle, setAnswerSourceTitle] = useState('');
  const [answerSourceUrl, setAnswerSourceUrl] = useState('');
  const canVoteForQuestion = !isAuthor || isTeacher;
  const canAddVote = canVoteForQuestion && usedVotes < voteBudget;
  const hasVoted = voteWeight > 0;
  const noVotesLeft = usedVotes >= voteBudget;

  const modBadge = question.moderationStatus !== 'visible' ? question.moderationStatus : null;
  const discBadge = question.discussionStatus !== 'none' ? question.discussionStatus : null;

  const rowTint =
    question.discussionStatus === 'selected'
      ? 'bg-blue-50/60'
      : question.moderationStatus !== 'visible'
        ? 'opacity-60'
        : '';

  // Opening a row with no passage and no teacher controls would otherwise draw
  // an empty grey box under a student's question.
  const hasPanelContent =
    editing || isAnswersExpanded || (isExpanded && (isTeacher || Boolean(question.selectedPassage) || Boolean(question.sourceUrl)));

  return (
    <li className={rowTint}>
      <div className="flex items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-3">
        <span
          className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-gray-700"
          title={`${question.voteCount} votes`}
        >
          {question.voteCount}
        </span>

        <button
          onClick={onToggleExpanded}
          className="min-w-0 flex-1 py-0.5 text-left"
          aria-expanded={isExpanded}
        >
          <span className={`block text-sm leading-5 text-gray-900 ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
            {question.questionText}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-400">
            <span className="truncate">{authorDisplayName}</span>
            {answers.length > 0 && <span>{answers.length} replies</span>}
            {isAuthor && !isTeacher && <span className="text-blue-500">yours</span>}
            {modBadge && <span className="text-amber-600">{modBadge}</span>}
            {discBadge && <span className="text-blue-600">{discBadge}</span>}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {canVoteForQuestion && (
            allowStackedVotes ? (
              <>
                <RowButton
                  onClick={onVote}
                  disabled={!canAddVote}
                  title={noVotesLeft ? 'No votes left' : 'Add a vote'}
                >
                  +1
                </RowButton>
                {hasVoted && (
                  <RowButton onClick={onRemoveVote} tone="danger" title="Remove a vote">
                    −1
                  </RowButton>
                )}
                {hasVoted && <span className="text-[11px] font-medium text-blue-600">×{voteWeight}</span>}
              </>
            ) : (
              <RowButton
                onClick={onVote}
                disabled={!canAddVote && !hasVoted}
                tone={hasVoted ? 'active' : 'default'}
                title={hasVoted ? 'Remove your vote' : noVotesLeft ? 'No votes left' : 'Vote'}
              >
                {hasVoted ? 'Voted' : 'Vote'}
              </RowButton>
            )
          )}

          <RowButton onClick={onToggleAnswers} title="Reply to this question">
            Respond{answers.length > 0 ? ` ${answers.length}` : ''}
          </RowButton>

          {isTeacher && (
            <RowButton
              onClick={onToggleExpanded}
              tone={isExpanded ? 'active' : 'default'}
              title="Teacher actions"
            >
              ⋯
            </RowButton>
          )}
          {isTeacher && isAuthor && question.isTeacherQuestion && <RowButton onClick={() => setEditing(value => !value)} tone={editing ? 'active' : 'default'} title="Edit your question">Edit</RowButton>}
        </div>
      </div>

      {hasPanelContent && (
        <div className="space-y-3 border-t border-gray-100 bg-gray-50/60 px-3 py-3">
          {isExpanded && question.selectedPassage && (
            <blockquote className="border-l-4 border-gray-200 pl-3 text-sm text-gray-500">
              &ldquo;{question.selectedPassage}&rdquo;
            </blockquote>
          )}
          {isExpanded && <SourceLink title={question.sourceTitle} url={question.sourceUrl} />}

          {isExpanded && isTeacher && (
            <div className="flex flex-wrap gap-1.5">
              {question.moderationStatus === 'visible' ? (
                <RowButton onClick={() => onModerate('hidden')}>Hide</RowButton>
              ) : (
                <RowButton onClick={() => onModerate('visible')}>Show</RowButton>
              )}
              {question.moderationStatus !== 'removed' && (
                <RowButton onClick={() => onModerate('removed')} tone="danger">Remove</RowButton>
              )}
              {question.discussionStatus !== 'selected' && (
                <RowButton onClick={() => onDiscussionStatus('selected')} tone="active">
                  Select for discussion
                </RowButton>
              )}
              {question.discussionStatus === 'selected' && (
                <RowButton onClick={() => onDiscussionStatus('discussed')} tone="active">
                  Mark discussed
                </RowButton>
              )}
              {question.discussionStatus !== 'none' && (
                <RowButton onClick={() => onDiscussionStatus('none')}>Clear status</RowButton>
              )}
            </div>
          )}

          {editing && isTeacher && isAuthor && question.isTeacherQuestion && <div className="space-y-2 rounded-lg border border-blue-100 bg-white p-3"><input className="w-full rounded-lg border px-3 py-2 text-sm" value={editText} onChange={e => setEditText(e.target.value)} /><textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={editPassage} onChange={e => setEditPassage(e.target.value)} placeholder="Quoted passage (optional)" /><SourceLinkFields title={editSourceTitle} url={editSourceUrl} onTitleChange={setEditSourceTitle} onUrlChange={setEditSourceUrl} /><div className="flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button size="sm" disabled={!editText.trim() || !validOptionalSourceLink(editSourceTitle, editSourceUrl)} onClick={() => { onEdit(editText, editPassage, editSourceTitle, editSourceUrl); setEditing(false); }}>Save question</Button></div></div>}

          {isAnswersExpanded && (
            <div className="space-y-2">
              {answers.length > 0 ? (
                answers.map(answer => (
                  <div key={answer.$id} className="rounded-lg bg-white px-3 py-2">
                    <div className="mb-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="font-medium text-gray-500">
                        {answer.authorName || getAnswerAuthorName(answer.authorId)}
                      </span>
                      <span>
                        {new Date(answer.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{answer.answerText}</p>
                    <SourceLink title={answer.sourceTitle} url={answer.sourceUrl} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No replies yet.</p>
              )}

              <div className="rounded-lg border border-gray-200 bg-white p-2">
                <textarea value={answerText} onChange={e => onAnswerTextChange(e.target.value)} rows={2} className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Write a reply…" />
                {answerLinkOpen && <SourceLinkFields title={answerSourceTitle} url={answerSourceUrl} onTitleChange={setAnswerSourceTitle} onUrlChange={setAnswerSourceUrl} />}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <LinkToggle open={answerLinkOpen} onClick={() => setAnswerLinkOpen(value => !value)} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={onToggleAnswers}>Cancel</Button>
                    <Button size="sm" onClick={() => void onSubmitAnswer(answerSourceTitle, answerSourceUrl).then(() => { setAnswerSourceTitle(''); setAnswerSourceUrl(''); setAnswerLinkOpen(false); })} loading={isSubmittingAnswer} disabled={!answerText.trim() || !validOptionalSourceLink(answerSourceTitle, answerSourceUrl)}>Send</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function validOptionalSourceLink(title: string, url: string): boolean {
  if (!title.trim() && !url.trim()) return true;
  if (!title.trim() || !url.trim()) return false;
  try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; }
}

function LinkToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-expanded={open} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50" title="Add a supporting link"><span aria-hidden="true">🔗</span>{open ? 'Hide link' : 'Add link'}</button>;
}

function SourceLinkFields({ title, url, onTitleChange, onUrlChange }: { title: string; url: string; onTitleChange: (value: string) => void; onUrlChange: (value: string) => void }) {
  const valid = validOptionalSourceLink(title, url);
  return <div className="mt-2 grid gap-2 rounded-lg bg-blue-50 p-2 sm:grid-cols-2"><label className="text-[11px] font-medium text-gray-600">Page title<input value={title} onChange={event => onTitleChange(event.target.value)} maxLength={255} placeholder="Article or page title" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm" /></label><label className="text-[11px] font-medium text-gray-600">Link<input type="url" value={url} onChange={event => onUrlChange(event.target.value)} maxLength={2048} placeholder="https://…" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm" /></label>{!valid && <p className="text-xs text-red-600 sm:col-span-2">Add both a title and a complete http or https link.</p>}</div>;
}

function SourceLink({ title, url }: { title?: string; url?: string }) {
  if (!title || !url || !validOptionalSourceLink(title, url)) return null;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-blue-700 hover:underline"><span aria-hidden="true">🔗</span><span className="truncate">{title}</span></a>;
}

/** Compact action button sized to sit inside a one-line row. */
function RowButton({
  children,
  onClick,
  disabled,
  title,
  tone = 'default',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  tone?: 'default' | 'active' | 'danger';
}) {
  const tones = {
    default: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    active: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
        disabled ? 'cursor-not-allowed bg-gray-50 text-gray-300' : tones[tone]
      }`}
    >
      {children}
    </button>
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
