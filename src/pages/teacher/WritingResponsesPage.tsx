import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { CopyButton } from '@/components/common/CopyButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Markdown } from '@/components/common/Markdown';
import { RubricScorer, RubricScoreTable } from '@/components/writing/RubricScorer';
import {
  formatScore,
  parseFeedbackPoints,
  parseImprovements,
  parseRubric,
  parseScores,
  getPromptStudentIds,
  saveTeacherFeedback,
  summariseScores,
} from '@/services/writing.service';
import type { PeerReview, RubricCriterion, WritingSubmission } from '@/types';

interface StudentRow {
  studentId: string;
  studentName: string;
  submission: WritingSubmission | null;
  reviewsReceived: PeerReview[];
  reviewsGiven: number;
  averageTotal: number | null;
  hasTeacherFeedback: boolean;
  hasFinal: boolean;
}

export function WritingResponsesPage() {
  const { promptId } = useParams<{ promptId: string }>();
  const [selected, setSelected] = useState<string | null>(null);

  const prompt = useLiveQuery(
    () => (promptId ? db.writing_prompts.get(promptId) : undefined),
    [promptId],
  );

  const rubric = useMemo(() => (prompt ? parseRubric(prompt.rubricJson) : []), [prompt]);

  const rows = useLiveQuery(async () => {
    if (!prompt) return [];

    // The prompt may be set for several sections, so the roster is everyone in
    // any class it was assigned to.
    const students = await getPromptStudentIds(prompt.$id);
    const submissions = await db.writing_submissions.where('promptId').equals(prompt.$id).toArray();
    const allReviews = await db.peer_reviews.where('promptId').equals(prompt.$id).toArray();
    const submittedReviews = allReviews.filter(r => r.status === 'submitted');

    const result: StudentRow[] = [];
    for (const studentId of students) {
      const user = await db.users.get(studentId);
      const submission = submissions.find(s => s.authorId === studentId) || null;
      const reviewsReceived = submission
        ? submittedReviews
            .filter(r => r.submissionId === submission.$id)
            .sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''))
        : [];
      const teacherFeedback = submission
        ? await db.teacher_writing_feedback.where('submissionId').equals(submission.$id).first()
        : undefined;

      result.push({
        studentId,
        studentName: user?.name || user?.email || 'Unknown student',
        submission,
        reviewsReceived,
        reviewsGiven: submittedReviews.filter(r => r.reviewerId === studentId).length,
        averageTotal: summariseScores(reviewsReceived, rubric).averageTotal,
        hasTeacherFeedback: Boolean(teacherFeedback),
        hasFinal: Boolean(submission?.finalMarkdown),
      });
    }

    return result.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [prompt, rubric]);

  if (!prompt) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  const maxTotal = rubric.reduce((sum, c) => sum + c.maxPoints, 0);
  const selectedRow = rows?.find(r => r.studentId === selected) || null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <header className="space-y-1">
        <Link to="/writing" className="text-sm text-blue-600 hover:underline">← All writing</Link>
        <h1 className="text-2xl font-bold">{prompt.title}</h1>
        <p className="text-sm text-gray-500">
          {prompt.peerReviewsRequired} peer reviews required · {maxTotal} points ·{' '}
          Students see each other anonymously; you see every name.
        </p>
      </header>

      <Card padding="none">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold">Class overview</h2>
          <CopyButton text={buildMarksCsv(rows || [], rubric)} label="Copy marks as CSV" />
        </div>
        {rows && rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-2 font-medium">Student</th>
                  <th className="px-3 py-2 font-medium">Submitted</th>
                  <th className="px-3 py-2 text-center font-medium">Marks received</th>
                  <th className="px-3 py-2 text-center font-medium">Average</th>
                  <th className="px-3 py-2 text-center font-medium">Reviews given</th>
                  <th className="px-3 py-2 text-center font-medium">Your feedback</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.studentId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {row.studentName}
                      {row.submission && (
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {row.submission.anonymousLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {row.submission?.submittedAt
                        ? `${row.submission.wordCount} words`
                        : <span className="text-orange-600">Not yet</span>}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700">
                      {row.reviewsReceived.length
                        ? summariseScores(row.reviewsReceived, rubric)
                            .perReviewer.map(r => `${r.total}`).join(' · ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-blue-700">
                      {row.averageTotal !== null ? `${formatScore(row.averageTotal)}/${maxTotal}` : '—'}
                    </td>
                    <td
                      className={`px-3 py-2 text-center ${
                        row.reviewsGiven >= prompt.peerReviewsRequired ? 'text-green-700' : 'text-orange-600'
                      }`}
                    >
                      {row.reviewsGiven}/{prompt.peerReviewsRequired}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.hasTeacherFeedback ? '✓' : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant={selected === row.studentId ? 'primary' : 'secondary'}
                        onClick={() => setSelected(selected === row.studentId ? null : row.studentId)}
                        disabled={!row.submission?.submittedAt}
                      >
                        {selected === row.studentId ? 'Close' : 'Open'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="No students in this class yet"
              message="Share the class join code and students will show up here."
            />
          </div>
        )}
      </Card>

      {selectedRow?.submission && (
        <StudentDetail
          key={selectedRow.studentId}
          row={selectedRow}
          rubric={rubric}
          promptId={prompt.$id}
        />
      )}
    </div>
  );
}

function StudentDetail({
  row,
  rubric,
  promptId,
}: {
  row: StudentRow;
  rubric: RubricCriterion[];
  promptId: string;
}) {
  const { user } = useAuth();
  const submission = row.submission!;

  const aiFeedback = useLiveQuery(
    () => db.writing_ai_feedback.where('submissionId').equals(submission.$id).first(),
    [submission.$id],
  );

  const existingTeacherFeedback = useLiveQuery(
    () => db.teacher_writing_feedback.where('submissionId').equals(submission.$id).first(),
    [submission.$id],
  );

  // Who reviewed whom, by name — the teacher's audit trail for review quality.
  const reviewerNames = useLiveQuery(async () => {
    const names: Record<string, string> = {};
    for (const review of row.reviewsReceived) {
      const reviewer = await db.users.get(review.reviewerId);
      names[review.$id] = reviewer?.name || reviewer?.email || 'Unknown';
    }
    return names;
  }, [row.reviewsReceived]);

  const reviewsGivenByStudent = useLiveQuery(
    () =>
      db.peer_reviews
        .where('promptId')
        .equals(promptId)
        .and(r => r.reviewerId === row.studentId && r.status === 'submitted')
        .toArray(),
    [promptId, row.studentId],
  );

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Load the saved feedback once the live query resolves, without clobbering
  // edits the teacher is part-way through typing.
  if (existingTeacherFeedback && loadedFor !== existingTeacherFeedback.$id) {
    setLoadedFor(existingTeacherFeedback.$id);
    setScores(parseScores(existingTeacherFeedback.scoresJson));
    setComment(existingTeacherFeedback.commentMarkdown);
  }

  const breakdown = summariseScores(row.reviewsReceived, rubric);
  const teacherTotal = rubric.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveTeacherFeedback({
        submissionId: submission.$id,
        teacherId: user.$id,
        scores,
        commentMarkdown: comment,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{row.studentName}</h2>
            <p className="text-xs text-gray-500">
              Seen by peers as {submission.anonymousLabel} · {submission.wordCount} words ·{' '}
              {submission.submittedAt && new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <CopyButton text={submission.finalMarkdown || submission.submittedMarkdown} label="Copy writing" />
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <Markdown content={submission.submittedMarkdown} className="text-sm" />
        </div>
        {submission.finalMarkdown && (
          <details className="rounded-lg border border-green-200 bg-green-50/50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-green-800">
              Revised final version ({new Date(submission.finalUpdatedAt || '').toLocaleString()})
            </summary>
            <div className="mt-2">
              <Markdown content={submission.finalMarkdown} className="text-sm" />
            </div>
          </details>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold">Peer marks</h3>
        {row.reviewsReceived.length > 0 ? (
          <RubricScoreTable
            rubric={rubric}
            columns={breakdown.perReviewer.map((r, i) => ({
              key: r.reviewId,
              label: reviewerNames?.[row.reviewsReceived[i].$id] || `Peer ${i + 1}`,
              scores: r.scores,
              total: r.total,
            }))}
            perCriterionAverage={breakdown.perCriterion}
            averageTotal={breakdown.averageTotal}
            maxTotal={breakdown.maxTotal}
          />
        ) : (
          <p className="text-sm text-gray-500">No peer reviews submitted yet.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold">Feedback received</h3>
        {row.reviewsReceived.map((review, index) => (
          <div key={review.$id} className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Peer {index + 1} — {reviewerNames?.[review.$id] || 'Unknown'}
            </p>
            <ol className="space-y-1.5">
              {parseFeedbackPoints(review.feedbackPointsJson).filter(Boolean).map((point, i) => (
                <li key={i} className="text-sm text-gray-800">
                  <span className="mr-1 font-semibold text-blue-600">{i + 1}.</span>{point}
                </li>
              ))}
            </ol>
            {review.additionalComment.trim() && (
              <p className="mt-2 border-t border-gray-100 pt-2 text-sm text-gray-600">
                {review.additionalComment}
              </p>
            )}
          </div>
        ))}
        {row.reviewsReceived.length === 0 && (
          <p className="text-sm text-gray-500">Nothing yet.</p>
        )}
      </Card>

      <Card className="space-y-2">
        <h3 className="font-semibold">
          Reviews {row.studentName} gave ({reviewsGivenByStudent?.length || 0})
        </h3>
        <p className="text-xs text-gray-500">
          Use this to check the quality of their judging, not just their writing.
        </p>
        {reviewsGivenByStudent?.map(review => (
          <div key={review.$id} className="rounded-lg bg-gray-50 p-3 text-sm">
            <ol className="space-y-1">
              {parseFeedbackPoints(review.feedbackPointsJson).filter(Boolean).map((point, i) => (
                <li key={i} className="text-gray-700">
                  <span className="mr-1 font-semibold text-gray-400">{i + 1}.</span>{point}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </Card>

      {aiFeedback && (
        <Card className="space-y-2">
          <h3 className="font-semibold">AI coach feedback the student saw</h3>
          <p className="rounded-lg bg-green-50 p-3 text-sm text-gray-800">{aiFeedback.wwwSummary}</p>
          <ol className="space-y-1.5">
            {parseImprovements(aiFeedback.improvementsJson).map((point, i) => (
              <li key={i} className="text-sm text-gray-800">
                <span className="mr-1 font-semibold text-blue-600">{i + 1}.</span>{point}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Your feedback</h3>
          <span className="text-sm text-gray-500">
            {teacherTotal}/{breakdown.maxTotal}
            {breakdown.averageTotal !== null && (
              <span className="ml-2 text-xs text-gray-400">
                (peer average {formatScore(breakdown.averageTotal)})
              </span>
            )}
          </span>
        </div>

        <RubricScorer
          rubric={rubric}
          scores={scores}
          onChange={(criterionId, value) => setScores(prev => ({ ...prev, [criterionId]: value }))}
        />

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={5}
          placeholder="Your comments to the student. Markdown works here."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="flex items-center gap-3">
          <Button onClick={() => void handleSave()} loading={saving}>Save feedback</Button>
          {saved && <span className="text-sm text-green-600">Saved — the student can see it now.</span>}
        </div>
      </Card>
    </div>
  );
}

function buildMarksCsv(rows: StudentRow[], rubric: RubricCriterion[]): string {
  const header = ['Student', 'Submitted', 'Words', 'Mark 1', 'Mark 2', 'Mark 3', 'Average', 'Max', 'Reviews given'];
  const lines = [header.join(',')];

  for (const row of rows) {
    const breakdown = summariseScores(row.reviewsReceived, rubric);
    const marks = breakdown.perReviewer.map(r => String(r.total));
    while (marks.length < 3) marks.push('');
    lines.push([
      escapeCsv(row.studentName),
      row.submission?.submittedAt ? 'yes' : 'no',
      String(row.submission?.wordCount || 0),
      ...marks.slice(0, 3),
      breakdown.averageTotal !== null ? formatScore(breakdown.averageTotal, 2) : '',
      String(breakdown.maxTotal),
      String(row.reviewsGiven),
    ].join(','));
  }

  return lines.join('\n');
}

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
