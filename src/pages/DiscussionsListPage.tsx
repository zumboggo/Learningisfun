import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { ClassSession } from '@/types';

interface DiscussionSessionRow {
  session: ClassSession;
  className: string;
  questionCount: number;
}

export function DiscussionsListPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const rows = useLiveQuery(async (): Promise<DiscussionSessionRow[]> => {
    if (!user) return [];

    let classMap = new Map<string, string>();
    let sessionClassIds: string[];

    if (isTeacher) {
      const classes = await db.classes.where('teacherId').equals(user.$id).toArray();
      for (const cls of classes) classMap.set(cls.$id, cls.name);
      sessionClassIds = classes.map(c => c.$id);
    } else {
      const memberships = await db.class_members.where('userId').equals(user.$id).toArray();
      const classIds = memberships.map(m => m.classId);
      if (classIds.length === 0) return [];
      const classes = await db.classes.where('$id').anyOf(classIds).toArray();
      for (const cls of classes) classMap.set(cls.$id, cls.name);
      sessionClassIds = classIds;
    }

    if (sessionClassIds.length === 0) return [];

    let sessions: ClassSession[];
    if (isTeacher) {
      sessions = await db.class_sessions.where('classId').anyOf(sessionClassIds).toArray();
    } else {
      sessions = await db.class_sessions
        .where('classId')
        .anyOf(sessionClassIds)
        .and(s => s.status === 'active' || s.status === 'published')
        .toArray();
    }

    sessions.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

    const sessionIds = sessions.map(s => s.$id);
    let questionCountBySession = new Map<string, number>();

    if (sessionIds.length > 0) {
      const allQuestions = await db.discussion_questions
        .where('classSessionId')
        .anyOf(sessionIds)
        .toArray();
      for (const q of allQuestions) {
        questionCountBySession.set(q.classSessionId, (questionCountBySession.get(q.classSessionId) || 0) + 1);
      }
    }

    return sessions.map(session => ({
      session,
      className: classMap.get(session.classId) || 'Unknown class',
      questionCount: questionCountBySession.get(session.$id) || 0,
    }));
  }, [user?.$id, isTeacher]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Discussions</h1>
        {isTeacher && (
          <Link to="/classes">
            <Button size="sm">Start discussion</Button>
          </Link>
        )}
      </div>

      {rows && rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map(row => (
            <Link key={row.session.$id} to={`/discussions/${row.session.$id}`}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{row.session.title}</h3>
                    <p className="text-sm text-gray-500">
                      {row.className} &middot; {row.session.sessionDate}
                    </p>
                    <p className="text-sm text-gray-500">
                      {row.questionCount} question{row.questionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <StatusBadge status={row.session.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No discussions yet"
          message={isTeacher ? 'Start a class period from one of your classes to begin a discussion.' : "Your teacher hasn't started any discussions yet."}
          action={isTeacher ? (
            <Link to="/classes">
              <Button size="sm">Go to classes</Button>
            </Link>
          ) : undefined}
        />
      )}
    </div>
  );
}
