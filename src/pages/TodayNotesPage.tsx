import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { getOrCreateTodayNotes, saveTodayNotes } from '@/services/class-session.service';

const MIN_FONT = 16;
const MAX_FONT = 38;
const DEFAULT_FONT = 24;

export function TodayNotesPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [className, setClassName] = useState('');
  const [notes, setNotes] = useState('');
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!classId || !user || initialized.current) return;
    initialized.current = true;
    void Promise.all([db.classes.get(classId), getOrCreateTodayNotes(classId, user.$id)]).then(([cls, session]) => {
      setClassName(cls?.name || cls?.courseName || 'Class');
      setSessionId(session.$id);
      setNotes(session.notesMarkdown || session.publishedNotesMarkdown || '');
    });
  }, [classId, user]);

  const save = async () => {
    if (!sessionId || !user) return;
    setSaving(true);
    try {
      await saveTodayNotes(sessionId, user.$id, notes);
      setSavedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-5 sm:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:min-h-[calc(100vh-4rem)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-8">
          <div>
            <Link to={`/classes/${classId}`} className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">← Back to class</Link>
            <h1 className="text-xl font-semibold text-slate-900">Today&apos;s Notes</h1>
            <p className="text-sm text-slate-500">{className} · {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Make font smaller" className="h-10 rounded-lg border px-4 text-lg font-semibold hover:bg-slate-50 disabled:opacity-40" disabled={fontSize <= MIN_FONT} onClick={() => setFontSize(size => Math.max(MIN_FONT, size - 2))}>A−</button>
            <button aria-label="Make font bigger" className="h-10 rounded-lg border px-4 text-xl font-semibold hover:bg-slate-50 disabled:opacity-40" disabled={fontSize >= MAX_FONT} onClick={() => setFontSize(size => Math.min(MAX_FONT, size + 2))}>A+</button>
            <button className="h-10 rounded-lg bg-blue-600 px-5 font-medium text-white hover:bg-blue-700 disabled:opacity-50" disabled={!sessionId || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </header>
        <textarea
          autoFocus
          aria-label="Today's class notes"
          className="min-h-0 flex-1 resize-none border-0 px-6 py-6 text-slate-900 outline-none sm:px-10 sm:py-8"
          style={{ fontSize, lineHeight: 1.5 }}
          value={notes}
          onChange={event => { setNotes(event.target.value); setSavedAt(null); }}
          placeholder="Write today's notes…"
        />
        <footer className="h-8 px-6 text-right text-xs text-slate-400 sm:px-10">{savedAt ? `Saved at ${savedAt}` : ''}</footer>
      </div>
    </main>
  );
}
