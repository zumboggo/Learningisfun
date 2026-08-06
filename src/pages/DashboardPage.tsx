import { useMemo, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { GoalRing } from '@/components/common/GoalRing';
import { StatusBadge } from '@/components/common/StatusBadge';
import { joinClass } from '@/services/class.service';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { getNextMilestone, getPreviousMilestone } from '@/services/progress-utils';
import type { Class, ClassSession, DeckAssignment, FlashcardDeck, StudentCardState, FlashcardReviewEvent, FlashcardStudySession } from '@/types';

interface DeckAction {
  assignment: DeckAssignment;
  deck: FlashcardDeck | undefined;
}

export function DashboardPage() {
  const { user, isTeacher } = useAuth();
  if (!user) return null;

  return isTeacher ? <TeacherDashboard /> : <StudentDashboard />;
}

const WORD_MILESTONES = [25, 50, 100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000];

function useCountUp(value: number, durationMs = 500): number {
  const [displayed, setDisplayed] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - t) * (1 - t);
      const next = Math.round(from + (value - from) * eased);
      setDisplayed(next);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, value]);
  return displayed;
}

function heatLevel(minutes: number, activityCount: number): number {
  if (activityCount === 0) return 0;
  if (minutes >= 20) return 4;
  if (minutes >= 10) return 3;
  if (minutes >= 3) return 2;
  return 1;
}

function friendlyDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function MilestoneJourney({ wordsKnown, leveledUpThisWeek }: { wordsKnown: number; leveledUpThisWeek: number }) {
  const nextMilestone = WORD_MILESTONES.find(m => m > wordsKnown) ?? WORD_MILESTONES[WORD_MILESTONES.length - 1];
  const previousMilestone = [...WORD_MILESTONES].reverse().find(m => m <= wordsKnown) ?? 0;
  const span = Math.max(1, nextMilestone - previousMilestone);
  const fillFraction = Math.min(1, Math.max(0, (wordsKnown - previousMilestone) / span));
  const remaining = Math.max(0, nextMilestone - wordsKnown);
  const displayedKnown = useCountUp(wordsKnown);

  return (
    <div className="milestone-journey">
      <div className="milestone-journey-headline">
        <strong className="milestone-journey-count">{displayedKnown}</strong>
        <span className="milestone-journey-label">words known</span>
        {leveledUpThisWeek > 0 && (
          <span className="milestone-journey-delta">▲ {leveledUpThisWeek} moved up this week</span>
        )}
      </div>
      <div className="milestone-journey-bar">
        <div className="milestone-journey-fill" style={{ width: `${fillFraction * 100}%` }} />
      </div>
      <div className="milestone-journey-legend">
        <span>{previousMilestone}</span>
        <span className="milestone-journey-next">
          {remaining > 0 ? `${remaining} to go` : 'Milestone reached!'}
        </span>
        <span>{nextMilestone}</span>
      </div>
    </div>
  );
}

function ProgressHeatmap({ days }: { days: Array<{ date: string; studySeconds: number; activityCount: number }> }) {
  const totalMinutes = days.reduce((sum, day) => sum + day.studySeconds, 0) / 60;
  const activeDays = days.filter(day => day.activityCount > 0).length;
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="progress-heatmap">
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
                title={`${friendlyDate(day.date)}: ${minutes.toFixed(1)} min, ${day.activityCount} events`}
              />
            );
          })}
        </div>
      </div>
      <div className="heatmap-caption">
        <span>{activeDays} study days</span>
        <span>{totalMinutes.toFixed(0)} minutes tracked</span>
      </div>
    </div>
  );
}

function getEncouragement(flashcardsToday: number, knownCards: number): string | null {
  if (flashcardsToday >= 60) return `You reviewed ${flashcardsToday} cards today. That's 2x your daily flashcard goal.`;
  if (flashcardsToday >= 30) return `Daily flashcard goal reached: ${flashcardsToday} cards reviewed.`;
  if (knownCards >= 50) return `Great work — you've mastered ${knownCards} words!`;
  return null;
}

