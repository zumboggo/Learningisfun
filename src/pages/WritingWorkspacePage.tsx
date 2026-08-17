import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { CopyButton } from '@/components/common/CopyButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Markdown, countMarkdownWords } from '@/components/common/Markdown';
import { MarkdownToolbar } from '@/components/common/MarkdownToolbar';
import { RubricScorer, RubricScoreTable } from '@/components/writing/RubricScorer';
import {
  FEEDBACK_POINT_SLOTS,
  ensureReviewAssignments,
  formatScore,
  generateAiFeedbackForSubmission,
  getOrCreateSubmission,
  parseFeedbackPoints,
  parseImprovements,
  parseRubric,
  parseScores,
  peerDisplayName,
  saveDraft,
  saveFinalVersion,
  saveReviewDraft,
  submitReview,
  submitWriting,
  summariseScores,
  validateReview,
  buildFeedbackDigest,
  type ReviewDraft,
} from '@/services/writing.service';
import type { PeerReview, RubricCriterion, WritingSubmission } from '@/types';

type Tab = 'write' | 'review' | 'feedback' | 'revise';

export function WritingWorkspacePage() {
  const { promptId } = useParams<{ promptId: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('write');
  const [ready, setReady] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const prompt = useLiveQuery(
    () => (promptId ? db.writing_prompts.get(promptId) : undefined),
    [promptId],
  );

  // The student's own row is created lazily on first visit so drafting works
  // offline without the teacher having to pre-provision anything.
  useEffect(() => {
    if (!promptId || !user) return;
    let cancelled = false;
    void getOrCreateSubmission(promptId, user.$id).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, [promptId, user]);

  const submission = useLiveQuery(
    () =>
      promptId && user
        ? db.writing_submissions.where('promptId').equals(promptId).and(s => s.authorId === user.$id).first()
        : undefined,
    [promptId, user?.$id, ready],
  );

  const myReviews = useLiveQuery(
    () =>
      promptId && user
        ? db.peer_reviews.where('promptId').equals(promptId).and(r => r.reviewerId === user.$id).toArray()
        : [],
    [promptId, user?.$id],
  );

  const reviewsOnMine = useLiveQuery(
    () =>
      submission
        ? db.peer_reviews.where('submissionId').equals(submission.$id).and(r => r.status === 'submitted').toArray()
        : [],
    [submission?.$id],
  );

  const aiFeedback = useLiveQuery(
    () => (submission ? db.writing_ai_feedback.where('submissionId').equals(submission.$id).first() : undefined),
    [submission?.$id],
  );

  const teacherFeedback = useLiveQuery(
    () =>
      submission
        ? db.teacher_writing_feedback.where('submissionId').equals(submission.$id).first()
        : undefined,
    [submission?.$id],
  );

  const rubric = useMemo(() => (prompt ? parseRubric(prompt.rubricJson) : []), [prompt]);

  if (!prompt || !user) {
    return <div className="p-6 text-sm text-gray-400">Loading…</div>;
  }
  if (!submission) {
    return <div className="p-6 text-sm text-gray-400">Preparing your workspace…</div>;
  }

  const reviewsDone = (myReviews || []).filter(r => r.status === 'submitted').length;
  const required = prompt.peerReviewsRequired;
  const hasSubmitted = submission.status !== 'draft';
  const unlocked = reviewsDone >= required;

  const tabs: Array<{ key: Tab; label: string; badge?: string; locked?: boolean }> = [
    { key: 'write', label: 'Write' },
    {
      key: 'review',
      label: 'Review peers',
      badge: `${reviewsDone}/${required}`,
      locked: !hasSubmitted,
    },
    { key: 'feedback', label: 'My feedback', locked: !unlocked },
    { key: 'revise', label: 'Revise', locked: !unlocked },
  ];

  return (
    <div className="student-page space-y-5 p-4">
      <header className="space-y-2">
        <Link to="/writing" className="text-sm text-blue-600 hover:underline">← All writing</Link>
        <h1 className="text-2xl font-bold">{prompt.title}</h1>
        <Card className="bg-blue-50/60">
          <Markdown content={prompt.promptMarkdown} className="text-sm text-gray-800" />
          {prompt.instructions && (
            <p className="mt-3 border-t border-blue-100 pt-3 text-xs text-gray-600">
              {prompt.instructions}
            </p>
          )}
        </Card>
      </header>

      <ProgressTrail
        hasSubmitted={hasSubmitted}
        reviewsDone={reviewsDone}
        required={required}
        hasFinal={Boolean(submission.finalMarkdown)}
      />

      {prompt.aiFeedbackEnabled && (
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-violet-50/60">
          <div><p className="font-semibold">AI writing coach</p><p className="text-xs text-gray-600">Get fresh feedback on the latest version saved in this workspace at any time.</p>{aiError && <p className="text-xs text-red-600">{aiError}</p>}</div>
          <Button size="sm" variant="secondary" loading={aiGenerating} onClick={() => { setAiError(''); setAiGenerating(true); void saveDraft(submission.$id, submission.draftMarkdown).then(() => generateAiFeedbackForSubmission(submission.$id)).catch(e => setAiError(e instanceof Error ? e.message : 'Could not generate feedback')).finally(() => setAiGenerating(false)); }}>
            {aiFeedback ? 'Generate fresh AI feedback' : 'Generate AI feedback'}
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map(item => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === item.key
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item.locked && <span aria-hidden="true" className="mr-1">🔒</span>}
            {item.label}
            {item.badge && (
              <span className={`ml-1.5 text-xs ${tab === item.key ? 'text-blue-100' : 'text-gray-400'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'write' && (
        <WriteTab submission={submission} minWords={prompt.minWords} closed={prompt.status === 'closed'} />
      )}

      {tab === 'review' && (
        hasSubmitted ? (
          <ReviewTab
            promptId={prompt.$id}
            reviewerId={user.$id}
            rubric={rubric}
            required={required}
            reviews={myReviews || []}
          />
        ) : (
          <EmptyState
            title="Submit your own writing first"
            message="Everyone reviews from the same starting line — hand in your draft, then you'll be given classmates' work to mark."
            action={<Button onClick={() => setTab('write')}>Back to writing</Button>}
          />
        )
      )}

      {tab === 'feedback' && (
        unlocked ? (
          <FeedbackTab
            submission={submission}
            rubric={rubric}
            reviews={reviewsOnMine || []}
            ai={aiFeedback ? { www: aiFeedback.wwwSummary, improvements: parseImprovements(aiFeedback.improvementsJson) } : null}
            teacher={teacherFeedback ? { comment: teacherFeedback.commentMarkdown, scores: parseScores(teacherFeedback.scoresJson) } : null}
            aiEnabled={prompt.aiFeedbackEnabled}
          />
        ) : (
          <LockedFeedback reviewsDone={reviewsDone} required={required} onGo={() => setTab('review')} />
        )
      )}

      {tab === 'revise' && (
        unlocked ? (
          <ReviseTab
            submission={submission}
            rubric={rubric}
            reviews={reviewsOnMine || []}
            ai={aiFeedback ? { www: aiFeedback.wwwSummary, improvements: parseImprovements(aiFeedback.improvementsJson) } : null}
            teacher={teacherFeedback ? { comment: teacherFeedback.commentMarkdown, scores: parseScores(teacherFeedback.scoresJson) } : null}
          />
        ) : (
          <LockedFeedback reviewsDone={reviewsDone} required={required} onGo={() => setTab('review')} />
        )
      )}
    </div>
  );
}

function ProgressTrail({
  hasSubmitted,
  reviewsDone,
  required,
  hasFinal,
}: {
  hasSubmitted: boolean;
  reviewsDone: number;
  required: number;
  hasFinal: boolean;
}) {
  const steps = [
    { label: 'Draft & submit', done: hasSubmitted },
    { label: `Review ${required} peers`, done: reviewsDone >= required },
    { label: 'Read feedback', done: reviewsDone >= required },
    { label: 'Revise & hand in', done: hasFinal },
  ];

  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
            step.done ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span className="font-semibold">{step.done ? '✓' : i + 1}</span>
          {step.label}
        </li>
      ))}
    </ol>
  );
}

function LockedFeedback({
  reviewsDone,
  required,
  onGo,
}: {
  reviewsDone: number;
  required: number;
  onGo: () => void;
}) {
  const remaining = required - reviewsDone;
  return (
    <EmptyState
      title="Your feedback is waiting"
      message={`Give ${remaining} more careful ${remaining === 1 ? 'review' : 'reviews'} to unlock what your classmates and the AI coach wrote about your piece. Marking someone else's work against the rubric is what makes you better at judging your own.`}
      action={<Button onClick={onGo}>Review a classmate</Button>}
    />
  );
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

function WriteTab({
  submission,
  minWords,
  closed,
}: {
  submission: WritingSubmission;
  minWords: number;
  closed: boolean;
}) {
  const [text, setText] = useState(submission.draftMarkdown);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submissionId = submission.$id;

  // Autosave keeps offline drafting safe without a manual save habit.
  useEffect(() => {
    if (text === submission.draftMarkdown) return;
    const timer = setTimeout(() => {
      void saveDraft(submissionId, text).then(() => setSavedAt(new Date().toLocaleTimeString()));
    }, 800);
    return () => clearTimeout(timer);
  }, [text, submissionId, submission.draftMarkdown]);

  const words = countMarkdownWords(text);
  const shortBy = Math.max(0, minWords - words);
  const locked = submission.status !== 'draft';

  const handleSubmit = async () => {
    setError('');
    if (shortBy > 0) {
      setError(`You're ${shortBy} words short of the ${minWords}-word target.`);
      return;
    }
    setSubmitting(true);
    try {
      await saveDraft(submissionId, text);
      await submitWriting(submissionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (locked) {
    return (
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Submitted</h2>
            <p className="text-xs text-gray-500">
              {submission.wordCount} words ·{' '}
              {submission.submittedAt && new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <CopyButton text={submission.submittedMarkdown} label="Copy draft" />
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <Markdown content={submission.submittedMarkdown} className="text-sm" />
        </div>
        <p className="text-xs text-gray-500">
          Your submitted draft is locked so reviewers all see the same version. You'll write your
          improved version in the <strong>Revise</strong> tab once feedback unlocks.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {closed && (
        <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
          This prompt is closed — you can still draft, but check with your teacher before submitting.
        </div>
      )}

      <MarkdownToolbar textareaRef={textareaRef} value={text} onChange={setText} />
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        rows={16}
        placeholder="Start writing…"
        className="w-full rounded-b-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <span>
          {words} words
          {minWords > 0 && (
            <span className={shortBy > 0 ? ' text-orange-600' : ' text-green-600'}>
              {' '}· target {minWords}{shortBy > 0 ? ` (${shortBy} to go)` : ' ✓'}
            </span>
          )}
        </span>
        <span>{savedAt ? `Saved ${savedAt}` : 'Saves automatically'}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleSubmit()} loading={submitting}>
          Submit for peer review
        </Button>
        <CopyButton text={text} label="Copy draft" />
      </div>
      <p className="text-xs text-gray-400">
        Once you submit, classmates see this anonymously as <strong>{submission.anonymousLabel}</strong>.
        Only your teacher can see your name.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Review peers
// ---------------------------------------------------------------------------

function ReviewTab({
  promptId,
  reviewerId,
  rubric,
  required,
  reviews,
}: {
  promptId: string;
  reviewerId: string;
  rubric: RubricCriterion[];
  required: number;
  reviews: PeerReview[];
}) {
  const [assigning, setAssigning] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    void ensureReviewAssignments(promptId, reviewerId)
      .then(assigned => {
        if (cancelled) return;
        if (assigned.length < required) {
          setNotice(
            `Only ${assigned.length} of ${required} classmates have submitted so far. Check back once more people hand in.`,
          );
        } else {
          setNotice('');
        }
      })
      .finally(() => { if (!cancelled) setAssigning(false); });
    return () => { cancelled = true; };
  }, [promptId, reviewerId, required]);

  const ordered = [...reviews].sort((a, b) => a.assignedAt.localeCompare(b.assignedAt));

  if (assigning && ordered.length === 0) {
    return <div className="p-6 text-sm text-gray-400">Finding classmates' work…</div>;
  }

  if (ordered.length === 0) {
    return (
      <EmptyState
        title="Nothing to review yet"
        message="No classmates have submitted their writing yet. Come back a little later and their work will appear here anonymously."
      />
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{notice}</div>
      )}
      {ordered.map((review, index) => (
        <PeerReviewCard
          key={review.$id}
          review={review}
          rubric={rubric}
          index={index}
          total={Math.max(required, ordered.length)}
        />
      ))}
    </div>
  );
}

function PeerReviewCard({
  review,
  rubric,
  index,
  total,
}: {
  review: PeerReview;
  rubric: RubricCriterion[];
  index: number;
  total: number;
}) {
  const submission = useLiveQuery(
    () => db.writing_submissions.get(review.submissionId),
    [review.submissionId],
  );

  const [open, setOpen] = useState(review.status !== 'submitted' && index === 0);
  const [scores, setScores] = useState<Record<string, number>>(() => parseScores(review.scoresJson));
  const [points, setPoints] = useState<string[]>(() => {
    const stored = parseFeedbackPoints(review.feedbackPointsJson);
    return Array.from({ length: FEEDBACK_POINT_SLOTS }, (_, i) => stored[i] || '');
  });
  const [comment, setComment] = useState(review.additionalComment);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const done = review.status === 'submitted';
  const draft: ReviewDraft = { scores, feedbackPoints: points, additionalComment: comment };
  const { valid, problems } = validateReview(draft, rubric);
  const runningTotal = rubric.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0);
  const maxTotal = rubric.reduce((sum, c) => sum + c.maxPoints, 0);

  // Keep the in-progress review on disk so a closed tab never loses the work.
  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => {
      void saveReviewDraft(review.$id, { scores, feedbackPoints: points, additionalComment: comment });
    }, 800);
    return () => clearTimeout(timer);
  }, [done, review.$id, scores, points, comment]);

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      await submitReview(review.$id, draft);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit the review');
    } finally {
      setSaving(false);
    }
  };

  const text = submission?.submittedMarkdown || '';

  return (
    <Card className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className="font-semibold">
            Review {index + 1} of {total}
          </h3>
          <p className="text-xs text-gray-500">
            {submission?.anonymousLabel || 'Anonymous classmate'} · {submission?.wordCount || 0} words
          </p>
        </div>
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            done ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
          }`}
        >
          {done ? `Done · ${runningTotal}/${maxTotal}` : 'To do'}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-100 pt-3">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Their writing
            </h4>
            <div className="max-h-72 overflow-y-auto rounded-lg bg-gray-50 p-3">
              {text ? (
                <Markdown content={text} className="text-sm" />
              ) : (
                <p className="text-sm text-gray-400">This classmate hasn't submitted yet.</p>
              )}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Mark against the rubric
            </h4>
            <RubricScorer
              rubric={rubric}
              scores={scores}
              disabled={done}
              onChange={(criterionId, value) =>
                setScores(prev => ({ ...prev, [criterionId]: value }))
              }
            />
            <p className="mt-2 text-right text-sm font-semibold text-gray-700">
              Total: {runningTotal}/{maxTotal}
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Three specific pieces of feedback
            </h4>
            <p className="text-xs text-gray-500">
              Point to an exact place in their writing, say what's happening there, and say what
              they could do instead. "Good job" doesn't help anybody.
            </p>
            {points.map((point, i) => (
              <div key={i}>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Feedback {i + 1}
                </label>
                <textarea
                  value={point}
                  disabled={done}
                  rows={2}
                  onChange={e =>
                    setPoints(prev => prev.map((p, j) => (j === i ? e.target.value : p)))
                  }
                  placeholder={
                    i === 0
                      ? 'e.g. Your second paragraph gives a strong example but never explains why it proves your point — add a sentence linking it back to your thesis.'
                      : 'Be specific and actionable.'
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                />
              </div>
            ))}
          </section>

          <section>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Anything else? <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              disabled={done}
              rows={4}
              onChange={e => setComment(e.target.value)}
              placeholder="Say more here if you want to — what you enjoyed, what confused you, questions you had."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </section>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {!done && (
            <>
              {!valid && (
                <ul className="space-y-1 rounded-lg bg-orange-50 p-3 text-xs text-orange-800">
                  {problems.map(problem => <li key={problem}>• {problem}</li>)}
                </ul>
              )}
              <Button onClick={() => void handleSubmit()} loading={saving} disabled={!valid}>
                Submit review
              </Button>
              <p className="text-xs text-gray-400">
                Your name is never shown — they'll see this as "{peerDisplayName(index)}".
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Feedback display (shared by the Feedback and Revise tabs)
// ---------------------------------------------------------------------------

interface FeedbackBundle {
  submission: WritingSubmission;
  rubric: RubricCriterion[];
  reviews: PeerReview[];
  ai: { www: string; improvements: string[] } | null;
  teacher: { comment: string; scores: Record<string, number> } | null;
}

function FeedbackTab({ aiEnabled, ...bundle }: FeedbackBundle & { aiEnabled: boolean }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      await generateAiFeedbackForSubmission(bundle.submission.$id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate feedback');
    } finally {
      setGenerating(false);
    }
  };

  const breakdown = summariseScores(bundle.reviews, bundle.rubric);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">What your classmates gave you</h2>
          <span className="text-sm text-gray-500">
            Average{' '}
            <strong className="text-lg text-blue-700">{formatScore(breakdown.averageTotal)}</strong>
            /{breakdown.maxTotal}
          </span>
        </div>
        {breakdown.perReviewer.length > 0 ? (
          <div className="mt-3">
            <RubricScoreTable
              rubric={bundle.rubric}
              columns={breakdown.perReviewer.map((r, i) => ({
                key: r.reviewId,
                label: peerDisplayName(i),
                scores: r.scores,
                total: r.total,
              }))}
              perCriterionAverage={breakdown.perCriterion}
              averageTotal={breakdown.averageTotal}
              maxTotal={breakdown.maxTotal}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            No classmate has reviewed your piece yet. It'll appear here as soon as they do.
          </p>
        )}
      </Card>

      <PeerFeedbackList reviews={bundle.reviews} />

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">AI coach</h2>
          {aiEnabled && (
            <Button size="sm" variant="secondary" onClick={() => void handleGenerate()} loading={generating}>
              {bundle.ai ? 'Regenerate' : 'Get AI feedback'}
            </Button>
          )}
        </div>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!aiEnabled && (
          <p className="text-sm text-gray-500">Your teacher turned off AI feedback for this prompt.</p>
        )}
        {bundle.ai ? (
          <AiFeedbackBody ai={bundle.ai} />
        ) : (
          aiEnabled && !error && (
            <p className="text-sm text-gray-500">
              Ask for three actionable next steps and a summary of what went well. It won't give you a
              grade — that's your peers' and your teacher's job.
            </p>
          )
        )}
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Teacher feedback</h2>
        {bundle.teacher ? (
          <>
            {Object.keys(bundle.teacher.scores).length > 0 && (
              <p className="text-sm text-gray-600">
                Teacher mark:{' '}
                <strong>
                  {bundle.rubric.reduce((sum, c) => sum + (bundle.teacher!.scores[c.id] ?? 0), 0)}
                </strong>
                /{breakdown.maxTotal}
              </p>
            )}
            <Markdown content={bundle.teacher.comment} className="text-sm" />
          </>
        ) : (
          <p className="text-sm text-gray-500">Your teacher hasn't added feedback yet.</p>
        )}
      </Card>
    </div>
  );
}

function PeerFeedbackList({ reviews }: { reviews: PeerReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <div className="space-y-3">
      {reviews.map((review, index) => {
        const points = parseFeedbackPoints(review.feedbackPointsJson).filter(Boolean);
        return (
          <Card key={review.$id} className="space-y-2">
            <h3 className="font-semibold">{peerDisplayName(index)}</h3>
            <ol className="space-y-2">
              {points.map((point, i) => (
                <li key={i} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                  <span className="mr-1.5 font-semibold text-blue-600">{i + 1}.</span>
                  {point}
                </li>
              ))}
            </ol>
            {review.additionalComment.trim() && (
              <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  More from {peerDisplayName(index)}
                </span>
                {review.additionalComment}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function AiFeedbackBody({ ai }: { ai: { www: string; improvements: string[] } }) {
  return (
    <div className="space-y-3">
      {ai.www && (
        <div className="rounded-lg bg-green-50 p-3">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-green-700">
            What went well
          </span>
          <p className="text-sm text-gray-800">{ai.www}</p>
        </div>
      )}
      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
          Three things to work on
        </span>
        <ol className="space-y-2">
          {ai.improvements.map((point, i) => (
            <li key={i} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
              <span className="mr-1.5 font-semibold text-blue-600">{i + 1}.</span>
              {point}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revise
// ---------------------------------------------------------------------------

function ReviseTab({ submission, rubric, reviews, ai, teacher }: FeedbackBundle) {
  const [text, setText] = useState(submission.finalMarkdown || submission.submittedMarkdown);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submissionId = submission.$id;

  useEffect(() => {
    if (text === submission.finalMarkdown) return;
    const timer = setTimeout(() => {
      void saveFinalVersion(submissionId, text).then(() => setSavedAt(new Date().toLocaleTimeString()));
    }, 900);
    return () => clearTimeout(timer);
  }, [text, submissionId, submission.finalMarkdown]);

  const breakdown = summariseScores(reviews, rubric);
  const teacherTotal = teacher
    ? rubric.reduce((sum, c) => sum + (teacher.scores[c.id] ?? 0), 0)
    : null;

  const digest = buildFeedbackDigest({
    peerReviews: breakdown.perReviewer.map((r, i) => ({
      points: parseFeedbackPoints(reviews[i]?.feedbackPointsJson || '[]'),
      comment: reviews[i]?.additionalComment || '',
      total: r.total,
    })),
    ai,
    teacher: teacher ? { comment: teacher.comment, total: teacherTotal } : null,
    maxTotal: breakdown.maxTotal,
    averageTotal: breakdown.averageTotal,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Your final version</h2>
            <p className="text-xs text-gray-500">
              Rewrite here with the feedback beside you, then copy it into Canvas.
            </p>
          </div>
          <CopyButton text={text} label="Copy for Canvas" copiedLabel="Copied ✓" variant="primary" />
        </div>

        <MarkdownToolbar textareaRef={textareaRef} value={text} onChange={setText} />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={20}
          className="w-full rounded-b-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            {countMarkdownWords(text)} words
            <span className="text-gray-400"> (first draft: {submission.wordCount})</span>
          </span>
          <span>{savedAt ? `Saved ${savedAt}` : 'Saves automatically'}</span>
        </div>

        <details className="rounded-lg bg-gray-50 p-3">
          <summary className="cursor-pointer text-xs font-medium text-gray-600">
            Show my original draft
          </summary>
          <div className="mt-2">
            <Markdown content={submission.submittedMarkdown} className="text-sm text-gray-600" />
          </div>
        </details>
      </Card>

      <div className="space-y-3">
        <Card className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">All your feedback</h2>
            <p className="text-xs text-gray-500">
              Peer average {formatScore(breakdown.averageTotal)}/{breakdown.maxTotal}
              {teacherTotal !== null && ` · Teacher ${teacherTotal}/${breakdown.maxTotal}`}
            </p>
          </div>
          <CopyButton text={digest} label="Copy all feedback" />
        </Card>

        <PeerFeedbackList reviews={reviews} />

        {ai && (
          <Card className="space-y-3">
            <h2 className="font-semibold">AI coach</h2>
            <AiFeedbackBody ai={ai} />
          </Card>
        )}

        {teacher && (
          <Card className="space-y-2">
            <h2 className="font-semibold">Teacher feedback</h2>
            <Markdown content={teacher.comment} className="text-sm" />
          </Card>
        )}
      </div>
    </div>
  );
}
