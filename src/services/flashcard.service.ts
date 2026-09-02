import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateId, getTimestamp, parseTags } from '@/utils/helpers';
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
import { joinBackValues, parseCsvContent, readFileAsText } from '@/utils/csv-parser';
import { executeLearningContent } from './learning-content.service';

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
    const back = joinBackValues(row, mapping.back);
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

export async function getDeckAssignments(deckId: string): Promise<DeckAssignment[]> {
  return db.deck_assignments.where('deckId').equals(deckId).toArray();
}

export async function unassignDeck(deckId: string, classId: string): Promise<void> {
  const existing = await db.deck_assignments
    .where('deckId')
    .equals(deckId)
    .and(a => a.classId === classId)
    .toArray();

  for (const assignment of existing) {
    await db.deck_assignments.delete(assignment.$id);
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.deck_assignments, assignment.$id);
    } catch {
      await addToQueue('', 'deck_assignment', assignment.$id, 'delete', assignment);
    }
  }
}

/**
 * Makes the deck's class assignments match `classIds` exactly: adds the missing
 * ones and removes the ones no longer selected. Existing assignments are left
 * alone so their daily target and required flag survive an unrelated edit.
 */
export async function setDeckClasses(
  deckId: string,
  classIds: string[],
  dailyTarget: number | null = null,
): Promise<void> {
  const current = await getDeckAssignments(deckId);
  const currentIds = new Set(current.map(a => a.classId));
  const nextIds = new Set(classIds);

  for (const classId of nextIds) {
    if (!currentIds.has(classId)) await assignDeck(deckId, classId, false, dailyTarget);
  }
  for (const classId of currentIds) {
    if (!nextIds.has(classId)) await unassignDeck(deckId, classId);
  }
}

export async function getClassAssignments(classId: string): Promise<DeckAssignment[]> {
  return db.deck_assignments.where('classId').equals(classId).toArray();
}

/**
 * Mirror of setDeckClasses from the class side: makes the class's assigned decks
 * match `deckIds` exactly.
 */
export async function setClassDecks(
  classId: string,
  deckIds: string[],
  dailyTarget: number | null = null,
): Promise<void> {
  const current = await getClassAssignments(classId);
  const currentIds = new Set(current.map(a => a.deckId));
  const nextIds = new Set(deckIds);

  for (const deckId of nextIds) {
    if (!currentIds.has(deckId)) await assignDeck(deckId, classId, false, dailyTarget);
  }
  for (const deckId of currentIds) {
    if (!nextIds.has(deckId)) await unassignDeck(deckId, classId);
  }
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

export interface DeckStudySettings { newLimit: number; reviewLimit: number; intensity: 'gentle'|'balanced'|'intensive'; order: 'due'|'random' }
export const DEFAULT_DECK_STUDY_SETTINGS: DeckStudySettings = { newLimit: 10, reviewLimit: 50, intensity: 'balanced', order: 'due' };
export async function getDeckStudySettings(userId: string, deckId: string): Promise<DeckStudySettings> {
  const row = await db.app_metadata.get(`deckStudySettings:${userId}:${deckId}`);
  try { return { ...DEFAULT_DECK_STUDY_SETTINGS, ...JSON.parse(row?.value || '{}') } as DeckStudySettings; } catch { return DEFAULT_DECK_STUDY_SETTINGS; }
}
export async function saveDeckStudySettings(userId: string, deckId: string, settings: DeckStudySettings): Promise<void> {
  await db.app_metadata.put({ key:`deckStudySettings:${userId}:${deckId}`, value:JSON.stringify(settings) });
}
export const retentionForIntensity = (intensity: DeckStudySettings['intensity']) => intensity === 'gentle' ? 0.85 : intensity === 'intensive' ? 0.95 : 0.9;

export async function setCardStudyPreference(userId: string, cardId: string, patch: { buriedUntil?: string|null; suspended?: boolean }): Promise<void> {
  const id = `${userId}_${cardId}`;
  const current = await db.student_deck_notes.get(id);
  await db.student_deck_notes.put({ $id:id, userId, cardId, personalNote:current?.personalNote || '', personalExample:current?.personalExample || '', buriedUntil: patch.buriedUntil === undefined ? current?.buriedUntil : patch.buriedUntil, suspended: patch.suspended === undefined ? current?.suspended : patch.suspended });
}

export async function undoLastCardReview(userId: string, cardId: string): Promise<StudentCardState | null> {
  const reviews = await db.card_reviews.where('userId').equals(userId).and(review => review.cardId === cardId).toArray();
  const latest = reviews.sort((a,b)=>b.reviewAt.localeCompare(a.reviewAt))[0];
  if (!latest) return null;
  const restored = getCardFromState(latest.previousState);
  const current = await db.student_card_state.get(`${userId}_${cardId}`);
  const state: StudentCardState = { $id:`${userId}_${cardId}`, userId, cardId, deckId:latest.deckId, fsrsState:latest.previousState, dueDate:getNextDueDate(restored).toISOString(), status:getCardStatus(restored), ...getCardReviewFields(restored), lastReviewAt:current?.lastReviewAt || '', reviewCount:Math.max(0,(current?.reviewCount || 1)-1) };
  await db.student_card_state.put(state);
  await db.card_reviews.delete(latest.$id);
  const queued = await db.sync_queue.where('entityId').equals(latest.$id).toArray();
  if (queued.length) await db.sync_queue.bulkDelete(queued.flatMap(row => row.id === undefined ? [] : [row.id]));
  const events = await db.flashcard_review_events.where('userId').equals(userId).and(event => event.cardId === cardId).toArray();
  const latestEvent = events.sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt))[0];
  if (latestEvent) await db.flashcard_review_events.delete(latestEvent.$id);
  return state;
}

