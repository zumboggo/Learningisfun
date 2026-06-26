import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { addSessionItem } from '@/services/class-session.service';
import { getAssignmentSubmissions } from '@/services/submission.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Markdown } from '@/components/common/Markdown';
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

  const addPresentationSample = async () => {
    if (!user || !selectedRow || !selectedSessionId) return;
    await addSessionItem(selectedSessionId, user.$id, 'submission', selectedRow.submission);
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
                    <span className={`rounded px-2 py-1 text-xs ${
                      row.submission.belowMinimum ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {row.submission.wordCount} words
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{row.submission.status}</p>
                </Card>
              </button>
            ))
          ) : (
            <Card className="text-center py-8">
              <p className="text-gray-400">No responses yet</p>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Anonymous presentation</h2>
                <p className="text-sm text-gray-500">Student identity is hidden in this panel.</p>
              </div>
              {selectedRow?.submission.belowMinimum && (
                <span className="rounded bg-orange-50 px-2 py-1 text-sm text-orange-700">Below word minimum</span>
              )}
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
    </div>
  );
}
