import { useState } from 'react';
import { db } from '@/db/schema';
import { syncClassRosterFromServer } from '@/services/class.service';

export interface StudentPickerRoster {
  classId: string;
  students?: { id: string; name: string }[];
}

export function StudentPicker({ classId, students }: StudentPickerRoster) {
  const storageKey = `discussion-student-picker:${classId}`;
  const [drawn, setDrawn] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
    } catch { return []; }
  });
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadedStudents, setLoadedStudents] = useState(students);
  const pick = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      let roster = students ?? loadedStudents;
      if (!roster) {
        await syncClassRosterFromServer(classId);
        const members = await db.class_members.where('classId').equals(classId).filter(member => member.role === 'student').toArray();
        const profiles = await db.users.bulkGet([...new Set(members.map(member => member.userId))]);
        roster = profiles.flatMap(profile => profile ? [{ id: profile.$id, name: profile.name }] : []);
        if (roster.length) setLoadedStudents(roster);
      }
      roster = [...new Map(roster.filter(student => student.name.trim()).map(student => [student.id, student])).values()];
      if (!roster.length) {
        setError('No students in this class roster.');
        return;
      }
      const remaining = roster.filter(student => !drawn.includes(student.id));
      const pool = remaining.length ? remaining : roster;
      const student = pool[Math.floor(Math.random() * pool.length)];
      const nextDrawn = [...(remaining.length ? drawn : []), student.id];
      setDrawn(nextDrawn);
      setSelected(student.name);
      try { sessionStorage.setItem(storageKey, JSON.stringify(nextDrawn)); } catch { /* Keep the current round in memory if storage is unavailable. */ }
    } catch {
      setError('Could not load the class roster. Try again.');
    } finally { setBusy(false); }
  };
  return <div className="question-student-picker">
    <div className="question-student-picker-row">
      <button type="button" disabled={busy} onClick={() => void pick()}>{busy ? 'Loading…' : 'Pick Student'}</button>
      <span className="question-student-name" role="status" aria-label="Selected student">{selected}</span>
    </div>
    {error && <p role="alert">{error}</p>}
  </div>;
}
