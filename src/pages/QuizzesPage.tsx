import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getApiKey, generateQuizFromSources, type QuizQuestion as AIQuizQuestion } from '@/services/ai.service';
import { createQuiz, generateQuizQuestions, publishQuiz, getClassQuizzes, getAllQuizAttemptsForQuiz } from '@/services/quiz.service';
import { ID } from 'appwrite';
import { getTimestamp } from '@/utils/helpers';
import { addToQueue } from '@/services/sync.service';
import type { Quiz, QuizQuestion as QuizQuestionType, QuizAttempt } from '@/types';
import { Modal } from '@/components/common/Modal';
import { DailyCanvasQuizModal } from '@/components/quizzes/DailyCanvasQuizModal';

export function QuizzesPage() {
  const { user, isTeacher } = useAuth();
  if (!user) return null;

  return isTeacher ? <TeacherQuizzes /> : <StudentQuizzes />;
}

function TeacherQuizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  const classes = useLiveQuery(
    () => db.classes.where('teacherId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const quizzes = useLiveQuery(async () => {
    if (!classes || classes.length === 0) return [];
    const classIds = classes.map(c => c.$id);
    const allQuizzes: Array<{ quiz: Quiz; className: string; attemptCount: number; avgScore: number | null }> = [];
    for (const cls of classes) {
      const classQuizzes = await getClassQuizzes(cls.$id);
      for (const quiz of classQuizzes) {
        const attempts = await getAllQuizAttemptsForQuiz(quiz.$id);
        const completed = attempts.filter(a => a.completedAt);
        const avgScore = completed.length > 0
          ? Math.round(completed.reduce((sum, a) => sum + (a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0), 0) / completed.length)
          : null;
        allQuizzes.push({ quiz, className: cls.name, attemptCount: completed.length, avgScore });
      }
    }
    return allQuizzes.sort((a, b) => b.quiz.createdAt.localeCompare(a.quiz.createdAt));
  }, [classes]);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-gray-500 text-sm">Generate and manage quizzes for your classes.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCanvas(true)} variant="secondary">Daily Canvas quiz</Button>
          <Button onClick={() => setShowCreate(true)}>Create quiz</Button>
        </div>
      </div>

      {quizzes && quizzes.length > 0 ? (
        <div className="space-y-3">
          {quizzes.map(({ quiz, className, attemptCount, avgScore }) => (
            <Card key={quiz.$id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{quiz.title}</h3>
                  <p className="text-sm text-gray-500">{className} · {quiz.questionCount} questions</p>
                </div>
                <StatusBadge status={quiz.status} />
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                <span>{attemptCount} attempts</span>
                {avgScore !== null && <span>Avg: {avgScore}%</span>}
                <span className="text-xs text-gray-400">
                  {quiz.notesWeight}% notes / {quiz.flashcardWeight}% flashcards
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {quiz.status === 'draft' && (
                  <Button size="sm" onClick={() => void publishQuiz(quiz.$id, user!.$id)}>Publish</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No quizzes yet"
          message="Create a quiz to test your students' understanding."
          action={<Button onClick={() => setShowCreate(true)}>Create your first quiz</Button>}
        />
      )}

      {showCreate && classes && (
        <CreateQuizModal
          classes={classes.map(c => ({ id: c.$id, name: c.name }))}
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}

      {showCanvas && classes && (
        <DailyCanvasQuizModal
          classes={classes.map(c => ({ id: c.$id, name: c.name }))}
          userId={user!.$id}
          onClose={() => setShowCanvas(false)}
        />
      )}
    </div>
  );
}

function CreateQuizModal({
  classes,
  onClose,
  onCreated,
}: {
  classes: Array<{ id: string; name: string }>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [title, setTitle] = useState('');
  const [notesWeight, setNotesWeight] = useState(50);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'config' | 'generating' | 'review'>('config');
  const [generatedQuestions, setGeneratedQuestions] = useState<AIQuizQuestion[]>([]);
  const [quizId, setQuizId] = useState('');

  const handleGenerate = async () => {
    if (!user || !classId) return;
    setGenerating(true);
    setError('');
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('No API key configured. Add one in Settings.');
        return;
      }

      const sessions = await db.class_sessions.where('classId').equals(classId).toArray();
      const notes = sessions.map(s => s.publishedNotesMarkdown || s.notesMarkdown).filter(Boolean).join('\n\n');

      const deckAssignments = await db.deck_assignments.where('classId').equals(classId).toArray();
      const deckIds = [...new Set(deckAssignments.map(a => a.deckId))];
      const cards = deckIds.length
        ? await db.flashcard_cards.where('deckId').anyOf(deckIds).toArray()
        : [];
      const flashcardFronts = cards.map(c => c.frontMarkdown || c.front);

      const aiQuestions = await generateQuizFromSources(
        notes,
        flashcardFronts,
        questionCount,
        { notes: notesWeight, flashcards: 100 - notesWeight },
        apiKey,
      );

      setGeneratedQuestions(aiQuestions);

      const quiz = await createQuiz({
        classId,
        createdBy: user.$id,
        title: title || `Quiz - ${new Date().toLocaleDateString()}`,
        sourceType: notesWeight === 100 ? 'discussion' : notesWeight === 0 ? 'flashcards' : 'mixed',
        notesWeight,
        flashcardWeight: 100 - notesWeight,
        questionCount,
        timeLimitMinutes: timeLimit,
      });
      setQuizId(quiz.$id);

      for (let i = 0; i < aiQuestions.length; i++) {
        const q = aiQuestions[i];
        const question = {
          $id: ID.unique(),
          quizId: quiz.$id,
          type: q.type,
          questionText: q.questionText,
          options: q.options ? JSON.stringify(q.options) : '[]',
          correctIndex: q.correctIndex ?? 0,
          clozeAnswer: q.clozeAnswer || '',
          explanation: q.explanation,
          sortOrder: i,
        };
        await db.quiz_questions.put(question);
        await addToQueue(user.$id, 'quiz_question', question.$id, 'create', question);
      }

      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !quizId) return;
    await publishQuiz(quizId, user.$id);
    onCreated();
  };

  if (step === 'review') {
    return (
      <Modal open onClose={onClose} title="Review Quiz">
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          <p className="text-sm text-gray-500">{generatedQuestions.length} questions generated. Review before publishing.</p>
          {generatedQuestions.map((q, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">Q{i + 1}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{q.type === 'mc' ? 'Multiple Choice' : 'Cloze'}</span>
              </div>
              <p className="text-sm font-medium">{q.questionText}</p>
              {q.type === 'mc' && q.options && (
                <ul className="text-sm text-gray-600 space-y-1">
                  {q.options.map((opt, j) => (
                    <li key={j} className={j === q.correctIndex ? 'text-green-600 font-medium' : ''}>
                      {String.fromCharCode(65 + j)}. {opt}
                      {j === q.correctIndex && ' ✓'}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === 'cloze' && (
                <p className="text-sm text-green-600">Answer: {q.clozeAnswer}</p>
              )}
              <p className="text-xs text-gray-500">{q.explanation}</p>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button onClick={handlePublish}>Publish quiz</Button>
            <Button onClick={onClose} variant="secondary">Cancel</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Create Quiz">
      <div className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quiz title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Chapter 3 Quiz"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source weight: {notesWeight}% notes / {100 - notesWeight}% flashcards
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={notesWeight}
            onChange={e => setNotesWeight(Number(e.target.value))}
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
              {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} min</option>)}
            </select>
          </div>
        </div>

        <Button onClick={handleGenerate} loading={generating} className="w-full">
          Generate quiz
        </Button>
      </div>
    </Modal>
  );
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
      const classQuizzes = await db.quizzes.where('classId').equals(classId).and(q => q.status === 'published').toArray();
      for (const quiz of classQuizzes) {
        const attempts = await db.quiz_attempts.where('quizId').equals(quiz.$id).and(a => a.userId === user!.$id).toArray();
        const completed = attempts.find(a => a.completedAt);
        result.push({ quiz, className: cls?.name || 'Class', myAttempt: completed || null });
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
