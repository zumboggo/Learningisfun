import { db } from '@/db/schema';
import { masteryBucketForState } from './flashcard.service';
import type { ClassMember, User } from '@/types';

export interface ParticipationRow {
  studentName: string;
  email: string;
  questionsSubmitted: number;
  votesUsed: number;
  responseStatus: string;
  responseWords: number;
  belowMinimum: boolean;
  flashcardMinutes: number;
  cardsReviewed: number;
  newCards: number;
  familiarCards: number;
  knownCards: number;
}

export async function buildClassParticipationRows(
  classId: string,
  options: { assignmentId?: string; classSessionId?: string; deckId?: string } = {},
): Promise<ParticipationRow[]> {
  const members = await db.class_members
    .where('classId')
    .equals(classId)
    .and(m => m.role === 'student')
    .toArray();
  const users = await usersForMembers(members);
  const rows: ParticipationRow[] = [];

  for (const member of members) {
    const user = users.get(member.userId);
    const submission = options.assignmentId
      ? await db.submissions.where('[assignmentId+userId]').equals([options.assignmentId, member.userId]).first()
      : undefined;
    const questionsSubmitted = options.classSessionId
      ? await db.discussion_questions
          .where('classSessionId')
          .equals(options.classSessionId)
          .and(q => q.authorId === member.userId && q.moderationStatus !== 'removed')
          .count()
      : 0;
    const votes = options.classSessionId
      ? await db.question_votes
          .where('classSessionId')
          .equals(options.classSessionId)
          .and(v => v.userId === member.userId)
          .toArray()
      : [];
    const flashcard = options.deckId
      ? await buildFlashcardSummary(member.userId, classId, options.deckId)
      : { minutes: 0, reviewed: 0, newCards: 0, familiarCards: 0, knownCards: 0 };

    rows.push({
      studentName: user?.name || 'Unknown',
      email: user?.email || '',
      questionsSubmitted,
      votesUsed: votes.reduce((sum, vote) => sum + Math.max(1, vote.weight || 1), 0),
      responseStatus: submission?.status || 'missing',
      responseWords: submission?.wordCount || 0,
      belowMinimum: Boolean(submission?.belowMinimum),
      flashcardMinutes: round1(flashcard.minutes),
      cardsReviewed: flashcard.reviewed,
      newCards: flashcard.newCards,
      familiarCards: flashcard.familiarCards,
      knownCards: flashcard.knownCards,
    });
  }

  return rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export function rowsToCsv(rows: ParticipationRow[]): string {
  const headers: Array<keyof ParticipationRow> = [
    'studentName',
    'email',
    'questionsSubmitted',
    'votesUsed',
    'responseStatus',
    'responseWords',
    'belowMinimum',
    'flashcardMinutes',
    'cardsReviewed',
    'newCards',
    'familiarCards',
    'knownCards',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(header => escapeCsv(row[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function usersForMembers(members: ClassMember[]): Promise<Map<string, User>> {
  const users = new Map<string, User>();
  await Promise.all(members.map(async member => {
    const user = await db.users.get(member.userId);
    if (user) users.set(member.userId, user);
  }));
  return users;
}

async function buildFlashcardSummary(userId: string, classId: string, deckId: string): Promise<{
  minutes: number;
  reviewed: number;
  newCards: number;
  familiarCards: number;
  knownCards: number;
}> {
  const [sessions, events, cards, states] = await Promise.all([
    db.flashcard_study_sessions.where('deckId').equals(deckId).and(s => s.userId === userId && s.classId === classId).toArray(),
    db.flashcard_review_events.where('deckId').equals(deckId).and(e => e.userId === userId && e.classId === classId).toArray(),
    db.flashcard_cards.where('deckId').equals(deckId).toArray(),
    db.student_card_state.where('userId').equals(userId).and(s => s.deckId === deckId).toArray(),
  ]);
  const stateMap = new Map(states.map(state => [state.cardId, state]));
  let newCards = 0;
  let familiarCards = 0;
  let knownCards = 0;
  for (const card of cards) {
    const bucket = masteryBucketForState(stateMap.get(card.$id));
    if (bucket === 'known') knownCards++;
    else if (bucket === 'familiar') familiarCards++;
    else newCards++;
  }
  return {
    minutes: sessions.reduce((sum, session) => sum + session.activeSeconds, 0) / 60,
    reviewed: events.length,
    newCards,
    familiarCards,
    knownCards,
  };
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
