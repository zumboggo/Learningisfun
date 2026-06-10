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

export interface Reading {
  $id: string;
  teacherId: string;
  title: string;
  author: string;
  sourceUrl: string;
  description: string;
  content: string;
  contentFormat: 'plain' | 'markdown';
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ReadingAssignment {
  $id: string;
  readingId: string;
  classId: string;
  assignedAt: string;
  dueDate: string | null;
}

export type AnnotationType = 'highlight' | 'private_note' | 'teacher_visible_note';

export interface Annotation {
  $id: string;
  userId: string;
  readingId: string;
  type: AnnotationType;
  selectedText: string;
  textBefore: string;
  textAfter: string;
  startOffset: number;
  endOffset: number;
  blockId: string;
  color: string;
  noteText: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'conflict';

export interface DiscussionQuestion {
  $id: string;
  readingId: string;
  assignmentId: string;
  authorId: string;
  questionText: string;
  selectedPassage: string;
  voteCount: number;
  moderationStatus: 'visible' | 'hidden' | 'removed';
  discussionStatus: 'none' | 'selected' | 'discussed' | 'archived';
  isTeacherQuestion: boolean;
  teacherVisibleBeforeSubmission: boolean;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface QuestionVote {
  $id: string;
  questionId: string;
  userId: string;
  createdAt: string;
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
  sortOrder: number;
  createdAt: string;
}

export interface DeckAssignment {
  $id: string;
  deckId: string;
  classId: string;
  isRequired: boolean;
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
  lastReviewAt: string;
  reviewCount: number;
}

export interface StudentDeckNote {
  $id: string;
  userId: string;
  cardId: string;
  personalNote: string;
  personalExample: string;
}

export interface ReadingProgress {
  $id: string;
  userId: string;
  readingId: string;
  scrollPercent: number;
  lastPosition: number;
  bookmarked: boolean;
  updatedAt: string;
  syncStatus: SyncStatus;
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

export interface AppMetadata {
  key: string;
  value: string;
}
