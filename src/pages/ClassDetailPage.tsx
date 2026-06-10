import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { regenerateJoinCode, removeStudent, getClassMembers } from '@/services/class.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useState } from 'react';

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const [newCode, setNewCode] = useState('');

  const cls = useLiveQuery(() => (classId ? db.classes.get(classId) : undefined), [classId]);
  const members = useLiveQuery(
    () => (classId ? getClassMembers(classId) : []),
    [classId],
  );

  const memberIds = members?.map(m => m.userId) || [];
  const students = useLiveQuery(async () => {
    if (memberIds.length === 0) return [];
    const users = [];
    for (const id of memberIds) {
      const u = await db.users.get(id);
      if (u) users.push(u);
    }
    return users;
  }, [memberIds]);

  const readings = useLiveQuery(
    () => (classId ? db.reading_assignments.where('classId').equals(classId).toArray() : []),
    [classId],
  );

  const decks = useLiveQuery(
    () => (classId ? db.deck_assignments.where('classId').equals(classId).toArray() : []),
    [classId],
  );

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isOwner = cls?.teacherId === user?.$id;

  const handleRegenerateCode = async () => {
    if (!classId || !user) return;
    const code = await regenerateJoinCode(classId, user.$id);
    setNewCode(code);
  };

  const handleRemoveStudent = async (userId: string) => {
    if (!classId) return;
    await removeStudent(classId, userId);
  };

  if (!cls) {
    return <div className="p-4 text-gray-400">Loading class…</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{cls.name}</h1>
        <p className="text-gray-500">{cls.courseName} · {cls.schoolYear}</p>
      </div>

      {isOwner && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Class join code</h3>
              <div className="text-2xl font-mono bg-gray-100 px-4 py-2 rounded-lg inline-block mt-1">
                {newCode || cls.joinCode}
              </div>
            </div>
            <Button onClick={() => void handleRegenerateCode()} size="sm" variant="secondary">
              Regenerate
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold mb-3">Students ({students?.length || 0})</h2>
          {students && students.length > 0 ? (
            <div className="space-y-2">
              {students.map(s => (
                <Card key={s.$id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-500">{s.email}</div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => void handleRemoveStudent(s.$id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No students yet</p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Assigned Readings ({readings?.length || 0})</h2>
          {readings && readings.length > 0 ? (
            <div className="space-y-2">
              {readings.map(async (r) => {
                const reading = await db.readings.get(r.readingId);
                return (
                  <Link key={r.$id} to={`/readings/${r.readingId}`}>
                    <Card>
                      <div className="font-medium">{reading?.title || 'Unknown reading'}</div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No readings assigned</p>
          )}
          {isOwner && (
            <Link to="/readings/new" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">Add reading</Button>
            </Link>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Flashcard Decks ({decks?.length || 0})</h2>
        {decks && decks.length > 0 ? (
          <div className="space-y-2">
            {decks.map(async (d) => {
              const deck = await db.flashcard_decks.get(d.deckId);
              return (
                <Link key={d.$id} to={`/decks/${d.deckId}/review`}>
                  <Card>
                    <div className="font-medium">{deck?.title || 'Unknown deck'}</div>
                    {d.isRequired && <span className="text-xs text-orange-600">Required</span>}
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No decks assigned</p>
        )}
        {isOwner && (
          <Link to="/decks/new" className="mt-3 inline-block">
            <Button size="sm" variant="secondary">Add deck</Button>
          </Link>
        )}
      </section>
    </div>
  );
}
