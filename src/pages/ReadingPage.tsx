import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import {
  getReadingProgress,
  updateReadingProgress,
} from '@/services/reading.service';
import {
  createAnnotation,
  getReadingAnnotations,
  getTeacherVisibleAnnotations,
  deleteAnnotation,
} from '@/services/annotation.service';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Markdown } from '@/components/common/Markdown';
import type { Annotation, AnnotationType } from '@/types';

export function ReadingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const reading = useLiveQuery(() => (id ? db.readings.get(id) : undefined), [id]);
  const myAnnotations = useLiveQuery(
    () => (id && user ? getReadingAnnotations(id, user.$id) : []),
    [id, user?.$id],
  );
  const allComments = useLiveQuery(
    () => (id ? getTeacherVisibleAnnotations(id) : []),
    [id],
  );

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const classSettings = useLiveQuery(async () => {
    if (!id || !isTeacher) return null;
    const assignments = await db.reading_assignments.where('readingId').equals(id).toArray();
    if (assignments.length === 0) return null;
    const settings = await db.teacher_settings.where('classId').equals(assignments[0].classId).first();
    return { ...settings, classId: assignments[0].classId };
  }, [id, isTeacher]);

  const myCommentCount = useMemo(() => {
    return (myAnnotations?.filter(a => a.type === 'teacher_visible_note' && a.noteText).length || 0);
  }, [myAnnotations]);

  const threshold = classSettings?.commentThreshold ?? 5;

  const visibleComments = useMemo(() => {
    if (!allComments) return [];
    if (isTeacher) return allComments;
    if (myCommentCount < threshold) {
      return allComments.filter(c => c.userId === user?.$id);
    }
    return allComments;
  }, [allComments, isTeacher, myCommentCount, threshold, user?.$id]);

  const paragraphs = useMemo(() => {
    if (!reading?.content) return [];
    if (reading.contentFormat === 'markdown') {
      const parts = reading.content.split(/\n\n+/);
      return parts.map((p, i) => ({ index: i, text: p.trim(), start: reading.content.indexOf(p) }));
    }
    const parts = reading.content.split(/\n\n+/);
    return parts.map((p, i) => ({ index: i, text: p.trim(), start: reading.content.indexOf(p) }));
  }, [reading?.content, reading?.contentFormat]);

  const commentsByParagraph = useMemo(() => {
    const map: Record<number, { annotation: Annotation; authorName: string }[]> = {};
    for (const comment of visibleComments) {
      let paraIdx = 0;
      for (let i = paragraphs.length - 1; i >= 0; i--) {
        if (comment.startOffset >= paragraphs[i].start) {
          paraIdx = i;
          break;
        }
      }
      if (!map[paraIdx]) map[paraIdx] = [];
      map[paraIdx].push({ annotation: comment, authorName: '' });
    }
    return map;
  }, [visibleComments, paragraphs]);

  const authorNames = useLiveQuery(async () => {
    if (!allComments || allComments.length === 0) return {} as Record<string, string>;
    const userIds = [...new Set(allComments.map(c => c.userId))];
    const names: Record<string, string> = {};
    for (const uid of userIds) {
      const u = await db.users.get(uid);
      names[uid] = u?.name || 'Student';
    }
    return names;
  }, [allComments]);

  const sessionLink = useLiveQuery(async () => {
    if (!id || !user) return '';
    const [assignments, memberships] = await Promise.all([
      db.reading_assignments.where('readingId').equals(id).toArray(),
      db.class_members.where('userId').equals(user.$id).toArray(),
    ]);
    const classIds = new Set(memberships.map(member => member.classId));
    const sessions = [];
    for (const assignment of assignments.filter(item => classIds.has(item.classId))) {
      const linked = await db.class_sessions.where('assignmentId').equals(assignment.$id).toArray();
      sessions.push(...linked);
    }
    const best = sessions.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return b.sessionDate.localeCompare(a.sessionDate);
    })[0];
    return best ? `/sessions/${best.$id}` : '';
  }, [id, user?.$id]);

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
  const [expandedComment, setExpandedComment] = useState<number | null>(null);

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

    const fullContent = reading.content;
    const selectedIdx = fullContent.indexOf(text);
    const offset = selectedIdx >= 0 ? selectedIdx : range.startOffset;

    setSelectedText(text);
    setSelectionRange({
      startOffset: offset,
      endOffset: offset + text.length,
      textBefore: fullContent.substring(Math.max(0, offset - 40), offset),
      textAfter: fullContent.substring(offset + text.length, offset + text.length + 40),
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
    const effectiveType = noteType === 'teacher_visible_note' ? 'teacher_visible_note' : 'private_note';
    await createAnnotation(
      user.$id, id, effectiveType, selectedText,
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
    navigate(sessionLink || `/discussions`);
  };

  if (!reading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading reading...</div>
      </div>
    );
  }

  const highlightAnnotations = myAnnotations?.filter(a => a.type === 'highlight') || [];
  const publicAnnotations = myAnnotations?.filter(a => a.type === 'teacher_visible_note' && a.noteText) || [];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <div className="sticky top-14 z-20 bg-inherit border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 p-1">
            &larr; Back
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!isTeacher && (
            <span className="text-xs text-gray-400">
              {myCommentCount}/{threshold} comments to unlock
            </span>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500 p-1">{'\u2699\uFE0F'}</button>
          <button onClick={goToQuestion} className="text-gray-500 p-1">?</button>
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
              <button onClick={() => void handleHighlight('#facc15')} className="p-2 hover:bg-gray-100 rounded-lg" title="Highlight yellow">{'\uD83D\uDFE1'}</button>
              <button onClick={() => void handleHighlight('#86efac')} className="p-2 hover:bg-gray-100 rounded-lg" title="Highlight green">{'\uD83D\uDFE2'}</button>
              <button onClick={() => void handleHighlight('#93c5fd')} className="p-2 hover:bg-gray-100 rounded-lg" title="Highlight blue">{'\uD83D\uDD35'}</button>
              <div className="w-px h-6 bg-gray-200" />
              <button onClick={() => handleNote('private_note')} className="p-2 hover:bg-gray-100 rounded-lg" title="Private note">{'\uD83D\uDCDD'}</button>
              <button onClick={() => handleNote('teacher_visible_note')} className="p-2 hover:bg-gray-100 rounded-lg" title="Comment">{'\uD83D\uDCAC'}</button>
              <div className="w-px h-6 bg-gray-200" />
              <button onClick={goToQuestion} className="p-2 hover:bg-gray-100 rounded-lg" title="Ask question">{'\u2753'}</button>
            </div>
          )}

          {reading.contentFormat === 'markdown' ? (
            <Markdown content={reading.content} />
          ) : (
            <div className="whitespace-pre-wrap leading-relaxed">
              {paragraphs.map((para) => {
                const paraComments = commentsByParagraph[para.index] || [];
                return (
                  <div key={para.index} className="group relative mb-4">
                    <span className="mr-2 text-xs text-gray-300 select-none">{para.index + 1}.</span>
                    <span>{para.text}</span>
                    {paraComments.length > 0 && (
                      <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium cursor-pointer"
                        onClick={() => setExpandedComment(expandedComment === para.index ? null : para.index)}>
                        {paraComments.length} comment{paraComments.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {expandedComment === para.index && paraComments.length > 0 && (
                      <div className="mt-2 ml-6 p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
                        {paraComments.map(({ annotation }) => (
                          <div key={annotation.$id} className="text-sm">
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-blue-800 text-xs">
                                {authorNames?.[annotation.userId] || (annotation.userId === user?.$id ? 'You' : 'Student')}:
                              </span>
                              <span className="text-gray-700 flex-1">{annotation.noteText}</span>
                              {annotation.userId === user?.$id && (
                                <button
                                  onClick={() => void deleteAnnotation(annotation.$id, user!.$id)}
                                  className="text-gray-400 hover:text-red-500 text-xs"
                                >x</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {highlightAnnotations.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Your highlights</h3>
            <div className="space-y-2">
              {highlightAnnotations.map(a => (
                <div key={a.$id} className="flex items-start gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: a.color }} />
                  <span className="text-gray-600 flex-1">{'"'}{a.selectedText}{'"'}</span>
                  <button
                    onClick={() => void deleteAnnotation(a.$id, user!.$id)}
                    className="text-gray-400 hover:text-red-500"
                  >x</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">
            Comments ({publicAnnotations.length} from you, {allComments ? allComments.length - publicAnnotations.length : 0} from peers)
          </h3>
          {!isTeacher && myCommentCount < threshold && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              Post {threshold - myCommentCount} more comment{threshold - myCommentCount !== 1 ? 's' : ''} to see your classmates' comments.
            </div>
          )}
          {allComments && allComments.length > 0 ? (
            <div className="space-y-3">
              {allComments.map(comment => {
                const isVisible = isTeacher || myCommentCount >= threshold || comment.userId === user?.$id;
                if (!isVisible) return null;
                return (
                  <div key={comment.$id} className={`flex items-start gap-2 text-sm p-2 rounded ${comment.userId === user?.$id ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <span className="font-medium text-xs text-blue-700 mt-0.5">
                      {authorNames?.[comment.userId] || (comment.userId === user?.$id ? 'You' : 'Student')}
                    </span>
                    <span className="text-gray-600 flex-1">{'"'}{comment.selectedText}{'"'}</span>
                    <span className="text-xs italic text-gray-400">{comment.noteText}</span>
                    {comment.userId === user?.$id && (
                      <button
                        onClick={() => void deleteAnnotation(comment.$id, user!.$id)}
                        className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
                      >x</button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Select text and add a comment to start a discussion.</p>
          )}
        </div>
      </div>

      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} title={noteType === 'private_note' ? 'Private Note' : 'Add Comment'}>
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            {'"'}{selectedText}{'"'}
          </div>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder={noteType === 'teacher_visible_note' ? 'Write your comment...' : 'Write your note...'}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
          />
          <Button onClick={() => void saveNote()} className="w-full">
            {noteType === 'teacher_visible_note' ? 'Post comment' : 'Save note'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
