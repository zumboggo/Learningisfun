import { useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');

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

  const visibleClasses = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return classes || [];
    return (classes || []).filter(cls => `${cls.courseName} ${cls.name} ${cls.schoolYear}`.toLocaleLowerCase().includes(normalized));
  }, [classes, query]);

  const courseGroups = useMemo(() => {
    const groups = new Map<string, Class[]>();
    for (const cls of visibleClasses) {
      const group = groups.get(cls.courseName) || [];
      group.push(cls);
      groups.set(cls.courseName, group);
    }
    return [...groups.entries()];
  }, [visibleClasses]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-start justify-between gap-4 sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Classes</h1>
          <p className="mt-1 text-sm text-gray-500">{isTeacher ? 'Your home for this week’s teaching and class tools.' : 'Choose a class to see what is happening this week.'}</p>
        </div>
        {isTeacher && (
          <Link to="/classes/new">
            <Button className="shrink-0 rounded-xl bg-gray-950 px-4 py-2.5 text-white hover:bg-gray-800 active:bg-black" size="sm">
              <span aria-hidden="true" className="mr-1 text-lg leading-none">+</span> New<span className="hidden sm:inline"> class</span>
            </Button>
          </Link>
        )}
      </div>

      {classes && classes.length > 5 && (
        <label className="mb-4 block">
          <span className="sr-only">Find a class</span>
          <div className="relative">
            <SearchIcon />
            <input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Find a class…" className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-200" />
          </div>
        </label>
      )}

      {classes && <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{visibleClasses.length} {visibleClasses.length === 1 ? 'class' : 'classes'}</p>}

      {classes && classes.length > 0 && visibleClasses.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {courseGroups.map(([courseName, groupedClasses]) => (
            <section key={courseName} className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h2 className="min-w-0 truncate text-base font-bold tracking-tight text-gray-950 sm:text-lg">{courseName}</h2>
                {groupedClasses.length > 1 && <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">{groupedClasses.length} sections</span>}
              </div>
              <div className="divide-y divide-gray-200">
                {groupedClasses.map(cls => (
                  <div key={cls.$id} className="group flex min-h-16 items-center gap-2 px-3 py-2 transition hover:bg-gray-50 sm:px-4">
                    <Link className="min-w-0 flex-1 rounded-lg px-1 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950" to={`/classes/${cls.$id}`}>
                      <h3 className="truncate font-semibold text-gray-950">{cls.name}</h3>
                      <p className="truncate text-xs text-gray-500">{cls.schoolYear}</p>
                    </Link>
                    {isTeacher && <button type="button" onClick={() => setEditing(cls)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950" aria-label={`Edit ${cls.courseName}, ${cls.name}`}><EditIcon /></button>}
                    <Link to={`/classes/${cls.$id}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-950 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950" aria-label={`Open ${cls.courseName}, ${cls.name}`}><ArrowIcon /></Link>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="text-gray-500">
            {classes?.length ? 'No classes match that search.' : isTeacher ? 'No classes yet. Create one!' : 'No classes joined yet'}
          </p>
          {classes?.length ? <button type="button" onClick={() => setQuery('')} className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800">Clear search</button> : !isTeacher && <Link to="/dashboard" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800">Join a class</Link>}
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

function SearchIcon() {
  return <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
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
