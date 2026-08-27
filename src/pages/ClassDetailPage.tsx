import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import {
  regenerateJoinCode,
  ensureParentCode,
  regenerateParentCode,
  removeStudent,
  moveStudent,
  getClassMembers,
  importClassRoster,
  parseClassLinks,
  saveClassLinks,
  MAX_CLASS_LINKS,
  syncClassRosterFromServer,
  type RosterImportResult,
} from '@/services/class.service';
import { createClassSession, todayKey } from '@/services/class-session.service';
import { downloadCsv } from '@/services/report.service';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { CopyButton } from '@/components/common/CopyButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CreateQuizModal } from '@/pages/QuizzesPage';
import { convertQuizScore, createPracticeQuiz, deleteQuiz, getQuizWithQuestions, publishQuiz, readQuizResults, type TeacherQuizResults } from '@/services/quiz.service';
import { buildQtiAssessmentXml, buildQtiZip, downloadBlob } from '@/services/qti-export';
import { addPresentationLinks, createWritingPrompt, deletePresentationLink, setPresentationWatched, updateWritingPrompt, type WritingPromptSize } from '@/services/presentation.service';
import { AddDecksToClassModal } from '@/components/common/AddDecksToClassModal';
import { unassignDeck } from '@/services/flashcard.service';
import { createText, setTextAssignmentDueDate, setTextClasses, splitParagraphs } from '@/services/text.service';
import { RandomStudentModal } from '@/components/teacher/RandomStudentModal';
import { CreateGroupsModal } from '@/components/teacher/CreateGroupsModal';
import type { Class, ClassLink, ClassSession, LearningText, PresentationLink, Quiz, TextAssignment } from '@/types';
import { classLabel } from '@/utils/helpers';
import { Markdown } from '@/components/common/Markdown';
import { MarkdownPasteEditor } from '@/components/common/MarkdownPasteEditor';
import { TextEditorModal } from '@/components/texts/TextEditorModal';
import { createPeerReviewActivity, listPeerReviewActivities } from '@/services/presentation-peer-review.service';
import type { PeerReviewActivity } from '@/types';
import { moderateNicknameReport, readClassNicknames, reportNickname, type ClassNickname, type NicknameReport } from '@/services/nickname.service';
import { refreshClassMaterials } from '@/services/class-material-refresh.service';

const PRESENTATION_FOLDER_URL = 'https://lifeplusworldwide-my.sharepoint.com/:f:/g/personal/david_hepting_cdischina_com/IgCKVDp4qOqzR5itb7Q70yDbAb7A95ZN6fG4XHD74ghu3lU?e=1W9www';