function StudentDashboard() {
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const navigate = useNavigate();

  const memberships = useLiveQuery(
    () => db.class_members.where('userId').equals(user!.$id).toArray(),
    [user?.$id],
  );
  const classIds = useMemo(() => memberships?.map(c => c.classId) || [], [memberships]);

  const today = new Date().toISOString().slice(0, 10);

  const progress = useLiveQuery(async () => {
    if (!user || classIds.length === 0) {
      return {
        totalCards: 0, knownCards: 0, familiarCards: 0, newCards: 0,
        movedThisWeek: 0, nextGoal: 50, flashcardsToday: 0,
        studySecondsToday: 0, studySecondsWeek: 0, studySecondsAll: 0,
        cardsWeek: 0, cardsAll: 0,
        currentStreak: 0, longestStreak: 0,
        studyHeatmap: [] as Array<{ date: string; studySeconds: number; activityCount: number }>,
      };
    }
    const deckAssignments = await db.deck_assignments.where('classId').anyOf(classIds).toArray();
    const deckIds = [...new Set(deckAssignments.map(a => a.deckId))];

    const cards = deckIds.length
      ? await db.flashcard_cards.where('deckId').anyOf(deckIds).toArray()
      : [];
    const states = await db.student_card_state
      .where('userId').equals(user.$id)
      .and(s => deckIds.includes(s.deckId))
      .toArray();
    const stateByCard = new Map(states.map(s => [s.cardId, s]));

    let knownCards = 0;
    let familiarCards = 0;
    for (const card of cards) {
      const state = stateByCard.get(card.$id);
      if (!state || state.reviewCount === 0) continue;
      if ((state.intervalDays || 0) >= 14) knownCards++;
      else familiarCards++;
    }

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const movedThisWeek = states.filter(s => s.lastReviewAt >= weekAgo.toISOString() && (s.intervalDays || 0) >= 1).length;

    const nextGoal = getNextMilestone(knownCards);

    const [events, sessions] = await Promise.all([
      db.flashcard_review_events.where('userId').equals(user.$id).toArray(),
      db.flashcard_study_sessions.where('userId').equals(user.$id).toArray(),
    ]);

    const todayEvents = events.filter(e => e.reviewedAt.slice(0, 10) === today);
    const todaySessions = sessions.filter(s => s.startedAt.slice(0, 10) === today);
    const flashcardsToday = todayEvents.length;
    const studySecondsToday = todaySessions.reduce((sum, s) => sum + (s.activeSeconds || 0), 0) + todayEvents.length * 5;

    const weekCutoff = new Date(Date.now() - 7 * 86400000).toISOString();
    const weekEvents = events.filter(e => e.reviewedAt >= weekCutoff);
    const weekSessions = sessions.filter(s => s.startedAt >= weekCutoff);
    const studySecondsWeek = weekSessions.reduce((sum, s) => sum + (s.activeSeconds || 0), 0) + weekEvents.length * 5;
    const cardsWeek = weekEvents.length;

    const cardsAll = events.length;
    const studySecondsAll = sessions.reduce((sum, s) => sum + (s.activeSeconds || 0), 0) + events.length * 5;

    // Build heatmap
    const heatmap = buildStudyHeatmap(events, sessions, 84);
    const streak = calculateStreak(heatmap);
    const longest = calculateLongestStreak(heatmap);

    return {
      totalCards: cards.length,
      knownCards,
      familiarCards,
      newCards: Math.max(0, cards.length - knownCards - familiarCards),
      movedThisWeek,
      nextGoal,
      flashcardsToday,
      studySecondsToday,
      studySecondsWeek,
      studySecondsAll,
      cardsWeek,
      cardsAll,
      currentStreak: streak,
      longestStreak: longest,
      studyHeatmap: heatmap,
    };
  }, [user?.$id, classIds]);

  const doNow = useLiveQuery(async () => {
    if (!user || classIds.length === 0) return { sessions: [], decks: [] };
    const [sessions, deckAssignments] = await Promise.all([
      db.class_sessions.where('classId').anyOf(classIds).and(s => s.status === 'active').toArray(),
      db.deck_assignments.where('classId').anyOf(classIds).toArray(),
    ]);
    const decks: DeckAction[] = [];
    for (const assignment of deckAssignments) {
      decks.push({ assignment, deck: await db.flashcard_decks.get(assignment.deckId) });
    }
    return {
      sessions: sessions.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)),
      decks: decks.sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt)),
    };
  }, [user?.$id, classIds]);

  useEffect(() => {
    if (!progress) return;
    const msg = getEncouragement(progress.flashcardsToday, progress.knownCards);
    if (msg && msg !== encouragement) {
      setEncouragement(msg);
      const timer = window.setTimeout(() => setEncouragement(null), 5000);
      return () => window.clearTimeout(timer);
    }
  }, [progress?.flashcardsToday, progress?.knownCards]);

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const result = await joinClass(user.$id, joinCode.trim().toUpperCase());
      if (!result) setJoinError('Invalid or expired class code');
      else { setShowJoin(false); setJoinCode(''); }
    } catch {
      setJoinError('Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  const stats = progress || {
    totalCards: 0, knownCards: 0, familiarCards: 0, newCards: 0,
    movedThisWeek: 0, nextGoal: 50, flashcardsToday: 0,
    studySecondsToday: 0, studySecondsWeek: 0, studySecondsAll: 0,
    cardsWeek: 0, cardsAll: 0,
    currentStreak: 0, longestStreak: 0,
    studyHeatmap: [],
  };

  const previousMilestone = getPreviousMilestone(stats.knownCards);
  const span = Math.max(1, stats.nextGoal - previousMilestone);
  const progressPercent = Math.min(100, span > 0 ? ((stats.knownCards - previousMilestone) / span) * 100 : 0);
  const wordsToGoal = Math.max(0, stats.nextGoal - stats.knownCards);

  return (
    <div className="student-home mx-auto min-h-screen max-w-5xl px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <section className="student-home-hero" aria-label="Learning is Fun">
        <div className="hero-content-overlay">
          <MilestoneJourney wordsKnown={stats.knownCards} leveledUpThisWeek={stats.movedThisWeek} />
        </div>
        <img
          src={`${import.meta.env.BASE_URL}images/learning-is-fun-home-reference.png`}
          alt="Learning is fun illustrated student header"
        />
      </section>

      {encouragement && (
        <div className="student-encouragement" role="status">{encouragement}</div>
      )}

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Join a class">
        <div className="space-y-4">
          {joinError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{joinError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class code</label>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-center text-lg tracking-widest uppercase"
            />
          </div>
          <Button onClick={() => void handleJoin()} loading={joining} className="w-full">Join</Button>
        </div>
      </Modal>

      <section className="student-study-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-950">Today's goals</h2>
          <Button onClick={() => setShowJoin(true)} size="sm" variant="secondary" className="bg-white/80">
            Join class
          </Button>
        </div>

        <div className="student-goal-grid">
          <GoalRing
            title="Flashcards studied"
            value={stats.flashcardsToday}
            goal={30}
            unit="cards"
            color="#e94c9d"
            onStart={() => navigate('/decks')}
          />
        </div>

        <div className="student-mini-stats">
          <StudentMiniStat label="New" value={stats.newCards} />
          <StudentMiniStat label="Familiar" value={stats.familiarCards} />
          <StudentMiniStat label="Known" value={stats.knownCards} />
        </div>

        <div className="student-progress-section mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500">Vocabulary progress</span>
            <span className="text-sm font-bold text-slate-700">{stats.knownCards} / {stats.nextGoal}</span>
          </div>
          <div className="student-progress-track">
            <div className="student-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold text-slate-400">
            <span>{previousMilestone}</span>
            <span>{wordsToGoal} to go</span>
            <span>{stats.nextGoal}</span>
          </div>
        </div>
      </section>

      <section className="student-study-card">
        <h2 className="text-lg font-bold text-slate-950 mb-3">Study heatmap</h2>
        {stats.studyHeatmap.some(d => d.activityCount > 0) ? (
          <ProgressHeatmap days={stats.studyHeatmap} />
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            <p>Complete your first flashcard review to light up your heatmap!</p>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">
            {stats.currentStreak > 0 ? `${stats.currentStreak}-day streak` : 'No streak yet'}
          </span>
          <span className="text-slate-500">Longest: {stats.longestStreak} days</span>
        </div>
      </section>

      <section className="student-section">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Do now</h2>
            <p className="text-sm text-slate-500">Start with the next thing your class needs.</p>
          </div>
        </div>
        {doNow && (doNow.sessions.length > 0 || doNow.decks.length > 0) ? (
          <div className="grid gap-3 md:grid-cols-2">
            {doNow.sessions.slice(0, 2).map(session => (
              <ActionCard
                key={session.$id}
                title={session.title}
                detail={`${session.votesPerStudent} votes available`}
                to={`/discussions/${session.$id}`}
                action="Open discussion"
                status={session.status}
              />
            ))}
            {doNow.decks.slice(0, 2).map(({ assignment, deck }) => (
              <ActionCard
                key={assignment.$id}
                title={deck?.title || 'Flashcard deck'}
                detail={assignment.dailyTarget ? `${assignment.dailyTarget} card target` : 'Study vocabulary'}
                to={`/decks/${assignment.deckId}/review`}
                action="Study cards"
                status={assignment.isRequired ? 'required' : 'practice'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing assigned yet"
            message="When your teacher opens a class period or flashcard deck, it will appear here."
            action={<Button onClick={() => setShowJoin(true)} variant="secondary">Join a class</Button>}
          />
        )}
      </section>

      <div className="student-section">
        <button
          onClick={() => setStatsExpanded(!statsExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <svg className={`h-4 w-4 transition-transform ${statsExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          All stats
        </button>
        {statsExpanded && (
          <div className="mt-3 grid gap-3 text-sm">
            <StatList>
              <StatRow label="Cards today" value={stats.flashcardsToday} />
              <StatRow label="Study time today" value={`${formatMinutes(stats.studySecondsToday)}`} />
              <StatRow label="Cards this week" value={stats.cardsWeek} />
              <StatRow label="Study time this week" value={formatMinutes(stats.studySecondsWeek)} />
              <StatRow label="Cards all time" value={stats.cardsAll} />
              <StatRow label="Study time all time" value={formatMinutes(stats.studySecondsAll)} />
              <StatRow label="Words known" value={stats.knownCards} />
              <StatRow label="Words familiar" value={stats.familiarCards} />
              <StatRow label="Words new" value={stats.newCards} />
              <StatRow label="Current streak" value={`${stats.currentStreak} days`} />
              <StatRow label="Longest streak" value={`${stats.longestStreak} days`} />
            </StatList>
          </div>
        )}
      </div>

      <div className="student-section">
        <h2 className="text-lg font-bold text-slate-950 mb-3">Flashcard decks</h2>
        {doNow?.decks && doNow.decks.length > 0 ? (
          <div className="space-y-3">
            {doNow.decks.map(({ assignment, deck }) => (
              <Link key={assignment.$id} to={`/decks/${assignment.deckId}/review`}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{deck?.title || 'Unknown deck'}</h3>
                      {deck?.description && <p className="text-sm text-gray-500">{deck.description}</p>}
                    </div>
                    {assignment.dailyTarget ? <StatusBadge status="ready" label={`${assignment.dailyTarget}/day`} /> : <StatusBadge status="practice" />}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No flashcard decks assigned yet.</p>
        )}
      </div>
    </div>
  );
}

function StudentMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-bold text-slate-950">{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
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

function StatList({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/60 border border-white/70 p-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</dl>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();

  const classes = useLiveQuery(
    () => db.classes.where('teacherId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const classIds = useMemo(() => classes?.map(c => c.$id) || [], [classes]);

  const dashboard = useLiveQuery(async () => {
    if (classIds.length === 0) return { activeSessions: [], classRows: [] };
    const [activeSessions, classRows] = await Promise.all([
      buildActiveSessionRows(classIds),
      buildTeacherClassRows(classes || []),
    ]);
    return { activeSessions, classRows };
  }, [classIds, classes]);

  const vocabProgress = useLiveQuery(async () => {
    if (!user) return null;
    const decks = await db.flashcard_decks.where('creatorId').equals(user.$id).toArray();
    const deckIds = decks.map(d => d.$id);
    let totalCards = 0;
    for (const deckId of deckIds) {
      totalCards += await db.flashcard_cards.where('deckId').equals(deckId).count();
    }
    const assignments = await db.deck_assignments.where('deckId').anyOf(deckIds).toArray();
    const assignedDeckIds = [...new Set(assignments.map(a => a.deckId))];
    let cardsInAssignedDecks = 0;
    for (const deckId of assignedDeckIds) {
      cardsInAssignedDecks += await db.flashcard_cards.where('deckId').equals(deckId).count();
    }
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();
    let cardsStudiedThisWeek = 0;
    for (const deckId of deckIds) {
      const reviews = await db.card_reviews.where('deckId').equals(deckId).and(r => r.reviewAt >= weekAgoStr).toArray();
      cardsStudiedThisWeek += reviews.length;
    }
    return { totalDecks: deckIds.length, assignedDecks: assignedDeckIds.length, totalCards, cardsInAssignedDecks, cardsStudiedThisWeek };
  }, [user?.$id]);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <p className="text-gray-500 text-sm">Today's class tools in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/settings"><Button size="sm" variant="secondary">Settings</Button></Link>
          <Link to="/classes/new"><Button size="sm">Create class</Button></Link>
        </div>
      </div>

      {vocabProgress && (
        <Card>
          <h3 className="font-semibold text-lg mb-3">Vocabulary Progress</h3>
          <div className="text-sm text-gray-600 space-y-1 mb-3">
            <p>Total decks: {vocabProgress.totalDecks} ({vocabProgress.assignedDecks} assigned)</p>
            <p>Total cards: {vocabProgress.totalCards}</p>
            <p>Cards studied this week: {vocabProgress.cardsStudiedThisWeek}</p>
            <p className="text-green-600 font-medium">{vocabProgress.cardsStudiedThisWeek} cards studied this week — keep it up!</p>
            <p>Cards assigned: {vocabProgress.cardsInAssignedDecks} of {vocabProgress.totalCards}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{
              width: vocabProgress.totalCards > 0 ? `${Math.round((vocabProgress.cardsInAssignedDecks / vocabProgress.totalCards) * 100)}%` : '0%',
            }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {vocabProgress.totalCards > 0 ? Math.round((vocabProgress.cardsInAssignedDecks / vocabProgress.totalCards) * 100) : 0}% assigned
          </p>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Today's class</h2>
        {dashboard && dashboard.activeSessions.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {dashboard.activeSessions.map(row => (
              <Card key={row.session.$id}>
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-semibold">{row.session.title}</h3>
                    <p className="text-sm text-gray-500">{row.cls?.name || 'Class'} | {row.session.sessionDate}</p>
                  </div>
                  <StatusBadge status={row.session.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
                  <Metric value={row.questionCount} label="Questions" />
                  <Metric value={row.deckCount} label="Decks" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/discussions/${row.session.$id}`}><Button size="sm">Open discussion</Button></Link>
                  {row.cls && <Link to={`/classes/${row.cls.$id}/reports`}><Button size="sm" variant="secondary">Report</Button></Link>}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active class period"
            message="Open a class and start a discussion to collect questions."
            action={<Link to="/classes"><Button variant="secondary">Go to classes</Button></Link>}
          />
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Classes</h2>
        {dashboard && dashboard.classRows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.classRows.map(row => (
              <Link key={row.cls.$id} to={`/classes/${row.cls.$id}`}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold text-lg">{row.cls.name}</h3>
                      <p className="text-sm text-gray-500">{row.cls.courseName}</p>
                    </div>
                    <StatusBadge status={row.cls.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span>{row.memberCount} students</span>
                    <span>{row.questionCount} questions</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{row.cls.joinCode}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classes yet"
            message="Create your first class, then share a join code."
            action={<Link to="/classes/new"><Button>Create your first class</Button></Link>}
          />
        )}
      </section>
    </div>
  );
}

function ActionCard({ title, detail, to, action, status }: {
  title: string; detail: string; to: string; action: string; status: string;
}) {
  return (
    <Link to={to}>
      <Card className="h-full">
        <div className="flex h-full flex-col justify-between gap-4">
          <div>
            <div className="mb-2"><StatusBadge status={status} /></div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{detail}</p>
          </div>
          <span className="text-sm font-medium text-blue-700">{action}</span>
        </div>
      </Card>
    </Link>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2 py-3">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
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

async function buildActiveSessionRows(classIds: string[]): Promise<Array<{
  session: ClassSession; cls: Class | undefined; questionCount: number; deckCount: number;
}>> {
  const sessions = await db.class_sessions.where('classId').anyOf(classIds).and(s => s.status === 'active').toArray();
  const rows = [];
  for (const session of sessions) {
    const [cls, questionCount, deckCount] = await Promise.all([
      db.classes.get(session.classId),
      db.discussion_questions.where('classSessionId').equals(session.$id).count(),
      db.deck_assignments.where('classId').equals(session.classId).count(),
    ]);
    rows.push({ session, cls, questionCount, deckCount });
  }
  return rows.sort((a, b) => b.session.sessionDate.localeCompare(a.session.sessionDate));
}

async function buildTeacherClassRows(classes: Class[]): Promise<Array<{
  cls: Class; memberCount: number; questionCount: number;
}>> {
  const rows = [];
  for (const cls of classes) {
    const [memberCount, sessions] = await Promise.all([
      db.class_members.where('classId').equals(cls.$id).and(member => member.role === 'student').count(),
      db.class_sessions.where('classId').equals(cls.$id).toArray(),
    ]);
    let questionCount = 0;
    for (const session of sessions) {
      questionCount += await db.discussion_questions.where('classSessionId').equals(session.$id).count();
    }
    rows.push({ cls, memberCount, questionCount });
  }
  return rows;
}
