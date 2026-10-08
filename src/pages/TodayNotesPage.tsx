import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { getOrCreateTodayNotes, saveTodayNotes } from '@/services/class-session.service';
import { clipboardToMarkdown, htmlToMarkdown, markdownToEditorHtml } from '@/utils/rich-text';

const MIN_FONT = 16;
const MAX_FONT = 38;
const DEFAULT_FONT = 24;

export function TodayNotesPage() {
  const { classId, sessionId } = useParams();
  const { user } = useAuth();
  return <NotesEditor key={`${user?.$id}:${classId}:${sessionId || 'today'}`} />;
}

function NotesEditor() {
  const { classId, sessionId: historicalSessionId } = useParams<{ classId: string; sessionId?: string }>();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [className, setClassName] = useState('');
  const [notes, setNotes] = useState('');
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [noteDate, setNoteDate] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const current = useRef('');
  const saved = useRef('');
  const inFlight = useRef(false);
  const recoveryKey = useRef('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!classId || !user) return;
    let cancelled = false;
    const sessionPromise = historicalSessionId ? db.class_sessions.get(historicalSessionId) : getOrCreateTodayNotes(classId, user.$id);
    void Promise.all([db.classes.get(classId), sessionPromise]).then(([cls, session]) => {
      if (cancelled) return;
      if (!session || session.classId !== classId || session.discussionType !== 'notes') {
        setLoadError('These class notes could not be found.');
        return;
      }
      setClassName(cls?.name || cls?.courseName || 'Class');
      setSessionId(session.$id);
      setNoteDate(session.sessionDate);
      saved.current = session.notesMarkdown || session.publishedNotesMarkdown || '';
      recoveryKey.current = `today-notes:${user.$id}:${session.$id}`;
      let content = saved.current;
      try { content = localStorage.getItem(recoveryKey.current) ?? content; }
      catch { setSaveError('Local recovery is unavailable. Use Save before closing.'); }
      current.current = content;
      setNotes(content);
      if (editorRef.current) editorRef.current.innerHTML = markdownToEditorHtml(content);
    }).catch(() => { if (!cancelled) setLoadError('These class notes could not be loaded. Please try again.'); });
    return () => { cancelled = true; };
  }, [classId, historicalSessionId, user]);

  const save = async () => {
    if (!sessionId || !user || inFlight.current || current.current === saved.current) return;
    const currentNotes = editorRef.current ? htmlToMarkdown(editorRef.current.innerHTML) : notes;
    setNotes(currentNotes);
    inFlight.current = true;
    setSaving(true);
    try {
      await saveTodayNotes(sessionId, user.$id, currentNotes);
      saved.current = currentNotes;
      setSaveError('');
      if (current.current === currentNotes) {
        try { localStorage.removeItem(recoveryKey.current); } catch { /* Saved to IndexedDB. */ }
      }
      setSavedAt(current.current === currentNotes ? new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null);
    } catch {
      setSaveError('Could not save yet. Your writing is kept on this device; saving will retry.');
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    const timer = window.setInterval(() => void saveRef.current(), 30000);
    const flush = () => { if (document.visibilityState === 'hidden') void saveRef.current(); };
    document.addEventListener('visibilitychange', flush);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', flush); void saveRef.current(); };
  }, []);

  const updateNotes = () => {
    if (!editorRef.current) return;
    const content = htmlToMarkdown(editorRef.current.innerHTML);
    current.current = content;
    setNotes(content);
    try { if (recoveryKey.current) localStorage.setItem(recoveryKey.current, content); }
    catch { setSaveError('Local recovery is unavailable. Use Save before closing.'); }
    setSavedAt(null);
  };

  const formatSelection = (command: 'bold' | 'italic') => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    updateNotes();
  };

  const pasteFormatted = (event: ReactClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const markdown = clipboardToMarkdown(event.clipboardData.getData('text/html'), event.clipboardData.getData('text/plain'));
    document.execCommand('insertHTML', false, markdownToEditorHtml(markdown));
    updateNotes();
  };

  return (
    <main className="min-h-screen bg-slate-100 p-5 sm:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:min-h-[calc(100vh-4rem)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-8">
          <div>
            <Link to={`/classes/${classId}`} className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">← Back to class</Link>
            <h1 className="text-xl font-semibold text-slate-900">{historicalSessionId ? 'Edit Class Notes' : 'Today\'s Notes'}</h1>
            <p className="text-sm text-slate-500">{className} · {noteDate ? new Date(`${noteDate}T12:00:00`).toLocaleDateString() : new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Make font smaller" className="h-10 rounded-lg border px-4 text-lg font-semibold hover:bg-slate-50 disabled:opacity-40" disabled={fontSize <= MIN_FONT} onClick={() => setFontSize(size => Math.max(MIN_FONT, size - 2))}>A−</button>
            <button aria-label="Make font bigger" className="h-10 rounded-lg border px-4 text-xl font-semibold hover:bg-slate-50 disabled:opacity-40" disabled={fontSize >= MAX_FONT} onClick={() => setFontSize(size => Math.min(MAX_FONT, size + 2))}>A+</button>
            <button type="button" aria-label="Bold selected text" title="Bold" className="h-10 min-w-10 rounded-lg border px-3 font-bold hover:bg-slate-50" onMouseDown={event=>event.preventDefault()} onClick={()=>formatSelection('bold')}>B</button>
            <button type="button" aria-label="Italicize selected text" title="Italic" className="h-10 min-w-10 rounded-lg border px-3 font-serif text-lg italic hover:bg-slate-50" onMouseDown={event=>event.preventDefault()} onClick={()=>formatSelection('italic')}>I</button>
            <button className="h-10 rounded-lg bg-blue-600 px-5 font-medium text-white hover:bg-blue-700 disabled:opacity-50" disabled={!sessionId || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </header>
        {loadError ? <div role="alert" className="m-6 rounded-xl bg-amber-50 p-4 text-amber-900">{loadError}</div> : <div
          ref={editorRef}
          autoFocus
          contentEditable={Boolean(sessionId)}
          suppressContentEditableWarning
          aria-label="Today's class notes"
          className="rich-notes-editor min-h-0 flex-1 overflow-y-auto border-0 px-6 py-6 text-slate-900 outline-none sm:px-10 sm:py-8"
          style={{ fontSize, lineHeight: 1.5 }}
          onInput={updateNotes}
          onPaste={pasteFormatted}
          data-placeholder="Write today's notes… Pasted bold, italics, paragraphs, lists, links, and tables will be preserved."
        />}
        <footer className="h-8 px-6 text-right text-xs text-slate-400 sm:px-10">{saveError || (savedAt ? `Saved on this device at ${savedAt} · sync queued` : 'Changes saved automatically every 30 seconds')}</footer>
      </div>
    </main>
  );
}
