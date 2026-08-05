import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildClassNotesPreview,
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
import {
  getSessionParagraphObservations,
  splitReadingIntoParagraphs,
  upsertParagraphObservation,
} from '@/services/paragraph-observation.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Markdown } from '@/components/common/Markdown';
import { MarkdownToolbar } from '@/components/common/MarkdownToolbar';
import { StatusBadge } from '@/components/common/StatusBadge';
import type {
  DeckAssignment,
  DiscussionQuestion,
  FlashcardDeck,
  ParagraphObservation,
  Reading,
  ReadingAssignment,
  Submission,
} from '@/types';

type SessionTab = 'text' | 'questions' | 'responses' | 'flashcards' | 'notes';

export function ClassSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SessionTab>('text');
  const [refreshKey, setRefreshKey] = useState(0);
  const [questionText, setQuestionText] = useState('');
  const [selectedPassage, setSelectedPassage] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const sessionNotesRef = useRef<HTMLTextAreaElement>(null);

  const session = useLiveQuery(() => (sessionId ? db.class_sessions.get(sessionId) : undefined), [sessionId, refreshKey]);
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

  const observations = useLiveQuery(
    () => (sessionId ? getSessionParagraphObservations(sessionId) : []),
    [sessionId, refreshKey],
  );

  const submissions = useLiveQuery(
    () => (session?.assignmentId ? db.submissions.where('assignmentId').equals(session.assignmentId).toArray() : []),
    [session?.assignmentId, refreshKey],
  );

  const deckRows = useLiveQuery(
    () => (session ? buildDeckRows(session.classId) : []),
    [session?.classId, refreshKey],
  );

  const activity = useLiveQuery(
    () => (session ? buildSessionActivity(session.$id, session.classId, session.assignmentId, session.sessionDate) : null),
    [session?.$id, session?.classId, session?.assignmentId, session?.sessionDate, refreshKey],
  );

  const notesPreview = useLiveQuery(
    () => (sessionId ? buildClassNotesPreview(sessionId) : ''),
    [sessionId, session?.updatedAt, questions?.length, observations?.length, refreshKey],
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
    setRefreshKey(key => key + 1);
  };

  const saveQuestionNotes = async (question: DiscussionQuestion) => {
    if (!user) return;
    const notes = notesDrafts[question.$id] ?? question.discussionNotesMarkdown;
    await updateQuestionDiscussionNotes(question.$id, user.$id, notes);
    setRefreshKey(key => key + 1);
  };

  const publishNotes = async () => {
    if (!user || !sessionId) return;
    await saveSessionNotes();
    await publishClassNotes(sessionId, user.$id);
    setRefreshKey(key => key + 1);
  };

  if (!session) {
    return <div className="p-4 text-gray-400">Loading class period...</div>;
  }

  const tabs: Array<{ id: SessionTab; label: string }> = [
    { id: 'text', label: 'Teach Text' },
    { id: 'questions', label: 'Questions' },
    { id: 'responses', label: 'Responses' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="mb-2 text-sm text-gray-500">Back</button>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-sm text-gray-500">
            {cls?.name || 'Class'} | {session.sessionDate} | {session.votesPerStudent} votes each
            {session.allowStackedVotes ? ' | stacked votes on' : ''}
          </p>
          {reading && (
            <p className="mt-1 text-sm text-gray-500">
              Linked reading: <Link to={`/readings/${reading.$id}`} className="text-blue-600">{reading.title}</Link>
            </p>
          )}
        </div>
        {isTeacher && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setRefreshKey(key => key + 1)}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => void publishNotes()}>
              Publish notes
            </Button>
          </div>
        )}
      </div>

      <ActivityStrip activity={activity} observations={observations || []} isTeacher={Boolean(isTeacher)} />

      {session.publishedNotesMarkdown && !isTeacher && (
        <Card>
          <h2 className="mb-3 font-semibold">Published notes</h2>
          <Markdown content={session.publishedNotesMarkdown} className="text-sm text-gray-700" />
        </Card>
      )}

      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex min-w-max gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'text' && (
        <LessonTextPanel
          reading={reading}
          assignment={assignment}
          sessionId={session.$id}
          userId={user?.$id || ''}
          isTeacher={Boolean(isTeacher)}
          observations={observations || []}
          onSaved={() => setRefreshKey(key => key + 1)}
        />
      )}

      {activeTab === 'questions' && (
        <QuestionBoardPanel
          session={session}
          questions={questions || []}
          isTeacher={Boolean(isTeacher)}
          currentUserId={user?.$id || ''}
          questionText={questionText}
          selectedPassage={selectedPassage}
          busy={busy}
          usedVotes={usedVotes || 0}
          voteByQuestion={voteByQuestion}
          notesDrafts={notesDrafts}
          onQuestionTextChange={setQuestionText}
          onSelectedPassageChange={setSelectedPassage}
          onSubmitQuestion={() => void handleSubmitQuestion()}
          onVote={questionId => void handleVote(questionId)}
          onNotesDraftChange={(questionId, value) => setNotesDrafts(prev => ({ ...prev, [questionId]: value }))}
          onSaveNotes={question => void saveQuestionNotes(question)}
          onStatusChange={(question, status) => {
            void markForDiscussion(question.$id, status, user?.$id || '').then(() => setRefreshKey(key => key + 1));
          }}
        />
      )}

      {activeTab === 'responses' && (
        <ResponsesPanel assignment={assignment} submissions={submissions || []} isTeacher={Boolean(isTeacher)} />
      )}

      {activeTab === 'flashcards' && (
        <FlashcardsPanel rows={deckRows || []} isTeacher={Boolean(isTeacher)} />
      )}

      {activeTab === 'notes' && (
        <NotesPanel
          isTeacher={Boolean(isTeacher)}
          sessionNotes={sessionNotes}
          notesPreview={notesPreview || session.publishedNotesMarkdown || ''}
          sessionNotesRef={sessionNotesRef}
          onNotesChange={setSessionNotes}
          onSave={() => void saveSessionNotes()}
          onPublish={() => void publishNotes()}
        />
      )}
    </div>
  );
}

