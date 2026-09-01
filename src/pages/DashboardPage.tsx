import { useMemo, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { joinClass } from '@/services/class.service';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { getNextMilestone } from '@/services/progress-utils';
import {
  buildReviewPaceSeries,
  buildKnownGrowthSeries,
  buildDeckComposition,
  type PaceSeries,
  type KnownGrowthPoint,
  type DeckComposition,
} from '@/services/study-insights';
import { ReviewPaceChart } from '@/components/student/ReviewPaceChart';
import { KnownGrowthChart } from '@/components/student/KnownGrowthChart';
import { DeckMakeup } from '@/components/student/DeckMakeup';
import type { Class, ClassSession, DeckAssignment, FlashcardDeck, FlashcardReviewEvent, FlashcardStudySession } from '@/types';
import { nextNicknameChangeAt, nicknameValidationError, updateNickname } from '@/services/nickname.service';
import { ErrorLogPanel } from '@/components/student/ErrorLogPanel';

interface DeckAction {
  assignment: DeckAssignment;
  deck: FlashcardDeck | undefined;
}

export function DashboardPage() {
  const { user, isTeacher, isParent } = useAuth();
  if (!user) return null;

  return isTeacher ? <Navigate to="/classes" replace /> : isParent ? <ParentDashboard /> : <StudentDashboard />;
}

function ParentDashboard() {
  const { user } = useAuth();
  const classes = useLiveQuery(async () => { const memberships = await db.class_members.where('userId').equals(user!.$id).toArray(); return Promise.all(memberships.map(m => db.classes.get(m.classId))); }, [user?.$id]);
  return <div className="student-page space-y-5 p-4"><header><h1 className="text-2xl font-bold">Parent view</h1><p className="text-gray-500">Read-only access to class learning materials and conversations.</p></header>{classes?.filter(Boolean).map(cls => <Card key={cls!.$id}><h2 className="font-semibold">{cls!.courseName}</h2><p className="text-sm text-gray-500">{cls!.name}</p><div className="mt-3 flex gap-3 text-sm"><Link to="/texts" className="text-blue-600">Texts</Link><Link to="/decks" className="text-blue-600">Flashcards</Link><Link to="/discussions" className="text-blue-600">Discussions</Link></div></Card>)}</div>;
}

const WORD_MILESTONES = [25, 50, 100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000];

/** Days of pace history shown; shorter than the heatmap so points stay legible. */
const PACE_WINDOW_DAYS = 28;

const EMPTY_PACE: PaceSeries = { points: [], center: null, upperLimit: null, lowerLimit: null };

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

function MilestoneJourney({ learningCards, longTermCards, leveledUpThisWeek }: { learningCards: number; longTermCards: number; leveledUpThisWeek: number }) {
  const nextMilestone = WORD_MILESTONES.find(m => m > learningCards) ?? WORD_MILESTONES[WORD_MILESTONES.length - 1];
  const previousMilestone = [...WORD_MILESTONES].reverse().find(m => m <= learningCards) ?? 0;
  const span = Math.max(1, nextMilestone - previousMilestone);
  const fillFraction = Math.min(1, Math.max(0, (learningCards - previousMilestone) / span));
  const remaining = Math.max(0, nextMilestone - learningCards);
  const displayedLearning = useCountUp(learningCards);

  return (
    <div className="milestone-journey">
      <div className="milestone-journey-headline">
        <strong className="milestone-journey-count">{displayedLearning}</strong>
        <span className="milestone-journey-label">cards growing</span>
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
          {remaining > 0 ? `${remaining} to next milestone` : 'Milestone reached!'}
        </span>
        <span>{nextMilestone}</span>
      </div>
      {longTermCards > 0 && <p className="mt-2 text-xs font-semibold text-emerald-700">{longTermCards} in long-term memory</p>}
    </div>
  );
}

function TodayStat({ value, label, tone }: { value: number; label: string; tone: 'blue' | 'violet' | 'green' }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-800',
    violet: 'bg-violet-50 text-violet-800',
    green: 'bg-emerald-50 text-emerald-800',
  };
  return <div className={`rounded-xl px-3 py-3 text-center ${styles[tone]}`}><strong className="block text-2xl leading-none">{value}</strong><span className="mt-1 block text-xs font-semibold">{label}</span></div>;
}

