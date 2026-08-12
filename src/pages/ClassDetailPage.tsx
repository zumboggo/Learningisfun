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
import { CopyButton } from '@/components/common/CopyButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AddDecksToClassModal } from '@/components/common/AddDecksToClassModal';

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

  const cls = useLiveQuery(() => (classId ? db.classes.get(classId) : undefined), [classId]);
  const members = useLiveQuery(
    () => (classId ? getClassMembers(classId) : []),
    [classId],
  );

  const isOwner = cls?.teacherId === user?.$id && isTeacher;
  const memberIds = useMemo(() => members?.map(m => m.userId) || [], [members]);

  const activeCode = newCode || cls?.joinCode || '';
  const joinLink = `${window.location.origin}${import.meta.env.BASE_URL}join/${activeCode}`;

  const students = useLiveQuery(async () => {
    if (memberIds.length === 0) return [];
    const users = await Promise.all(memberIds.map(id => db.users.get(id)));
    return users.filter((u): u is NonNullable<typeof u> => Boolean(u));
  }, [memberIds]);

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
            <h2 className="text-lg font-semibold">Questions ({discussions?.length || 0})</h2>
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
                  +{discussions.length - 5} more question sessions
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="No question sessions yet"
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
        <h2 className="text-lg font-semibold mb-3">Students ({students?.length || 0})</h2>
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
            message="Import a roster CSV or share the join code so students can enter the class."
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
    </div>
  );
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
