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
  Quiz,
  QuizQuestion,
  QuizAttempt,
  ReadingProgress,
  WritingPrompt,
  WritingPromptAssignment,
  WritingSubmission,
  PeerReview,
  WritingAiFeedback,
  TeacherWritingFeedback,
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
  reading_progress: EntityTable<ReadingProgress, '$id'>;
  quizzes: EntityTable<Quiz, '$id'>;
  quiz_questions: EntityTable<QuizQuestion, '$id'>;
  quiz_attempts: EntityTable<QuizAttempt, '$id'>;
  writing_prompts: EntityTable<WritingPrompt, '$id'>;
  writing_prompt_assignments: EntityTable<WritingPromptAssignment, '$id'>;
  writing_submissions: EntityTable<WritingSubmission, '$id'>;
  peer_reviews: EntityTable<PeerReview, '$id'>;
  writing_ai_feedback: EntityTable<WritingAiFeedback, '$id'>;
  teacher_writing_feedback: EntityTable<TeacherWritingFeedback, '$id'>;
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

db.version(6).stores({
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
  reading_progress: '$id, userId, readingId',
  quizzes: '$id, classId, createdBy, status, createdAt, syncStatus',
  quiz_questions: '$id, quizId, sortOrder',
  quiz_attempts: '$id, quizId, userId, completedAt, syncStatus',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

db.version(7).stores({
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
  reading_progress: '$id, userId, readingId',
  quizzes: '$id, classId, createdBy, status, createdAt, syncStatus',
  quiz_questions: '$id, quizId, sortOrder',
  quiz_attempts: '$id, quizId, userId, completedAt, syncStatus',
  writing_prompts: '$id, classId, teacherId, status, createdAt, syncStatus',
  writing_submissions: '$id, promptId, classId, authorId, status, [promptId+authorId], syncStatus',
  peer_reviews: '$id, promptId, submissionId, reviewerId, status, [promptId+reviewerId], [submissionId+reviewerId], syncStatus',
  writing_ai_feedback: '$id, submissionId',
  teacher_writing_feedback: '$id, submissionId, teacherId, syncStatus',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
});

db.version(8).stores({
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
  reading_progress: '$id, userId, readingId',
  quizzes: '$id, classId, createdBy, status, createdAt, syncStatus',
  quiz_questions: '$id, quizId, sortOrder',
  quiz_attempts: '$id, quizId, userId, completedAt, syncStatus',
  writing_prompts: '$id, classId, teacherId, status, createdAt, syncStatus',
  writing_prompt_assignments: '$id, promptId, classId, [promptId+classId]',
  writing_submissions: '$id, promptId, classId, authorId, status, [promptId+authorId], syncStatus',
  peer_reviews: '$id, promptId, submissionId, reviewerId, status, [promptId+reviewerId], [submissionId+reviewerId], syncStatus',
  writing_ai_feedback: '$id, submissionId',
  teacher_writing_feedback: '$id, submissionId, teacherId, syncStatus',
  sync_queue: '++id, operationId, userId, entityType, entityId, syncStatus, createdAt',
  app_metadata: 'key',
}).upgrade(async tx => {
  // Prompts written before this version belong to exactly one class. Give each
  // one the matching assignment row so the new class-based lookups still find
  // work students have already started.
  const prompts = await tx.table('writing_prompts').toArray();
  const assignments = prompts
    .filter((prompt: WritingPrompt) => Boolean(prompt.classId))
    .map((prompt: WritingPrompt) => ({
      $id: crypto.randomUUID(),
      promptId: prompt.$id,
      classId: prompt.classId,
      assignedAt: prompt.createdAt || new Date().toISOString(),
    }));
  if (assignments.length > 0) {
    await tx.table('writing_prompt_assignments').bulkPut(assignments);
  }
});

export { db };
export default db;
