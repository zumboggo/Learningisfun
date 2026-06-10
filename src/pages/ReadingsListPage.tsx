import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export function ReadingsListPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const readings = useLiveQuery(async () => {
    if (!user) return [];
    if (isTeacher) {
      return db.readings.where('teacherId').equals(user.$id).toArray();
    }
    const memberships = await db.class_members.where('userId').equals(user.$id).toArray();
    const classIds = memberships.map(m => m.classId);
    if (classIds.length === 0) return [];
    const assignments = await db.reading_assignments.where('classId').anyOf(classIds).toArray();
    const readingIds = [...new Set(assignments.map(a => a.readingId))];
    if (readingIds.length === 0) return [];
    return db.readings.where('$id').anyOf(readingIds).toArray();
  }, [user?.$id, isTeacher]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Readings</h1>
        {isTeacher && (
          <Link to="/readings/new">
            <Button size="sm">New reading</Button>
          </Link>
        )}
      </div>

      {readings && readings.length > 0 ? (
        <div className="space-y-3">
          {readings.map(reading => (
            <Link key={reading.$id} to={`/readings/${reading.$id}`}>
              <Card>
                <h3 className="font-medium">{reading.title}</h3>
                {reading.author && <p className="text-sm text-gray-500">{reading.author}</p>}
                {reading.description && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{reading.description}</p>
                )}
                {reading.status === 'draft' && (
                  <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Draft</span>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="text-gray-400">
            {isTeacher ? 'No readings yet. Create one!' : 'No readings assigned yet'}
          </p>
        </Card>
      )}
    </div>
  );
}
