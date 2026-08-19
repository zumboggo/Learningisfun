import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import {
  regenerateJoinCode,
  ensureParentCode,
  regenerateParentCode,
  removeStudent,
  getClassMembers,
  importClassRoster,
  parseClassLinks,
  saveClassLinks,
  MAX_CLASS_LINKS,
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
import { unassignDeck } from '@/services/flashcard.service';
import { setTextClasses } from '@/services/text.service';
import { RandomStudentModal } from '@/components/teacher/RandomStudentModal';
import { CreateGroupsModal } from '@/components/teacher/CreateGroupsModal';
import type { Class, ClassLink, ClassSession, LearningText } from '@/types';

type WeeklyMaterial =
  | { kind: 'notes'; date: string; session: ClassSession }
  | { kind: 'discussion'; date: string; session: ClassSession }
  | { kind: 'text'; date: string; text: LearningText };

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [newCode, setNewCode] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; name: string } | null>(null);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState('Class discussion');
  const [discussionFocus, setDiscussionFocus] = useState('');
  const [discussionDate, setDiscussionDate] = useState(todayKey());
  const [votesPerStudent, setVotesPerStudent] = useState(4);
  const [allowStackedVotes, setAllowStackedVotes] = useState(false);
  const [rosterImporting, setRosterImporting] = useState(false);
  const [rosterResult, setRosterResult] = useState<RosterImportResult | null>(null);
  const [showAddDecks, setShowAddDecks] = useState(false);
  const [showAssignTexts, setShowAssignTexts] = useState(false);
  const [pendingDeckRemoval, setPendingDeckRemoval] = useState<{ deckId: string; title: string } | null>(null);
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
    if (user) void ensureParentCode(classId, user.$id).then(setParentCode);
  }, [classId, user]);

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
  const parentIds = useMemo(() => (members || []).filter(m => m.role === 'parent').map(m => m.userId), [members]);
  const parents = useLiveQuery(async () => Promise.all(parentIds.map(async id => (await db.users.get(id)) || { $id:id,name:'Parent observer',email:'Profile not synced yet' })), [parentIds]);

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
    const sessions = (await db.class_sessions.where('classId').equals(classId).reverse().sortBy('sessionDate')).filter(session => session.discussionType !== 'notes');
    const rows = await Promise.all(sessions.map(async session => ({
      session,
      questionCount: await db.discussion_questions.where('classSessionId').equals(session.$id).count(),
    })));
    return rows;
  }, [classId]);

  const classQuizzes = useLiveQuery(async () => {
    if (!classId) return [];
    const assignments = await db.quiz_assignments.where('classId').equals(classId).toArray();
    const quizIds = [...new Set(assignments.map(assignment => assignment.quizId))];
    if (!quizIds.length) return [];
    const quizzes = await db.quizzes.where('$id').anyOf(quizIds).toArray();
    return quizzes.filter(quiz => isOwner || quiz.status === 'published').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [classId, isOwner]);

  const weeklyMaterials = useLiveQuery(async (): Promise<WeeklyMaterial[]> => {
    if (!classId) return [];
    const sessions = await db.class_sessions.where('classId').equals(classId).toArray();
    const sessionMaterials: WeeklyMaterial[] = sessions
      .filter(session => session.status === 'published' || (session.discussionType !== 'notes' && session.status === 'active'))
      .map(session => ({ kind: session.discussionType === 'notes' ? 'notes' : 'discussion', date: session.sessionDate, session }));
    const assignments = await db.text_assignments.where('classId').equals(classId).toArray();
    const texts = await Promise.all(assignments.map(assignment => db.texts.get(assignment.textId)));
    const textMaterials: WeeklyMaterial[] = assignments.flatMap((assignment, index) => {
      const text = texts[index];
      return text?.status === 'published' ? [{ kind: 'text' as const, date: assignment.assignedAt, text }] : [];
    });
    return [...sessionMaterials, ...textMaterials].sort((a, b) => b.date.localeCompare(a.date));
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
      discussionType: 'qft',
      promptMarkdown: discussionFocus,
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

  const messageClass = () => {
    if (!cls) return;
    const emails = [...new Set((students || []).map(student => student.email).filter(email => email && email !== 'Profile not synced yet'))];
    if (!emails.length) return;
    const subject = encodeURIComponent(`${cls.courseName} — ${cls.name}`);
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${subject}`;
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
            <Link to={`/classes/${cls.$id}/notes/today`}><Button size="sm">Today&apos;s Notes</Button></Link>
            <Button onClick={messageClass} disabled={!students?.some(student => student.email && student.email !== 'Profile not synced yet')} size="sm" variant="secondary">Message class</Button>
            <Button onClick={() => setShowDiscussionModal(true)} size="sm">Start discussion</Button>
            <Button onClick={() => setShowAssignTexts(true)} size="sm" variant="secondary">Assign texts</Button>
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
          <div className="mt-5 border-t pt-4">
            <h3 className="font-semibold">Parent observer code</h3>
            <p className="text-sm text-gray-500">Parents use this code on the same Join Class page. Their account is read-only.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2"><code className="rounded bg-violet-50 px-4 py-2 text-xl font-mono">{parentCode || cls.parentCode || 'Creating…'}</code><CopyButton text={parentCode || cls.parentCode || ''} label="Copy code" copiedLabel="Code copied"/><Button size="sm" variant="secondary" onClick={()=>void regenerateParentCode(cls.$id,user!.$id).then(setParentCode)}>Regenerate</Button></div>
            <p className="mt-3 text-sm text-gray-600">{parents?.length||0} parent observer{parents?.length===1?'':'s'} joined</p>
            {parents?.map(parent=><p key={parent.$id} className="text-xs text-gray-500">{parent.name} · {parent.email}</p>)}
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

      <ClassLinksPanel cls={cls} isOwner={Boolean(isOwner)} teacherId={user?.$id || ''} />

      <WeeklyClassReview materials={weeklyMaterials || []} />

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Quizzes ({classQuizzes?.length || 0})</h2>{isOwner && <Link to="/quizzes"><Button size="sm" variant="secondary">Manage quizzes</Button></Link>}</div>
        {classQuizzes?.length ? <div className="grid gap-3 sm:grid-cols-2">{classQuizzes.map(quiz => <Card key={quiz.$id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{quiz.title}</h3><p className="text-sm text-gray-500">{quiz.questionCount} questions{quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ''}</p></div><StatusBadge status={quiz.status}/></div><Link className="mt-3 block" to={`/quizzes/${quiz.$id}/take`}><Button size="sm" className="w-full">{isOwner ? 'Preview' : 'Start quiz'}</Button></Link></Card>)}</div> : <p className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-400">No published quizzes for this class yet.</p>}
      </section>

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
                        {isOwner && <Button size="sm" variant="danger" onClick={() => setPendingDeckRemoval({ deckId: assignment.deckId, title: deck?.title || 'this deck' })}>Remove</Button>}
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

      <Modal open={Boolean(pendingDeckRemoval)} onClose={() => setPendingDeckRemoval(null)} title="Remove deck from class">
        <div className="space-y-4"><p className="text-sm text-gray-600">Remove <strong>{pendingDeckRemoval?.title}</strong> from this class? The deck itself and student review history will not be deleted.</p><div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setPendingDeckRemoval(null)}>Cancel</Button><Button variant="danger" className="flex-1" onClick={() => { if (!pendingDeckRemoval) return; void unassignDeck(pendingDeckRemoval.deckId, cls.$id).then(() => setPendingDeckRemoval(null)); }}>Remove deck</Button></div></div>
      </Modal>

      <Modal open={showDiscussionModal} onClose={() => setShowDiscussionModal(false)} title="Start discussion">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discussion topic</label>
            <input
              value={discussionTitle}
              onChange={e => setDiscussionTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Overall focus or context</label><textarea value={discussionFocus} onChange={e => setDiscussionFocus(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg" placeholder="Give the class a broad topic or focus. Teachers and students can add multiple questions underneath it." /></div>
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
        <><AddDecksToClassModal
          open={showAddDecks}
          classId={cls.$id}
          teacherId={user.$id}
          onClose={() => setShowAddDecks(false)}
        /><AssignTextsToClassModal open={showAssignTexts} classId={cls.$id} teacherId={user.$id} onClose={() => setShowAssignTexts(false)} /></>
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

function AssignTextsToClassModal({ open, classId, teacherId, onClose }: { open: boolean; classId: string; teacherId: string; onClose: () => void }) {
  const texts = useLiveQuery(() => db.texts.where('teacherId').equals(teacherId).and(text => text.status !== 'archived').toArray(), [teacherId]);
  const assignments = useLiveQuery(() => db.text_assignments.where('classId').equals(classId).toArray(), [classId]);
  const [chosen, setChosen] = useState<Set<string> | null>(null);
  const selected = chosen || new Set(assignments?.map(assignment => assignment.textId) || []);
  const toggle = (textId: string) => { const next = new Set(selected); if (next.has(textId)) next.delete(textId); else next.add(textId); setChosen(next); };
  const save = async () => {
    for (const text of texts || []) {
      const current = await db.text_assignments.where('textId').equals(text.$id).toArray();
      const classIds = new Set(current.map(assignment => assignment.classId));
      if (selected.has(text.$id)) classIds.add(classId); else classIds.delete(classId);
      await setTextClasses(text.$id, [...classIds], teacherId);
    }
    setChosen(null); onClose();
  };
  return <Modal open={open} onClose={() => { setChosen(null); onClose(); }} title="Assign texts to class"><div className="space-y-4"><p className="text-sm text-gray-500">Choose any texts students in this class should be able to read.</p><div className="max-h-80 space-y-2 overflow-auto">{texts?.length ? texts.map(text => <label key={text.$id} className="flex items-start gap-3 rounded-lg border p-3"><input type="checkbox" className="mt-1" checked={selected.has(text.$id)} onChange={() => toggle(text.$id)} /><span><strong className="block text-sm">{text.title}</strong><span className="text-xs text-gray-500">{text.author || 'Unknown author'}</span></span></label>) : <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Create or upload a text in the Texts section first.</p>}</div><Button className="w-full" onClick={() => void save()}>Save text assignments</Button></div></Modal>;
}

function WeeklyClassReview({ materials }: { materials: WeeklyMaterial[] }) {
  const groups = new Map<string, WeeklyMaterial[]>();
  for (const material of materials) {
    const key = weekStart(material.date);
    groups.set(key, [...(groups.get(key) || []), material]);
  }
  const weeks = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const [openWeek, setOpenWeek] = useState(weeks[0]?.[0] || '');
  useEffect(() => {
    if (!openWeek && weeks[0]?.[0]) setOpenWeek(weeks[0][0]);
  }, [openWeek, weeks]);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Weekly class materials</h2>
      {weeks.length === 0 ? (
        <Card><p className="text-sm text-gray-500">Notes, discussions, and texts will appear here by week.</p></Card>
      ) : (
        <div className="space-y-3">
          {weeks.map(([week, items]) => {
            const isOpen = openWeek === week;
            const counts = {
              notes: items.filter(item => item.kind === 'notes').length,
              discussions: items.filter(item => item.kind === 'discussion').length,
              texts: items.filter(item => item.kind === 'text').length,
            };
            return (
              <div key={week} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <button className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50" onClick={() => setOpenWeek(isOpen ? '' : week)}>
                  <span className="font-semibold">{isOpen ? '▾' : '▸'} Week of {formatWeek(week)}</span>
                  <span className="text-xs text-gray-500">{counts.notes} notes · {counts.discussions} discussions · {counts.texts} texts</span>
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t bg-gray-50 p-4">
                    {items.map(item => item.kind === 'notes' ? (
                      <article key={`notes-${item.session.$id}`} className="rounded-xl border bg-white p-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Class notes · {formatDate(item.date)}</p>
                        <div className="whitespace-pre-wrap text-base leading-7 text-gray-800">{item.session.publishedNotesMarkdown}</div>
                      </article>
                    ) : item.kind === 'discussion' ? (
                      <Link key={`discussion-${item.session.$id}`} to={`/discussions/${item.session.$id}`} className="block rounded-xl border bg-white p-4 hover:border-blue-300">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Discussion · {formatDate(item.date)}</p>
                        <h3 className="mt-1 font-semibold">{item.session.title}</h3>
                        {item.session.promptMarkdown && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.session.promptMarkdown}</p>}
                      </Link>
                    ) : (
                      <Link key={`text-${item.text.$id}`} to={`/texts/${item.text.$id}`} className="block rounded-xl border bg-white p-4 hover:border-blue-300">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Text · {formatDate(item.date)}</p>
                        <h3 className="mt-1 font-semibold">{item.text.title}</h3>
                        <p className="text-sm text-gray-500">{item.text.author || 'Unknown author'}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function weekStart(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function formatWeek(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(value: string): string {
  return new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function ClassLinksPanel({ cls, isOwner, teacherId }: { cls: Class; isOwner: boolean; teacherId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const links = parseClassLinks(cls.linksJson);

  const addLink = async () => {
    if (!teacherId || !label.trim() || !url.trim() || links.length >= MAX_CLASS_LINKS) return;
    setSaving(true); setError('');
    try {
      await saveClassLinks(cls.$id, teacherId, [...links, { label, url }]);
      setLabel(''); setUrl('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save link');
    } finally {
      setSaving(false);
    }
  };

  const removeLink = async (target: ClassLink) => {
    if (!teacherId) return;
    setSaving(true); setError('');
    try {
      await saveClassLinks(cls.$id, teacherId, links.filter(link => link.label !== target.label || link.url !== target.url));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete link');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50" onClick={() => setOpen(value => !value)}>
        <span className="text-lg font-semibold">{open ? '▾' : '▸'} Links</span>
        <span className="text-sm text-gray-500">{links.length}/{MAX_CLASS_LINKS}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t p-4">
          {links.length ? links.map(link => (
            <div key={`${link.label}-${link.url}`} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <a href={link.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-blue-700 hover:underline">{link.label}</a>
              {isOwner && <button className="text-sm text-red-600 hover:text-red-800" disabled={saving} onClick={() => void removeLink(link)}>Delete</button>}
            </div>
          )) : <p className="text-sm text-gray-500">No class links have been added yet.</p>}
          {isOwner && links.length < MAX_CLASS_LINKS && (
            <div className="grid gap-2 border-t pt-3 sm:grid-cols-[1fr_1.5fr_auto]">
              <input className="rounded-lg border px-3 py-2 text-sm" value={label} onChange={event => setLabel(event.target.value)} placeholder="Link name" maxLength={120} />
              <input className="rounded-lg border px-3 py-2 text-sm" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://…" inputMode="url" />
              <Button size="sm" loading={saving} disabled={!label.trim() || !url.trim()} onClick={() => void addLink()}>Add</Button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
