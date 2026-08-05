import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { Reading, ReadingAssignment, Class } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';

interface ReadingWithClasses {
  reading: Reading;
  classes: Class[];
}

export function TextsListPage() {
  const { user, isTeacher } = useAuth();

  const teacherData = useLiveQuery(async (): Promise<ReadingWithClasses[]> => {
    if (!user || !isTeacher) return [];
    const readings = await db.readings
      .where('teacherId')
      .equals(user.$id)
      .toArray();
    const sorted = readings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const result: ReadingWithClasses[] = [];
    for (const reading of sorted) {
      const assignments = await db.reading_assignments
        .where('readingId')
        .equals(reading.$id)
        .toArray();
      const classIds = [...new Set(assignments.map((a) => a.classId))];
      const classes =
        classIds.length > 0
          ? await db.classes.where('$id').anyOf(classIds).toArray()
          : [];
      result.push({ reading, classes });
    }
    return result;
  }, [user?.$id, isTeacher]);

  const studentData = useLiveQuery(async (): Promise<ReadingWithClasses[]> => {
    if (!user || isTeacher) return [];
    const memberships = await db.class_members
      .where('userId')
      .equals(user.$id)
      .toArray();
    const classIds = memberships.map((m) => m.classId);
    if (classIds.length === 0) return [];

    const assignments = await db.reading_assignments
      .where('classId')
      .anyOf(classIds)
      .toArray();

    const readingIds = [...new Set(assignments.map((a) => a.readingId))];
    if (readingIds.length === 0) return [];

    const readings = await db.readings
      .where('$id')
      .anyOf(readingIds)
      .toArray();

    const result: ReadingWithClasses[] = [];
    for (const reading of readings) {
      const readingAssignmentClassIds = [
        ...new Set(
          assignments
            .filter((a) => a.readingId === reading.$id)
            .map((a) => a.classId)
        ),
      ];
      const classes =
        readingAssignmentClassIds.length > 0
          ? await db.classes
              .where('$id')
              .anyOf(readingAssignmentClassIds)
              .toArray()
          : [];
      result.push({ reading, classes });
    }

    result.sort(
      (a, b) =>
        new Date(b.reading.createdAt).getTime() -
        new Date(a.reading.createdAt).getTime()
    );
    return result;
  }, [user?.$id, isTeacher]);

  const data = isTeacher ? teacherData : studentData;

  const groupedByClass = useMemo(() => {
    if (!data) return null;
    const map = new Map<string, { classItem: Class; readings: Reading[] }>();
    for (const item of data) {
      if (item.classes.length === 0) {
        const unassignedKey = '__unassigned__';
        if (!map.has(unassignedKey)) {
          map.set(unassignedKey, {
            classItem: {
              $id: '',
              name: 'Unassigned',
              courseName: '',
              schoolYear: '',
              teacherId: '',
              joinCode: '',
              joinCodeActive: false,
              status: 'active',
              createdAt: '',
            },
            readings: [],
          });
        }
        map.get(unassignedKey)!.readings.push(item.reading);
      } else {
        for (const c of item.classes) {
          if (!map.has(c.$id)) {
            map.set(c.$id, { classItem: c, readings: [] });
          }
          map.get(c.$id)!.readings.push(item.reading);
        }
      }
    }
    return Array.from(map.values());
  }, [data]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Texts</h1>
        {isTeacher && (
          <Link to="/texts/new">
            <Button size="sm">New text</Button>
          </Link>
        )}
      </div>

      {!data ? (
        <Card className="text-center py-8">
          <p className="text-gray-400">Loading...</p>
        </Card>
      ) : data.length === 0 ? (
        <EmptyState
          title="No texts yet"
          message={
            isTeacher
              ? 'Create your first text to share with your classes.'
              : 'No texts have been assigned to your classes yet.'
          }
          action={
            isTeacher ? (
              <Link to="/texts/new">
                <Button size="sm">New text</Button>
              </Link>
            ) : undefined
          }
        />
      ) : isTeacher ? (
        groupedByClass && groupedByClass.length > 0 ? (
          <div className="space-y-8">
            {groupedByClass.map((group) => (
              <section key={group.classItem.$id || '__unassigned__'}>
                <h2 className="text-lg font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
                  {group.classItem.name}
                </h2>
                <div className="space-y-3">
                  {group.readings.map((reading) => (
                    <Link key={reading.$id} to={`/texts/${reading.$id}`}>
                      <Card>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate">
                              {reading.title}
                            </h3>
                            {reading.author && (
                              <p className="text-sm text-gray-500">
                                {reading.author}
                              </p>
                            )}
                            {reading.description && (
                              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                {reading.description}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={reading.status} />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <Link key={item.reading.$id} to={`/texts/${item.reading.$id}`}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">
                      {item.reading.title}
                    </h3>
                    {item.reading.author && (
                      <p className="text-sm text-gray-500">
                        {item.reading.author}
                      </p>
                    )}
                    {item.reading.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {item.reading.description}
                      </p>
                    )}
                    {item.classes.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {item.classes.map((c) => c.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={item.reading.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
