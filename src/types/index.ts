export type UserRole = 'student' | 'teacher' | 'parent' | 'substitute' | 'admin';

export interface User {
  $id: string;
  email: string;
  name: string;
  role: UserRole;
  deviceId: string;
  lastSyncAt: string;
  createdAt: string;
  nicknameUpdatedAt?: string;
  nicknameModerationStatus?: 'visible' | 'reset';
}

export interface Class {
  $id: string;
  name: string;
  courseName: string;
  schoolYear: string;
  teacherId: string;
  joinCode: string;
  joinCodeActive: boolean;
  parentCode: string;
  parentCodeActive: boolean;
  substituteCode?: string;
  substituteCodeActive?: boolean;
  substituteExpiresAt?: string | null;
  linksJson: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface ClassLink {
  label: string;
  url: string;
}

export interface ClassMember {
  $id: string;
  classId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
  expiresAt?: string | null;
}

export interface ClassSession {
  $id: string;
  classId: string;
  assignmentId?: string;
  discussionType?: 'qft' | 'question' | 'text' | 'notes' | 'presentation';
  textId?: string | null;
  promptMarkdown?: string;
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

export interface PresentationLink {
  $id: string;
  teacherId: string;
  classId: string;
  title: string;
  url: string;
  assignedAt: string;
  watchedAt: string | null;
}

export interface PeerReviewActivity {
  $id: string;
  classId: string;
  teacherId: string;
  title: string;
  assignmentType: 'presentation_pvlegs';
  reviewsRequired: number;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  flaggedCount?: number;
}

export type PvlegsRating = 1 | 2 | 3;

export interface PresentationPeerReview {
  $id: string;
  activityId: string;
  classId: string;
  presenterId: string;
  reviewerId?: string;
  reviewerName?: string;
  poise: PvlegsRating;
  voice: PvlegsRating;
  life: PvlegsRating;
  eyeContact: PvlegsRating;
  gestures: PvlegsRating;
  speed: PvlegsRating;
  strengthComment: string;
  nextStepComment: string;
  moderationStatus: 'visible' | 'hidden';
  flagged: boolean;
  flagReason: string;
  createdAt: string;
  updatedAt: string;
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
  sourceTitle?: string;
  sourceUrl?: string;
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
  buriedUntil?: string | null;
  suspended?: boolean;
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
  /**
   * One or more columns to combine onto the back of the card, in CSV column
   * order. A definition and an example usually both belong there.
   */
  back: string[];
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
  sourceTitle?: string;
  sourceUrl?: string;
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
  /** Class whose cards were used to generate this quiz. */
  sourceClassId?: string;
  createdBy: string;
  title: string;
  sourceType: 'discussion' | 'flashcards' | 'mixed';
  notesWeight: number;
  flashcardWeight: number;
  questionCount: number;
  timeLimitMinutes: number | null;
  /** One attempt by default; teachers may allow one retry. */
  allowedAttempts: 1 | 2;
  /** Whether students see per-question correctness and explanations after submitting. */
  showAnswerFeedback: boolean;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface QuizAssignment {
  $id: string;
  quizId: string;
  classId: string;
  assignedAt: string;
}

export interface QuizQuestion {
  $id: string;
  quizId: string;
  type: 'mc' | 'cloze' | 'matching';
  questionText: string;
  options: string;
  correctIndex: number;
  clozeAnswer: string;
  /** JSON-encoded string[] — alternate spellings also accepted for a cloze answer. */
  clozeVariants?: string;
  /** JSON-encoded MatchingQuestionData for matching questions. */
  matchingData?: string;
  /** Points available for this visible question card. */
  points?: number;
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
  /** Exact half-point grading for balanced retrieval quizzes. */
  scoreHalfPoints?: number;
  totalHalfPoints?: number;
  answers: string;
  syncStatus: SyncStatus;
}

export interface RubricLevel {
  points: number;
  label: string;
  descriptor: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface WritingPrompt {
  $id: string;
  classId: string;
  teacherId: string;
  title: string;
  promptMarkdown: string;
  instructions: string;
  /** JSON-encoded RubricCriterion[] */
  rubricJson: string;
  peerReviewsRequired: number;
  minWords: number;
  dueAt: string | null;
  status: 'draft' | 'published' | 'closed';
  aiFeedbackEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

/**
 * Which classes a writing prompt has been handed to. Mirrors DeckAssignment so
 * a prompt can be reused across sections instead of being retyped per class.
 */
export interface WritingPromptAssignment {
  $id: string;
  promptId: string;
  classId: string;
  assignedAt: string;
}

export interface WritingSubmission {
  $id: string;
  promptId: string;
  classId: string;
  authorId: string;
  /** Pseudonym shown to peers; teachers always resolve the real name. */
  anonymousLabel: string;
  draftMarkdown: string;
  submittedMarkdown: string;
  wordCount: number;
  status: 'draft' | 'submitted' | 'revised';
  submittedAt: string | null;
  finalMarkdown: string;
  finalUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface PeerReview {
  $id: string;
  promptId: string;
  submissionId: string;
  reviewerId: string;
  /** JSON-encoded Record<criterionId, number> */
  scoresJson: string;
  /** JSON-encoded string[] — the three specific pieces of feedback */
  feedbackPointsJson: string;
  additionalComment: string;
  status: 'assigned' | 'submitted';
  assignedAt: string;
  submittedAt: string | null;
  syncStatus: SyncStatus;
}

export interface WritingAiFeedback {
  $id: string;
  submissionId: string;
  wwwSummary: string;
  /** JSON-encoded string[] — actionable improvements */
  improvementsJson: string;
  model: string;
  generatedAt: string;
}

export interface TeacherWritingFeedback {
  $id: string;
  submissionId: string;
  teacherId: string;
  /** JSON-encoded Record<criterionId, number> */
  scoresJson: string;
  commentMarkdown: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LearningText {
  $id: string;
  teacherId: string;
  title: string;
  author: string;
  source: string;
  contentMode?: 'full' | 'link';
  externalUrl?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface TextAssignment {
  $id: string;
  textId: string;
  classId: string;
  assignedAt: string;
  dueClassNumber?: number;
}

export interface TextParagraph {
  $id: string;
  textId: string;
  sortOrder: number;
  content: string;
}

export type TextSupportLevel = 'supported' | 'highly_supported';

export interface TextVersion {
  $id: string;
  textId: string;
  level: TextSupportLevel;
  status: 'generating' | 'ready' | 'failed';
  requestedBy: string;
  model: string;
  promptVersion: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TextVersionParagraph {
  $id: string;
  versionId: string;
  textId: string;
  originalParagraphId: string;
  sortOrder: number;
  content: string;
}

export interface TextAnnotation {
  $id: string;
  textId: string;
  paragraphId: string;
  classId: string;
  authorId: string;
  anonymousLabel: string;
  type: 'observation' | 'question';
  kind?: 'annotation' | 'highlight' | 'page_note' | 'reply';
  content: string;
  selectedText?: string;
  tagsJson?: string;
  parentId?: string | null;
  visibility?: 'class' | 'private';
  moderationStatus: 'visible' | 'hidden';
  flagged?: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface TextDiscussionPost {
  $id: string;
  classSessionId: string;
  textId: string | null;
  classId: string;
  parentId: string | null;
  depth: number;
  authorId: string;
  anonymousLabel: string;
  content: string;
  score: number;
  moderationStatus: 'visible' | 'hidden';
  locked: boolean;
  isTeacherPost: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface TextDiscussionVote {
  $id: string;
  postId: string;
  classSessionId: string;
  textId: string | null;
  classId: string;
  userId: string;
  value: -1 | 1;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}
