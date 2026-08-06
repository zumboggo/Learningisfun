import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { getQuizWithQuestions, startQuizAttempt, submitQuizAttempt } from '@/services/quiz.service';
import type { Quiz, QuizQuestion } from '@/types';
import { Confetti } from '@/pages/FlashcardReviewPage';

export function QuizTakingPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [attemptId, setAttemptId] = useState('');
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ score: number; total: number; results: Array<{ correct: boolean; explanation: string }> } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!quizId) return;
    getQuizWithQuestions(quizId).then(data => {
      if (data) {
        setQuiz(data.quiz);
        setQuestions(data.questions);
        if (data.quiz.timeLimitMinutes) {
          setTimeLeft(data.quiz.timeLimitMinutes * 60);
        }
      }
      setLoading(false);
    });
  }, [quizId]);

  useEffect(() => {
    if (!started || submitted || timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, submitted]);

  const handleStart = async () => {
    if (!user || !quizId) return;
    const attempt = await startQuizAttempt(quizId, user.$id);
    setAttemptId(attempt.$id);
    setStarted(true);
  };

  const handleAnswer = (questionId: string, answer: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const answerArray = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
    const result = await submitQuizAttempt(attemptId, answerArray);
    setResults(result);
    setSubmitted(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-4 text-gray-400">Loading quiz...</div>;
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">Quiz not found or has no questions.</p>
          <Button onClick={() => navigate('/quizzes')} className="mt-4">Back to quizzes</Button>
        </div>
      </div>
    );
  }

  if (submitted && results) {
    const pct = Math.round((results.score / results.total) * 100);
    return (
      <div className="p-4 max-w-lg mx-auto">
        {pct >= 80 && <Confetti />}
        <Card>
          <div className="text-center py-4">
            <div className="text-5xl mb-3">{pct >= 80 ? '🎉' : pct >= 50 ? '📝' : '📚'}</div>
            <h2 className="text-2xl font-bold mb-2">Quiz complete!</h2>
            <div className="text-4xl font-bold text-blue-600 mb-1">{results.score}/{results.total}</div>
            <p className="text-gray-500 mb-6">{pct}% correct</p>

            <div className="space-y-3 text-left mb-6">
              {results.results.map((r, i) => (
                <div key={i} className={`rounded-lg p-3 ${r.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${r.correct ? 'text-green-700' : 'text-red-700'}`}>
                      Q{i + 1} {r.correct ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{r.explanation}</p>
                </div>
              ))}
            </div>

            <Button onClick={() => navigate('/quizzes')} className="w-full">Back to quizzes</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <button onClick={() => navigate('/quizzes')} className="text-gray-500 mb-4">Back</button>
        <Card>
          <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-gray-500 mb-4">{questions.length} questions</p>
          {quiz.timeLimitMinutes && (
            <p className="text-sm text-orange-600 mb-4">Time limit: {quiz.timeLimitMinutes} minutes</p>
          )}
          <Button onClick={handleStart} className="w-full" size="lg">Start quiz</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/quizzes')} className="text-gray-500">Exit</button>
        <span className="text-sm text-gray-400">
          {Object.keys(answers).length} / {questions.length} answered
        </span>
        {timeLeft !== null && (
          <span className={`text-sm font-mono font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
            {formatTime(timeLeft)}
          </span>
        )}
      </div>

      <div className="mb-4 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
        />
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.$id}
            question={q}
            index={i}
            answer={answers[q.$id]}
            onAnswer={(answer) => handleAnswer(q.$id, answer)}
          />
        ))}
      </div>

      <div className="mt-6 sticky bottom-4">
        <Button
          onClick={handleSubmit}
          className="w-full"
          size="lg"
          disabled={Object.keys(answers).length === 0}
        >
          Submit quiz ({Object.keys(answers).length}/{questions.length})
        </Button>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: QuizQuestion;
  index: number;
  answer: number | string | undefined;
  onAnswer: (answer: number | string) => void;
}) {
  const options: string[] = (() => {
    try { return JSON.parse(question.options); }
    catch { return []; }
  })();

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
          {question.type === 'mc' ? 'Multiple Choice' : 'Fill in the blank'}
        </span>
      </div>

      <p className="font-medium mb-4">{question.questionText}</p>

      {question.type === 'mc' && options.length > 0 && (
        <div className="space-y-2">
          {options.map((opt, j) => (
            <button
              key={j}
              onClick={() => onAnswer(j)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                answer === j
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === 'cloze' && (
        <input
          value={typeof answer === 'string' ? answer : ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      )}
    </Card>
  );
}
