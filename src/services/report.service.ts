import { db } from '@/db/schema';
import { masteryBucketForState } from './flashcard.service';
import type { ClassMember, User } from '@/types';
import { executeLearningContent } from '@/services/learning-content.service';

export interface ParticipationRow {
  studentName: string;
  email: string;
  questionsSubmitted: number;
  votesUsed: number;
  totalPosts: number;
  totalWords: number;
  totalUpvotes: number;
  annotationsTotal: number;
  annotationsThisWeek: number;
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
  let serverAnnotationCounts = new Map<string,{total:number;thisWeek:number}>();
  try {
    const result = await executeLearningContent<{counts:Array<{userId:string;total:number;thisWeek:number}>}>({action:'readAnnotationReport',classId});
    serverAnnotationCounts = new Map(result.counts.map(count=>[count.userId,{total:count.total,thisWeek:count.thisWeek}]));
  } catch { /* Use the local cache while offline. */ }
  const rows: ParticipationRow[] = [];

  for (const member of members) {
    const user = users.get(member.userId);
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
    const sessionIds = (await db.class_sessions.where('classId').equals(classId).toArray()).map(s => s.$id);
    const oldQuestions = sessionIds.length ? await db.discussion_questions.where('classSessionId').anyOf(sessionIds).and(q=>q.authorId===member.userId&&q.moderationStatus!=='removed').toArray() : [];
    const oldQuestionIds = sessionIds.length ? (await db.discussion_questions.where('classSessionId').anyOf(sessionIds).toArray()).map(q=>q.$id) : [];
    const oldAnswers = oldQuestionIds.length ? await db.discussion_answers.where('questionId').anyOf(oldQuestionIds).and(a=>a.authorId===member.userId).toArray() : [];
    const redditPosts = await db.text_discussion_posts.where('classId').equals(classId).and(p=>p.authorId===member.userId&&p.moderationStatus==='visible').toArray();
    const annotations = await db.text_annotations.where('classId').equals(classId).and(a=>a.authorId===member.userId&&a.moderationStatus==='visible').toArray();
    const weekStart = startOfCurrentWeek();
    const annotationCounts = serverAnnotationCounts.get(member.userId) || { total:annotations.length, thisWeek:annotations.filter(annotation => annotation.createdAt >= weekStart).length };
    const redditIds = redditPosts.map(p=>p.$id);
    const positiveVotes = redditIds.length ? await db.text_discussion_votes.where('postId').anyOf(redditIds).and(v=>v.value===1).count() : 0;
    const totalPosts = oldQuestions.length + oldAnswers.length + redditPosts.length + annotations.length;
    const totalWords = [...oldQuestions.map(q=>q.questionText),...oldAnswers.map(a=>a.answerText),...redditPosts.map(p=>p.content),...annotations.map(a=>a.content)].reduce((sum,text)=>sum+wordCount(text),0);

    rows.push({
      studentName: user?.name || 'Unknown',
      email: user?.email || '',
      questionsSubmitted,
      votesUsed: votes.reduce((sum, vote) => sum + Math.max(1, vote.weight || 1), 0),
      totalPosts,
      totalWords,
      totalUpvotes: oldQuestions.reduce((sum,q)=>sum+q.voteCount,0)+positiveVotes,
      annotationsTotal: annotationCounts.total,
      annotationsThisWeek: annotationCounts.thisWeek,
      responseStatus: 'n/a',
      responseWords: 0,
      belowMinimum: false,
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
    'totalPosts',
    'totalWords',
    'totalUpvotes',
    'annotationsTotal',
    'annotationsThisWeek',
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

function startOfCurrentWeek(): string {
  const date = new Date();
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
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
function wordCount(value:string):number{return value.trim()?value.trim().split(/\s+/).length:0;}
