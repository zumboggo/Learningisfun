import Dexie, { type EntityTable } from 'dexie';
import type {
  User,
  Class,
  ClassMember,
  Reading,
  ReadingAssignment,
  ClassSession,
  ClassSessionItem,
  Annotation,
  DiscussionQuestion,
  QuestionVote,
  Submission,
  FlashcardDeck,
  FlashcardCard,
  DeckAssignment,
  CardReview,
  FlashcardReviewEvent,
  FlashcardStudySession,
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
  class_sessions: EntityTable<ClassSession, '$id'>;
  class_session_items: EntityTable<ClassSessionItem, '$id'>;
  annotations: EntityTable<Annotation, '$id'>;
  discussion_questions: EntityTable<DiscussionQuestion, '$id'>;
  question_votes: EntityTable<QuestionVote, '$id'>;
  submissions: EntityTable<Submission, '$id'>;
  flashcard_decks: EntityTable<FlashcardDeck, '$id'>;
  flashcard_cards: EntityTable<FlashcardCard, '$id'>;
  deck_assignments: EntityTable<DeckAssignment, '$id'>;
  card_reviews: EntityTable<CardReview, '$id'>;
  flashcard_review_events: EntityTable<FlashcardReviewEvent, '$id'>;
  flashcard_study_sessions: EntityTable<FlashcardStudySession, '$id'>;
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

db.version(2).stores({
  users: '$id, email, role',
  classes: '$id, teacherId, joinCode, status',
  class_members: '$id, classId, userId, [classId+userId]',
  readings: '$id, teacherId, status',
  reading_assignments: '$id, readingId, classId, status',
  class_sessions: '$id, classId, assignmentId, sessionDate, status, syncStatus',
  class_session_items: '$id, classSessionId, type, sourceId, sortOrder, syncStatus',
  annotations: '$id, readingId, userId, type, syncStatus',
  discussion_questions: '$id, readingId, assignmentId, classSessionId, authorId, moderationStatus, discussionStatus',
  question_votes: '$id, questionId, classSessionId, userId, [questionId+userId], syncStatus',
  submissions: '$id, assignmentId, classId, userId, status, syncStatus, [assignmentId+userId]',
  flashcard_decks: '$id, creatorId, type, status',
  flashcard_cards: '$id, deckId, sortOrder',
  deck_assignments: '$id, deckId, classId',
  card_reviews: '$id, userId, cardId, deckId, operationId',
  flashcard_review_events: '$id, userId, classId, deckId, cardId, sessionId, reviewedAt, syncStatus',
  flashcard_study_sessions: '$id, userId, classId, deckId, startedAt, syncStatus',
  student_card_state: '$id, userId, cardId, deckId, dueDate, status',
  student_deck_notes: '$id, userId, cardId',
  reading_progress: '$id, userId, readingId',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

export { db };
export default db;
