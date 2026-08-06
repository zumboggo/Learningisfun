import { db } from '@/db/schema';
import type { FlashcardReviewEvent, FlashcardStudySession, StudentCardState } from '@/types';

export interface StudyDayStat {
  date: string;
  studySeconds: number;
  activityCount: number;
}

export interface RangeStats {
  cardsReviewed: number;
  studySeconds: number;
  newWords: number;
}

export interface DashboardProgressData {
  // Known words
  totalCards: number;
  knownCards: number;
  familiarCards: number;
  newCards: number;
  movedThisWeek: number;
  nextGoal: number;

  // Daily stats
  flashcardsToday: number;
  studySecondsToday: number;

  // Ranges
  ranges: Record<'today' | 'week' | 'month' | 'allTime', RangeStats>;

  // Streaks
  currentStreak: number;
  longestStreak: number;

  // Heatmap (84 days)
  studyHeatmap: StudyDayStat[];
}

const WORD_MILESTONES = [25, 50, 100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000];

export function getNextMilestone(known: number): number {
  return WORD_MILESTONES.find(m => m > known) ?? WORD_MILESTONES[WORD_MILESTONES.length - 1];
}

export function getPreviousMilestone(known: number): number {
  return [...WORD_MILESTONES].reverse().find(m => m <= known) ?? 0;
}

// Build a 84-day study heatmap from flashcard_review_events
function buildStudyHeatmap(events: FlashcardReviewEvent[], sessions: FlashcardStudySession[], days: number): StudyDayStat[] {
  const map = new Map<string, { studySeconds: number; activityCount: number }>();
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { studySeconds: 0, activityCount: 0 });
  }

  // Add event-based activity (each review event counts as 1 activity, approximating 5 seconds each)
  for (const event of events) {
    const key = event.reviewedAt.slice(0, 10);
    const entry = map.get(key);
    if (entry) {
      entry.activityCount++;
      entry.studySeconds += 5; // rough estimate per card
    }
  }

  // Add session-based study time (more accurate)
  for (const session of sessions) {
    const key = session.startedAt.slice(0, 10);
    const entry = map.get(key);
    if (entry) {
      entry.studySeconds += session.activeSeconds || 0;
    }
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    studySeconds: Math.round(data.studySeconds),
    activityCount: data.activityCount,
  }));
}

// Calculate current streak (consecutive days with any activity, counting backward from today)
function calculateStreak(heatmap: StudyDayStat[]): number {
  const sorted = [...heatmap].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = new Date();

  for (let i = 0; i < 365; i++) {
    const key = checkDate.toISOString().slice(0, 10);
    const day = sorted.find(d => d.date === key);
    if (day && day.activityCount > 0) {
      streak++;
    } else if (key !== today) {
      // Allow today to be 0 without breaking
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

function calculateLongestStreak(heatmap: StudyDayStat[]): number {
  const sorted = [...heatmap].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let current = 0;
  for (const day of sorted) {
    if (day.activityCount > 0) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}

function heatLevel(minutes: number, activityCount: number): number {
  if (activityCount === 0) return 0;
  if (minutes >= 20) return 4;
  if (minutes >= 10) return 3;
  if (minutes >= 3) return 2;
  return 1;
}

function toStartOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function getStudentProgress(userId: string): Promise<DashboardProgressData> {
  const memberships = await db.class_members.where('userId').equals(userId).toArray();
  const classIds = memberships.map(m => m.classId);

  const deckAssignments = classIds.length
    ? await db.deck_assignments.where('classId').anyOf(classIds).toArray()
    : [];
  const deckIds = [...new Set(deckAssignments.map(a => a.deckId))];

  const cards = deckIds.length
    ? await db.flashcard_cards.where('deckId').anyOf(deckIds).toArray()
    : [];

  const states = await db.student_card_state
    .where('userId').equals(userId)
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
  const newCards = Math.max(0, cards.length - knownCards - familiarCards);

  // Moved this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();
  const movedThisWeek = states.filter(s => s.lastReviewAt >= weekAgoStr && (s.intervalDays || 0) >= 1).length;

  const nextGoal = getNextMilestone(knownCards);

  // Events and sessions for heatmap
  const [events, sessions] = await Promise.all([
    db.flashcard_review_events.where('userId').equals(userId).toArray(),
    db.flashcard_study_sessions.where('userId').equals(userId).toArray(),
  ]);

  const heatmap = buildStudyHeatmap(events, sessions, 84);

  // Today stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter(e => e.reviewedAt.slice(0, 10) === todayStr);
  const todaySessions = sessions.filter(s => s.startedAt.slice(0, 10) === todayStr);
  const flashcardsToday = todayEvents.length;
  const studySecondsToday = todaySessions.reduce((sum, s) => sum + (s.activeSeconds || 0), 0) + todayEvents.length * 5;

  // Range stats
  const ranges = {
    today: computeRangeStats(events, sessions, 0),
    week: computeRangeStats(events, sessions, 7),
    month: computeRangeStats(events, sessions, 30),
    allTime: computeRangeStats(events, sessions, 365 * 10),
  };

  return {
    totalCards: cards.length,
    knownCards,
    familiarCards,
    newCards,
    movedThisWeek,
    nextGoal,
    flashcardsToday,
    studySecondsToday,
    ranges,
    currentStreak: calculateStreak(heatmap),
    longestStreak: calculateLongestStreak(heatmap),
    studyHeatmap: heatmap,
  };
}

function computeRangeStats(events: FlashcardReviewEvent[], sessions: FlashcardStudySession[], days: number): RangeStats {
  const cutoff = days === 0 
    ? toStartOfDay(new Date())
    : new Date(Date.now() - days * 86400000);
  const cutoffStr = cutoff.toISOString();

  const rangeEvents = days === 0
    ? events.filter(e => e.reviewedAt.slice(0, 10) === cutoff.toISOString().slice(0, 10))
    : events.filter(e => e.reviewedAt >= cutoffStr);

  const rangeSessions = days === 0
    ? sessions.filter(s => s.startedAt.slice(0, 10) === cutoff.toISOString().slice(0, 10))
    : sessions.filter(s => s.startedAt >= cutoffStr);

  return {
    cardsReviewed: rangeEvents.length,
    studySeconds: Math.round(
      rangeSessions.reduce((sum, s) => sum + (s.activeSeconds || 0), 0) + rangeEvents.length * 5
    ),
    newWords: 0, // Could be computed if we track first-time reviews
  };
}
