import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { updateClassDetails } from '@/services/class.service';
import type { Class } from '@/types';

export function ClassesListPage() {
  const { user, isTeacher } = useAuth();
  const [editing, setEditing] = useState<Class | null>(null);

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
              <Card key={cls.$id}>
                <div className="flex items-start justify-between gap-3">
                <Link className="min-w-0 flex-1" to={`/classes/${cls.$id}`}>
                <h3 className="font-medium">{cls.courseName}</h3>
                <p className="text-sm text-gray-500">{cls.name} · {cls.schoolYear}</p>
                {isTeacher && (
                  <div className="mt-1 text-xs text-gray-400">
                    Code: <span className="font-mono bg-gray-100 px-1 rounded">{cls.joinCode}</span>
                  </div>
                )}
                </Link>
                {isTeacher && <Button size="sm" variant="secondary" onClick={() => setEditing(cls)}>Edit</Button>}
                </div>
              </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="text-gray-400">
            {isTeacher ? 'No classes yet. Create one!' : 'No classes joined yet'}
          </p>
        </Card>
      )}
      {editing && <EditClassModal cls={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditClassModal({ cls, onClose }: { cls: Class; onClose: () => void }) {
  const [courseName, setCourseName] = useState(cls.courseName);
  const [name, setName] = useState(cls.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (!courseName.trim() || !name.trim()) return;
    setSaving(true); setError('');
    try { await updateClassDetails(cls.$id, courseName.trim(), name.trim()); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update class'); }
    finally { setSaving(false); }
  };
  return <Modal open onClose={onClose} title="Edit class"><div className="space-y-4">{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium">Course name<input className="mt-1 w-full rounded-lg border px-3 py-2" value={courseName} onChange={event => setCourseName(event.target.value)} /></label><label className="block text-sm font-medium">Section<input className="mt-1 w-full rounded-lg border px-3 py-2" value={name} onChange={event => setName(event.target.value)} /></label><Button className="w-full" loading={saving} disabled={!courseName.trim() || !name.trim()} onClick={() => void save()}>Save changes</Button></div></Modal>;
}
