import Dexie, { type EntityTable } from 'dexie';
import type {
  User,
  Class,
  ClassMember,
  ClassSession,
  ClassSessionItem,
  DiscussionQuestion,
  QuestionVote,
  FlashcardDeck,
  FlashcardCard,
  DeckAssignment,
  CardReview,
  FlashcardReviewEvent,
  FlashcardStudySession,
  StudentCardState,
  StudentDeckNote,
  SyncOperation,
  TeacherSettings,
  DiscussionAnswer,
  AppMetadata,
} from '@/types';

const db = new Dexie('LearningIsFunDB') as Dexie & {
  users: EntityTable<User, '$id'>;
  classes: EntityTable<Class, '$id'>;
  class_members: EntityTable<ClassMember, '$id'>;
  class_sessions: EntityTable<ClassSession, '$id'>;
  class_session_items: EntityTable<ClassSessionItem, '$id'>;
  discussion_questions: EntityTable<DiscussionQuestion, '$id'>;
  discussion_answers: EntityTable<DiscussionAnswer, '$id'>;
  question_votes: EntityTable<QuestionVote, '$id'>;
  flashcard_decks: EntityTable<FlashcardDeck, '$id'>;
  flashcard_cards: EntityTable<FlashcardCard, '$id'>;
  deck_assignments: EntityTable<DeckAssignment, '$id'>;
  card_reviews: EntityTable<CardReview, '$id'>;
  flashcard_review_events: EntityTable<FlashcardReviewEvent, '$id'>;
  flashcard_study_sessions: EntityTable<FlashcardStudySession, '$id'>;
  student_card_state: EntityTable<StudentCardState, '$id'>;
  student_deck_notes: EntityTable<StudentDeckNote, '$id'>;
  teacher_settings: EntityTable<TeacherSettings, '$id'>;
  sync_queue: EntityTable<SyncOperation, 'id'>;
  app_metadata: EntityTable<AppMetadata, 'key'>;
};

db.version(1).stores({
  users: '$id, email, role',
  classes: '$id, teacherId, joinCode, status',
  class_members: '$id, classId, userId, [classId+userId]',
  discussion_questions: '$id, classSessionId, authorId, moderationStatus',
  question_votes: '$id, questionId, userId',
  flashcard_decks: '$id, creatorId, type, status',
  flashcard_cards: '$id, deckId, sortOrder',
  deck_assignments: '$id, deckId, classId',
  card_reviews: '$id, userId, cardId, deckId, operationId',
  student_card_state: '$id, userId, cardId, deckId, dueDate, status',
  student_deck_notes: '$id, userId, cardId',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

db.version(2).stores({
  users: '$id, email, role',
  classes: '$id, teacherId, joinCode, status',
  class_members: '$id, classId, userId, [classId+userId]',
  class_sessions: '$id, classId, sessionDate, status, syncStatus',
  class_session_items: '$id, classSessionId, type, sourceId, sortOrder, syncStatus',
  discussion_questions: '$id, classSessionId, authorId, moderationStatus, discussionStatus',
  question_votes: '$id, questionId, classSessionId, userId, [questionId+userId], syncStatus',
  flashcard_decks: '$id, creatorId, type, status',
  flashcard_cards: '$id, deckId, sortOrder',
  deck_assignments: '$id, deckId, classId',
  card_reviews: '$id, userId, cardId, deckId, operationId',
  flashcard_review_events: '$id, userId, classId, deckId, cardId, sessionId, reviewedAt, syncStatus',
  flashcard_study_sessions: '$id, userId, classId, deckId, startedAt, syncStatus',
  student_card_state: '$id, userId, cardId, deckId, dueDate, status',
  student_deck_notes: '$id, userId, cardId',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

db.version(3).stores({
  users: '$id, email, role',
  classes: '$id, teacherId, joinCode, status',
  class_members: '$id, classId, userId, [classId+userId]',
  class_sessions: '$id, classId, sessionDate, status, syncStatus',
  class_session_items: '$id, classSessionId, type, sourceId, sortOrder, syncStatus',
  discussion_questions: '$id, classSessionId, authorId, moderationStatus, discussionStatus',
  question_votes: '$id, questionId, classSessionId, userId, [questionId+userId], syncStatus',
  flashcard_decks: '$id, creatorId, type, status',
  flashcard_cards: '$id, deckId, sortOrder',
  deck_assignments: '$id, deckId, classId',
  card_reviews: '$id, userId, cardId, deckId, operationId',
  flashcard_review_events: '$id, userId, classId, deckId, cardId, sessionId, reviewedAt, syncStatus',
  flashcard_study_sessions: '$id, userId, classId, deckId, startedAt, syncStatus',
  student_card_state: '$id, userId, cardId, deckId, dueDate, status',
  student_deck_notes: '$id, userId, cardId',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

db.version(4).stores({
  users: '$id, email, role',
  classes: '$id, teacherId, joinCode, status',
  class_members: '$id, classId, userId, [classId+userId]',
  class_sessions: '$id, classId, sessionDate, status, syncStatus',
  class_session_items: '$id, classSessionId, type, sourceId, sortOrder, syncStatus',
  discussion_questions: '$id, classSessionId, authorId, moderationStatus, discussionStatus',
  discussion_answers: '$id, questionId, authorId, syncStatus',
  question_votes: '$id, questionId, classSessionId, userId, [questionId+userId], syncStatus',
  flashcard_decks: '$id, creatorId, type, status',
  flashcard_cards: '$id, deckId, sortOrder',
  deck_assignments: '$id, deckId, classId',
  card_reviews: '$id, userId, cardId, deckId, operationId',
  flashcard_review_events: '$id, userId, classId, deckId, cardId, sessionId, reviewedAt, syncStatus',
  flashcard_study_sessions: '$id, userId, classId, deckId, startedAt, syncStatus',
  student_card_state: '$id, userId, cardId, deckId, dueDate, status',
  student_deck_notes: '$id, userId, cardId',
  teacher_settings: '$id, classId',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

db.version(5).stores({
  users: '$id, email, role',
  classes: '$id, teacherId, joinCode, status',
  class_members: '$id, classId, userId, [classId+userId]',
  class_sessions: '$id, classId, sessionDate, status, syncStatus',
  class_session_items: '$id, classSessionId, type, sourceId, sortOrder, syncStatus',
  discussion_questions: '$id, classSessionId, authorId, moderationStatus, discussionStatus',
  discussion_answers: '$id, questionId, authorId, syncStatus',
  question_votes: '$id, questionId, classSessionId, userId, [questionId+userId], syncStatus',
  flashcard_decks: '$id, creatorId, type, status',
  flashcard_cards: '$id, deckId, sortOrder',
  deck_assignments: '$id, deckId, classId',
  card_reviews: '$id, userId, cardId, deckId, operationId',
  flashcard_review_events: '$id, userId, classId, deckId, cardId, sessionId, reviewedAt, syncStatus',
  flashcard_study_sessions: '$id, userId, classId, deckId, startedAt, syncStatus',
  student_card_state: '$id, userId, cardId, deckId, dueDate, status',
  student_deck_notes: '$id, userId, cardId',
  teacher_settings: '$id, classId',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

export { db };
export default db;
