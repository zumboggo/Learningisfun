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
  toFsrsRating,
  Rating,
} from '@/lib/fsrs';
import { Query } from 'appwrite';
import type {
  FlashcardDeck,
  FlashcardCard,
  DeckAssignment,
  CardReview,
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
): Promise<FlashcardCard> {
  const existingCards = await db.flashcard_cards.where('deckId').equals(deckId).toArray();
  const sortOrder = existingCards.length;
  const id = generateId();
  const card: FlashcardCard = {
    $id: id,
    deckId,
    front,
    back,
    sortOrder,
    createdAt: getTimestamp(),
  };

  await db.flashcard_cards.put(card);
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.flashcard_cards, id, {
      deckId,
      front,
      back,
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
    if (front && back) {
      const card = await addCard(deck.$id, front, back);
      cards.push(card);
    }
  }

  return { deck, cards };
}

export async function assignDeck(deckId: string, classId: string, isRequired: boolean = false): Promise<DeckAssignment> {
  const id = generateId();
  const assignment: DeckAssignment = {
    $id: id,
    deckId,
    classId,
    isRequired,
    assignedAt: getTimestamp(),
  };

  await db.deck_assignments.put(assignment);
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.deck_assignments, id, {
      deckId,
      classId,
      isRequired,
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
): Promise<StudentCardState> {
  const stateRecord = await db.student_card_state.get(`${userId}_${cardId}`);
  const fsrsCard = stateRecord ? getCardFromState(stateRecord.fsrsState) : createNewCard();
  const previousState = cardToJson(fsrsCard);

  const fsrsRating = toFsrsRating(rating);
  const result = scheduleReview(fsrsCard, fsrsRating);
  const newCard = result.card;
  const newState = cardToJson(newCard);
  const now = getTimestamp();

  const cardState: StudentCardState = {
    $id: `${userId}_${cardId}`,
    userId,
    cardId,
    deckId,
    fsrsState: newState,
    dueDate: getNextDueDate(newCard).toISOString(),
    status: getCardStatus(newCard),
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

export async function getDeckProgress(userId: string, deckId: string): Promise<{
  total: number;
  newCount: number;
  learning: number;
  review: number;
  due: number;
  completedToday: number;
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

  for (const s of states) {
    if (s.status === 'learning' || s.status === 'relearning') learning++;
    if (s.status === 'review') review++;
    if (s.dueDate <= now.toISOString()) due++;
    if (s.lastReviewAt >= todayStart) completedToday++;
  }

  return {
    total: allCards.length,
    newCount: allCards.length - studiedIds.size,
    learning,
    review,
    due,
    completedToday,
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
        assignedAt: doc.assignedAt,
      });
    }
  } catch {
    // Offline
  }
}