export async function reportFlashcard(cardId: string, reason: string): Promise<void> {
  await executeLearningContent({ action:'reportFlashcard', cardId, reason:reason.trim() });
}

export async function listFlashcardReports(classId: string) {
  return executeLearningContent<{reports:Array<{id:string;cardId:string;deckTitle:string;front:string;studentName:string;reason:string;createdAt:string}>}>({ action:'listFlashcardReports', classId });
}
export async function resolveFlashcardReport(reportId:string):Promise<void>{await executeLearningContent({action:'resolveFlashcardReport',reportId});}

export interface EditableDeckCard {
  id?: string;
  front: string;
  back: string;
  hint: string;
  tags: string[];
}

export async function updateEntireDeck(
  deckId: string,
  creatorId: string,
  updates: { title: string; description: string; cards: EditableDeckCard[] },
): Promise<void> {
  const localDeck = await db.flashcard_decks.get(deckId);
  if (!localDeck || localDeck.creatorId !== creatorId) throw new Error('Only the deck creator can edit it');
  const result = await executeLearningContent<{ deck: FlashcardDeck; cards: FlashcardCard[] }>({
    action: 'updateFlashcardDeck',
    deckId,
    title: updates.title,
    description: updates.description,
    cards: updates.cards,
  });

  const oldIds = await db.flashcard_cards.where('deckId').equals(deckId).primaryKeys();
  await db.transaction('rw', db.flashcard_decks, db.flashcard_cards, async () => {
    await db.flashcard_decks.put(result.deck);
    await db.flashcard_cards.bulkDelete(oldIds);
    await db.flashcard_cards.bulkPut(result.cards);
  });
}

export async function deletePersonalDeck(deckId: string, creatorId: string): Promise<void> {
  const deck = await db.flashcard_decks.get(deckId);
  if (!deck || deck.creatorId !== creatorId || deck.type !== 'personal') throw new Error('Only the owner can delete this personal deck');
  await executeLearningContent({ action: 'deletePersonalFlashcardDeck', deckId });
  await db.transaction('rw', db.flashcard_decks, db.flashcard_cards, async () => {
    await db.flashcard_cards.where('deckId').equals(deckId).delete();
    await db.flashcard_decks.delete(deckId);
  });
}