type WeeklyMaterial =
  | { kind: 'notes'; date: string; session: ClassSession }
  | { kind: 'discussion'; date: string; session: ClassSession }
  | { kind: 'text'; date: string; text: LearningText; assignment: TextAssignment }
  | { kind: 'quiz'; date: string; quiz: Quiz }
  | { kind: 'presentation'; date: string; presentation: PresentationLink }
  | { kind: 'writingPrompt'; date: string; session: ClassSession };

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { user, isTeacher, isParent } = useAuth();
  const navigate = useNavigate();
  const [newCode, setNewCode] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; name: string } | null>(null);
  const [pendingMove, setPendingMove] = useState<{ id: string; name: string } | null>(null);
  const [moveTargetClassId, setMoveTargetClassId] = useState('');
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState('Class discussion');
  const [discussionFocus, setDiscussionFocus] = useState('');
  const [discussionDate, setDiscussionDate] = useState(todayKey());
  const [votesPerStudent, setVotesPerStudent] = useState(4);
  const [allowStackedVotes, setAllowStackedVotes] = useState(false);
  const [rosterImporting, setRosterImporting] = useState(false);
  const [rosterResult, setRosterResult] = useState<RosterImportResult | null>(null);
  const [showAddDecks, setShowAddDecks] = useState(false);
  const [showAssignTexts, setShowAssignTexts] = useState(false);
  const [pendingDeckRemoval, setPendingDeckRemoval] = useState<{ deckId: string; title: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [copiedQuizId, setCopiedQuizId] = useState('');
  const [generatingPracticeQuiz, setGeneratingPracticeQuiz] = useState(false);
  const [practiceQuizError, setPracticeQuizError] = useState('');
  const [showWritingPrompt, setShowWritingPrompt] = useState(false);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [resultsQuiz, setResultsQuiz] = useState<Quiz | null>(null);
  const [refreshingMaterials, setRefreshingMaterials] = useState(false);
  const [materialRefreshMessage, setMaterialRefreshMessage] = useState('');
  const [materialRefreshFailed, setMaterialRefreshFailed] = useState(false);

  const cls = useLiveQuery(() => (classId ? db.classes.get(classId) : undefined), [classId]);
  const members = useLiveQuery(
    () => (classId ? getClassMembers(classId) : []),
    [classId],
  );

  const isOwner = cls?.teacherId === user?.$id && isTeacher;
  const teacherClasses = useLiveQuery(
    () => user && isTeacher ? db.classes.where('teacherId').equals(user.$id).toArray() : [],
    [user?.$id, isTeacher],
  );

  const activeCode = newCode || cls?.joinCode || '';
  const joinLink = `${window.location.origin}${import.meta.env.BASE_URL}join/${activeCode}`;

  // Students who join from their own phone write their membership straight to
  // the server, so the teacher's device has to pull the roster to see them.
  const [refreshingRoster, setRefreshingRoster] = useState(false);
  const refreshRoster = async () => {
    if (!classId) return;
    setRefreshingRoster(true);
    try {
      await syncClassRosterFromServer(classId);
    } finally {
      setRefreshingRoster(false);
    }
  };

  useEffect(() => {
    if (!classId || !isOwner) return;
    void syncClassRosterFromServer(classId);
    if (user) void ensureParentCode(classId, user.$id).then(setParentCode);
  }, [classId, user, isOwner]);

  const studentIds = useMemo(
    () => [...new Set((members || []).filter(m => m.role === 'student').map(m => m.userId))],
    [members],
  );

  const students = useLiveQuery(async () => {
    if (studentIds.length === 0) return [];
    const rows = await Promise.all(studentIds.map(async id => {
      const profile = await db.users.get(id);
      // A profile the teacher cannot read still counts as an enrolled student —
      // dropping the row would under-report the class.
      return profile || { $id: id, name: 'Student', email: 'Profile not synced yet' };
    }));
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [studentIds]);
  const parentIds = useMemo(() => (members || []).filter(m => m.role === 'parent').map(m => m.userId), [members]);
  const parents = useLiveQuery(async () => Promise.all(parentIds.map(async id => (await db.users.get(id)) || { $id:id,name:'Parent observer',email:'Profile not synced yet' })), [parentIds]);

  const pickableStudents = useMemo(
    () => (students || []).map(s => ({ id: s.$id, name: s.name })),
    [students],
  );

  const deckRows = useLiveQuery(async () => {
    if (!classId) return [];
    const assignments = await db.deck_assignments.where('classId').equals(classId).toArray();
    const rows = await Promise.all(assignments.map(async assignment => ({
      assignment,
      deck: await db.flashcard_decks.get(assignment.deckId),
      cardCount: await db.flashcard_cards.where('deckId').equals(assignment.deckId).count(),
    })));
    return rows.sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt));
  }, [classId]);

  const totalCards = useMemo(
    () => (deckRows || []).reduce((sum, row) => sum + row.cardCount, 0),
    [deckRows],
  );

  const discussions = useLiveQuery(async () => {
    if (!classId) return [];
    const sessions = (await db.class_sessions.where('classId').equals(classId).reverse().sortBy('sessionDate')).filter(session => session.discussionType !== 'notes' && session.discussionType !== 'presentation');
    const rows = await Promise.all(sessions.map(async session => ({
      session,
      questionCount: await db.discussion_questions.where('classSessionId').equals(session.$id).count(),
    })));
    return rows;
  }, [classId]);

  const presentationLinks = useLiveQuery(() => classId ? db.presentation_links.where('classId').equals(classId).reverse().sortBy('assignedAt') : [], [classId]);
  const livePresentations = useLiveQuery(() => classId ? db.class_sessions.where('classId').equals(classId).and(session => session.discussionType === 'presentation' && session.status === 'active').toArray() : [], [classId]);

  const classQuizzes = useLiveQuery(async () => {
    if (!classId) return [];
    const assignments = await db.quiz_assignments.where('classId').equals(classId).toArray();
    const quizIds = [...new Set(assignments.map(assignment => assignment.quizId))];
    if (!quizIds.length) return [];
    const quizzes = await db.quizzes.where('$id').anyOf(quizIds).toArray();
    return quizzes.filter(quiz => isOwner || quiz.status === 'published').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [classId, isOwner]);

  const weeklyMaterials = useLiveQuery(async (): Promise<WeeklyMaterial[]> => {
    if (!classId) return [];
    const sessions = await db.class_sessions.where('classId').equals(classId).toArray();
    const sessionMaterials: WeeklyMaterial[] = sessions
      .filter(session => session.discussionType === 'presentation' ? session.status === 'published' : session.status === 'published' || (session.discussionType !== 'notes' && session.status === 'active'))
      .map(session => ({ kind: session.discussionType === 'presentation' ? 'writingPrompt' : session.discussionType === 'notes' ? 'notes' : 'discussion', date: session.sessionDate, session }));
    const assignments = await db.text_assignments.where('classId').equals(classId).toArray();
    const texts = await Promise.all(assignments.map(assignment => db.texts.get(assignment.textId)));
    const textMaterials: WeeklyMaterial[] = assignments.flatMap((assignment, index) => {
      const text = texts[index];
      return text?.status === 'published' ? [{ kind: 'text' as const, date: assignment.assignedAt, text, assignment }] : [];
    });
    const quizMaterials: WeeklyMaterial[] = (await Promise.all((await db.quiz_assignments.where('classId').equals(classId).toArray()).map(item => db.quizzes.get(item.quizId)))).filter((quiz): quiz is Quiz => Boolean(quiz && (isOwner || quiz.status === 'published'))).map(quiz => ({ kind: 'quiz', date: quiz.createdAt, quiz }));
    const presentationMaterials: WeeklyMaterial[] = (await db.presentation_links.where('classId').equals(classId).toArray()).map(presentation => ({ kind: 'presentation', date: presentation.assignedAt, presentation }));
    return [...sessionMaterials, ...textMaterials, ...quizMaterials, ...presentationMaterials].sort((a, b) => b.date.localeCompare(a.date));
  }, [classId, isOwner, presentationLinks?.length]);

  const handleRegenerateCode = async () => {
    if (!classId || !user) return;
    const code = await regenerateJoinCode(classId, user.$id);
    setNewCode(code);
  };

  const handleRemoveStudent = async () => {
    if (!classId || !pendingRemoval) return;
    await removeStudent(classId, pendingRemoval.id);
    setPendingRemoval(null);
  };

  const handleCreateDiscussion = async () => {
    if (!classId || !user) return;
    const session = await createClassSession(classId, user.$id, {
      title: discussionTitle,
      sessionDate: discussionDate,
      assignmentId: null,
      votesPerStudent,
      allowStackedVotes,
      discussionType: 'qft',
      promptMarkdown: discussionFocus,
    });
    setShowDiscussionModal(false);
    navigate(`/discussions/${session.$id}`);
  };

  const handleRosterFile = async (file: File) => {
    if (!classId || !user) return;
    setRosterImporting(true);
    try {
      const result = await importClassRoster(classId, file);
      setRosterResult(result);
    } finally {
      setRosterImporting(false);
    }
  };

  const messageClass = () => {
    if (!cls) return;
    const emails = [...new Set((students || []).map(student => student.email).filter(email => email && email !== 'Profile not synced yet'))];
    if (!emails.length) return;
    const subject = encodeURIComponent(`${cls.courseName} — ${cls.name}`);
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${subject}`;
  };

  const downloadRosterCredentials = () => {
    if (!rosterResult || !cls) return;
    const headers = ['name', 'email', 'password', 'status', 'message'];
    const lines = [
      headers.join(','),
      ...rosterResult.rows.map(row => [
        row.name,
        row.email,
        row.password,
        row.status,
        row.message,
      ].map(escapeCsv).join(',')),
    ];
    downloadCsv(`${cls.name.replace(/\s+/g, '-')}-student-logins.csv`, `${lines.join('\n')}\n`);
  };

  const copyQuizText = async (quizId: string) => {
    const record = await getQuizWithQuestions(quizId);
    if (!record) return;
    await navigator.clipboard.writeText(buildQtiAssessmentXml(record.quiz, record.questions));
    setCopiedQuizId(quizId);
    window.setTimeout(() => setCopiedQuizId(''), 1800);
  };

  const exportQuizQti = async (quizId: string) => {
    const record = await getQuizWithQuestions(quizId);
    if (!record) return;
    const blob = await buildQtiZip(record.quiz, record.questions);
    const filename = record.quiz.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'quiz';
    downloadBlob(blob, `${filename}.qti.zip`);
  };

  const confirmDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    await deleteQuiz(quizId);
  };

  const generatePracticeQuiz = async () => {
    if (!classId || !user) return;
    setGeneratingPracticeQuiz(true); setPracticeQuizError('');
    try {
      const quiz = await createPracticeQuiz(classId, user.$id);
      navigate(`/quizzes/${quiz.$id}/take?practice=1&returnTo=${encodeURIComponent(`/classes/${classId}`)}`);
    } catch (cause) {
      setPracticeQuizError(cause instanceof Error ? cause.message : 'Could not generate a practice quiz.');
    } finally {
      setGeneratingPracticeQuiz(false);
    }
  };

  const refreshMaterials = async () => {
    if (!classId || !user) return;
    setRefreshingMaterials(true); setMaterialRefreshMessage(''); setMaterialRefreshFailed(false);
    try {
      const result = await refreshClassMaterials(classId, user.$id, user.role === 'teacher' || user.role === 'admin');
      if (result.failed.length) {
        setMaterialRefreshFailed(true);
        setMaterialRefreshMessage(`Most class material refreshed, but ${result.failed.join(', ')} could not update. Check your connection and try again.`);
      } else {
        setMaterialRefreshMessage(`Class is up to date · ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      }
    } catch {
      setMaterialRefreshFailed(true); setMaterialRefreshMessage('Could not reach the class server. Check your connection and try again.');
    } finally { setRefreshingMaterials(false); }
  };

  if (!cls) {
    return <div className="p-4 text-gray-400">Loading class...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <Link to="/classes" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-950"><span aria-hidden="true">←</span> All classes</Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{cls.courseName}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{cls.name} <span aria-hidden="true">·</span> {cls.schoolYear}</p>
          {isOwner && cls.joinCode && <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-gray-500">Student class code</span><code className="rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-base font-bold tracking-widest text-gray-950">{cls.joinCode}</code><CopyButton text={cls.joinCode} label="Copy code" copiedLabel="Code copied" /></div>}
        </div>
        {isOwner ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link to={`/classes/${cls.$id}/notes/today`}><Button size="sm">Today&apos;s Notes</Button></Link>
            <Button onClick={() => setShowWritingPrompt(true)} size="sm">Writing Prompt</Button>
            <Button onClick={() => setShowDiscussionModal(true)} size="sm" variant="secondary">Discussion</Button>
            <Button onClick={() => setShowTimerSetup(true)} size="sm" variant="secondary">Timer</Button>
            <details className="relative">
              <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950">More <span className="ml-1 text-xs" aria-hidden="true">▾</span></summary>
              <div className="absolute right-0 z-20 mt-2 grid w-52 gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                <button onClick={() => setShowAssignTexts(true)} className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-gray-100">Add a text</button>
                <button onClick={() => setShowPicker(true)} className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-gray-100">Pick a student</button>
                <button onClick={() => setShowGroups(true)} className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-gray-100">Create groups</button>
                <button onClick={messageClass} disabled={!students?.some(student => student.email && student.email !== 'Profile not synced yet')} className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-gray-100 disabled:text-gray-400">Message class</button>
                <Link to={`/classes/${cls.$id}/reports`} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">Reports</Link>
              </div>
            </details>
          </div>
        ) : <Button size="sm" variant="secondary" loading={refreshingMaterials} onClick={() => void refreshMaterials()}>↻ Refresh class</Button>}
      </div>

      {materialRefreshMessage && !isOwner && <p role="status" className={`rounded-lg px-3 py-2 text-sm ${materialRefreshFailed ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>{materialRefreshMessage}</p>}

      {livePresentations?.length ? <section aria-label="Active writing prompt" className="space-y-2">{livePresentations.map(session => <Link key={session.$id} to={`/presentations/${session.$id}/live`} className="flex items-center justify-between rounded-xl border border-blue-700 bg-blue-600 p-4 !text-white shadow-sm hover:bg-blue-700"><span><span className="block text-xs font-semibold uppercase tracking-wide text-blue-100">Writing now</span><strong className="mt-1 block text-lg !text-white">Writing Prompt</strong><span className="text-sm text-blue-100">{isOwner ? 'View and present anonymous responses' : 'Open prompt and write your response'}</span></span><span className="text-2xl text-white" aria-hidden="true">→</span></Link>)}</section> : null}

      <WeeklyClassMaterials classId={cls.$id} materials={weeklyMaterials || []} isOwner={Boolean(isOwner)} />

      {isOwner && (
        <details className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-gray-900 hover:bg-gray-50"><span>People &amp; access</span><span className="text-xs font-medium text-gray-500">{students?.length || 0} students · {parents?.length || 0} parents <span className="ml-2" aria-hidden="true">▾</span></span></summary>
        <Card className="rounded-none border-x-0 border-b-0 shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="font-semibold">Class join code</h3>
              <div className="text-2xl font-mono bg-gray-100 px-4 py-2 rounded-lg inline-block mt-1">
                {newCode || cls.joinCode}
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  Or send students this link — they can sign up and join in one step:
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs break-all">{joinLink}</code>
                  <CopyButton text={joinLink} label="Copy link" copiedLabel="Link copied" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Button onClick={() => void handleRegenerateCode()} size="sm" variant="secondary">
                Regenerate
              </Button>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
                {rosterImporting ? 'Importing...' : 'Import roster CSV'}
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) void handleRosterFile(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
            </div>
          </div>
          <div className="mt-5 border-t pt-4">
            <h3 className="font-semibold">Parent observer code</h3>
            <p className="text-sm text-gray-500">Parents use this code on the same Join Class page. Their account is read-only.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2"><code className="rounded bg-violet-50 px-4 py-2 text-xl font-mono">{parentCode || cls.parentCode || 'Creating…'}</code><CopyButton text={parentCode || cls.parentCode || ''} label="Copy code" copiedLabel="Code copied"/><Button size="sm" variant="secondary" onClick={()=>void regenerateParentCode(cls.$id,user!.$id).then(setParentCode)}>Regenerate</Button></div>
            <p className="mt-3 text-sm text-gray-600">{parents?.length||0} parent observer{parents?.length===1?'':'s'} joined</p>
            {parents?.map(parent=><p key={parent.$id} className="text-xs text-gray-500">{parent.name} · {parent.email}</p>)}
          </div>
          {rosterResult && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {rosterResult.created} created, {rosterResult.existing} existing, {rosterResult.added} enrolled, {rosterResult.skipped} skipped
                </span>
                <Button onClick={downloadRosterCredentials} size="sm" variant="secondary">
                  Download logins
                </Button>
              </div>
            </div>
          )}
        </Card>
        </details>
      )}

      {!isOwner && !isParent && <Link to="/writing" className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300"><span><strong className="block">Writing Feedback</strong><span className="text-sm text-gray-500">Get private AI feedback on any piece of writing.</span></span><span aria-hidden="true">→</span></Link>}

      <PeerReviewClassPanel classId={cls.$id} isOwner={Boolean(isOwner)} isParent={Boolean(isParent)} />

      <details className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 hover:bg-gray-50">
          <span><strong className="block text-gray-950">Class resources</strong><span className="text-sm text-gray-500">Links, presentations, quizzes, discussions, and card decks</span></span>
          <span className="shrink-0 text-sm font-medium text-gray-500" aria-hidden="true">Show ▾</span>
        </summary>
        <div className="space-y-5 border-t bg-gray-50/60 p-3 sm:p-4">
      <ClassLinksPanel cls={cls} isOwner={Boolean(isOwner)} teacherId={user?.$id || ''} />
      {!isParent && <ClassNicknamesPanel classId={cls.$id} userId={user?.$id || ''} isOwner={Boolean(isOwner)} />}
      <SimplePresentationLinksPanel links={presentationLinks || []} isOwner={Boolean(isOwner)} />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Quizzes ({classQuizzes?.length || 0})</h2>{isOwner ? <Button size="sm" onClick={() => setShowCreateQuiz(true)}>Create quiz</Button> : !isParent ? <Button size="sm" loading={generatingPracticeQuiz} onClick={() => void generatePracticeQuiz()}>Generate Practice Quiz</Button> : null}</div>
        {practiceQuizError && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{practiceQuizError}</p>}
        {classQuizzes?.length ? <div className="space-y-2">{classQuizzes.map(quiz => <div key={quiz.$id} className="relative flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 pr-8"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{quiz.title}</h3>{isOwner && <StatusBadge status={quiz.status}/>}</div><p className="text-sm text-gray-500">{quiz.questionCount} questions{quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ''}{quiz.allowedAttempts === 2 ? ' · 2 attempts' : ''}{isOwner ? ` · ${quiz.showAnswerFeedback ? 'answers shown' : 'answers hidden'}` : ''}</p></div>{isOwner ? <div className="flex flex-wrap gap-2 pr-6"><Button size="sm" variant="secondary" onClick={() => setResultsQuiz(quiz)}>Results</Button><Button size="sm" variant="secondary" onClick={() => void copyQuizText(quiz.$id)}>{copiedQuizId === quiz.$id ? 'Copied!' : 'Copy'}</Button><Button size="sm" variant="secondary" onClick={() => void exportQuizQti(quiz.$id)}>QTI</Button>{quiz.status === 'draft' && <Button size="sm" onClick={() => user && void publishQuiz(quiz.$id, user.$id)}>Publish</Button>}<button type="button" aria-label="Delete quiz" title="Delete quiz" onClick={() => void confirmDeleteQuiz(quiz.$id)} className="absolute right-3 top-3 text-lg leading-none text-red-500 hover:text-red-700">×</button></div> : <Link to={`/quizzes/${quiz.$id}/take`}><Button size="sm">Take quiz</Button></Link>}</div>)}</div> : <p className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-400">{isOwner ? 'No quizzes for this class yet.' : 'No published quizzes for this class yet.'}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Discussions ({discussions?.length || 0})</h2>
            {isOwner && (
              <Button
                onClick={() => setShowDiscussionModal(true)}
                size="sm"
                variant="secondary"
                aria-label="Start a discussion"
              >
                Start
              </Button>
            )}
          </div>
          {discussions && discussions.length > 0 ? (
            <div className="space-y-2">
              {discussions.slice(0, 5).map(({ session, questionCount }) => (
                <Link key={session.$id} to={`/discussions/${session.$id}`}>
                  <Card>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-sm">{session.title}</h3>
                        <p className="text-xs text-gray-500">{session.sessionDate}</p>
                      </div>
                      <StatusBadge status={session.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{questionCount} questions</p>
                  </Card>
                </Link>
              ))}
              {discussions.length > 5 && (
                <Link to="/discussions" className="text-sm text-blue-600 hover:underline block">
                  +{discussions.length - 5} more discussions
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="No discussions yet"
              message="Start a discussion to collect questions and votes."
              action={isOwner && <Button onClick={() => setShowDiscussionModal(true)} size="sm" variant="secondary">Start discussion</Button>}
            />
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              Card decks ({deckRows?.length || 0})
              {totalCards > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">{totalCards} cards</span>
              )}
            </h2>
            {isOwner && (
              <div className="flex gap-2">
                <Link to={`/classes/${cls.$id}/cards/new`}>
                  <Button size="sm" variant="secondary" aria-label="Add cards to this class">
                    Add cards
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Add existing decks to this class"
                  onClick={() => setShowAddDecks(true)}
                >
                  Add decks
                </Button>
              </div>
            )}
          </div>
          {deckRows && deckRows.length > 0 ? (
            <div className="space-y-2">
              {deckRows.slice(0, 5).map(({ assignment, deck, cardCount }) => (
                <Card key={assignment.$id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/decks/${assignment.deckId}/review`} className="font-medium text-sm hover:text-blue-700">
                        {deck?.title || 'Unknown deck'}
                      </Link>
                      {deck?.description && <p className="text-xs text-gray-500">{deck.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                      </p>
                    </div>
                    {isTeacher ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link to={`/decks/${assignment.deckId}/present`}>
                          <Button size="sm">Present</Button>
                        </Link>
                        <Link to={`/classes/${cls.$id}/decks/${assignment.deckId}/progress`}>
                          <Button size="sm" variant="secondary">Progress</Button>
                        </Link>
                        {isOwner && <Button size="sm" variant="danger" onClick={() => setPendingDeckRemoval({ deckId: assignment.deckId, title: deck?.title || 'this deck' })}>Remove</Button>}
                      </div>
                    ) : (
                      <Link to={`/decks/${assignment.deckId}/review`}>
                        <Button size="sm" variant="secondary">Study</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
              {deckRows.length > 5 && (
                <Link to="/decks" className="text-sm text-blue-600 hover:underline block">
                  +{deckRows.length - 5} more {deckRows.length - 5 === 1 ? 'deck' : 'decks'}
                </Link>
              )}
            </div>
          ) : (
            <EmptyState
              title="No cards yet"
              message="Type cards in by hand, or import a CSV if you already have a list."
              action={isOwner && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to={`/classes/${cls.$id}/cards/new`}><Button size="sm">Add cards</Button></Link>
                  <Button size="sm" variant="secondary" onClick={() => setShowAddDecks(true)}>Add decks</Button>
                  <Link to="/decks/import"><Button size="sm" variant="secondary">Import CSV</Button></Link>
                </div>
              )}
            />
          )}
        </section>
      </div>

        </div>
      </details>

      {isOwner && <details className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold hover:bg-gray-50"><span>Student roster</span><span className="text-sm font-medium text-gray-500">{students?.length || 0} students <span className="ml-2" aria-hidden="true">▾</span></span></summary>
      <section className="border-t p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Students ({students?.length || 0})</h2>
          {isOwner && (
            <Button
              size="sm"
              variant="secondary"
              loading={refreshingRoster}
              onClick={() => void refreshRoster()}
            >
              Refresh roster
            </Button>
          )}
        </div>
        {students && students.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {students.map(student => (
              <Card key={student.$id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <Link
                      to={`/classes/${classId}/students/${student.$id}/progress`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Progress
                    </Link>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => { setPendingMove({ id: student.$id, name: student.name }); setMoveTargetClassId(teacherClasses?.find(item => item.$id !== classId)?.$id || ''); }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Move
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setPendingRemoval({ id: student.$id, name: student.name })}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No students yet"
            message="Import a roster CSV or share the join code so students can enter the class. If students say they have joined, hit Refresh roster."
          />
        )}
      </section>
      </details>}

      <Modal
        open={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        title="Remove student"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Remove <strong>{pendingRemoval?.name}</strong> from {cls.courseName}? They lose access to this
            class's cards and discussions, and will need the join code to come back.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button variant="danger" onClick={() => void handleRemoveStudent()} className="sm:flex-1">
              Remove {pendingRemoval?.name}
            </Button>
            <Button variant="secondary" onClick={() => setPendingRemoval(null)} className="sm:flex-1">
              Keep in class
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(pendingMove)} onClose={() => setPendingMove(null)} title="Move student">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Move <strong>{pendingMove?.name}</strong> from {cls.courseName} — {cls.name} to another class?</p>
          <select className="w-full rounded-lg border px-3 py-2" value={moveTargetClassId} onChange={event => setMoveTargetClassId(event.target.value)}>
            {(teacherClasses || []).filter(item => item.$id !== classId).map(item => <option key={item.$id} value={item.$id}>{item.courseName} — {item.name}</option>)}
          </select>
          {(teacherClasses || []).filter(item => item.$id !== classId).length === 0 && <p className="text-sm text-amber-700">Create another class before moving this student.</p>}
          <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setPendingMove(null)}>Cancel</Button><Button className="flex-1" disabled={!moveTargetClassId} onClick={() => { if (!pendingMove || !classId) return; void moveStudent(classId, moveTargetClassId, pendingMove.id).then(() => setPendingMove(null)); }}>Move student</Button></div>
        </div>
      </Modal>

      <Modal open={Boolean(pendingDeckRemoval)} onClose={() => setPendingDeckRemoval(null)} title="Remove deck from class">
        <div className="space-y-4"><p className="text-sm text-gray-600">Remove <strong>{pendingDeckRemoval?.title}</strong> from this class? The deck itself and student review history will not be deleted.</p><div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setPendingDeckRemoval(null)}>Cancel</Button><Button variant="danger" className="flex-1" onClick={() => { if (!pendingDeckRemoval) return; void unassignDeck(pendingDeckRemoval.deckId, cls.$id).then(() => setPendingDeckRemoval(null)); }}>Remove deck</Button></div></div>
      </Modal>

      {isOwner && resultsQuiz && classId && <QuizResultsModal quiz={resultsQuiz} classId={classId} onClose={() => setResultsQuiz(null)} />}

      <Modal open={showDiscussionModal} onClose={() => setShowDiscussionModal(false)} title="Start discussion">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discussion topic</label>
            <input
              value={discussionTitle}
              onChange={e => setDiscussionTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Overall focus or context</label><textarea value={discussionFocus} onChange={e => setDiscussionFocus(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg" placeholder="Give the class a broad topic or focus. Teachers and students can add multiple questions underneath it." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={discussionDate}
                onChange={e => setDiscussionDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Votes each</label>
              <input
                type="number"
                min={0}
                max={20}
                value={votesPerStudent}
                onChange={e => setVotesPerStudent(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowStackedVotes}
              onChange={e => setAllowStackedVotes(e.target.checked)}
              className="rounded"
            />
            <span>Allow students to put multiple votes on one question</span>
          </label>
          <Button onClick={() => void handleCreateDiscussion()} className="w-full">
            Create discussion
          </Button>
        </div>
      </Modal>

      {isOwner && user && (
        <><AddDecksToClassModal
          open={showAddDecks}
          classId={cls.$id}
          teacherId={user.$id}
          onClose={() => setShowAddDecks(false)}
        /><AssignTextsToClassModal open={showAssignTexts} classId={cls.$id} teacherId={user.$id} onClose={() => setShowAssignTexts(false)} />
        {showCreateQuiz && <CreateQuizModal classes={(teacherClasses || []).map(item => ({ id: item.$id, name: classLabel(item) }))} sourceClassId={cls.$id} onClose={() => setShowCreateQuiz(false)} onCreated={() => setShowCreateQuiz(false)} />}</>
      )}
      {isOwner && showWritingPrompt && <CreateWritingPromptModal classId={cls.$id} onClose={() => setShowWritingPrompt(false)} onCreated={sessionId => navigate(`/presentations/${sessionId}/live`)} />}
      {isOwner&&showTimerSetup&&<Modal open onClose={()=>setShowTimerSetup(false)} title="Class timer"><div className="space-y-4"><p className="text-sm text-gray-500">Choose up to 30 minutes. The timer opens on a clean white presentation screen.</p><label className="block text-sm font-medium">Minutes<input autoFocus type="number" min={1} max={30} step={1} className="mt-1 w-full rounded-lg border px-3 py-3 text-2xl font-semibold" value={timerMinutes} onChange={event=>setTimerMinutes(Math.min(30,Math.max(1,Number(event.target.value)||1)))}/></label><div className="grid grid-cols-4 gap-2">{[3,5,10,15].map(value=><button key={value} type="button" onClick={()=>setTimerMinutes(value)} className={`rounded-lg border px-2 py-2 text-sm font-semibold ${timerMinutes===value?'border-gray-950 bg-gray-950 text-white':'hover:bg-gray-50'}`}>{value} min</button>)}</div><Button className="w-full" onClick={()=>navigate(`/classes/${cls.$id}/timer?minutes=${timerMinutes}`)}>Open timer</Button></div></Modal>}

      {isOwner && (
        <>
          <RandomStudentModal
            open={showPicker}
            students={pickableStudents}
            onClose={() => setShowPicker(false)}
          />
          <CreateGroupsModal
            open={showGroups}
            students={pickableStudents}
            onClose={() => setShowGroups(false)}
          />
        </>
      )}
    </div>
  );
}

function QuizResultsModal({ quiz, classId, onClose }: { quiz: Quiz; classId: string; onClose: () => void }) {
  const [results, setResults] = useState<TeacherQuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignmentPoints, setAssignmentPoints] = useState(20);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setResults(await readQuizResults(quiz.$id, classId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load quiz results.'); }
    finally { setLoading(false); }
  }, [quiz.$id, classId]);

  useEffect(() => { void load(); }, [load]);

  const completed = results?.students.filter(student => student.attempts.some(attempt => attempt.completedAt)) || [];
  const bestPercent = (student: TeacherQuizResults['students'][number]) => student.attempts
    .filter(attempt => attempt.completedAt && attempt.totalQuestions > 0)
    .reduce((best, attempt) => Math.max(best, Math.round(attempt.score / attempt.totalQuestions * 100)), -1);
  const average = completed.length ? Math.round(completed.reduce((sum, student) => sum + Math.max(0, bestPercent(student)), 0) / completed.length) : null;
  const bestAttempt = (student: TeacherQuizResults['students'][number]) => student.attempts
    .filter(attempt => attempt.completedAt && attempt.totalQuestions > 0)
    .reduce<(TeacherQuizResults['students'][number]['attempts'][number] | null)>((best, attempt) => !best || attempt.score / attempt.totalQuestions > best.score / best.totalQuestions ? attempt : best, null);

  return <Modal open onClose={onClose} title={`Results · ${quiz.title}`}>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{results ? `${completed.length} of ${results.students.length} students completed` : 'Loading class results…'}{average !== null ? ` · ${average}% class average` : ''}</p>
        <Button size="sm" variant="secondary" loading={loading} onClick={() => void load()}>Refresh</Button>
      </div>
      <label className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-950">Convert each best result to an assignment out of <input type="number" min={0.01} max={10000} step="any" value={assignmentPoints} onChange={event => setAssignmentPoints(Math.max(0, Number(event.target.value) || 0))} className="w-24 rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-right font-semibold text-gray-950" aria-label="Assignment points" /> points</label>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && !results ? <p className="py-8 text-center text-sm text-gray-400">Loading results…</p> : results?.students.length ? <div className="max-h-[65vh] overflow-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-3 py-2">Student</th><th className="px-3 py-2">Best result</th><th className="px-3 py-2">Converted (/{assignmentPoints || '—'})</th><th className="px-3 py-2">Attempts</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{results.students.map(student => {
            const finished = student.attempts.filter(attempt => attempt.completedAt);
            const inProgress = student.attempts.some(attempt => !attempt.completedAt);
            const best = bestPercent(student);
            const strongest = bestAttempt(student);
            const converted = strongest ? convertQuizScore(strongest.score, strongest.totalQuestions, assignmentPoints) : null;
            return <tr key={student.userId}><td className="px-3 py-3 font-medium text-gray-900">{student.name}</td><td className="px-3 py-3">{best >= 0 ? <span className="font-semibold text-gray-900">{best}%</span> : <span className="text-gray-400">{inProgress ? 'In progress' : 'Not attempted'}</span>}</td><td className="px-3 py-3">{converted !== null ? <strong className="text-blue-800">{converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {assignmentPoints.toLocaleString()}</strong> : <span className="text-gray-400">—</span>}</td><td className="px-3 py-3 text-gray-600">{finished.length ? finished.map((attempt, index) => <div key={attempt.id}>Attempt {index + 1}: <strong>{attempt.score}/{attempt.totalQuestions}</strong> ({Math.round(attempt.score / Math.max(1, attempt.totalQuestions) * 100)}%)</div>) : <span className="text-gray-400">—</span>}{inProgress && <div className="text-amber-700">Current attempt in progress</div>}</td></tr>;
          })}</tbody>
        </table>
      </div> : !loading && !error ? <p className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-400">No students are currently enrolled in this class.</p> : null}
      <p className="text-xs text-gray-400">The class average uses each student's best completed attempt. Individual answers remain private.</p>
    </div>
  </Modal>;
}

function PeerReviewClassPanel({classId,isOwner,isParent}:{classId:string;isOwner:boolean;isParent:boolean}){
  const [activities,setActivities]=useState<PeerReviewActivity[]>([]),[creating,setCreating]=useState(false),[title,setTitle]=useState(`Presentation Peer Review · ${new Date().toLocaleDateString()}`),[required,setRequired]=useState(3),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const load=useCallback(async()=>{try{setActivities((await listPeerReviewActivities(classId)).activities)}catch{/* offline */}},[classId]);
  useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')void load()};const initial=window.setTimeout(refresh,0);window.addEventListener('focus',refresh);const timer=isOwner?window.setInterval(refresh,60000):undefined;return()=>{window.clearTimeout(initial);if(timer!==undefined)window.clearInterval(timer);window.removeEventListener('focus',refresh)}},[load,isOwner]);
  const create=async()=>{setBusy(true);setError('');try{await createPeerReviewActivity(classId,title,required);setCreating(false);await load()}catch(cause){setError(cause instanceof Error?cause.message:'Could not create peer review.')}finally{setBusy(false)}};
  if(isParent)return null;
  return <section className="overflow-hidden rounded-xl border border-sky-200 bg-sky-50"><div className="flex items-center justify-between gap-3 p-4"><div><h2 className="font-semibold text-sky-950">Peer Review</h2><p className="text-sm text-sky-800">Live, no-upload presentation feedback</p></div>{isOwner&&<Button size="sm" onClick={()=>setCreating(true)}>New Peer Review</Button>}</div>{activities.length>0&&<div className="space-y-2 border-t border-sky-200 p-3">{activities.slice(0,isOwner?6:3).map(activity=><Link key={activity.$id} to={`/peer-reviews/${activity.$id}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 hover:ring-1 hover:ring-sky-300"><span><strong className="block text-sm">{activity.title}</strong><span className="text-xs text-gray-500">PVLEGS · {activity.reviewsRequired} reviews required{activity.flaggedCount?` · ${activity.flaggedCount} flagged`:''}</span></span><span className={`rounded-full px-2 py-1 text-xs font-medium ${activity.flaggedCount?'bg-red-100 text-red-800':activity.status==='active'?'bg-green-100 text-green-800':'bg-gray-100 text-gray-600'}`}>{activity.flaggedCount?`${activity.flaggedCount} flag${activity.flaggedCount===1?'':'s'}`:activity.status}</span></Link>)}</div>} {creating&&<Modal open onClose={()=>setCreating(false)} title="New Peer Review"><div className="space-y-4">{error&&<p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium">Assignment type<select className="mt-1 w-full rounded-lg border px-3 py-2"><option>Presentation — PVLEGS</option></select></label><label className="block text-sm font-medium">Activity title<input className="mt-1 w-full rounded-lg border px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="block text-sm font-medium">Reviews students must submit to unlock feedback<input type="number" min={1} max={20} className="mt-1 w-full rounded-lg border px-3 py-2" value={required} onChange={e=>setRequired(Number(e.target.value))}/></label><p className="text-xs text-gray-500">Students select different classmates from the roster. Reviews are anonymous to peers but identifiable to you.</p><Button className="w-full" loading={busy} disabled={!title.trim()||required<1} onClick={()=>void create()}>Open peer review</Button></div></Modal>}</section>;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function ClassNicknamesPanel({ classId, userId, isOwner }: { classId: string; userId: string; isOwner: boolean }) {
  const [open, setOpen] = useState(false);
  const [nicknames, setNicknames] = useState<ClassNickname[]>([]);
  const [reports, setReports] = useState<NicknameReport[]>([]);
  const [reporting, setReporting] = useState<ClassNickname | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    try { const result = await readClassNicknames(classId); setNicknames(result.nicknames); setReports(result.reports); }
    catch { /* Cached class content remains usable while offline. */ }
  }, [classId]);
  const sendReport = async () => {
    if (!reporting || reason.trim().length < 3) return;
    setBusy(true); setMessage('');
    try { await reportNickname(classId, reporting.userId, reason); setReporting(null); setReason(''); setMessage('Your teacher has been notified.'); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Could not send this report.'); }
    finally { setBusy(false); }
  };
  const moderate = async (reportId: string, command: 'dismiss' | 'reset') => { setBusy(true); try { await moderateNicknameReport(reportId, command); await load(); } finally { setBusy(false); } };
  return <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <button className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50" onClick={() => { const next=!open;setOpen(next);if(next)void load(); }}><span className="text-lg font-semibold">{open ? '▾' : '▸'} Class nicknames</span>{isOwner && reports.length > 0 ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">{reports.length} flagged</span> : null}</button>
    {open && <div className="space-y-3 border-t p-4">{message && <p className="text-sm text-blue-700">{message}</p>}{isOwner && reports.length > 0 && <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3"><h3 className="font-semibold text-red-900">Nickname reports</h3>{reports.map(report => <div key={report.$id} className="rounded-lg bg-white p-3 text-sm"><p><strong>{report.targetName || report.nickname}</strong> was reported: {report.reason}</p><p className="mt-1 text-xs text-gray-500">Reported by {report.reporterName || 'a student'}</p><div className="mt-2 flex gap-3 text-xs font-semibold"><button disabled={busy} className="text-red-700" onClick={() => void moderate(report.$id, 'reset')}>Reset nickname</button><button disabled={busy} className="text-gray-600" onClick={() => void moderate(report.$id, 'dismiss')}>Dismiss report</button></div></div>)}</div>}
      <div className="grid gap-2 sm:grid-cols-2">{nicknames.map(item => <div key={item.userId} className="flex items-center justify-between rounded-lg border px-3 py-2"><span className="font-medium">{item.userId === userId ? `${item.nickname} (you)` : item.nickname}</span>{!isOwner && item.userId !== userId && <button className="text-xs text-red-600" onClick={() => { setReporting(item); setReason(''); setMessage(''); }}>Flag</button>}</div>)}</div>
    </div>}
    {reporting && <Modal open onClose={() => !busy && setReporting(null)} title="Report nickname"><div className="space-y-4"><p className="text-sm">Tell your teacher why <strong>{reporting.nickname}</strong> may be inappropriate.</p><textarea autoFocus rows={3} className="w-full rounded-lg border px-3 py-2" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} /><Button variant="danger" className="w-full" loading={busy} disabled={reason.trim().length < 3} onClick={() => void sendReport()}>Send report</Button></div></Modal>}
  </section>;
}

function AssignTextsToClassModal({ open, classId, teacherId, onClose }: { open: boolean; classId: string; teacherId: string; onClose: () => void }) {
  const texts = useLiveQuery(() => db.texts.where('teacherId').equals(teacherId).and(text => text.status !== 'archived').toArray(), [teacherId]);
  const assignments = useLiveQuery(() => db.text_assignments.where('classId').equals(classId).toArray(), [classId]);
  const [mode, setMode] = useState<'existing' | 'new'>('new');
  const [contentMode, setContentMode] = useState<'full' | 'link'>('full');
  const [chosen, setChosen] = useState<Set<string> | null>(null);
  const [dueDate, setDueDate] = useState(todayKey());
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [copiedText, setCopiedText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = chosen || new Set(assignments?.map(assignment => assignment.textId) || []);
  const toggle = (textId: string) => { const next = new Set(selected); if (next.has(textId)) next.delete(textId); else next.add(textId); setChosen(next); };
  const schedule = { assignedAt: new Date(`${dueDate}T12:00:00`).toISOString() };
  const save = async () => {
    setBusy(true); setError('');
    try {
      for (const text of texts || []) {
        const current = await db.text_assignments.where('textId').equals(text.$id).toArray();
        const classIds = new Set(current.map(assignment => assignment.classId));
        if (selected.has(text.$id)) classIds.add(classId); else classIds.delete(classId);
        await setTextClasses(text.$id, [...classIds], teacherId, selected.has(text.$id) ? schedule : undefined);
      }
      setChosen(null); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not assign texts.'); }
    finally { setBusy(false); }
  };
  const createAndAssign = async () => {
    setBusy(true); setError('');
    try {
      await createText({ teacherId, title: title.trim(), author: author.trim(), source: source.trim(), paragraphs: contentMode === 'full' ? splitParagraphs(copiedText) : [], classIds: [classId], contentMode, externalUrl: contentMode === 'link' ? externalUrl.trim() : '', schedule });
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add this text.'); }
    finally { setBusy(false); }
  };
  const close = () => { if (busy) return; setChosen(null); setError(''); onClose(); };
  const newTextValid = Boolean(title.trim()) && (contentMode === 'link' ? /^https?:\/\//i.test(externalUrl) : splitParagraphs(copiedText).length > 0);
  return <Modal open={open} onClose={close} title="Assign Text"><div className="space-y-4"><div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"><button className={`rounded-md px-3 py-2 text-sm font-medium ${mode==='existing'?'bg-white shadow-sm':''}`} onClick={()=>setMode('existing')}>Choose existing</button><button className={`rounded-md px-3 py-2 text-sm font-medium ${mode==='new'?'bg-white shadow-sm':''}`} onClick={()=>setMode('new')}>Add new text</button></div>{error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium">Due date<input type="date" className="mt-1 w-full rounded-lg border px-3 py-2" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label>{mode==='existing'?<><p className="text-sm text-gray-500">Choose from texts you have already added.</p><div className="max-h-72 space-y-2 overflow-auto">{texts?.length ? texts.map(text => <label key={text.$id} className="flex items-start gap-3 rounded-lg border p-3"><input type="checkbox" className="mt-1" checked={selected.has(text.$id)} onChange={() => toggle(text.$id)} /><span><strong className="block text-sm">{text.title}</strong><span className="text-xs text-gray-500">{text.author || 'Unknown author'}{text.contentMode==='link'?' · Link':''}</span></span></label>) : <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No saved texts yet. Choose “Add new text” above.</p>}</div><Button className="w-full" loading={busy} onClick={() => void save()}>Save text assignments</Button></>:<><div className="grid grid-cols-2 gap-1 rounded-lg border p-1"><button className={`rounded-md px-3 py-2 text-sm ${contentMode==='full'?'bg-blue-50 font-semibold text-blue-700':''}`} onClick={()=>setContentMode('full')}>Paste full text</button><button className={`rounded-md px-3 py-2 text-sm ${contentMode==='link'?'bg-blue-50 font-semibold text-blue-700':''}`} onClick={()=>setContentMode('link')}>Post a link</button></div><input className="w-full rounded-lg border px-3 py-2" placeholder="Text title" value={title} onChange={e=>setTitle(e.target.value)}/><div className="grid grid-cols-2 gap-3"><input className="w-full rounded-lg border px-3 py-2" placeholder="Author (optional)" value={author} onChange={e=>setAuthor(e.target.value)}/><input className="w-full rounded-lg border px-3 py-2" placeholder="Source (optional)" value={source} onChange={e=>setSource(e.target.value)}/></div>{contentMode==='link'?<input type="url" className="w-full rounded-lg border px-3 py-2" placeholder="https://…" value={externalUrl} onChange={e=>setExternalUrl(e.target.value)}/>:<><MarkdownPasteEditor value={copiedText} onChange={setCopiedText} rows={10}/><p className="text-xs text-gray-500">{splitParagraphs(copiedText).length} paragraph{splitParagraphs(copiedText).length===1?'':'s'} detected</p></>}<Button className="w-full" loading={busy} disabled={!newTextValid} onClick={()=>void createAndAssign()}>Add and assign text</Button></>}</div></Modal>;
}

function SimplePresentationLinksPanel({ links, isOwner }: { links: PresentationLink[]; isOwner: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50" onClick={() => setOpen(value => !value)}>
        <span className="text-lg font-semibold">{open ? '▾' : '▸'} Presentations</span>
        <span className="text-sm text-gray-500">{links.length}</span>
      </button>
      {open && <div className="space-y-3 border-t p-4">
        <a href={PRESENTATION_FOLDER_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-fuchsia-50 px-4 py-3 font-semibold text-fuchsia-900 hover:bg-fuchsia-100">
          <span>Open presentation folder</span><span aria-hidden="true">↗</span>
        </a>
        <p className="text-sm text-gray-500">Search the shared folder using the presentation name below. Add new entries from the appropriate week.</p>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {links.length ? links.map(link => <div key={link.$id} className="flex items-center gap-3 rounded-lg border p-3">
            <label className="flex min-w-0 flex-1 items-center gap-3">
              <input type="checkbox" checked={Boolean(link.watchedAt)} disabled={!isOwner} onChange={event => void setPresentationWatched(link.$id, event.target.checked)} className="h-5 w-5 rounded" />
              <span className="min-w-0"><a href={link.url || PRESENTATION_FOLDER_URL} target="_blank" rel="noreferrer" className="block truncate font-medium text-blue-700 hover:underline" onClick={event => event.stopPropagation()}>{link.title}</a><span className="text-xs text-gray-500">{link.watchedAt ? 'Watched' : 'Not watched yet'} · {formatDate(link.assignedAt)}</span></span>
            </label>
            {isOwner && <button className="text-sm text-red-600" onClick={() => window.confirm('Delete this presentation entry?') && void deletePresentationLink(link.$id)}>Delete</button>}
          </div>) : <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No presentations recorded yet. Open a week below to add one.</p>}
        </div>
      </div>}
    </section>
  );
}

function WeeklyClassMaterials({ classId, materials, isOwner }: { classId: string; materials: WeeklyMaterial[]; isOwner: boolean }) {
  const { user } = useAuth();
  const teacherClasses=useLiveQuery(()=>user?db.classes.where('teacherId').equals(user.$id).toArray():[],[user?.$id]);
  const groups = new Map<string, WeeklyMaterial[]>();
  for (const material of materials) {
    const key = weekStart(material.date);
    groups.set(key, [...(groups.get(key) || []), material]);
  }
  const currentWeek = weekStart(todayKey());
  const upcomingWeek = addDays(currentWeek, 7);
  if (isOwner) {
    if (!groups.has(currentWeek)) groups.set(currentWeek, []);
    if (!groups.has(upcomingWeek)) groups.set(upcomingWeek, []);
  }
  const weeks = [...groups.entries()].sort((a, b) => {
    const rank = (week: string) => week === currentWeek ? 0 : week === upcomingWeek ? 1 : week > currentWeek ? 2 : 3;
    return rank(a[0]) - rank(b[0]) || b[0].localeCompare(a[0]);
  });
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set([currentWeek]));
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [quickAdd, setQuickAdd] = useState<{ kind: 'text' | 'presentation'; week: string } | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [itemDate, setItemDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [editingText, setEditingText] = useState<LearningText | null>(null);
  const [editingWritingPrompt, setEditingWritingPrompt] = useState<ClassSession | null>(null);

  const openQuickAdd = (kind: 'text' | 'presentation', week: string) => {
    setTitle(''); setUrl(''); setItemDate(''); setAddError(''); setQuickAdd({ kind, week });
  };
  const saveQuickAdd = async () => {
    if (!quickAdd || !user || !title.trim()) return;
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) { setAddError('The optional link must begin with http:// or https://.'); return; }
    setAdding(true); setAddError('');
    try {
      const assignedDate = itemDate || quickAdd.week;
      const assignedAt = new Date(`${assignedDate}T12:00:00`).toISOString();
      if (quickAdd.kind === 'presentation') {
        await addPresentationLinks({ title: title.trim(), url: url.trim() || PRESENTATION_FOLDER_URL, classIds: [classId], assignedAt });
      } else {
        await createText({ teacherId: user.$id, title: title.trim(), author: '', source: '', paragraphs: [], classIds: [classId], contentMode: 'link', externalUrl: url.trim(), schedule: { assignedAt } });
      }
      setOpenSections(current => new Set(current).add(`${quickAdd.week}-${quickAdd.kind === 'text' ? 'texts' : 'presentations'}`));
      setQuickAdd(null);
    } catch (cause) { setAddError(cause instanceof Error ? cause.message : `Could not add this ${quickAdd.kind}.`); }
    finally { setAdding(false); }
  };

  return <>
    <section>
      <h2 className="mb-3 text-lg font-semibold">Weekly class materials</h2>
      {!weeks.length ? <Card><p className="text-sm text-gray-500">Notes, writing prompts, quizzes, discussions, texts, and presentations will appear here by week.</p></Card> : <div className="space-y-3">
        {weeks.map(([week, unsortedItems]) => {
          const priority: Record<WeeklyMaterial['kind'], number> = { text: 0, presentation: 1, notes: 2, writingPrompt: 3, discussion: 4, quiz: 5 };
          const items = [...unsortedItems].sort((a, b) => priority[a.kind] - priority[b.kind] || b.date.localeCompare(a.date));
          const isOpen = openWeeks.has(week);
          const byKind = <K extends WeeklyMaterial['kind']>(kind: K) => items.filter((item): item is Extract<WeeklyMaterial, { kind: K }> => item.kind === kind);
          const texts = byKind('text'), presentations = byKind('presentation'), notes = byKind('notes'), writingPrompts = byKind('writingPrompt'), discussions = byKind('discussion'), quizzes = byKind('quiz');
          const weekLabel = week === currentWeek ? `This week · ${formatWeek(week)}` : week === upcomingWeek ? `Upcoming week · ${formatWeek(week)}` : `Week of ${formatWeek(week)}`;
          return <div key={week} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50" onClick={() => setOpenWeeks(current => toggleSetValue(current, week))}>
              <span className="font-semibold">{isOpen ? '▾' : '▸'} {weekLabel}</span>
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </button>
            {isOpen && <div className="space-y-3 border-t bg-gray-50 p-4">
              {isOwner && <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => openQuickAdd('presentation', week)}>+ Presentation</Button><Button size="sm" variant="secondary" onClick={() => openQuickAdd('text', week)}>+ Text</Button></div>}
              {texts.length > 0 && <CompactWeekSection title="Texts" count={texts.length} color="emerald" open={openSections.has(`${week}-texts`)} onToggle={() => setOpenSections(current => toggleSetValue(current, `${week}-texts`))}>{texts.map(item => <div key={item.assignment.$id} className="flex items-center gap-3 border-t border-emerald-100 px-4 py-2.5 hover:bg-emerald-100/50"><TextMaterialLink item={item} />{isOwner && <button className="shrink-0 text-xs font-semibold text-emerald-800 underline" onClick={() => setEditingText(item.text)}>Edit</button>}</div>)}</CompactWeekSection>}
              {presentations.length > 0 && <CompactWeekSection title="Presentations" count={presentations.length} color="fuchsia" open={openSections.has(`${week}-presentations`)} onToggle={() => setOpenSections(current => toggleSetValue(current, `${week}-presentations`))}>{presentations.map(item => <div key={item.presentation.$id} className="flex items-center gap-3 border-t border-fuchsia-100 px-4 py-2.5"><input aria-label={`Mark ${item.presentation.title} watched`} type="checkbox" className="h-5 w-5" checked={Boolean(item.presentation.watchedAt)} disabled={!isOwner} onChange={event => void setPresentationWatched(item.presentation.$id, event.target.checked)} /><a href={item.presentation.url || PRESENTATION_FOLDER_URL} target="_blank" rel="noreferrer" className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-fuchsia-950">{item.presentation.title}</span><span className="text-xs text-fuchsia-800">{item.presentation.watchedAt ? 'Watched' : 'Posted · not watched'} · {formatDate(item.date)}</span></a>{isOwner && <button className="text-xs font-semibold text-red-700 underline" onClick={() => window.confirm('Delete this presentation entry?') && void deletePresentationLink(item.presentation.$id)}>Delete</button>}</div>)}</CompactWeekSection>}
              {notes.length > 0 && <CompactWeekSection title="Class notes" count={notes.length} color="blue" open={openSections.has(`${week}-notes`)} onToggle={() => setOpenSections(current => toggleSetValue(current, `${week}-notes`))}>{notes.map(item => <article key={item.session.$id} className="border-t border-blue-100 px-4 py-3"><p className="mb-2 text-xs font-semibold text-blue-700">{formatDate(item.date)}</p><Markdown content={item.session.publishedNotesMarkdown} className="text-base leading-7 text-gray-800" /></article>)}</CompactWeekSection>}
              {writingPrompts.length > 0 && <CompactWeekSection title="Writing prompts" count={writingPrompts.length} color="cyan" open={openSections.has(`${week}-writing`)} onToggle={() => setOpenSections(current => toggleSetValue(current, `${week}-writing`))}>{writingPrompts.map(item => <article key={item.session.$id} className="border-t border-cyan-100 px-4 py-3"><div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs font-semibold text-cyan-800">{formatDate(item.date)}</p>{isOwner&&<button className="text-xs font-semibold text-cyan-900 underline" onClick={()=>setEditingWritingPrompt(item.session)}>Edit prompt</button>}</div><Markdown content={item.session.publishedNotesMarkdown} className="text-sm text-gray-800" /></article>)}</CompactWeekSection>}
              {discussions.length > 0 && <CompactWeekSection title="Discussions" count={discussions.length} color="violet" open={openSections.has(`${week}-discussions`)} onToggle={() => setOpenSections(current => toggleSetValue(current, `${week}-discussions`))}>{discussions.map(item => <Link key={item.session.$id} to={`/discussions/${item.session.$id}`} className="block border-t border-violet-100 px-4 py-3 hover:bg-violet-100/50"><span className="block text-sm font-semibold text-violet-950">{item.session.title}</span><span className="text-xs text-violet-800">{formatDate(item.date)}</span></Link>)}</CompactWeekSection>}
              {quizzes.length > 0 && <CompactWeekSection title="Quizzes" count={quizzes.length} color="amber" open={openSections.has(`${week}-quizzes`)} onToggle={() => setOpenSections(current => toggleSetValue(current, `${week}-quizzes`))}>{quizzes.map(item => <Link key={item.quiz.$id} to={`/quizzes/${item.quiz.$id}/take`} className="block border-t border-amber-100 px-4 py-3 hover:bg-amber-100/50"><span className="block text-sm font-semibold text-amber-950">{item.quiz.title}</span><span className="text-xs text-amber-800">{formatDate(item.date)}</span></Link>)}</CompactWeekSection>}
              {!items.length && <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">Nothing has been added to this week yet.</p>}
            </div>}
          </div>;
        })}
      </div>}
    </section>
    {quickAdd && <Modal open onClose={() => !adding && setQuickAdd(null)} title={`Add ${quickAdd.kind} · ${formatWeek(quickAdd.week)}`}><div className="space-y-4">
      {addError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{addError}</p>}
      <label className="block text-sm font-medium">Name<input autoFocus className="mt-1 w-full rounded-lg border px-3 py-2" value={title} onChange={event => setTitle(event.target.value)} placeholder={quickAdd.kind === 'presentation' ? 'Presentation name' : 'Text title'} /></label>
      <label className="block text-sm font-medium">Link <span className="font-normal text-gray-500">(optional)</span><input type="url" className="mt-1 w-full rounded-lg border px-3 py-2" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://…" /></label>
      {quickAdd.kind === 'presentation' && <p className="rounded-lg bg-fuchsia-50 p-3 text-sm text-fuchsia-900">If you leave the link blank, this opens the shared OneDrive presentation folder so students can search by name.</p>}
      {quickAdd.kind === 'text' && <p className="text-sm text-gray-500">This quick entry is for a title or link. Use “Add a Text” at the top of the class to paste the complete text for annotation.</p>}
      <label className="block text-sm font-medium">Specific date <span className="font-normal text-gray-500">(optional)</span><input type="date" min={quickAdd.week} max={addDays(quickAdd.week, 6)} className="mt-1 w-full rounded-lg border px-3 py-2" value={itemDate} onChange={event => setItemDate(event.target.value)} /></label>
      <Button className="w-full" loading={adding} disabled={!title.trim()} onClick={() => void saveQuickAdd()}>Add to this week</Button>
    </div></Modal>}
    {editingText&&user&&teacherClasses&&<TextEditorModal text={editingText} teacherId={user.$id} classes={teacherClasses.map(cls=>({id:cls.$id,name:classLabel(cls)}))} onClose={()=>setEditingText(null)}/>}
    {editingWritingPrompt&&<EditSavedWritingPromptModal session={editingWritingPrompt} onClose={()=>setEditingWritingPrompt(null)}/>}
  </>;
}

function TextMaterialLink({ item }: { item: Extract<WeeklyMaterial, { kind: 'text' }> }) {
  const content = <><span className="block truncate text-sm font-semibold text-emerald-950">{item.text.title}</span><span className="text-xs text-emerald-800">{formatDate(item.date)}{item.text.author ? ` · ${item.text.author}` : ''}</span></>;
  if (item.text.externalUrl) return <a href={item.text.externalUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1">{content}</a>;
  if (item.text.contentMode === 'link') return <div className="min-w-0 flex-1">{content}</div>;
  return <Link to={`/texts/${item.text.$id}`} className="min-w-0 flex-1">{content}</Link>;
}

/* eslint-disable @typescript-eslint/no-unused-vars -- remove after the weekly-materials UI rollout is complete */
function PresentationLinksPanel({ links, isOwner, onAdd }: { links: PresentationLink[]; isOwner: boolean; onAdd: () => void }) {
  const [open, setOpen] = useState(true);
  return <section className="overflow-hidden rounded-xl border border-gray-200 bg-white"><button className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50" onClick={() => setOpen(value => !value)}><span className="text-lg font-semibold">{open ? '▾' : '▸'} Presentations</span><span className="text-sm text-gray-500">{links.length}</span></button>{open && <div className="border-t p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm text-gray-500">Slides and presentations assigned to this class.</p>{isOwner && <Button size="sm" onClick={onAdd}>Add</Button>}</div><div className="max-h-80 space-y-2 overflow-y-auto pr-1">{links.length ? links.map(link => <div key={link.$id} className="flex items-center gap-3 rounded-lg border p-3"><label className="flex min-w-0 flex-1 items-center gap-3"><input type="checkbox" checked={Boolean(link.watchedAt)} disabled={!isOwner} onChange={event => void setPresentationWatched(link.$id, event.target.checked)} className="h-5 w-5 rounded"/><span className="min-w-0"><a href={link.url} target="_blank" rel="noreferrer" className="block truncate font-medium text-blue-700 hover:underline" onClick={event => event.stopPropagation()}>{link.title}</a><span className="text-xs text-gray-500">{link.watchedAt ? 'Watched' : 'Not watched yet'} · {formatDate(link.assignedAt)}</span></span></label>{isOwner && <button className="text-sm text-red-600" onClick={() => window.confirm('Delete this presentation link?') && void deletePresentationLink(link.$id)}>Delete</button>}</div>) : <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No presentation links yet.</p>}</div></div>}</section>;
}

function AddPresentationModal({ sourceClassId, classes, onClose }: { sourceClassId: string; classes: Class[]; onClose: () => void }) {
  const [title, setTitle] = useState(''); const [url, setUrl] = useState(''); const [assignedAt, setAssignedAt] = useState(todayKey()); const [selected, setSelected] = useState(new Set([sourceClassId])); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const save = async () => { setBusy(true); setError(''); try { await addPresentationLinks({ title: title.trim(), url: url.trim(), classIds: [...selected], assignedAt: new Date(`${assignedAt}T12:00:00`).toISOString() }); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add presentation.'); } finally { setBusy(false); } };
  return <Modal open onClose={onClose} title="Add presentation"><div className="space-y-4">{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium">Title<input className="mt-1 w-full rounded-lg border px-3 py-2" value={title} onChange={event => setTitle(event.target.value)} /></label><label className="block text-sm font-medium">Presentation link<input className="mt-1 w-full rounded-lg border px-3 py-2" type="url" placeholder="https://…" value={url} onChange={event => setUrl(event.target.value)} /></label><label className="block text-sm font-medium">Week assigned<input className="mt-1 w-full rounded-lg border px-3 py-2" type="date" value={assignedAt} onChange={event => setAssignedAt(event.target.value)} /></label><fieldset><legend className="mb-2 text-sm font-medium">Add to classes</legend><div className="max-h-48 space-y-2 overflow-auto">{classes.map(item => <label key={item.$id} className="flex gap-2 text-sm"><input type="checkbox" checked={selected.has(item.$id)} onChange={() => setSelected(current => { const next = new Set(current); if (next.has(item.$id)) next.delete(item.$id); else next.add(item.$id); return next; })}/>{classLabel(item)}</label>)}</div></fieldset><Button className="w-full" loading={busy} disabled={!title.trim() || !/^https?:\/\//i.test(url) || !selected.size} onClick={() => void save()}>Add presentation</Button></div></Modal>;
}

function CreateWritingPromptModal({ classId, onClose, onCreated }: { classId: string; onClose: () => void; onCreated: (sessionId: string) => void }) {
  const [prompt, setPrompt] = useState(''); const [exampleResponse,setExampleResponse]=useState(''); const [promptSize,setPromptSize]=useState<WritingPromptSize>('large'); const [allowResubmission,setAllowResubmission]=useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const save = async () => { setBusy(true); setError(''); try { onCreated(await createWritingPrompt(classId, prompt, allowResubmission, promptSize, exampleResponse)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open the writing prompt.'); } finally { setBusy(false); } };
  return <Modal open onClose={onClose} title="Writing Prompt"><div className="space-y-4">{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<p className="text-sm text-gray-500">Students will write one paragraph response. You can display their answers anonymously, then save the prompt and responses into this week.</p><label className="block text-sm font-medium">Prompt<textarea autoFocus className="mt-1 w-full rounded-lg border px-3 py-3 text-base" rows={5} placeholder="What would you like students to write about?" value={prompt} onChange={event => setPrompt(event.target.value)}/></label><label className="block text-sm font-medium">Prompt text size<select className="mt-1 w-full rounded-lg border px-3 py-2" value={promptSize} onChange={event=>setPromptSize(event.target.value as WritingPromptSize)}><option value="standard">Standard</option><option value="large">Large</option><option value="extra-large">Extra large</option></select></label><label className="block text-sm font-medium">Example response <span className="font-normal text-gray-500">(optional)</span><textarea className="mt-1 w-full rounded-lg border px-3 py-3 text-base" rows={6} placeholder="Show students what a strong response might look like…" value={exampleResponse} onChange={event=>setExampleResponse(event.target.value)}/></label><label className="flex items-start gap-3 rounded-lg border p-3"><input type="checkbox" className="mt-1 h-4 w-4" checked={allowResubmission} onChange={event=>setAllowResubmission(event.target.checked)}/><span><strong className="block text-sm">Allow students to revise and resubmit</strong><span className="text-xs text-gray-500">Their newest response replaces the previous version.</span></span></label><Button className="w-full" loading={busy} disabled={!prompt.trim()} onClick={() => void save()}>Open writing prompt</Button></div></Modal>;
}

function EditSavedWritingPromptModal({session,onClose}:{session:ClassSession;onClose:()=>void}) {
  const config = writingPromptConfig(session);
  const [prompt,setPrompt]=useState(session.promptMarkdown||'');
  const [exampleResponse,setExampleResponse]=useState(config.exampleResponse);
  const [promptSize,setPromptSize]=useState<WritingPromptSize>(config.promptSize);
  const [allowResubmission,setAllowResubmission]=useState(config.allowResubmission);
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const save=async()=>{setBusy(true);setError('');try{await updateWritingPrompt(session.$id,prompt,allowResubmission,promptSize,exampleResponse);onClose();}catch(cause){setError(cause instanceof Error?cause.message:'Could not update the writing prompt.');}finally{setBusy(false);}};
  return <Modal open onClose={onClose} title="Edit writing prompt"><div className="space-y-4">{error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium">Prompt<textarea autoFocus rows={5} className="mt-1 w-full rounded-lg border px-3 py-3 text-base" value={prompt} onChange={event=>setPrompt(event.target.value)}/></label><label className="block text-sm font-medium">Prompt text size<select className="mt-1 w-full rounded-lg border px-3 py-2" value={promptSize} onChange={event=>setPromptSize(event.target.value as WritingPromptSize)}><option value="standard">Standard</option><option value="large">Large</option><option value="extra-large">Extra large</option></select></label><label className="block text-sm font-medium">Example response <span className="font-normal text-gray-500">(optional)</span><textarea rows={6} className="mt-1 w-full rounded-lg border px-3 py-3 text-base" value={exampleResponse} onChange={event=>setExampleResponse(event.target.value)}/></label><label className="flex items-start gap-3 rounded-lg border p-3"><input type="checkbox" className="mt-1 h-4 w-4" checked={allowResubmission} onChange={event=>setAllowResubmission(event.target.checked)}/><span className="text-sm font-medium">Allow students to revise and resubmit</span></label><Button className="w-full" loading={busy} disabled={!prompt.trim()} onClick={()=>void save()}>Save changes</Button></div></Modal>;
}

function writingPromptConfig(session:ClassSession):{promptSize:WritingPromptSize;exampleResponse:string;allowResubmission:boolean}{
  try { const value=JSON.parse(session.notesMarkdown||'{}') as {promptSize?:WritingPromptSize;exampleResponse?:string;allowResubmission?:boolean}; return {promptSize:['standard','large','extra-large'].includes(value.promptSize||'')?value.promptSize!:'large',exampleResponse:value.exampleResponse||'',allowResubmission:Boolean(value.allowResubmission)}; }
  catch { return {promptSize:'large',exampleResponse:'',allowResubmission:false}; }
}

function WeeklyClassReview({ materials, isOwner }: { materials: WeeklyMaterial[]; isOwner: boolean }) {
  const { user } = useAuth();
  const groups = new Map<string, WeeklyMaterial[]>();
  for (const material of materials) {
    const key = weekStart(material.date);
    groups.set(key, [...(groups.get(key) || []), material]);
  }
  const weeks = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [editingDueDate, setEditingDueDate] = useState<Extract<WeeklyMaterial, { kind: 'text' }> | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [savingDueDate, setSavingDueDate] = useState(false);
  const editDueDate = (item: Extract<WeeklyMaterial, { kind: 'text' }>) => {
    setEditingDueDate(item);
    setDueDate(item.date.slice(0, 10));
  };
  const saveDueDate = async () => {
    if (!editingDueDate || !dueDate || !user) return;
    setSavingDueDate(true);
    try {
      await setTextAssignmentDueDate(editingDueDate.assignment.$id, user.$id, new Date(`${dueDate}T12:00:00`).toISOString());
      setEditingDueDate(null);
    } finally { setSavingDueDate(false); }
  };

  return (
    <>
    <section>
      <h2 className="mb-3 text-lg font-semibold">Weekly class materials</h2>
      {weeks.length === 0 ? (
        <Card><p className="text-sm text-gray-500">Notes, writing prompts, quizzes, discussions, texts, and presentations will appear here by week.</p></Card>
      ) : (
        <div className="space-y-3">
          {weeks.map(([week, unsortedItems]) => {
            const priority: Record<WeeklyMaterial['kind'], number> = { text: 0, presentation: 1, notes: 2, writingPrompt: 3, discussion: 4, quiz: 5 };
            const items = [...unsortedItems].sort((a,b) => priority[a.kind] - priority[b.kind] || b.date.localeCompare(a.date));
            const isOpen = openWeeks.has(week);
            const counts = {
              notes: items.filter(item => item.kind === 'notes').length,
              discussions: items.filter(item => item.kind === 'discussion').length,
              texts: items.filter(item => item.kind === 'text').length,
              quizzes: items.filter(item => item.kind === 'quiz').length,
              presentations: items.filter(item => item.kind === 'presentation').length,
              writingPrompts: items.filter(item => item.kind === 'writingPrompt').length,
            };
            return (
              <div key={week} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <button className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50" onClick={() => setOpenWeeks(current => { const next = new Set(current); if (next.has(week)) next.delete(week); else next.add(week); return next; })}>
                  <span className="font-semibold">{isOpen ? '▾' : '▸'} {week === weekStart(new Date().toISOString()) ? `This week · ${formatWeek(week)}` : `Week of ${formatWeek(week)}`}</span>
                  <span className="text-xs text-gray-500">{counts.notes} notes · {counts.writingPrompts} writing prompts · {counts.discussions} discussions · {counts.texts} texts · {counts.quizzes} quizzes · {counts.presentations} presentations</span>
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t bg-gray-50 p-4">
                    {counts.texts > 0 && <CompactWeekSection title="Texts" count={counts.texts} color="emerald" open={openSections.has(`${week}-texts`)} onToggle={() => setOpenSections(current => toggleSetValue(current, `${week}-texts`))}>{items.filter((item): item is Extract<WeeklyMaterial,{kind:'text'}> => item.kind === 'text').map(item => <div key={item.assignment.$id} className="flex items-center gap-3 border-t border-emerald-100 px-4 py-2.5 hover:bg-emerald-100/50"><Link to={`/texts/${item.text.$id}`} className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-emerald-950">{item.text.title}</span><span className="text-xs text-emerald-800">Due {formatDate(item.date)}{item.text.author ? ` · ${item.text.author}` : ''}</span></Link>{isOwner&&<button className="shrink-0 text-xs font-semibold text-emerald-800 underline" onClick={()=>editDueDate(item)}>Edit due date</button>}</div>)}</CompactWeekSection>}
                    {counts.presentations > 0 && <CompactWeekSection title="Presentations" count={counts.presentations} color="fuchsia" open={openSections.has(`${week}-presentations`)} onToggle={() => setOpenSections(current => toggleSetValue(current, `${week}-presentations`))}>{items.filter((item): item is Extract<WeeklyMaterial,{kind:'presentation'}> => item.kind === 'presentation').map(item => <div key={item.presentation.$id} className="flex items-center gap-3 border-t border-fuchsia-100 px-4 py-2.5"><input aria-label={`Mark ${item.presentation.title} watched`} type="checkbox" className="h-5 w-5" checked={Boolean(item.presentation.watchedAt)} disabled={!isOwner} onChange={event=>void setPresentationWatched(item.presentation.$id,event.target.checked)}/><a href={item.presentation.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-fuchsia-950">{item.presentation.title}</span><span className="text-xs text-fuchsia-800">{item.presentation.watchedAt?'Watched':'Posted · not watched'} · {formatDate(item.date)}</span></a></div>)}</CompactWeekSection>}
                    {counts.notes > 0 && <CompactWeekSection title="Class notes" count={counts.notes} color="blue" open={openSections.has(`${week}-notes`)} onToggle={()=>setOpenSections(current=>toggleSetValue(current,`${week}-notes`))}>{items.filter((item):item is Extract<WeeklyMaterial,{kind:'notes'}>=>item.kind==='notes').map(item=><article key={item.session.$id} className="border-t border-blue-100 px-4 py-3"><p className="mb-2 text-xs font-semibold text-blue-700">{formatDate(item.date)}</p><Markdown content={item.session.publishedNotesMarkdown} className="text-base leading-7 text-gray-800" /></article>)}</CompactWeekSection>}
                    {counts.writingPrompts > 0 && <CompactWeekSection title="Writing prompts" count={counts.writingPrompts} color="cyan" open={openSections.has(`${week}-writing`)} onToggle={()=>setOpenSections(current=>toggleSetValue(current,`${week}-writing`))}>{items.filter((item):item is Extract<WeeklyMaterial,{kind:'writingPrompt'}>=>item.kind==='writingPrompt').map(item=><article key={item.session.$id} className="border-t border-cyan-100 px-4 py-3"><p className="mb-2 text-xs font-semibold text-cyan-800">{formatDate(item.date)}</p><Markdown content={item.session.publishedNotesMarkdown} className="text-sm text-gray-800" /></article>)}</CompactWeekSection>}
                    {counts.discussions > 0 && <CompactWeekSection title="Discussions" count={counts.discussions} color="violet" open={openSections.has(`${week}-discussions`)} onToggle={()=>setOpenSections(current=>toggleSetValue(current,`${week}-discussions`))}>{items.filter((item):item is Extract<WeeklyMaterial,{kind:'discussion'}>=>item.kind==='discussion').map(item=><Link key={item.session.$id} to={`/discussions/${item.session.$id}`} className="block border-t border-violet-100 px-4 py-3 hover:bg-violet-100/50"><span className="block text-sm font-semibold text-violet-950">{item.session.title}</span><span className="text-xs text-violet-800">{formatDate(item.date)}</span></Link>)}</CompactWeekSection>}
                    {counts.quizzes > 0 && <CompactWeekSection title="Quizzes" count={counts.quizzes} color="amber" open={openSections.has(`${week}-quizzes`)} onToggle={()=>setOpenSections(current=>toggleSetValue(current,`${week}-quizzes`))}>{items.filter((item):item is Extract<WeeklyMaterial,{kind:'quiz'}>=>item.kind==='quiz').map(item=><Link key={item.quiz.$id} to={`/quizzes/${item.quiz.$id}/take`} className="block border-t border-amber-100 px-4 py-3 hover:bg-amber-100/50"><span className="block text-sm font-semibold text-amber-950">{item.quiz.title}</span><span className="text-xs text-amber-800">{formatDate(item.date)}</span></Link>)}</CompactWeekSection>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
    {editingDueDate&&<Modal open onClose={()=>setEditingDueDate(null)} title="Edit text due date"><div className="space-y-4"><p className="text-sm text-gray-600">Move <strong>{editingDueDate.text.title}</strong> to a different date and week.</p><label className="block text-sm font-medium">Due date<input type="date" className="mt-1 w-full rounded-lg border px-3 py-2" value={dueDate} onChange={event=>setDueDate(event.target.value)}/></label><Button className="w-full" loading={savingDueDate} disabled={!dueDate} onClick={()=>void saveDueDate()}>Save due date</Button></div></Modal>}
    </>
  );
}

/* eslint-enable @typescript-eslint/no-unused-vars */

type WeekSectionColor = 'emerald'|'fuchsia'|'blue'|'cyan'|'violet'|'amber';
function CompactWeekSection({ title, count, color, open, onToggle, children }: { title: string; count: number; color: WeekSectionColor; open: boolean; onToggle: () => void; children: ReactNode }) {
  const styles: Record<WeekSectionColor,string> = { emerald:'border-emerald-200 bg-emerald-50 text-emerald-900', fuchsia:'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900', blue:'border-blue-200 bg-blue-50 text-blue-900', cyan:'border-cyan-200 bg-cyan-50 text-cyan-900', violet:'border-violet-200 bg-violet-50 text-violet-900', amber:'border-amber-200 bg-amber-50 text-amber-900' };
  return <section className={`overflow-hidden rounded-xl border ${styles[color]}`}><button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={onToggle}><span className="font-semibold">{open?'▾':'▸'} {title}</span><span className="text-xs font-medium">{count}</span></button>{open&&<div>{children}</div>}</section>;
}

function toggleSetValue(current: Set<string>, value: string): Set<string> { const next = new Set(current); if (next.has(value)) next.delete(value); else next.add(value); return next; }

function weekStart(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return localDateKey(date);
}

function addDays(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

function localDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatWeek(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(value: string): string {
  return new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function ClassLinksPanel({ cls, isOwner, teacherId }: { cls: Class; isOwner: boolean; teacherId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const links = parseClassLinks(cls.linksJson);

  const addLink = async () => {
    if (!teacherId || !label.trim() || !url.trim() || links.length >= MAX_CLASS_LINKS) return;
    setSaving(true); setError('');
    try {
      await saveClassLinks(cls.$id, teacherId, [...links, { label, url }]);
      setLabel(''); setUrl('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save link');
    } finally {
      setSaving(false);
    }
  };

  const removeLink = async (target: ClassLink) => {
    if (!teacherId) return;
    setSaving(true); setError('');
    try {
      await saveClassLinks(cls.$id, teacherId, links.filter(link => link.label !== target.label || link.url !== target.url));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete link');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50" onClick={() => setOpen(value => !value)}>
        <span className="text-lg font-semibold">{open ? '▾' : '▸'} Links</span>
        <span className="text-sm text-gray-500">{links.length}/{MAX_CLASS_LINKS}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t p-4">
          {links.length ? links.map(link => (
            <div key={`${link.label}-${link.url}`} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <a href={link.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-blue-700 hover:underline">{link.label}</a>
              {isOwner && <button className="text-sm text-red-600 hover:text-red-800" disabled={saving} onClick={() => void removeLink(link)}>Delete</button>}
            </div>
          )) : <p className="text-sm text-gray-500">No class links have been added yet.</p>}
          {isOwner && links.length < MAX_CLASS_LINKS && (
            <div className="grid gap-2 border-t pt-3 sm:grid-cols-[1fr_1.5fr_auto]">
              <input className="rounded-lg border px-3 py-2 text-sm" value={label} onChange={event => setLabel(event.target.value)} placeholder="Link name" maxLength={120} />
              <input className="rounded-lg border px-3 py-2 text-sm" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://…" inputMode="url" />
              <Button size="sm" loading={saving} disabled={!label.trim() || !url.trim()} onClick={() => void addLink()}>Add</Button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
