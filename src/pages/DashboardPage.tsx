import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { joinClass } from '@/services/class.service';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

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

  const classes = useLiveQuery(
    () => db.class_members.where('userId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const classIds = classes?.map(c => c.classId) || [];

  const readings = useLiveQuery(async () => {
    if (classIds.length === 0) return [];
    const assignments = await db.reading_assignments
      .where('classId')
      .anyOf(classIds)
      .toArray();
    const readingIds = [...new Set(assignments.map(a => a.readingId))];
    if (readingIds.length === 0) return [];
    return db.readings.where('$id').anyOf(readingIds).toArray();
  }, [classIds]);

  const decks = useLiveQuery(async () => {
    if (classIds.length === 0) return [];
    const assignments = await db.deck_assignments
      .where('classId')
      .anyOf(classIds)
      .toArray();
    const deckIds = [...new Set(assignments.map(a => a.deckId))];
    if (deckIds.length === 0) return [];
    return db.flashcard_decks.where('$id').anyOf(deckIds).toArray();
  }, [classIds]);

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const result = await joinClass(user.$id, joinCode.trim().toUpperCase());
      if (!result) {
        setJoinError('Invalid or expired class code');
      } else {
        setShowJoin(false);
        setJoinCode('');
      }
    } catch {
      setJoinError('Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-500 text-sm">Your learning dashboard</p>
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

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Assigned Readings</h2>
        {readings && readings.length > 0 ? (
          <div className="space-y-3">
            {readings.map(reading => (
              <Link key={reading.$id} to={`/readings/${reading.$id}`}>
                <Card>
                  <h3 className="font-medium">{reading.title}</h3>
                  {reading.author && <p className="text-sm text-gray-500">{reading.author}</p>}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No readings assigned yet</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Flashcard Decks</h2>
        {decks && decks.length > 0 ? (
          <div className="space-y-3">
            {decks.map(deck => (
              <Link key={deck.$id} to={`/decks/${deck.$id}/review`}>
                <Card>
                  <h3 className="font-medium">{deck.title}</h3>
                  <p className="text-sm text-gray-500">{deck.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No decks assigned yet</p>
        )}
      </section>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();

  const classes = useLiveQuery(
    () => db.classes.where('teacherId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const classIds = classes?.map(c => c.$id) || [];

  const memberCounts = useLiveQuery(async () => {
    if (classIds.length === 0) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const id of classIds) {
      const count = await db.class_members.where('classId').equals(id).count();
      counts.set(id, count);
    }
    return counts;
  }, [classIds]);

  const readingCounts = useLiveQuery(async () => {
    if (classIds.length === 0) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const id of classIds) {
      const count = await db.reading_assignments.where('classId').equals(id).count();
      counts.set(id, count);
    }
    return counts;
  }, [classIds]);

  const questionCounts = useLiveQuery(async () => {
    if (classIds.length === 0) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const id of classIds) {
      const assignments = await db.reading_assignments.where('classId').equals(id).toArray();
      let total = 0;
      for (const a of assignments) {
        const qCount = await db.discussion_questions.where('assignmentId').equals(a.$id).count();
        total += qCount;
      }
      counts.set(id, total);
    }
    return counts;
  }, [classIds]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage your classes</p>
        </div>
        <Link to="/classes/new">
          <Button size="sm">New class</Button>
        </Link>
      </div>

      {classes && classes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map(cls => (
            <Link key={cls.$id} to={`/classes/${cls.$id}`}>
              <Card>
                <h3 className="font-semibold text-lg">{cls.name}</h3>
                <p className="text-sm text-gray-500">{cls.courseName}</p>
                <div className="mt-3 flex gap-4 text-sm text-gray-600">
                  <span>👥 {memberCounts?.get(cls.$id) || 0} students</span>
                  <span>📖 {readingCounts?.get(cls.$id) || 0} readings</span>
                  <span>❓ {questionCounts?.get(cls.$id) || 0} questions</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{cls.joinCode}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="text-gray-400 mb-4">No classes yet</p>
          <Link to="/classes/new">
            <Button>Create your first class</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
