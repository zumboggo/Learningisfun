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
    let result: Class[];
    if (isTeacher) {
      result = await db.classes.where('teacherId').equals(user.$id).toArray();
    } else {
      const memberships = await db.class_members.where('userId').equals(user.$id).toArray();
      const classIds = memberships.map(m => m.classId);
      if (classIds.length === 0) return [];
      result = await db.classes.where('$id').anyOf(classIds).toArray();
    }
    return result.sort((a, b) => a.courseName.localeCompare(b.courseName, undefined, { sensitivity: 'base' }) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [user?.$id, isTeacher]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8 sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Classes</h1>
          {isTeacher && <p className="mt-1 text-sm text-gray-500">Open a class to manage its students and learning materials.</p>}
          {classes && <p className="mt-2 text-sm font-medium text-gray-700">{classes.length} {classes.length === 1 ? 'class' : 'classes'}</p>}
        </div>
        {isTeacher && (
          <Link to="/classes/new">
            <Button className="shrink-0 rounded-xl bg-gray-950 px-4 py-2.5 text-white hover:bg-gray-800 active:bg-black" size="sm">
              <span aria-hidden="true" className="mr-1 text-lg leading-none">+</span> New<span className="hidden sm:inline"> class</span>
            </Button>
          </Link>
        )}
      </div>

      {classes && classes.length > 0 ? (
        <div className={isTeacher ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'}>
          {classes.map(cls => (
              <Card key={cls.$id} padding={isTeacher ? 'none' : 'md'} className={isTeacher ? 'group overflow-hidden rounded-2xl border-gray-300 shadow-none transition hover:border-gray-500 hover:shadow-sm' : ''}>
                {isTeacher ? (
                  <div className="flex min-h-32 flex-col p-4 sm:p-5">
                    <Link className="min-w-0 flex-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-4" to={`/classes/${cls.$id}`}>
                      <h2 className="truncate text-lg font-bold tracking-tight text-gray-950 sm:text-xl">{cls.courseName}</h2>
                      <p className="mt-0.5 truncate text-sm text-gray-600">{cls.name} <span aria-hidden="true">·</span> {cls.schoolYear}</p>
                    </Link>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-3">
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600">Code: <strong className="ml-1 font-mono text-gray-950">{cls.joinCode}</strong></span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setEditing(cls)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950" aria-label={`Edit ${cls.courseName}, ${cls.name}`}>
                          <EditIcon /> <span>Edit</span>
                        </button>
                        <Link to={`/classes/${cls.$id}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-950 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950" aria-label={`Open ${cls.courseName}, ${cls.name}`}>
                          <ArrowIcon />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link className="block min-w-0" to={`/classes/${cls.$id}`}>
                    <h3 className="font-medium">{cls.courseName}</h3>
                    <p className="text-sm text-gray-500">{cls.name} · {cls.schoolYear}</p>
                  </Link>
                )}
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

function EditIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" className="h-5 w-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
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
