import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { StudentCardState, FlashcardReviewEvent, FlashcardStudySession } from '@/types';

interface StudentStats {
  name: string;
  email: string;
  knownCards: number;
  familiarCards: number;
  newCards: number;
  totalCards: number;
  totalStudySeconds: number;
  cardsReviewed: number;
  currentStreak: number;
  longestStreak: number;
  heatmap: Array<{ date: string; studySeconds: number; activityCount: number }>;
  deckTimes: Array<{ deckTitle: string; seconds: number; cardsReviewed: number }>;
  quizScores: Array<{ quizTitle: string; score: number; total: number; date: string }>;
}

export function StudentProgressPage() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId || !studentId) return;
    loadStats(classId, studentId).then(s => { setStats(s); setLoading(false); });
  }, [classId, studentId]);

  if (loading) return <div className="p-4 text-gray-400">Loading student progress...</div>;
  if (!stats) return <div className="p-4 text-gray-400">Student not found.</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">Back</button>
        <div>
          <h1 className="text-2xl font-bold">{stats.name}</h1>
          <p className="text-sm text-gray-500">{stats.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Known" value={stats.knownCards} color="green" />
        <StatCard label="Familiar" value={stats.familiarCards} color="yellow" />
        <StatCard label="New" value={stats.newCards} color="blue" />
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Study heatmap</h2>
        <ProgressHeatmap days={stats.heatmap} />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">
            {stats.currentStreak > 0 ? `${stats.currentStreak}-day streak` : 'No streak'}
          </span>
          <span className="text-slate-500">Longest: {stats.longestStreak} days</span>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Study time by deck</h2>
        {stats.deckTimes.length > 0 ? (
          <div className="space-y-3">
            {stats.deckTimes.map((dt, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{dt.deckTitle}</p>
                  <p className="text-xs text-gray-500">{dt.cardsReviewed} cards reviewed</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{formatMinutes(dt.seconds)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No study time recorded.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Total study time</h2>
        <div className="text-3xl font-bold text-blue-600">{formatMinutes(stats.totalStudySeconds)}</div>
        <p className="text-sm text-gray-500">{stats.cardsReviewed} cards reviewed total</p>
      </Card>

      {stats.quizScores.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-3">Quiz scores</h2>
          <div className="space-y-3">
            {stats.quizScores.map((qs, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{qs.quizTitle}</p>
                  <p className="text-xs text-gray-500">{qs.date}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {qs.score}/{qs.total} ({Math.round((qs.score / qs.total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'green' | 'yellow' | 'blue' }) {
  const colors = { green: 'bg-green-50 text-green-700', yellow: 'bg-yellow-50 text-yellow-700', blue: 'bg-blue-50 text-blue-700' };
  return (
    <div className={`rounded-xl p-4 text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

function formatMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function ProgressHeatmap({ days }: { days: Array<{ date: string; studySeconds: number; activityCount: number }> }) {
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function heatLevel(minutes: number, activityCount: number): number {
    if (activityCount === 0) return 0;
    if (minutes >= 20) return 4;
    if (minutes >= 10) return 3;
    if (minutes >= 3) return 2;
    return 1;
  }

  return (
    <div className="heatmap-with-labels">
      <div className="heatmap-weekdays" aria-hidden="true">
        {weekdayLabels.map(label => <span key={label}>{label}</span>)}
      </div>
      <div className="heatmap-grid">
        {days.map(day => {
          const minutes = day.studySeconds / 60;
          const level = heatLevel(minutes, day.activityCount);
          return (
            <span
              key={day.date}
              className={`heat-cell heat-${level}`}
              title={`${day.date}: ${minutes.toFixed(1)} min`}
            />
          );
        })}
      </div>
    </div>
  );
}

async function loadStats(classId: string, studentId: string): Promise<StudentStats | null> {
  const user = await db.users.get(studentId);
  if (!user) return null;

  const deckAssignments = await db.deck_assignments.where('classId').equals(classId).toArray();
  const deckIds = [...new Set(deckAssignments.map(a => a.deckId))];

  const cards = deckIds.length
    ? await db.flashcard_cards.where('deckId').anyOf(deckIds).toArray()
    : [];
  const states = await db.student_card_state
    .where('userId').equals(studentId)
    .and(s => deckIds.includes(s.deckId))
    .toArray();
  const stateByCard = new Map(states.map(s => [s.cardId, s]));

  let knownCards = 0, familiarCards = 0;
  for (const card of cards) {
    const state = stateByCard.get(card.$id);
    if (!state || state.reviewCount === 0) continue;
    if ((state.intervalDays || 0) >= 14) knownCards++;
    else familiarCards++;
  }

  const events = await db.flashcard_review_events.where('userId').equals(studentId).toArray();
  const sessions = await db.flashcard_study_sessions.where('userId').equals(studentId).toArray();

  const totalStudySeconds = sessions.reduce((sum, s) => sum + (s.activeSeconds || 0), 0) + events.length * 5;
  const cardsReviewed = events.length;

  const heatmap = buildStudyHeatmap(events, sessions, 84);
  const streak = calculateStreak(heatmap);
  const longest = calculateLongestStreak(heatmap);

  const deckTimes: Array<{ deckTitle: string; seconds: number; cardsReviewed: number }> = [];
  for (const deckId of deckIds) {
    const deck = await db.flashcard_decks.get(deckId);
    const deckEvents = events.filter(e => e.deckId === deckId);
    const deckSessions = sessions.filter(s => s.deckId === deckId);
    const seconds = deckSessions.reduce((sum, s) => sum + (s.activeSeconds || 0), 0) + deckEvents.length * 5;
    if (seconds > 0) {
      deckTimes.push({ deckTitle: deck?.title || 'Unknown', seconds, cardsReviewed: deckEvents.length });
    }
  }

  const quizAttempts = await db.quiz_attempts.where('userId').equals(studentId).toArray();
  const quizScores: Array<{ quizTitle: string; score: number; total: number; date: string }> = [];
  for (const attempt of quizAttempts) {
    if (!attempt.completedAt) continue;
    const quiz = await db.quizzes.get(attempt.quizId);
    if (quiz && quiz.classId === classId) {
      quizScores.push({
        quizTitle: quiz.title,
        score: attempt.score,
        total: attempt.totalQuestions,
        date: attempt.completedAt.slice(0, 10),
      });
    }
  }

  return {
    name: user.name,
    email: user.email,
    knownCards,
    familiarCards,
    newCards: Math.max(0, cards.length - knownCards - familiarCards),
    totalCards: cards.length,
    totalStudySeconds,
    cardsReviewed,
    currentStreak: streak,
    longestStreak: longest,
    heatmap,
    deckTimes,
    quizScores,
  };
}

function buildStudyHeatmap(
  events: FlashcardReviewEvent[],
  sessions: FlashcardStudySession[],
  days: number,
): Array<{ date: string; studySeconds: number; activityCount: number }> {
  const map = new Map<string, { studySeconds: number; activityCount: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), { studySeconds: 0, activityCount: 0 });
  }
  for (const event of events) {
    const key = event.reviewedAt.slice(0, 10);
    const entry = map.get(key);
    if (entry) { entry.activityCount++; entry.studySeconds += 5; }
  }
  for (const session of sessions) {
    const key = session.startedAt.slice(0, 10);
    const entry = map.get(key);
    if (entry) entry.studySeconds += session.activeSeconds || 0;
  }
  return Array.from(map.entries()).map(([date, data]) => ({
    date, studySeconds: Math.round(data.studySeconds), activityCount: data.activityCount,
  }));
}

function calculateStreak(heatmap: Array<{ date: string; activityCount: number }>): number {
  const sorted = [...heatmap].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const key = checkDate.toISOString().slice(0, 10);
    const day = sorted.find(d => d.date === key);
    if (day && day.activityCount > 0) streak++;
    else if (key !== today) break;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

function calculateLongestStreak(heatmap: Array<{ date: string; activityCount: number }>): number {
  const sorted = [...heatmap].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0, current = 0;
  for (const day of sorted) {
    if (day.activityCount > 0) { current++; if (current > longest) longest = current; }
    else current = 0;
  }
  return longest;
}
