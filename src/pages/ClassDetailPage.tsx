import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import {
  regenerateJoinCode,
  removeStudent,
  getClassMembers,
  importClassRoster,
  type RosterImportResult,
} from '@/services/class.service';
import { createClassSession, todayKey } from '@/services/class-session.service';
import { downloadCsv } from '@/services/report.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newCode, setNewCode] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('Class discussion');
  const [sessionDate, setSessionDate] = useState(todayKey());
  const [sessionAssignmentId, setSessionAssignmentId] = useState('');
  const [votesPerStudent, setVotesPerStudent] = useState(4);
  const [allowStackedVotes, setAllowStackedVotes] = useState(false);
  const [rosterImporting, setRosterImporting] = useState(false);
  const [rosterResult, setRosterResult] = useState<RosterImportResult | null>(null);

  const cls = useLiveQuery(() => (classId ? db.classes.get(classId) : undefined), [classId]);
  const members = useLiveQuery(
    () => (classId ? getClassMembers(classId) : []),
    [classId],
  );

  const isOwner = cls?.teacherId === user?.$id;
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const memberIds = useMemo(() => members?.map(m => m.userId) || [], [members]);

  const students = useLiveQuery(async () => {
    if (memberIds.length === 0) return [];
    const users = await Promise.all(memberIds.map(id => db.users.get(id)));
    return users.filter((u): u is NonNullable<typeof u> => Boolean(u));
  }, [memberIds]);

  const readingRows = useLiveQuery(async () => {
    if (!classId) return [];
    const assignments = await db.reading_assignments.where('classId').equals(classId).toArray();
    const rows = await Promise.all(assignments.map(async assignment => ({
      assignment,
      reading: await db.readings.get(assignment.readingId),
    })));
    return rows.sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt));
  }, [classId]);

  const deckRows = useLiveQuery(async () => {
    if (!classId) return [];
    const assignments = await db.deck_assignments.where('classId').equals(classId).toArray();
    const rows = await Promise.all(assignments.map(async assignment => ({
      assignment,
      deck: await db.flashcard_decks.get(assignment.deckId),
    })));
    return rows.sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt));
  }, [classId]);

  const sessions = useLiveQuery(
    () => (classId ? db.class_sessions.where('classId').equals(classId).reverse().sortBy('sessionDate') : []),
    [classId],
  );

  const handleRegenerateCode = async () => {
    if (!classId || !user) return;
    const code = await regenerateJoinCode(classId, user.$id);
    setNewCode(code);
  };

  const handleRemoveStudent = async (userId: string) => {
    if (!classId) return;
    await removeStudent(classId, userId);
  };

  const handleCreateSession = async () => {
    if (!classId || !user) return;
    const session = await createClassSession(classId, user.$id, {
      title: sessionTitle,
      sessionDate,
      assignmentId: sessionAssignmentId || null,
      votesPerStudent,
      allowStackedVotes,
    });
    setShowSessionModal(false);
    navigate(`/sessions/${session.$id}`);
  };

  const handleRosterFile = async (file: File) => {
    if (!classId || !user) return;
    setRosterImporting(true);
    try {
      const result = await importClassRoster(classId, user.$id, file);
      setRosterResult(result);
    } finally {
      setRosterImporting(false);
    }
  };

  const downloadRosterCredentials = () => {
    if (!rosterResult || !cls) return;
    const headers = ['name', 'email', 'password', 'status', 'message'];
    const lines = [
      headers.join(','),
      ...rosterResult.rows.map(row => [
        row.name,
        row.email,
        row.password,
        row.status,
        row.message,
      ].map(escapeCsv).join(',')),
    ];
    downloadCsv(`${cls.name.replace(/\s+/g, '-')}-student-logins.csv`, `${lines.join('\n')}\n`);
  };

  if (!cls) {
    return <div className="p-4 text-gray-400">Loading class...</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{cls.name}</h1>
          <p className="text-gray-500">{cls.courseName} | {cls.schoolYear}</p>
        </div>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowSessionModal(true)} size="sm">Start class period</Button>
            <Link to={`/classes/${cls.$id}/reports`}>
              <Button size="sm" variant="secondary">Reports</Button>
            </Link>
          </div>
        )}
      </div>

      {isOwner && (
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="font-semibold">Class join code</h3>
              <div className="text-2xl font-mono bg-gray-100 px-4 py-2 rounded-lg inline-block mt-1">
                {newCode || cls.joinCode}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Button onClick={() => void handleRegenerateCode()} size="sm" variant="secondary">
                Regenerate
              </Button>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
                {rosterImporting ? 'Importing...' : 'Import roster CSV'}
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) void handleRosterFile(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
          </div>
          {rosterResult && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {rosterResult.created} created, {rosterResult.existing} existing, {rosterResult.added} enrolled, {rosterResult.skipped} skipped
                </span>
                <Button onClick={downloadRosterCredentials} size="sm" variant="secondary">
                  Download logins
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Class periods</h2>
          {isOwner && sessions && sessions.length > 0 && (
            <Button onClick={() => setShowSessionModal(true)} size="sm" variant="secondary">New period</Button>
          )}
        </div>
        {sessions && sessions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map(session => (
              <Link key={session.$id} to={`/sessions/${session.$id}`}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-gray-500">{session.sessionDate}</p>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {session.votesPerStudent} votes each{session.allowStackedVotes ? ' | stacking enabled' : ''}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No class periods yet"
            message="Start a period to gather questions, run voting, publish notes, and present anonymous responses."
            action={isOwner && <Button onClick={() => setShowSessionModal(true)}>Start first period</Button>}
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold mb-3">Readings ({readingRows?.length || 0})</h2>
          {readingRows && readingRows.length > 0 ? (
            <div className="space-y-2">
              {readingRows.map(({ assignment, reading }) => (
                <Card key={assignment.$id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/readings/${assignment.readingId}`} className="font-medium hover:text-blue-700">
                        {reading?.title || 'Unknown reading'}
                      </Link>
                      {assignment.promptMarkdown && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{assignment.promptMarkdown}</p>
                      )}
                    </div>
                    <Link to={isTeacher ? `/assignments/${assignment.$id}/submissions` : `/assignments/${assignment.$id}/respond`}>
                      <Button size="sm" variant="secondary">{isTeacher ? 'Responses' : 'Respond'}</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No readings assigned"
              message="Add a reading with an optional Markdown writing prompt and word minimum."
              action={isOwner && <Link to="/readings/new"><Button size="sm" variant="secondary">Add reading</Button></Link>}
            />
          )}
          {isOwner && readingRows && readingRows.length > 0 && (
            <Link to="/readings/new" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">Add reading</Button>
            </Link>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Flashcard decks ({deckRows?.length || 0})</h2>
          {deckRows && deckRows.length > 0 ? (
            <div className="space-y-2">
              {deckRows.map(({ assignment, deck }) => (
                <Card key={assignment.$id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/decks/${assignment.deckId}/review`} className="font-medium hover:text-blue-700">
                        {deck?.title || 'Unknown deck'}
                      </Link>
                      {deck?.description && <p className="text-sm text-gray-500">{deck.description}</p>}
                    </div>
                    {isTeacher ? (
                      <Link to={`/classes/${cls.$id}/decks/${assignment.deckId}/progress`}>
                        <Button size="sm" variant="secondary">Progress</Button>
                      </Link>
                    ) : (
                      <Link to={`/decks/${assignment.deckId}/review`}>
                        <Button size="sm" variant="secondary">Study</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No flashcard decks assigned"
              message="Import a vocabulary CSV or create a deck so students can study with FSRS scheduling."
              action={isOwner && <Link to="/decks/new"><Button size="sm" variant="secondary">Add deck</Button></Link>}
            />
          )}
          {isOwner && deckRows && deckRows.length > 0 && (
            <Link to="/decks/new" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">Add deck</Button>
            </Link>
          )}
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Students ({students?.length || 0})</h2>
        {students && students.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {students.map(student => (
              <Card key={student.$id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => void handleRemoveStudent(student.$id)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No students yet"
            message="Import a roster CSV or share the join code so students can enter the class."
          />
        )}
      </section>

      <Modal open={showSessionModal} onClose={() => setShowSessionModal(false)} title="Start class period">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={sessionTitle}
              onChange={e => setSessionTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Votes each</label>
              <input
                type="number"
                min={0}
                max={20}
                value={votesPerStudent}
                onChange={e => setVotesPerStudent(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linked reading assignment</label>
            <select
              value={sessionAssignmentId}
              onChange={e => setSessionAssignmentId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="">No linked assignment</option>
              {readingRows?.map(({ assignment, reading }) => (
                <option key={assignment.$id} value={assignment.$id}>{reading?.title || assignment.$id}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowStackedVotes}
              onChange={e => setAllowStackedVotes(e.target.checked)}
              className="rounded"
            />
            <span>Allow students to put multiple votes on one question</span>
          </label>
          <Button onClick={() => void handleCreateSession()} className="w-full">
            Create class period
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
