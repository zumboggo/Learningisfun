import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import {
  getReading,
  updateReadingProgress,
  getReadingProgress,
} from '@/services/reading.service';
import {
  createAnnotation,
  getReadingAnnotations,
  deleteAnnotation,
  updateAnnotation,
} from '@/services/annotation.service';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import type { Annotation, AnnotationType } from '@/types';

export function ReadingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const reading = useLiveQuery(() => (id ? db.readings.get(id) : undefined), [id]);
  const annotations = useLiveQuery(
    () => (id && user ? getReadingAnnotations(id, user.$id) : []),
    [id, user?.$id],
  );

  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{
    startOffset: number;
    endOffset: number;
    textBefore: string;
    textAfter: string;
    blockId: string;
  } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<AnnotationType>('private_note');
  const [showSettings, setShowSettings] = useState(false);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current || !reading) {
      setShowToolbar(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2) {
      setShowToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = contentRef.current.getBoundingClientRect();

    setSelectedText(text);
    setSelectionRange({
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      textBefore: '',
      textAfter: '',
      blockId: '',
    });

    setToolbarPos({
      top: rect.top - containerRect.top - 50,
      left: Math.min(Math.max(rect.left - containerRect.left + rect.width / 2 - 100, 10), containerRect.width - 210),
    });
    setShowToolbar(true);
  }, [reading]);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [handleTextSelection]);

  useEffect(() => {
    if (!user || !id) return;
    const loadProgress = async () => {
      const progress = await getReadingProgress(user.$id, id);
      if (progress && contentRef.current) {
        contentRef.current.scrollTop = progress.lastPosition;
      }
    };
    void loadProgress();
  }, [user, id]);

  const saveProgress = useCallback(() => {
    if (!user || !id || !contentRef.current) return;
    const el = contentRef.current;
    const scrollPercent = el.scrollHeight > 0
      ? Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
      : 0;
    void updateReadingProgress(user.$id, id, scrollPercent, el.scrollTop, false);
  }, [user, id]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener('scroll', saveProgress);
    return () => el.removeEventListener('scroll', saveProgress);
  }, [saveProgress]);

  const handleHighlight = async (color: string = '#facc15') => {
    if (!user || !id || !selectedText || !selectionRange) return;
    await createAnnotation(
      user.$id, id, 'highlight', selectedText,
      selectionRange.textBefore, selectionRange.textAfter,
      selectionRange.startOffset, selectionRange.endOffset,
      selectionRange.blockId, color,
    );
    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleNote = (type: AnnotationType) => {
    setNoteType(type);
    setNoteText('');
    setShowNoteModal(true);
    setShowToolbar(false);
  };

  const saveNote = async () => {
    if (!user || !id || !selectedText || !selectionRange) return;
    await createAnnotation(
      user.$id, id, noteType, selectedText,
      selectionRange.textBefore, selectionRange.textAfter,
      selectionRange.startOffset, selectionRange.endOffset,
      selectionRange.blockId, '#facc15', noteText,
    );
    setShowNoteModal(false);
    window.getSelection()?.removeAllRanges();
  };

  const goToQuestion = () => {
    if (!id) return;
    setShowToolbar(false);
    navigate(`/readings/${id}/questions`);
  };

  if (!reading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading reading…</div>
      </div>
    );
  }

  const highlightAnnotations = annotations?.filter(a => a.type === 'highlight') || [];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="sticky top-14 z-20 bg-inherit border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 p-1">
            ← Back
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500 p-1">⚙️</button>
          <button onClick={() => navigate(`/readings/${id}/questions`)} className="text-gray-500 p-1">❓</button>
        </div>
      </div>

      {showSettings && (
        <div className={`px-4 py-3 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-sm w-20">Font size</label>
              <input
                type="range"
                min={14}
                max={28}
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-8">{fontSize}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm w-20">Spacing</label>
              <input
                type="range"
                min={1.2}
                max={2.5}
                step={0.1}
                value={lineHeight}
                onChange={e => setLineHeight(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-8">{lineHeight.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm w-20">Dark mode</label>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{reading.title}</h1>
          {reading.author && <p className="text-gray-500">{reading.author}</p>}
          {reading.description && <p className="text-sm text-gray-400 mt-1">{reading.description}</p>}
        </div>

        <div
          ref={contentRef}
          className="relative"
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          {showToolbar && (
            <div
              className="absolute z-30 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center gap-1 p-1.5"
              style={{ top: toolbarPos.top, left: toolbarPos.left }}
            >
              <button onClick={() => void handleHighlight('#facc15')} className="p-2 hover:bg-gray-100 rounded-lg" title="Highlight yellow">🟡</button>
              <button onClick={() => void handleHighlight('#86efac')} className="p-2 hover:bg-gray-100 rounded-lg" title="Highlight green">🟢</button>
              <button onClick={() => void handleHighlight('#93c5fd')} className="p-2 hover:bg-gray-100 rounded-lg" title="Highlight blue">🔵</button>
              <div className="w-px h-6 bg-gray-200" />
              <button onClick={() => handleNote('private_note')} className="p-2 hover:bg-gray-100 rounded-lg" title="Private note">📝</button>
              <button onClick={() => handleNote('teacher_visible_note')} className="p-2 hover:bg-gray-100 rounded-lg" title="Teacher note">📤</button>
              <div className="w-px h-6 bg-gray-200" />
              <button onClick={goToQuestion} className="p-2 hover:bg-gray-100 rounded-lg" title="Ask question">❓</button>
            </div>
          )}

          <div className="whitespace-pre-wrap leading-relaxed">
            {reading.content}
          </div>
        </div>

        {highlightAnnotations.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Your highlights</h3>
            <div className="space-y-2">
              {highlightAnnotations.map(a => (
                <div key={a.$id} className="flex items-start gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: a.color }} />
                  <span className="text-gray-600 flex-1">"{a.selectedText}"</span>
                  <button
                    onClick={() => void deleteAnnotation(a.$id, user!.$id)}
                    className="text-gray-400 hover:text-red-500"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} title={noteType === 'private_note' ? 'Private Note' : 'Note for Teacher'}>
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            "{selectedText}"
          </div>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Write your note…"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
          />
          <Button onClick={() => void saveNote()} className="w-full">
            Save note
          </Button>
        </div>
      </Modal>
    </div>
  );
}
