import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { joinClass } from '@/services/class.service';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import type { Class, ClassSession, DeckAssignment, FlashcardDeck, Reading, ReadingAssignment, Submission } from '@/types';

interface ReadingAction {
  assignment: ReadingAssignment;
  reading: Reading | undefined;
  submission: Submission | undefined;
}

interface DeckAction {
  assignment: DeckAssignment;
  deck: FlashcardDeck | undefined;
}

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const isTeacher = user.role === 'teacher' || user.role === 'admin';

  return isTeacher ? <TeacherDashboard /> : <StudentDashboard />;
}

function StudentDashboard() {
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [joining, setJoining] = useState(false);

  const memberships = useLiveQuery(
    () => db.class_members.where('userId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const classIds = useMemo(() => memberships?.map(c => c.classId) || [], [memberships]);

  const doNow = useLiveQuery(async () => {
    if (!user || classIds.length === 0) return { sessions: [], readings: [], decks: [] };
    const [sessions, readingAssignments, deckAssignments] = await Promise.all([
      db.class_sessions.where('classId').anyOf(classIds).and(s => s.status === 'active').toArray(),
      db.reading_assignments.where('classId').anyOf(classIds).toArray(),
      db.deck_assignments.where('classId').anyOf(classIds).toArray(),
    ]);
    const readings: ReadingAction[] = [];
    for (const assignment of readingAssignments) {
      const [reading, submission] = await Promise.all([
        db.readings.get(assignment.readingId),
        db.submissions.where('[assignmentId+userId]').equals([assignment.$id, user.$id]).first(),
      ]);
      readings.push({ assignment, reading, submission });
    }
    const decks: DeckAction[] = [];
    for (const assignment of deckAssignments) {
      decks.push({ assignment, deck: await db.flashcard_decks.get(assignment.deckId) });
    }
    return {
      sessions: sessions.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)),
      readings: readings.sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt)),
      decks: decks.sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt)),
    };
  }, [user?.$id, classIds]);

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const result = await joinClass(user.$id, joinCode.trim().toUpperCase());
      if (!result) setJoinError('Invalid or expired class code');
      else {
        setShowJoin(false);
        setJoinCode('');
      }
    } catch {
      setJoinError('Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  const pendingReadings = doNow?.readings.filter(row => row.submission?.status !== 'submitted') || [];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-500 text-sm">Start with the next thing your class needs.</p>
        </div>
        <Button onClick={() => setShowJoin(true)} size="sm">
          Join class
        </Button>
      </div>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Join a class">
        <div className="space-y-4">
          {joinError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{joinError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class code</label>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-center text-lg tracking-widest uppercase"
            />
          </div>
          <Button onClick={() => void handleJoin()} loading={joining} className="w-full">
            Join
          </Button>
        </div>
      </Modal>

      <section>
        <h2 className="text-lg font-semibold mb-3">Do now</h2>
        {doNow && (doNow.sessions.length > 0 || pendingReadings.length > 0 || doNow.decks.length > 0) ? (
          <div className="grid gap-3 md:grid-cols-3">
            {doNow.sessions.slice(0, 2).map(session => (
              <ActionCard
                key={session.$id}
                title={session.title}
                detail={`${session.votesPerStudent} votes available`}
                to={`/sessions/${session.$id}`}
                action="Open discussion"
                status={session.status}
              />
            ))}
            {pendingReadings.slice(0, 2).map(({ assignment, reading, submission }) => (
              <ActionCard
                key={assignment.$id}
                title={reading?.title || 'Reading response'}
                detail={assignment.minResponseWords > 0 ? `${assignment.minResponseWords}+ words` : 'Response prompt'}
                to={`/assignments/${assignment.$id}/respond`}
                action={submission ? 'Continue response' : 'Start response'}
                status={submission?.belowMinimum ? 'short' : submission?.status || 'not started'}
              />
            ))}
            {doNow.decks.slice(0, 2).map(({ assignment, deck }) => (
              <ActionCard
                key={assignment.$id}
                title={deck?.title || 'Flashcard deck'}
                detail={assignment.dailyTarget ? `${assignment.dailyTarget} card target` : 'Study vocabulary'}
                to={`/decks/${assignment.deckId}/review`}
                action="Study cards"
                status={assignment.isRequired ? 'required' : 'practice'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing assigned yet"
            message="When your teacher opens a class period, reading, or flashcard deck, it will appear here."
            action={<Button onClick={() => setShowJoin(true)} variant="secondary">Join a class</Button>}
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardList title="Assigned readings">
          {doNow?.readings.map(({ assignment, reading, submission }) => (
            <Link key={assignment.$id} to={`/assignments/${assignment.$id}/respond`}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{reading?.title || 'Unknown reading'}</h3>
                    {reading?.author && <p className="text-sm text-gray-500">{reading.author}</p>}
                  </div>
                  <StatusBadge status={submission?.belowMinimum ? 'short' : submission?.status || 'not started'} />
                </div>
              </Card>
            </Link>
          ))}
        </DashboardList>

        <DashboardList title="Flashcard decks">
          {doNow?.decks.map(({ assignment, deck }) => (
            <Link key={assignment.$id} to={`/decks/${assignment.deckId}/review`}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{deck?.title || 'Unknown deck'}</h3>
                    {deck?.description && <p className="text-sm text-gray-500">{deck.description}</p>}
                  </div>
                  {assignment.dailyTarget ? <StatusBadge status="ready" label={`${assignment.dailyTarget}/day`} /> : <StatusBadge status="practice" />}
                </div>
              </Card>
            </Link>
          ))}
        </DashboardList>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();

  const classes = useLiveQuery(
    () => db.classes.where('teacherId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const classIds = useMemo(() => classes?.map(c => c.$id) || [], [classes]);

  const dashboard = useLiveQuery(async () => {
    if (classIds.length === 0) return { activeSessions: [], classRows: [] };
    const [activeSessions, classRows] = await Promise.all([
      buildActiveSessionRows(classIds),
      buildTeacherClassRows(classes || []),
    ]);
    return { activeSessions, classRows };
  }, [classIds, classes]);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <p className="text-gray-500 text-sm">Today’s class tools in one place.</p>
        </div>
        <Link to="/classes/new">
          <Button size="sm">New class</Button>
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Today’s class</h2>
        {dashboard && dashboard.activeSessions.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {dashboard.activeSessions.map(row => (
              <Card key={row.session.$id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{row.session.title}</h3>
                    <p className="text-sm text-gray-500">{row.cls?.name || 'Class'} | {row.session.sessionDate}</p>
                  </div>
                  <StatusBadge status={row.session.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <Metric value={row.questionCount} label="Questions" />
                  <Metric value={row.submissionCount} label="Submissions" />
                  <Metric value={row.deckCount} label="Decks" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/sessions/${row.session.$id}`}><Button size="sm">Open period</Button></Link>
                  {row.session.assignmentId && (
                    <Link to={`/assignments/${row.session.assignmentId}/submissions`}>
                      <Button size="sm" variant="secondary">Responses</Button>
                    </Link>
                  )}
                  {row.cls && <Link to={`/classes/${row.cls.$id}/reports`}><Button size="sm" variant="secondary">Report</Button></Link>}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active class period"
            message="Open a class and start a period to collect questions, votes, notes, and anonymous submissions."
            action={<Link to="/classes"><Button variant="secondary">Open classes</Button></Link>}
          />
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Classes</h2>
        {dashboard && dashboard.classRows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.classRows.map(row => (
              <Link key={row.cls.$id} to={`/classes/${row.cls.$id}`}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-lg">{row.cls.name}</h3>
                      <p className="text-sm text-gray-500">{row.cls.courseName}</p>
                    </div>
                    <StatusBadge status={row.cls.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span>{row.memberCount} students</span>
                    <span>{row.readingCount} readings</span>
                    <span>{row.questionCount} questions</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{row.cls.joinCode}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classes yet"
            message="Create your first class, then import a roster or share a join code."
            action={<Link to="/classes/new"><Button>Create your first class</Button></Link>}
          />
        )}
      </section>
    </div>
  );
}

function ActionCard({
  title,
  detail,
  to,
  action,
  status,
}: {
  title: string;
  detail: string;
  to: string;
  action: string;
  status: string;
}) {
  return (
    <Link to={to}>
      <Card className="h-full">
        <div className="flex h-full flex-col justify-between gap-4">
          <div>
            <div className="mb-2"><StatusBadge status={status} /></div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{detail}</p>
          </div>
          <span className="text-sm font-medium text-blue-700">{action}</span>
        </div>
      </Card>
    </Link>
  );
}

function DashboardList({ title, children }: { title: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {Array.isArray(items) && items.length === 0 ? (
        <p className="text-gray-400 text-sm">Nothing here yet</p>
      ) : (
        <div className="space-y-3">{items}</div>
      )}
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2 py-3">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

async function buildActiveSessionRows(classIds: string[]): Promise<Array<{
  session: ClassSession;
  cls: Class | undefined;
  questionCount: number;
  submissionCount: number;
  deckCount: number;
}>> {
  const sessions = await db.class_sessions.where('classId').anyOf(classIds).and(s => s.status === 'active').toArray();
  const rows = [];
  for (const session of sessions) {
    const [cls, questionCount, deckCount] = await Promise.all([
      db.classes.get(session.classId),
      db.discussion_questions.where('classSessionId').equals(session.$id).count(),
      db.deck_assignments.where('classId').equals(session.classId).count(),
    ]);
    const submissionCount = session.assignmentId
      ? await db.submissions.where('assignmentId').equals(session.assignmentId).count()
      : 0;
    rows.push({ session, cls, questionCount, submissionCount, deckCount });
  }
  return rows.sort((a, b) => b.session.sessionDate.localeCompare(a.session.sessionDate));
}

async function buildTeacherClassRows(classes: Class[]): Promise<Array<{
  cls: Class;
  memberCount: number;
  readingCount: number;
  questionCount: number;
}>> {
  const rows = [];
  for (const cls of classes) {
    const [memberCount, readingAssignments] = await Promise.all([
      db.class_members.where('classId').equals(cls.$id).and(member => member.role === 'student').count(),
      db.reading_assignments.where('classId').equals(cls.$id).toArray(),
    ]);
    let questionCount = 0;
    for (const assignment of readingAssignments) {
      questionCount += await db.discussion_questions.where('assignmentId').equals(assignment.$id).count();
    }
    rows.push({ cls, memberCount, readingCount: readingAssignments.length, questionCount });
  }
  return rows;
}
