import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateId, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import {
  createNewCard,
  scheduleReview,
  getCardFromState,
  cardToJson,
  getCardStatus,
  getNextDueDate,
  getCardReviewFields,
  toFsrsRating,
} from '@/lib/fsrs';
import { Query } from 'appwrite';
import type {
  FlashcardDeck,
  FlashcardCard,
  DeckAssignment,
  CardReview,
  FlashcardReviewEvent,
  FlashcardStudySession,
  StudentCardState,
  StudentDeckNote,
  ReviewRating,
  CsvMapping,
} from '@/types';
import { parseCsvContent, readFileAsText } from '@/utils/csv-parser';

export async function createDeck(
  creatorId: string,
  title: string,
  description: string,
  type: 'teacher' | 'personal',
): Promise<FlashcardDeck> {
  const id = generateId();
  const now = getTimestamp();
  const deck: FlashcardDeck = {
    $id: id,
    creatorId,
    title,
    description,
    type,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  await db.flashcard_decks.put(deck);
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.flashcard_decks, id, {
      creatorId,
      title,
      description,
      type,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    await addToQueue(creatorId, 'deck', id, 'create', deck);
  }

  return deck;
}

export async function addCard(
  deckId: string,
  front: string,
  back: string,
  options: { hint?: string; tags?: string[] } = {},
): Promise<FlashcardCard> {
  const existingCards = await db.flashcard_cards.where('deckId').equals(deckId).toArray();
  const sortOrder = existingCards.length;
  const id = generateId();
  const card: FlashcardCard = {
    $id: id,
    deckId,
    front,
    back,
    frontMarkdown: front,
    backMarkdown: back,
    hint: options.hint || '',
    tags: options.tags || [],
    sortOrder,
    createdAt: getTimestamp(),
  };

  await db.flashcard_cards.put(card);
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.flashcard_cards, id, {
      deckId,
      front,
      back,
      frontMarkdown: card.frontMarkdown,
      backMarkdown: card.backMarkdown,
      hint: card.hint,
      tags: card.tags,
      sortOrder,
      createdAt: card.createdAt,
    });
  } catch {
    await addToQueue('', 'card', id, 'create', card);
  }

  return card;
}

export async function importDeckFromCsv(
  creatorId: string,
  title: string,
  file: File,
  mapping: CsvMapping,
  type: 'teacher' | 'personal' = 'personal',
): Promise<{ deck: FlashcardDeck; cards: FlashcardCard[] }> {
  const content = await readFileAsText(file);
  const preview = parseCsvContent(content, mapping);

  const deck = await createDeck(creatorId, title, `Imported from ${file.name}`, type);
  const cards: FlashcardCard[] = [];

  for (const row of preview.rows) {
    const front = row[mapping.front] || '';
    const back = row[mapping.back] || '';
    const hint = mapping.hint ? row[mapping.hint] || '' : '';
    const tags = mapping.tags ? parseTags(row[mapping.tags]) : [];
    const source = mapping.source ? row[mapping.source] || '' : '';
    if (source && !tags.includes(source)) tags.push(source);
    if (front && back) {
      const card = await addCard(deck.$id, front, back, { hint, tags });
      cards.push(card);
    }
  }

  return { deck, cards };
}

export async function assignDeck(
  deckId: string,
  classId: string,
  isRequired: boolean = false,
  dailyTarget: number | null = null,
): Promise<DeckAssignment> {
  const id = generateId();
  const assignment: DeckAssignment = {
    $id: id,
    deckId,
    classId,
    isRequired,
    dailyTarget,
    assignedAt: getTimestamp(),
  };

  await db.deck_assignments.put(assignment);
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.deck_assignments, id, {
      deckId,
      classId,
      isRequired,
      dailyTarget,
      assignedAt: assignment.assignedAt,
    });
  } catch {
    await addToQueue('', 'deck_assignment', id, 'create', assignment);
  }

  return assignment;
}

export async function publishDeck(deckId: string, creatorId: string): Promise<void> {
  const now = getTimestamp();
  await db.flashcard_decks.update(deckId, { status: 'published', updatedAt: now });
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.flashcard_decks, deckId, { status: 'published', updatedAt: now });
  } catch {
    await addToQueue(creatorId, 'deck', deckId, 'update', { status: 'published' });
  }
}

export async function getStudentDecks(userId: string): Promise<FlashcardDeck[]> {
  const memberships = await db.class_members.where('userId').equals(userId).toArray();
  const deckIds = new Set<string>();

  for (const m of memberships) {
    const assignments = await db.deck_assignments.where('classId').equals(m.classId).toArray();
    assignments.forEach(a => deckIds.add(a.deckId));
  }

  const personalDecks = await db.flashcard_decks
    .where('creatorId')
    .equals(userId)
    .and(d => d.type === 'personal' && d.status !== 'archived')
    .toArray();

  const decks: FlashcardDeck[] = [...personalDecks];
  for (const id of deckIds) {
    const deck = await db.flashcard_decks.get(id);
    if (deck && deck.status === 'published') decks.push(deck);
  }

  return decks;
}

