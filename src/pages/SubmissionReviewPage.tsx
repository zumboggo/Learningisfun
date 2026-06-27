import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { addSessionItem } from '@/services/class-session.service';
import { getAssignmentSubmissions } from '@/services/submission.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Markdown } from '@/components/common/Markdown';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Submission, User } from '@/types';

interface SubmissionRow {
  submission: Submission;
  user: User | undefined;
}

export function SubmissionReviewPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [presentationOpen, setPresentationOpen] = useState(false);

  const assignment = useLiveQuery(
    () => (assignmentId ? db.reading_assignments.get(assignmentId) : undefined),
    [assignmentId],
  );
  const reading = useLiveQuery(
    () => (assignment ? db.readings.get(assignment.readingId) : undefined),
    [assignment?.readingId],
  );
  const rows = useLiveQuery(async () => {
    if (!assignmentId) return [];
    const submissions = await getAssignmentSubmissions(assignmentId);
    const withUsers: SubmissionRow[] = [];
    for (const submission of submissions) {
      withUsers.push({ submission, user: await db.users.get(submission.userId) });
    }
    return withUsers.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
  }, [assignmentId]);
  const sessions = useLiveQuery(
    () => (assignment ? db.class_sessions.where('classId').equals(assignment.classId).toArray() : []),
    [assignment?.classId],
  );

  const selectedRow = useMemo(
    () => rows?.find(row => row.submission.$id === selectedSubmissionId) || rows?.[0],
    [rows, selectedSubmissionId],
  );
  const selectedIndex = Math.max(0, rows?.findIndex(row => row.submission.$id === selectedRow?.submission.$id) ?? 0);

  const addPresentationSample = async () => {
    if (!user || !selectedRow || !selectedSessionId) return;
    await addSessionItem(selectedSessionId, user.$id, 'submission', selectedRow.submission);
  };

  const moveSelection = (direction: -1 | 1) => {
    if (!rows || rows.length === 0) return;
    const nextIndex = (selectedIndex + direction + rows.length) % rows.length;
    setSelectedSubmissionId(rows[nextIndex].submission.$id);
  };

  if (!assignment || !reading) {
    return <div className="p-4 text-gray-400">Loading submissions...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 mb-2">Back</button>
          <h1 className="text-2xl font-bold">Submissions</h1>
          <p className="text-sm text-gray-500">{reading.title}</p>
        </div>
        <Link to={`/classes/${assignment.classId}`}>
          <Button size="sm" variant="secondary">Class</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Named marking view</h2>
            <span className="text-sm text-gray-500">{rows?.length || 0} responses</span>
          </div>

          {rows && rows.length > 0 ? (
            rows.map(row => (
              <button
                key={row.submission.$id}
                onClick={() => setSelectedSubmissionId(row.submission.$id)}
                className="block w-full text-left"
              >
                <Card className={selectedRow?.submission.$id === row.submission.$id ? 'ring-2 ring-blue-500' : ''}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{row.user?.name || 'Unknown student'}</h3>
                      <p className="text-sm text-gray-500">{row.user?.email}</p>
                    </div>
                    <StatusBadge status={row.submission.belowMinimum ? 'short' : row.submission.status} label={`${row.submission.wordCount} words`} />
                  </div>
                  <div className="mt-2"><StatusBadge status={row.submission.status} /></div>
                </Card>
              </button>
            ))
          ) : (
            <EmptyState
              title="No responses yet"
              message="Submitted student responses will appear here for marking and anonymous presentation."
            />
          )}
        </section>

        <section className="space-y-4">
          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Anonymous presentation</h2>
                <p className="text-sm text-gray-500">Student identity is hidden in this panel.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedRow?.submission.belowMinimum && <StatusBadge status="short" label="Below word minimum" />}
                <Button size="sm" onClick={() => setPresentationOpen(true)} disabled={!selectedRow}>
                  Full screen
                </Button>
              </div>
            </div>

            {selectedRow ? (
              <div className="min-h-[360px] rounded-lg border border-gray-200 bg-white p-6">
                <Markdown content={selectedRow.submission.responseMarkdown} className="text-lg text-gray-900" />
              </div>
            ) : (
              <p className="text-gray-400">Choose a response to present.</p>
            )}
          </Card>

          {sessions && sessions.length > 0 && selectedRow && (
            <Card>
              <h2 className="font-semibold mb-3">Add to a class period</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Choose period</option>
                  {sessions.map(session => (
                    <option key={session.$id} value={session.$id}>{session.sessionDate} - {session.title}</option>
                  ))}
                </select>
                <Button onClick={() => void addPresentationSample()} disabled={!selectedSessionId}>
                  Add sample
                </Button>
              </div>
            </Card>
          )}
        </section>
      </div>

      {presentationOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Anonymous sample</h2>
              <p className="text-xs text-gray-400">{selectedIndex + 1} of {rows?.length || 0}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => moveSelection(-1)}>Previous</Button>
              <Button size="sm" variant="secondary" onClick={() => moveSelection(1)}>Next</Button>
              <Button size="sm" variant="ghost" onClick={() => setPresentationOpen(false)}>Close</Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-16 md:py-12">
            <div className="mx-auto max-w-4xl">
              <Markdown content={selectedRow.submission.responseMarkdown} className="text-2xl leading-relaxed text-gray-950 md:text-3xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
