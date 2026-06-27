import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import {
  getStudentSubmission,
  saveSubmissionDraft,
  submitResponse,
} from '@/services/submission.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Markdown, countMarkdownWords } from '@/components/common/Markdown';
import { MarkdownToolbar } from '@/components/common/MarkdownToolbar';
import { StatusBadge } from '@/components/common/StatusBadge';

export function ResponsePage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [responseMarkdown, setResponseMarkdown] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const responseRef = useRef<HTMLTextAreaElement>(null);

  const assignment = useLiveQuery(
    () => (assignmentId ? db.reading_assignments.get(assignmentId) : undefined),
    [assignmentId],
  );
  const reading = useLiveQuery(
    () => (assignment ? db.readings.get(assignment.readingId) : undefined),
    [assignment?.readingId],
  );
  const existingSubmission = useLiveQuery(
    () => (assignmentId && user ? getStudentSubmission(user.$id, assignmentId) : undefined),
    [assignmentId, user?.$id],
  );
  const linkedSession = useLiveQuery(async () => {
    if (!assignmentId) return undefined;
    const sessions = await db.class_sessions.where('assignmentId').equals(assignmentId).toArray();
    return sessions.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0];
  }, [assignmentId]);

  useEffect(() => {
    if (existingSubmission) setResponseMarkdown(existingSubmission.responseMarkdown);
  }, [existingSubmission?.$id]);

  const wordCount = useMemo(() => countMarkdownWords(responseMarkdown), [responseMarkdown]);
  const belowMinimum = Boolean(assignment?.minResponseWords && wordCount < assignment.minResponseWords);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const saveDraft = async () => {
    if (!user || !assignmentId) return;
    setBusy(true);
    try {
      await saveSubmissionDraft(user.$id, assignmentId, responseMarkdown);
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!user || !assignmentId) return;
    setBusy(true);
    try {
      await submitResponse(user.$id, assignmentId, responseMarkdown);
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setBusy(false);
    }
  };

  if (!assignment || !reading) {
    return <div className="p-4 text-gray-400">Loading response...</div>;
  }

  if (isTeacher) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 mb-4">Back</button>
        <Card className="text-center py-8">
          <h1 className="text-xl font-semibold mb-2">{reading.title}</h1>
          <p className="text-gray-500 mb-4">Open the submissions view to mark named responses or present samples anonymously.</p>
          <Link to={`/assignments/${assignment.$id}/submissions`}>
            <Button>View submissions</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 mb-2">Back</button>
          <h1 className="text-2xl font-bold">{reading.title}</h1>
          <p className="text-sm text-gray-500">
            {assignment.minResponseWords > 0 ? `${assignment.minResponseWords}+ words` : 'No word minimum'}
            {assignment.dueDate ? ` | Due ${assignment.dueDate}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {linkedSession && (
            <Link to={`/sessions/${linkedSession.$id}`}>
              <Button variant="secondary" size="sm">Questions</Button>
            </Link>
          )}
          <Link to={`/readings/${reading.$id}`}>
            <Button variant="secondary" size="sm">Reading</Button>
          </Link>
        </div>
      </div>

      {assignment.promptMarkdown && (
        <Card>
          <h2 className="font-semibold mb-3">Prompt</h2>
          <Markdown content={assignment.promptMarkdown} className="text-gray-700" />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your response</h2>
            <StatusBadge status={belowMinimum ? 'short' : existingSubmission?.status || 'draft'} label={`${wordCount} words`} />
          </div>
          <MarkdownToolbar textareaRef={responseRef} value={responseMarkdown} onChange={setResponseMarkdown} />
          <textarea
            ref={responseRef}
            value={responseMarkdown}
            onChange={e => setResponseMarkdown(e.target.value)}
            rows={18}
            className="w-full rounded-b-lg border border-gray-300 px-3 py-2 font-mono text-sm"
            placeholder="Write in Markdown. Bold and italics are welcome."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void saveDraft()} loading={busy} variant="secondary">Save draft</Button>
            <Button onClick={() => void submit()} loading={busy} disabled={!responseMarkdown.trim()}>Submit</Button>
            {savedAt && <span className="text-sm text-gray-400">Saved {savedAt}</span>}
            {belowMinimum && (
              <StatusBadge status="short" label="Short submission flag" />
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Preview</h2>
            {responseMarkdown.trim() ? (
              <Markdown content={responseMarkdown} className="text-sm text-gray-700" />
            ) : (
              <p className="text-sm text-gray-400">Your Markdown preview appears here.</p>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">Status</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center justify-between gap-3">
                <span>Submission</span>
                <StatusBadge status={existingSubmission?.status || 'not started'} />
              </p>
              <p>Words: <span className="font-medium">{wordCount}</span></p>
              {assignment.minResponseWords > 0 && (
                <p>Minimum: <span className="font-medium">{assignment.minResponseWords}</span></p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