function ProgressHeatmap({ days, longestStreak }: {
  days: Array<{ date: string; studySeconds: number; activityCount: number }>;
  longestStreak: number;
}) {
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
        <span>{totalMinutes.toFixed(0)} min tracked</span>
        <span>Best: {longestStreak}d</span>
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
  const [editingDecks, setEditingDecks] = useState(false);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[] | null>(null);
  const [studySessionSize, setStudySessionSize] = useState(30);
  const [nickname, setNickname] = useState(user?.name || '');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const navigate = useNavigate();
  const localProfile = useLiveQuery(() => user ? db.users.get(user.$id) : undefined, [user?.$id]);

  const memberships = useLiveQuery(
    () => db.class_members.where('userId').equals(user!.$id).toArray(),
    [user?.$id],
  );
  const classIds = useMemo(() => memberships?.map(c => c.classId) || [], [memberships]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      db.app_metadata.get(`studyDecks_${user.$id}`),
      db.app_metadata.get(`selectedDecks_${user.$id}`),
    ]).then(([current, legacy]) => {
      const entry = current || legacy;
      if (!entry) { setSelectedDeckIds(null); return; }
      try { setSelectedDeckIds(JSON.parse(entry.value)); }
      catch { setSelectedDeckIds(null); }
    });
  }, [user?.$id]);

  useEffect(() => {
    if (!user) return;
    void db.app_metadata.get(`studySessionSize_${user.$id}`).then(entry => {
      const value = Number(entry?.value || 30);
      setStudySessionSize(Math.min(100, Math.max(5, Number.isFinite(value) ? value : 30)));
    });
  }, [user?.$id]);

  const saveSelectedDecks = async (ids: string[]) => {
    if (!user) return;
    setSelectedDeckIds(ids);
    await db.app_metadata.put({ key: `studyDecks_${user.$id}`, value: JSON.stringify(ids) });
  };

  const toggleDeckSelection = (deckId: string) => {
    const current = selectedDeckIds || [];
    const next = current.includes(deckId)
      ? current.filter(id => id !== deckId)
      : [...current, deckId];
    void saveSelectedDecks(next);
  };

  const allAssignedDeckIds = useLiveQuery(async () => {
    if (!user || classIds.length === 0) return [];
    const assignments = await db.deck_assignments.where('classId').anyOf(classIds).toArray();
    return [...new Set(assignments.map(a => a.deckId))];
  }, [user?.$id, classIds]);

  const today = new Date().toISOString().slice(0, 10);

  const progress = useLiveQuery(async () => {
    if (!user || classIds.length === 0) {
      return {
        totalCards: 0, knownCards: 0, familiarCards: 0, newCards: 0,
        dueCards: 0, learningCards: 0, finishedToday: 0,
        movedThisWeek: 0, nextGoal: 50, flashcardsToday: 0,
        studySecondsToday: 0, studySecondsWeek: 0, studySecondsAll: 0,
        cardsWeek: 0, cardsAll: 0,
        currentStreak: 0, longestStreak: 0,
        studyHeatmap: [] as Array<{ date: string; studySeconds: number; activityCount: number }>,
        pace: EMPTY_PACE,
        knownGrowth: [] as KnownGrowthPoint[],
        deckMakeup: [] as DeckComposition[],
      };
    }
    const deckAssignments = await db.deck_assignments.where('classId').anyOf(classIds).toArray();
    const allDeckIds = [...new Set(deckAssignments.map(a => a.deckId))];
    const deckIds = selectedDeckIds !== null
      ? allDeckIds.filter(id => selectedDeckIds.includes(id))
      : allDeckIds;

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

    const nowIso = new Date().toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartIso = todayStart.toISOString();
    const dueCards = states.filter(state => state.dueDate <= nowIso).length;
    const learningCards = states.filter(state => state.status === 'learning' || state.status === 'relearning').length;
    const finishedToday = states.filter(state => state.lastReviewAt >= todayStartIso && (state.intervalDays || 0) >= 1).length;

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

    // Insight charts. Pace uses a shorter window than the heatmap so the daily
    // points stay readable; growth and makeup use the full window.
    const decks = deckIds.length
      ? await db.flashcard_decks.where('$id').anyOf(deckIds).toArray()
      : [];
    // Deliberately unfiltered by deck: the study minutes in the heatmap cover
    // every deck, so filtering only the recalls would divide by time the
    // student spent elsewhere and understate their pace. Distraction and
    // getting stuck affect a whole session anyway, not one deck.
    const pace = buildReviewPaceSeries(heatmap.slice(-PACE_WINDOW_DAYS), events);
    const knownGrowth = buildKnownGrowthSeries(heatmap, states);
    const deckMakeup = buildDeckComposition(decks, cards, states);

    return {
      pace,
      knownGrowth,
      deckMakeup,
      totalCards: cards.length,
      knownCards,
      familiarCards,
      newCards: Math.max(0, cards.length - knownCards - familiarCards),
      dueCards,
      learningCards,
      finishedToday,
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
  }, [user?.$id, classIds, selectedDeckIds]);

  const doNow = useLiveQuery(async () => {
    if (!user || classIds.length === 0) return { sessions: [], decks: [] };
    const [sessions, deckAssignments] = await Promise.all([
      db.class_sessions.where('classId').anyOf(classIds).and(s => s.status === 'active' && s.discussionType !== 'presentation').toArray(),
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

  const saveNickname = async () => {
    const validation = nicknameValidationError(nickname);
    if (validation) { setNicknameMessage(validation); return; }
    setSavingNickname(true); setNicknameMessage('');
    try { const updated = await updateNickname(nickname); setNickname(updated.name); setNicknameMessage('Nickname saved. You can change it again in 24 hours.'); }
    catch (cause) { setNicknameMessage(cause instanceof Error ? cause.message : 'Could not update your nickname.'); }
    finally { setSavingNickname(false); }
  };

  const stats = progress || {
    totalCards: 0, knownCards: 0, familiarCards: 0, newCards: 0,
    dueCards: 0, learningCards: 0, finishedToday: 0,
    movedThisWeek: 0, nextGoal: 50, flashcardsToday: 0,
    studySecondsToday: 0, studySecondsWeek: 0, studySecondsAll: 0,
    cardsWeek: 0, cardsAll: 0,
    currentStreak: 0, longestStreak: 0,
    studyHeatmap: [],
    pace: EMPTY_PACE,
    knownGrowth: [],
    deckMakeup: [],
  };
  const activeDeckIds = (allAssignedDeckIds || []).filter(id => selectedDeckIds === null || selectedDeckIds.includes(id));
  const readyCardCount = Math.min(studySessionSize, stats.dueCards + stats.newCards);
  const estimatedMinutes = Math.max(1, Math.ceil(readyCardCount / 4));
  const startToday = () => {
    if (!activeDeckIds.length || readyCardCount === 0) { navigate('/decks'); return; }
    navigate(`/decks/combined/review?decks=${encodeURIComponent(activeDeckIds.join(','))}&limit=${studySessionSize}&autostart=1`);
  };

  return (
    <div className="student-home">
      <section className="student-home-hero" aria-label="Learning is Fun">
        <div className="student-home-hero-text">
          <h1 className="student-home-hero-heading">
            Learning <span>is fun</span>
          </h1>
          <p className="student-home-hero-tagline">Let's grow a little stronger everyday.</p>
          <MilestoneJourney learningCards={stats.familiarCards + stats.knownCards} longTermCards={stats.knownCards} leveledUpThisWeek={stats.movedThisWeek} />
        </div>
        <img
          className="student-home-hero-illustration"
          src={`${import.meta.env.BASE_URL}images/student-hero-illustration.png`}
          alt="Excited student ready to learn"
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

      <section className="student-ready-card" aria-labelledby="ready-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Ready for today</p>
            <h2 id="ready-heading" className="mt-1 text-2xl font-bold text-slate-950">
              {readyCardCount > 0 ? `${readyCardCount} cards · about ${estimatedMinutes} min` : 'You are caught up'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{activeDeckIds.length} selected {activeDeckIds.length === 1 ? 'deck' : 'decks'}</p>
          </div>
          <Button onClick={() => setShowJoin(true)} size="sm" variant="secondary" className="bg-white/80">Join class</Button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Today's flashcard queue">
          <TodayStat value={stats.dueCards} label="Due" tone="blue" />
          <TodayStat value={stats.newCards} label="New" tone="violet" />
          <TodayStat value={stats.finishedToday} label="Done today" tone="green" />
        </div>
        <Button size="lg" className="mt-5 w-full bg-blue-600" onClick={startToday}>
          {readyCardCount > 0 ? `Study ${readyCardCount} cards` : 'Choose decks or practise more'}
        </Button>
        {stats.flashcardsToday > 0 && <p className="mt-3 text-center text-sm font-medium text-emerald-700">You reviewed {stats.flashcardsToday} cards today. Keep building the memory.</p>}
      </section>

      <section className="student-section">
        <div className="student-section-head">
          <div>
            <h2 className="student-title">Do now</h2>
            <p className="student-subtitle">Start with the next thing your class needs.</p>
          </div>
        </div>
        {doNow && (doNow.sessions.length > 0 || doNow.decks.length > 0) ? (
          <div className="student-grid student-grid-2">
            {doNow.sessions.slice(0, 2).map(session => (
              <ActionCard
                key={session.$id}
                title={session.title}
                detail={`${session.votesPerStudent} votes available`}
                to={`/discussions/${session.$id}`}
                action="Open questions"
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

      <ErrorLogPanel userId={user!.$id} />

      <details className="student-progress-details">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
          <span><strong className="block text-slate-950">Your progress</strong><span className="text-sm text-slate-500">Learning stages, study days, and detailed patterns</span></span>
          <span className="text-sm font-semibold text-slate-500" aria-hidden="true">View ▾</span>
        </summary>
        <div className="space-y-4 border-t border-slate-200 p-4">
          <section>
            <div className="student-section-head"><h2 className="student-title">Learning stages</h2><span className="text-sm font-bold text-emerald-700">{stats.knownCards} long-term</span></div>
            <DeckMakeup decks={stats.deckMakeup} />
          </section>
          <section className="student-progress-divider">
            <div className="student-section-head"><h2 className="student-title">Study days</h2><span className="text-sm font-bold text-slate-700">{stats.currentStreak > 0 ? `${stats.currentStreak} in a row` : `${stats.studyHeatmap.filter(day => day.activityCount > 0).length} days so far`}</span></div>
            {stats.studyHeatmap.some(d => d.activityCount > 0) ? <ProgressHeatmap days={stats.studyHeatmap} longestStreak={stats.longestStreak} /> : <p className="py-4 text-center text-sm text-slate-400">Review your first card to begin your study history.</p>}
          </section>
          <section className="student-progress-divider">
            <h2 className="student-title">Long-term memory</h2>
            <p className="student-subtitle">Cards remembered on schedules of two weeks or longer.</p>
            <KnownGrowthChart points={stats.knownGrowth} />
          </section>
          <section className="student-progress-divider">
            <h2 className="student-title">Reviewing pattern</h2>
            <p className="student-subtitle">Optional detail about your recall pace—not a score or a race.</p>
            <ReviewPaceChart series={stats.pace} />
          </section>
        </div>
      </details>

      <div className="student-section">
        <div className="student-section-head">
          <h2 className="student-title">My decks</h2>
          {allAssignedDeckIds && allAssignedDeckIds.length > 0 && (
            <button
              onClick={() => setEditingDecks(!editingDecks)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {editingDecks ? 'Done' : 'Choose decks'}
            </button>
          )}
        </div>
        {allAssignedDeckIds && allAssignedDeckIds.length > 0 ? (
          <div className="space-y-2">
            {allAssignedDeckIds.map(deckId => {
              const entry = doNow?.decks.find(d => d.deck?.$id === deckId);
              const deck = entry?.deck;
              const assignment = entry?.assignment;
              const isSelected = selectedDeckIds === null || selectedDeckIds.includes(deckId);
              return (
                <DeckRow
                  key={deckId}
                  deckId={deckId}
                  title={deck?.title || 'Unknown deck'}
                  description={deck?.description}
                  dailyTarget={assignment?.dailyTarget}
                  selected={isSelected}
                  editing={editingDecks}
                  onToggle={() => toggleDeckSelection(deckId)}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No flashcard decks assigned yet.</p>
        )}
      </div>

      <div className="student-section">
        <button
          onClick={() => setStatsExpanded(!statsExpanded)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          <svg className={`h-4 w-4 transition-transform ${statsExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          All stats
        </button>
        {statsExpanded && (
          <StatList>
            <StatRow label="Cards today" value={stats.flashcardsToday} />
            <StatRow label="Time today" value={formatMinutes(stats.studySecondsToday)} />
            <StatRow label="Cards this week" value={stats.cardsWeek} />
            <StatRow label="Time this week" value={formatMinutes(stats.studySecondsWeek)} />
            <StatRow label="Cards all time" value={stats.cardsAll} />
            <StatRow label="Time all time" value={formatMinutes(stats.studySecondsAll)} />
            <StatRow label="Cards in long-term memory" value={stats.knownCards} />
            <StatRow label="Cards learning" value={stats.familiarCards} />
            <StatRow label="Cards new" value={stats.newCards} />
            <StatRow label="Current streak" value={`${stats.currentStreak} days`} />
            <StatRow label="Longest streak" value={`${stats.longestStreak} days`} />
          </StatList>
        )}
      </div>

      <div className="student-section">
        <h2 className="student-title">Settings</h2>
        <div className="student-card mt-3 space-y-3 p-4">
          <div><h3 className="text-sm font-semibold text-slate-800">Class nickname</h3><p className="text-xs text-slate-500">Choose a school-appropriate name. You can change it once every 24 hours.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><input aria-label="Class nickname" value={nickname} maxLength={24} disabled={Boolean(localProfile && nextNicknameChangeAt(localProfile))} onChange={event => { setNickname(event.target.value); setNicknameMessage(''); }} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2" /><Button size="sm" loading={savingNickname} disabled={Boolean(localProfile && nextNicknameChangeAt(localProfile)) || !nickname.trim() || nickname === localProfile?.name} onClick={() => void saveNickname()}>Save nickname</Button></div>
          {localProfile && nextNicknameChangeAt(localProfile) && <p className="text-xs text-slate-500">Next change: {nextNicknameChangeAt(localProfile)?.toLocaleString()}</p>}
          {nicknameMessage && <p className={`text-xs ${nicknameMessage.startsWith('Nickname saved') ? 'text-green-700' : 'text-red-700'}`}>{nicknameMessage}</p>}
        </div>
        <div className="student-card mt-3 flex items-center justify-between gap-4 p-4">
          <div><h3 className="text-sm font-semibold text-slate-800">Cards per study session</h3><p className="text-xs text-slate-500">The default is 30. Choose between 5 and 100.</p></div>
          <input
            aria-label="Cards per study session"
            type="number"
            min={5}
            max={100}
            value={studySessionSize}
            onChange={event => setStudySessionSize(Math.min(100, Math.max(5, Number(event.target.value) || 30)))}
            onBlur={() => { if (user) void db.app_metadata.put({ key: `studySessionSize_${user.$id}`, value: String(studySessionSize) }); }}
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-center font-semibold"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * A deck in the student's list. The selection checkbox only appears while
 * editing; the rest of the time the row is a plain tap target so the home
 * screen stays uncluttered.
 */
function DeckRow({ deckId, title, description, dailyTarget, selected, editing, onToggle }: {
  deckId: string;
  title: string;
  description?: string;
  dailyTarget?: number | null;
  selected: boolean;
  editing: boolean;
  onToggle: () => void;
}) {
  const body = (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-800">{title}</h3>
        {description && <p className="truncate text-xs text-slate-400">{description}</p>}
      </div>
      {dailyTarget && (
        <span className="shrink-0 text-xs font-semibold text-slate-400">{dailyTarget}/day</span>
      )}
    </div>
  );

  return (
    <div
      className={`student-card flex items-center gap-3 px-4 py-3 transition-opacity ${
        editing && !selected ? 'opacity-50' : ''
      }`}
    >
      {editing && (
        <button
          onClick={onToggle}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 hover:border-blue-400'
          }`}
          aria-label={selected ? `Stop counting ${title}` : `Count ${title}`}
        >
          {selected && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}
      {editing ? body : <Link to={`/decks/${deckId}/review`} className="flex min-w-0 flex-1">{body}</Link>}
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
    <div className="student-card mt-3 p-4">
      <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-900/5 py-1.5 text-sm last:border-b-0">
      <dt className="text-slate-500">{label}</dt>
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
                  <Link to={`/discussions/${row.session.$id}`}><Button size="sm">Open questions</Button></Link>
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
                    <div><h3 className="font-semibold text-lg">{row.cls.courseName}</h3>
                      <p className="text-sm text-gray-500">{row.cls.name}</p>
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