export async function getDeckCards(deckId: string): Promise<FlashcardCard[]> {
  return db.flashcard_cards.where('deckId').equals(deckId).sortBy('sortOrder');
}

export async function reviewCard(
  userId: string,
  cardId: string,
  deckId: string,
  rating: ReviewRating,
  context: { classId?: string | null; sessionId?: string; elapsedSeconds?: number } = {},
): Promise<StudentCardState> {
  const stateRecord = await db.student_card_state.get(`${userId}_${cardId}`);
  const fsrsCard = stateRecord ? getCardFromState(stateRecord.fsrsState) : createNewCard();
  const previousState = cardToJson(fsrsCard);

  const fsrsRating = toFsrsRating(rating);
  const result = scheduleReview(fsrsCard, fsrsRating);
  const newCard = result.card;
  const newState = cardToJson(newCard);
  const now = getTimestamp();
  const reviewFields = getCardReviewFields(newCard);

  const cardState: StudentCardState = {
    $id: `${userId}_${cardId}`,
    userId,
    cardId,
    deckId,
    fsrsState: newState,
    dueDate: getNextDueDate(newCard).toISOString(),
    status: getCardStatus(newCard),
    ...reviewFields,
    lastReviewAt: now,
    reviewCount: (stateRecord?.reviewCount || 0) + 1,
  };

  await db.student_card_state.put(cardState);

  const reviewId = generateId();
  const review: CardReview = {
    $id: reviewId,
    userId,
    cardId,
    deckId,
    rating,
    reviewAt: now,
    previousState,
    newState,
    deviceId: '',
    operationId: reviewId,
    syncStatus: 'local',
  };

  await db.card_reviews.put(review);
  await addToQueue(userId, 'card_review', reviewId, 'create', review);

  const sessionId = context.sessionId || `flashcards:${reviewId}`;
  const event: FlashcardReviewEvent = {
    $id: generateId(),
    userId,
    classId: context.classId || null,
    deckId,
    cardId,
    sessionId,
    rating,
    reviewedAt: now,
    elapsedSeconds: Math.max(0, Math.round(context.elapsedSeconds || 0)),
    syncStatus: 'local',
  };
  await db.flashcard_review_events.put(event);
  await addToQueue(userId, 'flashcard_review_event', event.$id, 'create', event);

  if (context.sessionId) {
    await incrementStudySession(context.sessionId, rating, context.elapsedSeconds || 0);
  }

  return cardState;
}

export async function getDueCards(userId: string, deckId: string): Promise<FlashcardCard[]> {
  const now = new Date().toISOString();
  const states = await db.student_card_state
    .where('userId')
    .equals(userId)
    .and(s => s.deckId === deckId && s.dueDate <= now)
    .toArray();

  const cards: FlashcardCard[] = [];
  for (const s of states) {
    const card = await db.flashcard_cards.get(s.cardId);
    if (card) cards.push(card);
  }

  return cards;
}

export async function getNewCards(userId: string, deckId: string): Promise<FlashcardCard[]> {
  const allCards = await db.flashcard_cards.where('deckId').equals(deckId).toArray();
  const studied = await db.student_card_state
    .where('userId')
    .equals(userId)
    .and(s => s.deckId === deckId)
    .toArray();
  const studiedIds = new Set(studied.map(s => s.cardId));
  return allCards.filter(c => !studiedIds.has(c.$id));
}

export type FlashcardQueueMode = 'due' | 'new' | 'mixed' | 'all';

export async function buildFlashcardQueue(
  userId: string,
  deckId: string,
  mode: FlashcardQueueMode = 'mixed',
  limit = 30,
): Promise<FlashcardCard[]> {
  const [cards, states] = await Promise.all([
    getDeckCards(deckId),
    db.student_card_state.where('userId').equals(userId).and(s => s.deckId === deckId).toArray(),
  ]);
  if (mode === 'all') return cards.slice(0, limit);

  const stateByCard = new Map(states.map(s => [s.cardId, s]));
  const now = Date.now();
  const learnAhead = now + 5 * 60 * 1000;
  const due = cards
    .filter(card => {
      const state = stateByCard.get(card.$id);
      if (!state) return false;
      const dueAt = Date.parse(state.dueDate);
      if (!Number.isFinite(dueAt)) return true;
      return dueAt <= now || ((state.status === 'learning' || state.status === 'relearning') && dueAt <= learnAhead);
    })
    .sort((a, b) => {
      const aDue = Date.parse(stateByCard.get(a.$id)?.dueDate || '');
      const bDue = Date.parse(stateByCard.get(b.$id)?.dueDate || '');
      return (Number.isFinite(aDue) ? aDue : 0) - (Number.isFinite(bDue) ? bDue : 0);
    });
  const fresh = cards.filter(card => !stateByCard.has(card.$id));

  if (mode === 'due') return due.slice(0, limit);
  if (mode === 'new') return fresh.slice(0, limit);

  const seen = new Set<string>();
  const mixed = [...due, ...fresh].filter(card => {
    if (seen.has(card.$id)) return false;
    seen.add(card.$id);
    return true;
  });
  return mixed.slice(0, limit);
}