function ActivityStrip({
  activity,
  observations,
  isTeacher,
}: {
  activity: SessionActivity | null | undefined;
  observations: ParagraphObservation[];
  isTeacher: boolean;
}) {
  if (!isTeacher) return null;
  const observationCount = observations.filter(item =>
    item.observationMarkdown.trim() || item.keyQuestionMarkdown.trim() || item.vocabularyMarkdown.trim(),
  ).length;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <ActivityTile label="Questions" value={activity?.questionCount || 0} detail={`${activity?.voteCount || 0} votes`} />
      <ActivityTile label="Responses" value={activity?.submissionCount || 0} detail={`${activity?.shortSubmissionCount || 0} short`} />
      <ActivityTile label="Text notes" value={observationCount} detail="paragraphs marked" />
      <ActivityTile label="Flashcards" value={`${activity?.flashcardMinutes || 0}m`} detail={`${activity?.cardsReviewed || 0} cards`} />
      <ActivityTile label="Class notes" value={activity?.published ? 'Live' : 'Draft'} detail={activity?.published ? 'published' : 'not published'} />
    </div>
  );
}

function ActivityTile({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <Card className="py-3">
      <div className="text-xs font-medium uppercase text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{detail}</div>
    </Card>
  );
}

function LessonTextPanel({
  reading,
  assignment,
  sessionId,
  userId,
  isTeacher,
  observations,
  onSaved,
}: {
  reading: Reading | undefined;
  assignment: ReadingAssignment | undefined;
  sessionId: string;
  userId: string;
  isTeacher: boolean;
  observations: ParagraphObservation[];
  onSaved: () => void;
}) {
  const paragraphs = splitReadingIntoParagraphs(reading);
  const observationByIndex = useMemo(
    () => new Map(observations.map(item => [item.paragraphIndex, item])),
    [observations],
  );

  if (!reading || !assignment) {
    return (
      <EmptyState
        title="No reading attached"
        message="Use the New Lesson builder to connect a text, prompt, questions, and vocab to one class period."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4">
        {paragraphs.map(paragraph => (
          <ParagraphTeachingCard
            key={paragraph.index}
            paragraphIndex={paragraph.index}
            text={paragraph.text}
            reading={reading}
            assignment={assignment}
            sessionId={sessionId}
            userId={userId}
            isTeacher={isTeacher}
            observation={observationByIndex.get(paragraph.index)}
            onSaved={onSaved}
          />
        ))}
      </section>
      <aside className="space-y-4">
        <Card>
          <h2 className="mb-2 font-semibold">Teaching flow</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <StepNumber number={1} text="Read a paragraph aloud or silently." />
            <StepNumber number={2} text="Capture observations, vocabulary, and a key question." />
            <StepNumber number={3} text="Send bigger questions to the question board for voting." />
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Writing prompt</h2>
          {assignment.promptMarkdown ? (
            <Markdown content={assignment.promptMarkdown} className="text-sm text-gray-700" />
          ) : (
            <p className="text-sm text-gray-500">No prompt added yet.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/assignments/${assignment.$id}/respond`}>
              <Button size="sm">{isTeacher ? 'Preview response' : 'Open response'}</Button>
            </Link>
            {assignment.minResponseWords > 0 && <StatusBadge status="ready" label={`${assignment.minResponseWords}+ words`} />}
          </div>
        </Card>
      </aside>
    </div>
  );
}

function ParagraphTeachingCard({
  paragraphIndex,
  text,
  reading,
  assignment,
  sessionId,
  userId,
  isTeacher,
  observation,
  onSaved,
}: {
  paragraphIndex: number;
  text: string;
  reading: Reading;
  assignment: ReadingAssignment;
  sessionId: string;
  userId: string;
  isTeacher: boolean;
  observation: ParagraphObservation | undefined;
  onSaved: () => void;
}) {
  const [observationMarkdown, setObservationMarkdown] = useState(observation?.observationMarkdown || '');
  const [keyQuestionMarkdown, setKeyQuestionMarkdown] = useState(observation?.keyQuestionMarkdown || '');
  const [vocabularyMarkdown, setVocabularyMarkdown] = useState(observation?.vocabularyMarkdown || '');

  useEffect(() => {
    setObservationMarkdown(observation?.observationMarkdown || '');
    setKeyQuestionMarkdown(observation?.keyQuestionMarkdown || '');
    setVocabularyMarkdown(observation?.vocabularyMarkdown || '');
  }, [observation?.$id, observation?.updatedAt]);

  const save = async () => {
    if (!userId) return;
    await upsertParagraphObservation(userId, {
      readingId: reading.$id,
      assignmentId: assignment.$id,
      classSessionId: sessionId,
      paragraphIndex,
      observationMarkdown,
      keyQuestionMarkdown,
      vocabularyMarkdown,
    });
    onSaved();
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">Paragraph {paragraphIndex + 1}</h2>
        {observation && <StatusBadge status="draft" label="Notes saved" />}
      </div>
      {reading.contentFormat === 'markdown' ? (
        <Markdown content={text} className="text-gray-800" />
      ) : (
        <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{text}</p>
      )}

      {isTeacher && (
        <div className="mt-5 grid gap-3 border-t border-gray-100 pt-4 lg:grid-cols-3">
          <CompactTextarea label="Observation" value={observationMarkdown} onChange={setObservationMarkdown} />
          <CompactTextarea label="Key question" value={keyQuestionMarkdown} onChange={setKeyQuestionMarkdown} />
          <CompactTextarea label="Vocabulary" value={vocabularyMarkdown} onChange={setVocabularyMarkdown} />
          <div className="lg:col-span-3">
            <Button size="sm" variant="secondary" onClick={() => void save()}>
              Save paragraph notes
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function CompactTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
      />
    </label>
  );
}

function StepNumber({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-50 text-xs font-bold text-blue-700">
        {number}
      </span>
      <span>{text}</span>
    </div>
  );
}

function QuestionBoardPanel({
  session,
  questions,
  isTeacher,
  currentUserId,
  questionText,
  selectedPassage,
  busy,
  usedVotes,
  voteByQuestion,
  notesDrafts,
  onQuestionTextChange,
  onSelectedPassageChange,
  onSubmitQuestion,
  onVote,
  onNotesDraftChange,
  onSaveNotes,
  onStatusChange,
}: {
  session: { votesPerStudent: number; allowStackedVotes: boolean };
  questions: DiscussionQuestion[];
  isTeacher: boolean;
  currentUserId: string;
  questionText: string;
  selectedPassage: string;
  busy: boolean;
  usedVotes: number;
  voteByQuestion: Map<string, number>;
  notesDrafts: Record<string, string>;
  onQuestionTextChange: (value: string) => void;
  onSelectedPassageChange: (value: string) => void;
  onSubmitQuestion: () => void;
  onVote: (questionId: string) => void;
  onNotesDraftChange: (questionId: string, value: string) => void;
  onSaveNotes: (question: DiscussionQuestion) => void;
  onStatusChange: (question: DiscussionQuestion, status: DiscussionQuestion['discussionStatus']) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Question board</h2>
            <p className="text-sm text-gray-500">{questions.length} questions sorted by votes, then time</p>
          </div>
        </div>

        {!isTeacher && (
          <VoteBudgetMeter
            usedVotes={usedVotes}
            voteBudget={session.votesPerStudent}
            allowStackedVotes={session.allowStackedVotes}
          />
        )}

        {questions.length > 0 ? (
          questions.map(question => (
            <QuestionSessionCard
              key={question.$id}
              question={question}
              currentUserId={currentUserId}
              isTeacher={isTeacher}
              voteWeight={voteByQuestion.get(question.$id) || 0}
              usedVotes={usedVotes}
              voteBudget={session.votesPerStudent}
              allowStackedVotes={session.allowStackedVotes}
              notesDraft={notesDrafts[question.$id] ?? question.discussionNotesMarkdown}
              onNotesDraftChange={value => onNotesDraftChange(question.$id, value)}
              onVote={() => onVote(question.$id)}
              onSaveNotes={() => onSaveNotes(question)}
              onStatusChange={status => onStatusChange(question, status)}
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

      <aside>
        <Card>
          <h2 className="mb-3 font-semibold">Add a question</h2>
          <textarea
            id="session-question-input"
            value={questionText}
            onChange={e => onQuestionTextChange(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="What should the class discuss?"
          />
          <textarea
            value={selectedPassage}
            onChange={e => onSelectedPassageChange(e.target.value)}
            rows={3}
            className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Quoted passage (optional)"
          />
          <Button
            onClick={onSubmitQuestion}
            loading={busy}
            disabled={!questionText.trim()}
            className="mt-3 w-full"
          >
            Submit question
          </Button>
        </Card>
      </aside>
    </div>
  );
}

function ResponsesPanel({
  assignment,
  submissions,
  isTeacher,
}: {
  assignment: ReadingAssignment | undefined;
  submissions: Submission[];
  isTeacher: boolean;
}) {
  if (!assignment) {
    return <EmptyState title="No response prompt" message="Add a writing prompt in the New Lesson builder to collect student responses." />;
  }
  if (!isTeacher) {
    return (
      <Card>
        <h2 className="mb-2 font-semibold">Writing prompt</h2>
        <Markdown content={assignment.promptMarkdown || 'No prompt added.'} className="text-gray-700" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/assignments/${assignment.$id}/respond`}>
            <Button>Open response</Button>
          </Link>
          {assignment.minResponseWords > 0 && <StatusBadge status="ready" label={`${assignment.minResponseWords}+ words`} />}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Writing responses</h2>
          <p className="text-sm text-gray-500">{submissions.length} submissions collected</p>
        </div>
        <Link to={`/assignments/${assignment.$id}/submissions`}>
          <Button size="sm">Named marking view</Button>
        </Link>
      </div>
      {submissions.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {submissions.map((submission, index) => (
            <Card key={submission.$id}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Anonymous sample {index + 1}</h3>
                  <p className="text-sm text-gray-500">{submission.wordCount} words</p>
                </div>
                <StatusBadge status={submission.belowMinimum ? 'short' : submission.status} />
              </div>
              <Markdown content={submission.responseMarkdown.slice(0, 700)} className="line-clamp-6 text-sm text-gray-700" />
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No responses yet" message="When students submit, anonymous samples will appear here for class discussion." />
      )}
    </div>
  );
}

function FlashcardsPanel({
  rows,
  isTeacher,
}: {
  rows: DeckRow[];
  isTeacher: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Flashcards</h2>
        <p className="text-sm text-gray-500">Assigned vocab decks for this class.</p>
      </div>
      {rows.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map(row => (
            <Card key={row.assignment.$id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{row.deck?.title || 'Unknown deck'}</h3>
                  <p className="text-sm text-gray-500">
                    {row.cardCount} cards{row.assignment.dailyTarget ? ` | ${row.assignment.dailyTarget}/day target` : ''}
                  </p>
                </div>
                <StatusBadge status={row.assignment.isRequired ? 'required' : 'practice'} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!isTeacher && (
                  <Link to={`/decks/${row.assignment.deckId}/review`}>
                    <Button size="sm">Study</Button>
                  </Link>
                )}
                {isTeacher && (
                  <Link to={`/classes/${row.assignment.classId}/decks/${row.assignment.deckId}/progress`}>
                    <Button size="sm" variant="secondary">View progress</Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No vocab deck assigned" message="Add a vocab CSV in the New Lesson builder so students can study with FSRS scheduling." />
      )}
    </div>
  );
}

function NotesPanel({
  isTeacher,
  sessionNotes,
  notesPreview,
  sessionNotesRef,
  onNotesChange,
  onSave,
  onPublish,
}: {
  isTeacher: boolean;
  sessionNotes: string;
  notesPreview: string;
  sessionNotesRef: RefObject<HTMLTextAreaElement | null>;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
}) {
  if (!isTeacher) {
    return (
      <Card>
        <h2 className="mb-3 font-semibold">Class notes</h2>
        {notesPreview ? <Markdown content={notesPreview} className="text-gray-700" /> : <p className="text-sm text-gray-500">No notes published yet.</p>}
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <h2 className="mb-3 font-semibold">Daily discussion notes</h2>
        <MarkdownToolbar textareaRef={sessionNotesRef} value={sessionNotes} onChange={onNotesChange} />
        <textarea
          ref={sessionNotesRef}
          value={sessionNotes}
          onChange={e => onNotesChange(e.target.value)}
          rows={12}
          className="w-full resize-y rounded-b-lg border border-gray-300 px-3 py-2 font-mono text-sm"
          placeholder="Markdown notes for the day"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={onSave} variant="secondary">Save draft</Button>
          <Button onClick={onPublish}>Publish notes</Button>
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Student preview</h2>
        {notesPreview ? (
          <Markdown content={notesPreview} className="max-h-[640px] overflow-auto text-sm text-gray-700" />
        ) : (
          <p className="text-sm text-gray-500">Add notes, selected questions, or paragraph observations to build the class note.</p>
        )}
      </Card>
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
                className="w-full resize-y rounded-b-lg border border-gray-300 px-3 py-2 font-mono text-sm"
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

interface SessionActivity {
  questionCount: number;
  voteCount: number;
  submissionCount: number;
  shortSubmissionCount: number;
  flashcardMinutes: number;
  cardsReviewed: number;
  published: boolean;
}

interface DeckRow {
  assignment: DeckAssignment;
  deck: FlashcardDeck | undefined;
  cardCount: number;
}

async function buildSessionActivity(
  sessionId: string,
  classId: string,
  assignmentId: string | null,
  sessionDate: string,
): Promise<SessionActivity> {
  const [questions, votes, submissions, sessions, session] = await Promise.all([
    db.discussion_questions.where('classSessionId').equals(sessionId).and(q => q.moderationStatus === 'visible').toArray(),
    db.question_votes.where('classSessionId').equals(sessionId).toArray(),
    assignmentId ? db.submissions.where('assignmentId').equals(assignmentId).toArray() : Promise.resolve([]),
    db.flashcard_study_sessions.where('classId').equals(classId).and(item => item.startedAt.startsWith(sessionDate)).toArray(),
    db.class_sessions.get(sessionId),
  ]);
  return {
    questionCount: questions.length,
    voteCount: votes.reduce((sum, vote) => sum + Math.max(1, vote.weight || 1), 0),
    submissionCount: submissions.length,
    shortSubmissionCount: submissions.filter(submission => submission.belowMinimum).length,
    flashcardMinutes: Math.round((sessions.reduce((sum, item) => sum + item.activeSeconds, 0) / 60) * 10) / 10,
    cardsReviewed: sessions.reduce((sum, item) => sum + item.cardsReviewed, 0),
    published: Boolean(session?.publishedAt),
  };
}

async function buildDeckRows(classId: string): Promise<DeckRow[]> {
  const assignments = await db.deck_assignments.where('classId').equals(classId).toArray();
  const rows: DeckRow[] = [];
  for (const assignment of assignments) {
    const [deck, cardCount] = await Promise.all([
      db.flashcard_decks.get(assignment.deckId),
      db.flashcard_cards.where('deckId').equals(assignment.deckId).count(),
    ]);
    rows.push({ assignment, deck, cardCount });
  }
  return rows.sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt));
}
