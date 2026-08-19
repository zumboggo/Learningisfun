import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import {
  RECENT_WINDOW_DAYS,
  previewFlashcardQuiz,
  saveFlashcardQuiz,
  type FlashcardQuizPreview,
} from '@/services/quiz.service';
import { classLabel } from '@/utils/helpers';
import type { Quiz, QuizAttempt } from '@/types';
import { Modal } from '@/components/common/Modal';

export function QuizzesPage() {
  const { user, isTeacher } = useAuth();
  if (!user) return null;

  return isTeacher ? <Navigate to="/classes" replace /> : <StudentQuizzes />;
}

export function CreateQuizModal({
  classes,
  sourceClassId,
  onClose,
  onCreated,
}: {
  classes: Array<{ id: string; name: string }>;
  sourceClassId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const classId = sourceClassId;
  const [classIds, setClassIds] = useState<Set<string>>(new Set([sourceClassId]));
  const [recentWeight, setRecentWeight] = useState(60);
  const [mcWeight, setMcWeight] = useState(60);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'config' | 'review'>('config');
  const [preview, setPreview] = useState<FlashcardQuizPreview | null>(null);

  const handlePreview = async () => {
    if (!classId) { setError('Pick a class first.'); return; }
    setBusy(true);
    setError('');
    try {
      setPreview(await previewFlashcardQuiz({
        classId,
        questionCount,
        recentWeight,
        multipleChoiceWeight: mcWeight,
      }));
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the quiz.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!user || !preview) return;
    setBusy(true);
    setError('');
    try {
      await saveFlashcardQuiz({
        classId,
        classIds: [...classIds],
        createdBy: user.$id,
        title: defaultQuizTitle(),
        timeLimitMinutes: timeLimit || null,
        recentWeight,
        preview,
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the quiz.');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'review' && preview) {
    const { summary } = preview.result;
    return (
      <Modal open onClose={onClose} title="Review quiz">
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

          <div className="text-sm text-gray-600">
            <p>
              {summary.produced} questions · {summary.fromToday} from the last {RECENT_WINDOW_DAYS} days,{' '}
              {summary.fromReview} from earlier in the course
            </p>
            <p className="text-xs text-gray-400">
              Card pool: {preview.pools.recent} recent, {preview.pools.older} earlier
            </p>
          </div>

          {summary.produced < summary.requested && (
            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg">
              Asked for {summary.requested} questions but only {summary.produced} could be built from these cards.
              {summary.skipped.length > 0 && (
                <ul className="mt-1 list-disc list-inside">
                  {summary.skipped.map(s => <li key={s.cardId}>{s.front} — {s.reason}</li>)}
                </ul>
              )}
            </div>
          )}

          {preview.result.questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">Q{i + 1}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {q.type === 'mc' ? 'Multiple choice' : 'Fill in the blank'}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  {q.bucket === 'today' ? 'recent' : 'review'}
                </span>
              </div>
              <p className="text-sm font-medium whitespace-pre-line">{q.questionText}</p>
              {q.type === 'mc' && (
                <ul className="text-sm text-gray-600 space-y-1">
                  {q.options.map((opt, j) => (
                    <li key={j} className={j === q.correctIndex ? 'text-green-600 font-medium' : ''}>
                      {String.fromCharCode(65 + j)}. {opt}
                      {j === q.correctIndex && ' ✓'}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === 'cloze' && q.cloze && (
                <div className="text-sm">
                  <p className="font-medium text-green-600">Answer: {q.cloze.primary}</p>
                  {q.cloze.variants.length > 0 && (
                    <p className="text-xs text-gray-500">Also accepted: {q.cloze.variants.join(', ')}</p>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 whitespace-pre-line">{q.explanation}</p>
            </div>
          ))}

          <div className="sticky bottom-0 flex flex-wrap gap-2 bg-white pt-2">
            <Button onClick={() => void handleSave()} loading={busy}>Save quiz</Button>
            <Button onClick={() => setStep('config')} variant="ghost">Back</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Create quiz">
      <div className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          Questions are built from <strong>{classes.find(item => item.id === classId)?.name}</strong> flashcards. Wrong answers are always real backs from
          other cards, so nothing is invented.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign to classes</label>
          <div className="space-y-2">{classes.map(c => <label key={c.id} className="flex gap-2 text-sm"><input type="checkbox" disabled={c.id === classId} checked={classIds.has(c.id)} onChange={() => setClassIds(old => { const next = new Set(old); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next; })}/>{c.name}{c.id === classId ? ' (source)' : ''}</label>)}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card mix: {recentWeight}% from the last {RECENT_WINDOW_DAYS} days / {100 - recentWeight}% from the whole course
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={recentWeight}
            onChange={e => setRecentWeight(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-400">
            The course half still favours recent teaching, so last week comes up more often than last term.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question types: {mcWeight}% multiple choice / {100 - mcWeight}% fill-in-the-blank
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={mcWeight}
            onChange={e => setMcWeight(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
            <select
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time limit</label>
            <select
              value={timeLimit}
              onChange={e => setTimeLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={0}>None</option>
              {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} min</option>)}
            </select>
          </div>
        </div>

        <Button onClick={() => void handlePreview()} loading={busy} className="w-full">
          Preview quiz
        </Button>
      </div>
    </Modal>
  );
}

function defaultQuizTitle(date = new Date()): string {
  const day = date.getDate();
  const remainder = day % 100;
  const suffix = remainder >= 11 && remainder <= 13 ? 'th' : day % 10 === 1 ? 'st' : day % 10 === 2 ? 'nd' : day % 10 === 3 ? 'rd' : 'th';
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${month}. ${day}${suffix}`;
}

function StudentQuizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const memberships = useLiveQuery(
    () => db.class_members.where('userId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const quizzes = useLiveQuery(async () => {
    if (!memberships || memberships.length === 0) return [];
    const classIds = memberships.map(m => m.classId);
    const result: Array<{ quiz: Quiz; className: string; myAttempt: QuizAttempt | null }> = [];
    for (const classId of classIds) {
      const cls = await db.classes.get(classId);
      const assignments = await db.quiz_assignments.where('classId').equals(classId).toArray();
      const assignedIds = [...new Set(assignments.map(assignment => assignment.quizId))];
      const classQuizzes = assignedIds.length
        ? (await db.quizzes.where('$id').anyOf(assignedIds).toArray()).filter(q => q.status === 'published')
        : [];
      for (const quiz of classQuizzes) {
        const attempts = await db.quiz_attempts.where('quizId').equals(quiz.$id).and(a => a.userId === user!.$id).toArray();
        const completed = attempts.find(a => a.completedAt);
        result.push({ quiz, className: classLabel(cls), myAttempt: completed || null });
      }
    }
    return result.sort((a, b) => b.quiz.createdAt.localeCompare(a.quiz.createdAt));
  }, [memberships]);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <p className="text-gray-500 text-sm">Take quizzes assigned by your teacher.</p>
      </div>

      {quizzes && quizzes.length > 0 ? (
        <div className="space-y-3">
          {quizzes.map(({ quiz, className, myAttempt }) => (
            <Card key={quiz.$id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{quiz.title}</h3>
                  <p className="text-sm text-gray-500">{className} · {quiz.questionCount} questions</p>
                </div>
                {myAttempt ? (
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {myAttempt.score}/{myAttempt.totalQuestions}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((myAttempt.score / myAttempt.totalQuestions) * 100)}%
                    </div>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => navigate(`/quizzes/${quiz.$id}/take`)}>
                    Start
                  </Button>
                )}
              </div>
              {quiz.timeLimitMinutes && (
                <p className="text-xs text-gray-400 mt-2">{quiz.timeLimitMinutes} min time limit</p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No quizzes yet"
          message="Your teacher hasn't published any quizzes yet."
        />
      )}
    </div>
  );
}