export function masteryBucketForState(
  state: StudentCardState | undefined,
  knownIntervalDays = 14,
): 'new' | 'familiar' | 'known' {
  if (!state || state.reviewCount === 0 || state.repetitions === 0) return 'new';
  return (state.intervalDays || 0) >= knownIntervalDays ? 'known' : 'familiar';
}

export async function getDeckProgress(userId: string, deckId: string): Promise<{
  total: number;
  newCount: number;
  learning: number;
  review: number;
  due: number;
  completedToday: number;
  familiar: number;
  known: number;
}> {
  const allCards = await db.flashcard_cards.where('deckId').equals(deckId).toArray();
  const states = await db.student_card_state
    .where('userId')
    .equals(userId)
    .and(s => s.deckId === deckId)
    .toArray();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const studiedIds = new Set(states.map(s => s.cardId));
  let learning = 0;
  let review = 0;
  let due = 0;
  let completedToday = 0;
  let familiar = 0;
  let known = 0;

  for (const s of states) {
    if (s.status === 'learning' || s.status === 'relearning') learning++;
    if (s.status === 'review') review++;
    if (s.dueDate <= now.toISOString()) due++;
    if (s.lastReviewAt >= todayStart) completedToday++;
    const bucket = masteryBucketForState(s);
    if (bucket === 'familiar') familiar++;
    if (bucket === 'known') known++;
  }

  return {
    total: allCards.length,
    newCount: allCards.length - studiedIds.size,
    learning,
    review,
    due,
    completedToday,
    familiar,
    known,
  };
}

export async function getTeacherDeckProgress(classId: string): Promise<{
  deckId: string;
  deckTitle: string;
  notStarted: number;
  newCount: number;
  learning: number;
  reviewing: number;
  due: number;
  completedToday: number;
}[]> {
  const assignments = await db.deck_assignments.where('classId').equals(classId).toArray();
  const members = await db.class_members.where('classId').equals(classId).and(m => m.role === 'student').toArray();
  const result: {
    deckId: string;
    deckTitle: string;
    notStarted: number;
    newCount: number;
    learning: number;
    reviewing: number;
    due: number;
    completedToday: number;
  }[] = [];

  for (const assignment of assignments) {
    const deck = await db.flashcard_decks.get(assignment.deckId);
    if (!deck) continue;

    let notStarted = 0;
    let newCount = 0;
    let learning = 0;
    let reviewing = 0;
    let due = 0;
    let completedToday = 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    for (const member of members) {
      const states = await db.student_card_state
        .where('userId')
        .equals(member.userId)
        .and(s => s.deckId === assignment.deckId)
        .toArray();

      if (states.length === 0) {
        notStarted++;
        continue;
      }

      for (const s of states) {
        if (s.status === 'new') newCount++;
        if (s.status === 'learning' || s.status === 'relearning') learning++;
        if (s.status === 'review') reviewing++;
        if (s.dueDate <= now.toISOString()) due++;
        if (s.lastReviewAt >= todayStart) completedToday++;
      }
    }

    result.push({
      deckId: assignment.deckId,
      deckTitle: deck.title,
      notStarted,
      newCount,
      learning,
      reviewing,
      due,
      completedToday,
    });
  }

  return result;
}

export async function startFlashcardStudySession(
  userId: string,
  deckId: string,
  classId: string | null = null,
): Promise<FlashcardStudySession> {
  const now = getTimestamp();
  const session: FlashcardStudySession = {
    $id: generateId(),
    userId,
    classId,
    deckId,
    startedAt: now,
    endedAt: null,
    activeSeconds: 0,
    cardsReviewed: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    syncStatus: 'local',
  };
  await db.flashcard_study_sessions.put(session);
  await addToQueue(userId, 'flashcard_study_session', session.$id, 'create', session);
  return session;
}

