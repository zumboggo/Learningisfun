import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export function ClassesListPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const classes = useLiveQuery(async () => {
    if (!user) return [];
    if (isTeacher) {
      return db.classes.where('teacherId').equals(user.$id).toArray();
    }
    const memberships = await db.class_members.where('userId').equals(user.$id).toArray();
    const classIds = memberships.map(m => m.classId);
    if (classIds.length === 0) return [];
    return db.classes.where('$id').anyOf(classIds).toArray();
  }, [user?.$id, isTeacher]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Classes</h1>
        {isTeacher && (
          <Link to="/classes/new">
            <Button size="sm">New class</Button>
          </Link>
        )}
      </div>

      {classes && classes.length > 0 ? (
        <div className="space-y-3">
          {classes.map(cls => (
            <Link key={cls.$id} to={`/classes/${cls.$id}`}>
              <Card>
                <h3 className="font-medium">{cls.name}</h3>
                <p className="text-sm text-gray-500">{cls.courseName} · {cls.schoolYear}</p>
                {isTeacher && (
                  <div className="mt-1 text-xs text-gray-400">
                    Code: <span className="font-mono bg-gray-100 px-1 rounded">{cls.joinCode}</span>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="text-gray-400">
            {isTeacher ? 'No classes yet. Create one!' : 'No classes joined yet'}
          </p>
        </Card>
      )}
    </div>
  );
}