export async function reviewCard(
  userId: string,
  cardId: string,
  deckId: string,
  rating: ReviewRating,
  context: { classId?: string | null; sessionId?: string; elapsedSeconds?: number; requestRetention?: number } = {},
): Promise<StudentCardState> {
  const stateRecord = await db.student_card_state.get(`${userId}_${cardId}`);
  const fsrsCard = stateRecord ? getCardFromState(stateRecord.fsrsState) : createNewCard();
  const previousState = cardToJson(fsrsCard);

  const fsrsRating = toFsrsRating(rating);
  const result = scheduleReview(fsrsCard, fsrsRating, context.requestRetention || 0.9);
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
export type CustomStudyFilter = 'all' | 'due' | 'new' | 'difficult';

export function filterCustomStudyCards(cards: FlashcardCard[], states: StudentCardState[], tags: string[], filter: CustomStudyFilter): FlashcardCard[] {
  const stateByCard = new Map(states.map(state => [state.cardId, state]));
  const now = Date.now();
  return cards.filter(card => {
    if (tags.length && !card.tags.some(tag => tags.includes(tag))) return false;
    const state = stateByCard.get(card.$id);
    if (filter === 'new') return !state;
    if (filter === 'due') return Boolean(state && (!Number.isFinite(Date.parse(state.dueDate)) || Date.parse(state.dueDate) <= now));
    if (filter === 'difficult') return Boolean(state && (state.lapses > 0 || state.difficulty >= 7));
    return true;
  });
}

export async function buildFlashcardQueue(
  userId: string,
  deckId: string,
  mode: FlashcardQueueMode = 'mixed',
  limit = 30,
): Promise<FlashcardCard[]> {
  const [cards, states, preferences, settings] = await Promise.all([
    getDeckCards(deckId),
    db.student_card_state.where('userId').equals(userId).and(s => s.deckId === deckId).toArray(),
    db.student_deck_notes.where('userId').equals(userId).toArray(),
    getDeckStudySettings(userId, deckId),
  ]);
  const now = Date.now();
  const preferenceByCard = new Map(preferences.map(row => [row.cardId,row]));
  const availableCards = cards.filter(card => { const preference=preferenceByCard.get(card.$id);return !preference?.suspended && (!preference?.buriedUntil || Date.parse(preference.buriedUntil) <= now); });
  if (mode === 'all') return (settings.order === 'random' ? [...availableCards].sort(()=>Math.random()-.5) : availableCards).slice(0, limit);

  const stateByCard = new Map(states.map(s => [s.cardId, s]));
  const learnAhead = now + 5 * 60 * 1000;
  const due = availableCards
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
  const fresh = availableCards.filter(card => !stateByCard.has(card.$id)).slice(0, settings.newLimit);

  if (mode === 'due') return due.slice(0, Math.min(limit, settings.reviewLimit));
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

export async function syncDecksFromServer(classIds: string[], userId: string): Promise<boolean> {
  try {
    const assignmentResult = classIds.length
      ? await databases.listDocuments(DATABASE_ID, COLLECTIONS.deck_assignments, [Query.equal('classId', classIds), Query.limit(200)])
      : { documents: [] };
    const assignedDeckIds = [...new Set(assignmentResult.documents.map(doc => doc.deckId as string))];
    const [assignedDecks, ownedDecks] = await Promise.all([
      assignedDeckIds.length
        ? databases.listDocuments(DATABASE_ID, COLLECTIONS.flashcard_decks, [Query.equal('$id', assignedDeckIds), Query.equal('status', 'published'), Query.limit(200)])
        : Promise.resolve({ documents: [] }),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.flashcard_decks, [Query.equal('creatorId', userId), Query.limit(200)]),
    ]);
    const deckResult = { documents: [...new Map([...assignedDecks.documents, ...ownedDecks.documents].map(doc => [doc.$id, doc])).values()] };
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

    const deckIds = deckResult.documents.map(doc => doc.$id);
    const cardResult = deckIds.length
      ? await databases.listDocuments(DATABASE_ID, COLLECTIONS.flashcard_cards, [Query.equal('deckId', deckIds), Query.limit(2000)])
      : { documents: [] };
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

    // A pull must remove cards that were deleted on another device or by a
    // server-side maintenance pass. Keep local cards that still have an
    // unsent create/update operation so offline teacher work is never erased.
    if (deckIds.length) {
      const [localCards, queuedCardChanges] = await Promise.all([
        db.flashcard_cards.where('deckId').anyOf(deckIds).toArray(),
        db.sync_queue.where('entityType').equals('card').filter(op => op.syncStatus !== 'synced').toArray(),
      ]);
      const remoteCardIds = new Set(cardResult.documents.map(doc => doc.$id));
      const protectedCardIds = new Set(queuedCardChanges.map(op => op.entityId));
      const staleCardIds = localCards
        .filter(card => !remoteCardIds.has(card.$id) && !protectedCardIds.has(card.$id))
        .map(card => card.$id);
      if (staleCardIds.length) await db.flashcard_cards.bulkDelete(staleCardIds);
    }

    for (const doc of assignmentResult.documents) {
      await db.deck_assignments.put({
        $id: doc.$id,
        deckId: doc.deckId,
        classId: doc.classId,
        isRequired: doc.isRequired,
        dailyTarget: doc.dailyTarget ?? null,
        assignedAt: doc.assignedAt,
      });
    }
    if (classIds.length) {
      const [localAssignments, queuedAssignmentChanges] = await Promise.all([
        db.deck_assignments.where('classId').anyOf(classIds).toArray(),
        db.sync_queue.where('entityType').equals('deck_assignment').filter(op => op.syncStatus !== 'synced').toArray(),
      ]);
      const remoteAssignmentIds = new Set(assignmentResult.documents.map(doc => doc.$id));
      const protectedAssignmentIds = new Set(queuedAssignmentChanges.map(op => op.entityId));
      const staleAssignmentIds = localAssignments
        .filter(assignment => !remoteAssignmentIds.has(assignment.$id) && !protectedAssignmentIds.has(assignment.$id))
        .map(assignment => assignment.$id);
      if (staleAssignmentIds.length) await db.deck_assignments.bulkDelete(staleAssignmentIds);
    }
    return true;
  } catch { return false; }
}
