export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  $id: string;
  email: string;
  name: string;
  role: UserRole;
  deviceId: string;
  lastSyncAt: string;
  createdAt: string;
}

export interface Class {
  $id: string;
  name: string;
  courseName: string;
  schoolYear: string;
  teacherId: string;
  joinCode: string;
  joinCodeActive: boolean;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface ClassMember {
  $id: string;
  classId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
}

export interface ClassSession {
  $id: string;
  classId: string;
  assignmentId?: string;
  title: string;
  sessionDate: string;
  status: 'draft' | 'active' | 'published' | 'archived';
  votesPerStudent: number;
  allowStackedVotes: boolean;
  notesMarkdown: string;
  publishedNotesMarkdown: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface ClassSessionItem {
  $id: string;
  classSessionId: string;
  type: 'question' | 'submission' | 'note';
  sourceId: string;
  sortOrder: number;
  snapshotMarkdown: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'conflict';

export interface DiscussionQuestion {
  $id: string;
  classSessionId: string;
  authorId: string;
  questionText: string;
  selectedPassage: string;
  voteCount: number;
  moderationStatus: 'visible' | 'hidden' | 'removed';
  discussionStatus: 'none' | 'selected' | 'discussed' | 'archived';
  discussionNotesMarkdown: string;
  notesUpdatedAt: string | null;
  isTeacherQuestion: boolean;
  teacherVisibleBeforeSubmission: boolean;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface QuestionVote {
  $id: string;
  questionId: string;
  classSessionId: string;
  userId: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface FlashcardDeck {
  $id: string;
  creatorId: string;
  title: string;
  description: string;
  type: 'teacher' | 'personal';
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardCard {
  $id: string;
  deckId: string;
  front: string;
  back: string;
  frontMarkdown: string;
  backMarkdown: string;
  hint: string;
  tags: string[];
  sortOrder: number;
  createdAt: string;
}

export interface DeckAssignment {
  $id: string;
  deckId: string;
  classId: string;
  isRequired: boolean;
  dailyTarget: number | null;
  assignedAt: string;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface CardReview {
  $id: string;
  userId: string;
  cardId: string;
  deckId: string;
  rating: ReviewRating;
  reviewAt: string;
  previousState: string;
  newState: string;
  deviceId: string;
  operationId: string;
  syncStatus: SyncStatus;
}

export type CardStatus = 'new' | 'learning' | 'review' | 'relearning';

export interface StudentCardState {
  $id: string;
  userId: string;
  cardId: string;
  deckId: string;
  fsrsState: string;
  dueDate: string;
  status: CardStatus;
  intervalDays: number;
  stability: number;
  difficulty: number;
  learningSteps: number;
  repetitions: number;
  lapses: number;
  lastReviewAt: string;
  reviewCount: number;
}

export interface FlashcardReviewEvent {
  $id: string;
  userId: string;
  classId: string | null;
  deckId: string;
  cardId: string;
  sessionId: string;
  rating: ReviewRating;
  reviewedAt: string;
  elapsedSeconds: number;
  syncStatus: SyncStatus;
}

export interface FlashcardStudySession {
  $id: string;
  userId: string;
  classId: string | null;
  deckId: string;
  startedAt: string;
  endedAt: string | null;
  activeSeconds: number;
  cardsReviewed: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  syncStatus: SyncStatus;
}

export interface StudentDeckNote {
  $id: string;
  userId: string;
  cardId: string;
  personalNote: string;
  personalExample: string;
}

export interface SyncOperation {
  id?: number;
  operationId: string;
  userId: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  operationType: 'create' | 'update' | 'delete';
  timestamp: number;
  localVersion: number;
  payload: unknown;
  retryCount: number;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  error?: string;
}

export interface CsvMapping {
  front: string;
  back: string;
  hint?: string;
  tags?: string;
  source?: string;
  initialStatus?: string;
}

export interface CsvPreview {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  invalidRows: number;
  emptyRows: number;
  duplicates: number;
  longFields: number;
}

export interface TeacherSettings {
  $id: string;
  classId: string;
  commentThreshold: number;
  hideStudentNicknames: boolean;
}

export interface DiscussionAnswer {
  $id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  answerText: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface AppMetadata {
  key: string;
  value: string;
}

export interface ReadingProgress {
  $id: string;
  userId: string;
  readingId: string;
  progress: number;
  lastReadAt: string;
}

export interface Quiz {
  $id: string;
  classId: string;
  createdBy: string;
  title: string;
  sourceType: 'discussion' | 'flashcards' | 'mixed';
  notesWeight: number;
  flashcardWeight: number;
  questionCount: number;
  timeLimitMinutes: number | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface QuizQuestion {
  $id: string;
  quizId: string;
  type: 'mc' | 'cloze';
  questionText: string;
  options: string;
  correctIndex: number;
  clozeAnswer: string;
  explanation: string;
  sortOrder: number;
}

export interface QuizAttempt {
  $id: string;
  quizId: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  score: number;
  totalQuestions: number;
  answers: string;
  syncStatus: SyncStatus;
}
