import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import {
  regenerateJoinCode,
  removeStudent,
  getClassMembers,
  importClassRoster,
  syncClassRosterFromServer,
  type RosterImportResult,
} from '@/services/class.service';
import { createClassSession, todayKey } from '@/services/class-session.service';
import { downloadCsv } from '@/services/report.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { CopyButton } from '@/components/common/CopyButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AddDecksToClassModal } from '@/components/common/AddDecksToClassModal';
import { RandomStudentModal } from '@/components/teacher/RandomStudentModal';
import { CreateGroupsModal } from '@/components/teacher/CreateGroupsModal';

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [newCode, setNewCode] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; name: string } | null>(null);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState('Class discussion');
  const [discussionDate, setDiscussionDate] = useState(todayKey());
  const [votesPerStudent, setVotesPerStudent] = useState(4);
  const [allowStackedVotes, setAllowStackedVotes] = useState(false);
  const [rosterImporting, setRosterImporting] = useState(false);
  const [rosterResult, setRosterResult] = useState<RosterImportResult | null>(null);
  const [showAddDecks, setShowAddDecks] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const cls = useLiveQuery(() => (classId ? db.classes.get(classId) : undefined), [classId]);
  const members = useLiveQuery(
    () => (classId ? getClassMembers(classId) : []),
    [classId],
  );

  const isOwner = cls?.teacherId === user?.$id && isTeacher;

  const activeCode = newCode || cls?.joinCode || '';
  const joinLink = `${window.location.origin}${import.meta.env.BASE_URL}join/${activeCode}`;

  // Students who join from their own phone write their membership straight to
  // the server, so the teacher's device has to pull the roster to see them.
  const [refreshingRoster, setRefreshingRoster] = useState(false);
  const refreshRoster = async () => {
    if (!classId) return;
    setRefreshingRoster(true);
    try {
      await syncClassRosterFromServer(classId);
    } finally {
      setRefreshingRoster(false);
    }
  };

  useEffect(() => {
    if (!classId) return;
    void syncClassRosterFromServer(classId);
  }, [classId]);

  const studentIds = useMemo(
    () => (members || []).filter(m => m.role === 'student').map(m => m.userId),
    [members],
  );

  const students = useLiveQuery(async () => {
    if (studentIds.length === 0) return [];
    const rows = await Promise.all(studentIds.map(async id => {
      const profile = await db.users.get(id);
      // A profile the teacher cannot read still counts as an enrolled student —
      // dropping the row would under-report the class.
      return profile || { $id: id, name: 'Student', email: 'Profile not synced yet' };
    }));
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [studentIds]);

  const pickableStudents = useMemo(
    () => (students || []).map(s => ({ id: s.$id, name: s.name })),
    [students],
  );

  const deckRows = useLiveQuery(async () => {
    if (!classId) return [];
    const assignments = await db.deck_assignments.where('classId').equals(classId).toArray();
    const rows = await Promise.all(assignments.map(async assignment => ({
      assignment,
      deck: await db.flashcard_decks.get(assignment.deckId),
      cardCount: await db.flashcard_cards.where('deckId').equals(assignment.deckId).count(),
    })));
    return rows.sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt));
  }, [classId]);

  const totalCards = useMemo(
    () => (deckRows || []).reduce((sum, row) => sum + row.cardCount, 0),
    [deckRows],
  );

  const discussions = useLiveQuery(async () => {
    if (!classId) return [];
    const sessions = await db.class_sessions.where('classId').equals(classId).reverse().sortBy('sessionDate');
    const rows = await Promise.all(sessions.map(async session => ({
      session,
      questionCount: await db.discussion_questions.where('classSessionId').equals(session.$id).count(),
    })));
    return rows;
  }, [classId]);

  const handleRegenerateCode = async () => {
    if (!classId || !user) return;
    const code = await regenerateJoinCode(classId, user.$id);
    setNewCode(code);
  };

  const handleRemoveStudent = async () => {
    if (!classId || !pendingRemoval) return;
    await removeStudent(classId, pendingRemoval.id);
    setPendingRemoval(null);
  };

  const handleCreateDiscussion = async () => {
    if (!classId || !user) return;
    const session = await createClassSession(classId, user.$id, {
      title: discussionTitle,
      sessionDate: discussionDate,
      assignmentId: null,
      votesPerStudent,
      allowStackedVotes,
    });
    setShowDiscussionModal(false);
    navigate(`/discussions/${session.$id}`);
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
          <h1 className="text-2xl font-bold">{cls.courseName}</h1>
          <p className="text-gray-500">{cls.name} | {cls.schoolYear}</p>
        </div>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowDiscussionModal(true)} size="sm">Start discussion</Button>
            <Button onClick={() => setShowPicker(true)} size="sm" variant="secondary">Pick a student</Button>
            <Button onClick={() => setShowGroups(true)} size="sm" variant="secondary">Create groups</Button>
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
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  Or send students this link — they can sign up and join in one step:
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs break-all">{joinLink}</code>
                  <CopyButton text={joinLink} label="Copy link" copiedLabel="Link copied" />
                </div>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Discussions ({discussions?.length || 0})</h2>
            {isOwner && (
              <Button
                onClick={() => setShowDiscussionModal(true)}
                size="sm"
                variant="secondary"
                aria-label="Start a discussion"
              >
                Start
              </Button>
            )}
          </div>
          {discussions && discussions.length > 0 ? (
            <div className="space-y-2">
              {discussions.slice(0, 5).map(({ session, questionCount }) => (
                <Link key={session.$id} to={`/discussions/${session.$id}`}>
                  <Card>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-sm">{session.title}</h3>
                        <p className="text-xs text-gray-500">{session.sessionDate}</p>
                      </div>
                      <StatusBadge status={session.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{questionCount} questions</p>
                  </Card>
                </Link>
              ))}
              {discussions.length > 5 && (
                <Link to="/discussions" className="text-sm text-blue-600 hover:underline block">
                  +{discussions.length - 5} more discussions
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="No discussions yet"
              message="Start a discussion to collect questions and votes."
              action={isOwner && <Button onClick={() => setShowDiscussionModal(true)} size="sm" variant="secondary">Start discussion</Button>}
            />
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              Card decks ({deckRows?.length || 0})
              {totalCards > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">{totalCards} cards</span>
              )}
            </h2>
            {isOwner && (
              <div className="flex gap-2">
                <Link to={`/classes/${cls.$id}/cards/new`}>
                  <Button size="sm" variant="secondary" aria-label="Add cards to this class">
                    Add cards
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Add existing decks to this class"
                  onClick={() => setShowAddDecks(true)}
                >
                  Add decks
                </Button>
              </div>
            )}
          </div>
          {deckRows && deckRows.length > 0 ? (
            <div className="space-y-2">
              {deckRows.slice(0, 5).map(({ assignment, deck, cardCount }) => (
                <Card key={assignment.$id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/decks/${assignment.deckId}/review`} className="font-medium text-sm hover:text-blue-700">
                        {deck?.title || 'Unknown deck'}
                      </Link>
                      {deck?.description && <p className="text-xs text-gray-500">{deck.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                      </p>
                    </div>
                    {isTeacher ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link to={`/decks/${assignment.deckId}/present`}>
                          <Button size="sm">Present</Button>
                        </Link>
                        <Link to={`/classes/${cls.$id}/decks/${assignment.deckId}/progress`}>
                          <Button size="sm" variant="secondary">Progress</Button>
                        </Link>
                      </div>
                    ) : (
                      <Link to={`/decks/${assignment.deckId}/review`}>
                        <Button size="sm" variant="secondary">Study</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
              {deckRows.length > 5 && (
                <Link to="/decks" className="text-sm text-blue-600 hover:underline block">
                  +{deckRows.length - 5} more {deckRows.length - 5 === 1 ? 'deck' : 'decks'}
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="No cards yet"
              message="Type cards in by hand, or import a CSV if you already have a list."
              action={isOwner && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to={`/classes/${cls.$id}/cards/new`}><Button size="sm">Add cards</Button></Link>
                  <Button size="sm" variant="secondary" onClick={() => setShowAddDecks(true)}>Add decks</Button>
                  <Link to="/decks/import"><Button size="sm" variant="secondary">Import CSV</Button></Link>
                </div>
              )}
            />
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Students ({students?.length || 0})</h2>
          {isOwner && (
            <Button
              size="sm"
              variant="secondary"
              loading={refreshingRoster}
              onClick={() => void refreshRoster()}
            >
              Refresh roster
            </Button>
          )}
        </div>
        {students && students.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {students.map(student => (
              <Card key={student.$id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <Link
                      to={`/classes/${classId}/students/${student.$id}/progress`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Progress
                    </Link>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setPendingRemoval({ id: student.$id, name: student.name })}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No students yet"
            message="Import a roster CSV or share the join code so students can enter the class. If students say they have joined, hit Refresh roster."
          />
        )}
      </section>

      <Modal
        open={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        title="Remove student"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Remove <strong>{pendingRemoval?.name}</strong> from {cls.courseName}? They lose access to this
            class's cards and discussions, and will need the join code to come back.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button variant="danger" onClick={() => void handleRemoveStudent()} className="sm:flex-1">
              Remove {pendingRemoval?.name}
            </Button>
            <Button variant="secondary" onClick={() => setPendingRemoval(null)} className="sm:flex-1">
              Keep in class
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDiscussionModal} onClose={() => setShowDiscussionModal(false)} title="Start discussion">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={discussionTitle}
              onChange={e => setDiscussionTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={discussionDate}
                onChange={e => setDiscussionDate(e.target.value)}
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowStackedVotes}
              onChange={e => setAllowStackedVotes(e.target.checked)}
              className="rounded"
            />
            <span>Allow students to put multiple votes on one question</span>
          </label>
          <Button onClick={() => void handleCreateDiscussion()} className="w-full">
            Create discussion
          </Button>
        </div>
      </Modal>

      {isOwner && user && (
        <AddDecksToClassModal
          open={showAddDecks}
          classId={cls.$id}
          teacherId={user.$id}
          onClose={() => setShowAddDecks(false)}
        />
      )}

      {isOwner && (
        <>
          <RandomStudentModal
            open={showPicker}
            students={pickableStudents}
            onClose={() => setShowPicker(false)}
          />
          <CreateGroupsModal
            open={showGroups}
            students={pickableStudents}
            onClose={() => setShowGroups(false)}
          />
        </>
      )}
    </div>
  );
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
