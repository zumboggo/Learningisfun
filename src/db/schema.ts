import Dexie, { type EntityTable } from 'dexie';
import type {
  User,
  Class,
  ClassMember,
  Reading,
  ReadingAssignment,
  Annotation,
  DiscussionQuestion,
  QuestionVote,
  FlashcardDeck,
  FlashcardCard,
  DeckAssignment,
  CardReview,
  StudentCardState,
  StudentDeckNote,
  ReadingProgress,
  SyncOperation,
  AppMetadata,
} from '@/types';

const db = new Dexie('EduSparkDB') as Dexie & {
  users: EntityTable<User, '$id'>;
  classes: EntityTable<Class, '$id'>;
  class_members: EntityTable<ClassMember, '$id'>;
  readings: EntityTable<Reading, '$id'>;
  reading_assignments: EntityTable<ReadingAssignment, '$id'>;
  annotations: EntityTable<Annotation, '$id'>;
  discussion_questions: EntityTable<DiscussionQuestion, '$id'>;
  question_votes: EntityTable<QuestionVote, '$id'>;
  flashcard_decks: EntityTable<FlashcardDeck, '$id'>;
  flashcard_cards: EntityTable<FlashcardCard, '$id'>;
  deck_assignments: EntityTable<DeckAssignment, '$id'>;
  card_reviews: EntityTable<CardReview, '$id'>;
  student_card_state: EntityTable<StudentCardState, '$id'>;
  student_deck_notes: EntityTable<StudentDeckNote, '$id'>;
  reading_progress: EntityTable<ReadingProgress, '$id'>;
  sync_queue: EntityTable<SyncOperation, 'id'>;
  app_metadata: EntityTable<AppMetadata, 'key'>;
};

db.version(1).stores({
  users: '$id, email, role',
  classes: '$id, teacherId, joinCode, status',
  class_members: '$id, classId, userId, [classId+userId]',
  readings: '$id, teacherId, status',
  reading_assignments: '$id, readingId, classId',
  annotations: '$id, readingId, userId, type, syncStatus',
  discussion_questions: '$id, readingId, assignmentId, authorId, moderationStatus',
  question_votes: '$id, questionId, userId',
  flashcard_decks: '$id, creatorId, type, status',
  flashcard_cards: '$id, deckId, sortOrder',
  deck_assignments: '$id, deckId, classId',
  card_reviews: '$id, userId, cardId, deckId, operationId',
  student_card_state: '$id, userId, cardId, deckId, dueDate, status',
  student_deck_notes: '$id, userId, cardId',
  reading_progress: '$id, userId, readingId',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

export { db };
export default db;