export async function finishFlashcardStudySession(
  sessionId: string,
  userId: string,
  activeSeconds: number,
): Promise<void> {
  const now = getTimestamp();
  await db.flashcard_study_sessions.update(sessionId, {
    endedAt: now,
    activeSeconds: Math.max(0, Math.round(activeSeconds)),
    syncStatus: 'local',
  });
  const session = await db.flashcard_study_sessions.get(sessionId);
  if (session) await addToQueue(userId, 'flashcard_study_session', sessionId, 'update', session);
}

export async function getTeacherFlashcardAnalytics(
  classId: string,
  deckId: string,
): Promise<Array<{
  userId: string;
  name: string;
  minutes: number;
  cardsReviewed: number;
  newCount: number;
  familiar: number;
  known: number;
}>> {
  const members = await db.class_members.where('classId').equals(classId).and(m => m.role === 'student').toArray();
  const cards = await db.flashcard_cards.where('deckId').equals(deckId).toArray();
  const rows = [];
  for (const member of members) {
    const [user, sessions, events, states] = await Promise.all([
      db.users.get(member.userId),
      db.flashcard_study_sessions.where('deckId').equals(deckId).and(s => s.userId === member.userId && s.classId === classId).toArray(),
      db.flashcard_review_events.where('deckId').equals(deckId).and(e => e.userId === member.userId && e.classId === classId).toArray(),
      db.student_card_state.where('userId').equals(member.userId).and(s => s.deckId === deckId).toArray(),
    ]);
    const stateMap = new Map(states.map(s => [s.cardId, s]));
    let newCount = 0;
    let familiar = 0;
    let known = 0;
    for (const card of cards) {
      const bucket = masteryBucketForState(stateMap.get(card.$id));
      if (bucket === 'known') known++;
      else if (bucket === 'familiar') familiar++;
      else newCount++;
    }
    rows.push({
      userId: member.userId,
      name: user?.name || 'Unknown',
      minutes: Math.round((sessions.reduce((sum, session) => sum + session.activeSeconds, 0) / 60) * 10) / 10,
      cardsReviewed: events.length,
      newCount,
      familiar,
      known,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

async function incrementStudySession(
  sessionId: string,
  rating: ReviewRating,
  elapsedSeconds: number,
): Promise<void> {
  const session = await db.flashcard_study_sessions.get(sessionId);
  if (!session) return;
  const updates: Partial<FlashcardStudySession> = {
    activeSeconds: session.activeSeconds + Math.max(0, Math.round(elapsedSeconds)),
    cardsReviewed: session.cardsReviewed + 1,
    syncStatus: 'local',
  };
  if (rating === 'again') updates.againCount = session.againCount + 1;
  if (rating === 'hard') updates.hardCount = session.hardCount + 1;
  if (rating === 'good') updates.goodCount = session.goodCount + 1;
  if (rating === 'easy') updates.easyCount = session.easyCount + 1;
  await db.flashcard_study_sessions.update(sessionId, updates);
}

export async function addPersonalNote(
  userId: string,
  cardId: string,
  personalNote: string,
  personalExample: string,
): Promise<void> {
  const id = `${userId}_${cardId}`;
  await db.student_deck_notes.put({ $id: id, userId, cardId, personalNote, personalExample });
}

export async function getPersonalNote(userId: string, cardId: string): Promise<StudentDeckNote | undefined> {
  return db.student_deck_notes.get(`${userId}_${cardId}`);
}

export async function syncDecksFromServer(): Promise<void> {
  try {
    const deckResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.flashcard_decks, [
      Query.equal('status', 'published'),
      Query.limit(100),
    ]);
    for (const doc of deckResult.documents) {
      await db.flashcard_decks.put({
        $id: doc.$id,
        creatorId: doc.creatorId,
        title: doc.title,
        description: doc.description,
        type: doc.type,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      });
    }

    const cardResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.flashcard_cards, [
      Query.limit(500),
    ]);
    for (const doc of cardResult.documents) {
      await db.flashcard_cards.put({
        $id: doc.$id,
        deckId: doc.deckId,
        front: doc.front,
        back: doc.back,
        frontMarkdown: doc.frontMarkdown || doc.front,
        backMarkdown: doc.backMarkdown || doc.back,
        hint: doc.hint || '',
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        sortOrder: doc.sortOrder,
        createdAt: doc.createdAt,
      });
    }

    const assignResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.deck_assignments, [
      Query.limit(100),
    ]);
    for (const doc of assignResult.documents) {
      await db.deck_assignments.put({
        $id: doc.$id,
        deckId: doc.deckId,
        classId: doc.classId,
        isRequired: doc.isRequired,
        dailyTarget: doc.dailyTarget ?? null,
        assignedAt: doc.assignedAt,
      });
    }
  } catch {
    // Offline
  }
}

function parseTags(value: string): string[] {
  return value
    .split(/[;,]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}
