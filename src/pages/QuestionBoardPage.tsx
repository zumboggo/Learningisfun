import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

export function QuestionBoardPage() {
  const { readingId } = useParams<{ readingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const reading = useLiveQuery(() => (readingId ? db.readings.get(readingId) : undefined), [readingId]);
  const sessionRows = useLiveQuery(async () => {
    if (!readingId || !user) return [];
    const [assignments, memberships] = await Promise.all([
      db.reading_assignments.where('readingId').equals(readingId).toArray(),
      db.class_members.where('userId').equals(user.$id).toArray(),
    ]);
    const classIds = new Set(memberships.map(member => member.classId));
    const rows = [];
    for (const assignment of assignments.filter(item => classIds.has(item.classId))) {
      const [cls, sessions] = await Promise.all([
        db.classes.get(assignment.classId),
        db.class_sessions.where('assignmentId').equals(assignment.$id).toArray(),
      ]);
      for (const session of sessions) rows.push({ session, cls });
    }
    return rows.sort((a, b) => {
      if (a.session.status === 'active' && b.session.status !== 'active') return -1;
      if (b.session.status === 'active' && a.session.status !== 'active') return 1;
      return b.session.sessionDate.localeCompare(a.session.sessionDate);
    });
  }, [readingId, user?.$id]);

  if (!reading) {
    return <div className="p-4 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 mb-2">Back</button>
        <h1 className="text-2xl font-bold">{reading.title}</h1>
        <p className="text-sm text-gray-500">Choose the class period for questions and voting.</p>
      </div>

      {sessionRows && sessionRows.length > 0 ? (
        <div className="space-y-3">
          {sessionRows.map(({ session, cls }) => (
            <Link key={session.$id} to={`/sessions/${session.$id}`}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{session.title}</h2>
                    <p className="text-sm text-gray-500">{cls?.name || 'Class'} | {session.sessionDate}</p>
                  </div>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{session.status}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{session.votesPerStudent} votes each</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <h2 className="font-semibold mb-2">No linked class period</h2>
          <p className="text-sm text-gray-500 mb-4">
            Questions now live inside a class period. Ask the teacher to start a period for this reading.
          </p>
          <Link to="/classes">
            <Button variant="secondary">Open classes</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
