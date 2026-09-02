// One-off script: provisions the Appwrite database + collections this app expects.
// Reads credentials from .env.setup.local (gitignored, never commit it).
// Run with: node --env-file=.env.setup.local scripts/setup-appwrite.mjs
//
// New collections have no collection-wide browser permissions. Reads and writes
// for collaborative content must pass through authenticated Appwrite Functions,
// which enforce role, ownership, assignment, and class-membership checks.
// Existing collections are not changed by this provisioning pass.

import { Client, Databases, Permission, Role, ID } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'main';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY. Run via .env.setup.local.');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const PERMISSIONS = [];

// type: 'string' | 'text' | 'integer' | 'float' | 'boolean' | 'enum'
// text is just a string attribute with a large size, for markdown/JSON blobs.
const S = (key, opts = {}) => ({ type: 'string', key, size: 255, ...opts });
const TXT = (key, opts = {}) => ({ type: 'string', key, size: 1_000_000, ...opts });
const INT = (key, opts = {}) => ({ type: 'integer', key, ...opts });
const FLOAT = (key, opts = {}) => ({ type: 'float', key, ...opts });
const BOOL = (key, opts = {}) => ({ type: 'boolean', key, ...opts });
const ENUM = (key, elements, opts = {}) => ({ type: 'enum', key, elements, ...opts });

// Dates/timestamps are stored as ISO strings (getTimestamp() = new Date().toISOString()),
// but sessionDate/dueAt-style fields aren't always full ISO — plain strings avoid any
// datetime-attribute format friction.
const DATE = (key, opts = {}) => S(key, { size: 64, ...opts });

const COLLECTIONS = [
  {
    id: 'users',
    name: 'Users',
    attributes: [
      S('email', { size: 320, required: true }),
      S('name', { required: true }),
      ENUM('role', ['teacher', 'student', 'parent'], { required: true }),
      S('deviceId', { required: true }),
      DATE('lastSyncAt', { required: true }),
      DATE('createdAt', { required: true }),
      DATE('nicknameUpdatedAt', { required: false }),
      ENUM('nicknameModerationStatus', ['visible', 'reset'], { required: false }),
    ],
    indexes: [
      { key: 'idx_email', type: 'key', attributes: ['email'] },
      { key: 'idx_role', type: 'key', attributes: ['role'] },
    ],
  },
  {
    id: 'classes',
    name: 'Classes',
    attributes: [
      S('name', { required: true }),
      S('courseName', { required: true }),
      S('schoolYear', { required: true }),
      S('teacherId', { required: true }),
      S('joinCode', { size: 16, required: true }),
      BOOL('joinCodeActive', { required: true }),
      S('parentCode', { size: 16, required: false }),
      BOOL('parentCodeActive', { required: false }),
      TXT('linksJson', { required: false }),
      ENUM('status', ['active', 'archived'], { required: true }),
      DATE('createdAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_teacherId', type: 'key', attributes: ['teacherId'] },
      { key: 'idx_joinCode', type: 'key', attributes: ['joinCode'] },
      { key: 'idx_parentCode', type: 'key', attributes: ['parentCode'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
    ],
  },
  {
    id: 'class_members',
    name: 'Class Members',
    attributes: [
      S('classId', { required: true }),
      S('userId', { required: true }),
      ENUM('role', ['teacher', 'student', 'parent'], { required: true }),
      DATE('joinedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_class_user', type: 'key', attributes: ['classId', 'userId'] },
    ],
  },
  {
    id: 'class_sessions',
    name: 'Class Sessions',
    attributes: [
      S('classId', { required: true }),
      S('assignmentId', { required: false }),
      ENUM('discussionType', ['qft', 'question', 'text', 'notes', 'presentation'], { required: false }),
      S('textId', { required: false }),
      TXT('promptMarkdown', { required: false }),
      S('title', { required: true }),
      DATE('sessionDate', { required: true }),
      ENUM('status', ['draft', 'active', 'published', 'archived'], { required: true }),
      INT('votesPerStudent', { required: true }),
      BOOL('allowStackedVotes', { required: true }),
      TXT('notesMarkdown', { required: false }),
      TXT('publishedNotesMarkdown', { required: false }),
      DATE('publishedAt', { required: false }),
      DATE('createdAt', { required: true }),
      DATE('updatedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
      { key: 'idx_sessionDate', type: 'key', attributes: ['sessionDate'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
      { key: 'idx_discussionType', type: 'key', attributes: ['discussionType'] },
    ],
  },
  {
    id: 'class_session_items',
    name: 'Class Session Items',
    attributes: [
      S('classSessionId', { required: true }),
      ENUM('type', ['question', 'submission', 'note'], { required: true }),
      S('sourceId', { required: true }),
      INT('sortOrder', { required: true }),
      TXT('snapshotMarkdown', { required: false }),
      DATE('createdAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_classSessionId', type: 'key', attributes: ['classSessionId'] },
      { key: 'idx_type', type: 'key', attributes: ['type'] },
      { key: 'idx_sourceId', type: 'key', attributes: ['sourceId'] },
    ],
  },
  {
    id: 'discussion_questions',
    name: 'Discussion Questions',
    attributes: [
      S('classSessionId', { required: true }),
      S('authorId', { required: true }),
      TXT('questionText', { required: true }),
      TXT('selectedPassage', { required: false }),
      S('sourceTitle', { required: false }),
      S('sourceUrl', { size: 2048, required: false }),
      INT('voteCount', { required: true }),
      ENUM('moderationStatus', ['visible', 'hidden', 'removed'], { required: true }),
      ENUM('discussionStatus', ['none', 'selected', 'discussed', 'archived'], { required: true }),
      TXT('discussionNotesMarkdown', { required: false }),
      DATE('notesUpdatedAt', { required: false }),
      BOOL('isTeacherQuestion', { required: true }),
      BOOL('teacherVisibleBeforeSubmission', { required: true }),
      DATE('createdAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_classSessionId', type: 'key', attributes: ['classSessionId'] },
      { key: 'idx_authorId', type: 'key', attributes: ['authorId'] },
      { key: 'idx_moderationStatus', type: 'key', attributes: ['moderationStatus'] },
      { key: 'idx_discussionStatus', type: 'key', attributes: ['discussionStatus'] },
    ],
  },
  {
    id: 'question_votes',
    name: 'Question Votes',
    attributes: [
      S('questionId', { required: true }),
      S('classSessionId', { required: true }),
      S('userId', { required: true }),
      INT('weight', { required: true }),
      DATE('createdAt', { required: true }),
      DATE('updatedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_questionId', type: 'key', attributes: ['questionId'] },
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_question_user', type: 'key', attributes: ['questionId', 'userId'] },
    ],
  },
  {
    // Replies to a discussion question. Without this collection replies never
    // leave the device that wrote them.
    id: 'discussion_answers',
    name: 'Discussion Answers',
    attributes: [
      S('questionId', { required: true }),
      S('authorId', { required: true }),
      S('authorName', { required: false }),
      TXT('answerText', { required: false }),
      S('sourceTitle', { required: false }),
      S('sourceUrl', { size: 2048, required: false }),
      DATE('createdAt', { required: true }),
      DATE('updatedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_questionId', type: 'key', attributes: ['questionId'] },
      { key: 'idx_authorId', type: 'key', attributes: ['authorId'] },
    ],
  },
  {
    id: 'flashcard_decks',
    name: 'Flashcard Decks',
    attributes: [
      S('creatorId', { required: true }),
      S('title', { required: true }),
      TXT('description', { required: false }),
      ENUM('type', ['teacher', 'personal'], { required: true }),
      ENUM('status', ['draft', 'published', 'archived'], { required: true }),
      DATE('createdAt', { required: true }),
      DATE('updatedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_creatorId', type: 'key', attributes: ['creatorId'] },
      { key: 'idx_type', type: 'key', attributes: ['type'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
    ],
  },
  {
    id: 'flashcard_cards',
    name: 'Flashcard Cards',
    attributes: [
      S('deckId', { required: true }),
      TXT('front', { required: true }),
      TXT('back', { required: true }),
      TXT('frontMarkdown', { required: false }),
      TXT('backMarkdown', { required: false }),
      S('hint', { required: false }),
      S('tags', { array: true, required: false }),
      INT('sortOrder', { required: true }),
      DATE('createdAt', { required: true }),
    ],
    indexes: [{ key: 'idx_deckId', type: 'key', attributes: ['deckId'] }],
  },
  {
    id: 'deck_assignments',
    name: 'Deck Assignments',
    attributes: [
      S('deckId', { required: true }),
      S('classId', { required: true }),
      BOOL('isRequired', { required: true }),
      INT('dailyTarget', { required: false }),
      DATE('assignedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_deckId', type: 'key', attributes: ['deckId'] },
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
    ],
  },
  {
    id: 'card_reviews',
    name: 'Card Reviews',
    attributes: [
      S('userId', { required: true }),
      S('cardId', { required: true }),
      S('deckId', { required: true }),
      S('rating', { required: true }),
      DATE('reviewAt', { required: true }),
      S('previousState', { required: false }),
      S('newState', { required: false }),
      S('deviceId', { required: true }),
      S('operationId', { required: true }),
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_cardId', type: 'key', attributes: ['cardId'] },
      { key: 'idx_deckId', type: 'key', attributes: ['deckId'] },
      { key: 'idx_operationId', type: 'key', attributes: ['operationId'] },
    ],
  },
  {
    id: 'flashcard_review_events',
    name: 'Flashcard Review Events',
    attributes: [
      S('userId', { required: true }),
      S('classId', { required: false }),
      S('deckId', { required: true }),
      S('cardId', { required: true }),
      S('sessionId', { required: true }),
      S('rating', { required: true }),
      DATE('reviewedAt', { required: true }),
      INT('elapsedSeconds', { required: true }),
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
      { key: 'idx_deckId', type: 'key', attributes: ['deckId'] },
      { key: 'idx_cardId', type: 'key', attributes: ['cardId'] },
      { key: 'idx_sessionId', type: 'key', attributes: ['sessionId'] },
    ],
  },
  {
    id: 'flashcard_study_sessions',
    name: 'Flashcard Study Sessions',
    attributes: [
      S('userId', { required: true }),
      S('classId', { required: false }),
      S('deckId', { required: true }),
      DATE('startedAt', { required: true }),
      DATE('endedAt', { required: false }),
      INT('activeSeconds', { required: true }),
      INT('cardsReviewed', { required: true }),
      INT('againCount', { required: true }),
      INT('hardCount', { required: true }),
      INT('goodCount', { required: true }),
      INT('easyCount', { required: true }),
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
      { key: 'idx_deckId', type: 'key', attributes: ['deckId'] },
      { key: 'idx_startedAt', type: 'key', attributes: ['startedAt'] },
    ],
  },
  {
    id: 'student_card_state',
    name: 'Student Card State',
    attributes: [
      S('userId', { required: true }),
      S('cardId', { required: true }),
      S('deckId', { required: true }),
      S('fsrsState', { required: false }),
      DATE('dueDate', { required: true }),
      S('status', { required: true }),
      FLOAT('intervalDays', { required: true }),
      FLOAT('stability', { required: true }),
      FLOAT('difficulty', { required: true }),
      INT('learningSteps', { required: true }),
      INT('repetitions', { required: true }),
      INT('lapses', { required: true }),
      DATE('lastReviewAt', { required: false }),
      INT('reviewCount', { required: true }),
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_cardId', type: 'key', attributes: ['cardId'] },
      { key: 'idx_deckId', type: 'key', attributes: ['deckId'] },
      { key: 'idx_dueDate', type: 'key', attributes: ['dueDate'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
    ],
  },
  {
    id: 'student_deck_notes',
    name: 'Student Deck Notes',
    attributes: [
      S('userId', { required: true }),
      S('cardId', { required: true }),
      TXT('personalNote', { required: false }),
      TXT('personalExample', { required: false }),
      DATE('buriedUntil', { required: false }),
      BOOL('suspended', { required: false }),
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_cardId', type: 'key', attributes: ['cardId'] },
    ],
  },
  {
    id: 'flashcard_reports',
    name: 'Flashcard Reports',
    attributes: [S('cardId',{required:true}),S('deckId',{required:true}),S('classId',{required:true}),S('studentId',{required:true}),TXT('reason',{required:true}),ENUM('status',['open','resolved'],{required:true}),DATE('createdAt',{required:true})],
    indexes: [{key:'idx_classId',type:'key',attributes:['classId']},{key:'idx_cardId',type:'key',attributes:['cardId']},{key:'idx_status',type:'key',attributes:['status']}],
  },
  {
    id: 'writing_prompts',
    name: 'Writing Prompts',
    attributes: [
      S('classId', { required: true }),
      S('teacherId', { required: true }),
      S('title', { required: true }),
      TXT('promptMarkdown', { required: false }),
      TXT('instructions', { required: false }),
      TXT('rubricJson', { required: false }),
      INT('peerReviewsRequired', { required: true }),
      INT('minWords', { required: true }),
      DATE('dueAt', { required: false }),
      ENUM('status', ['draft', 'published', 'closed'], { required: true }),
      BOOL('aiFeedbackEnabled', { required: true }),
      DATE('createdAt', { required: true }),
      DATE('updatedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
      { key: 'idx_teacherId', type: 'key', attributes: ['teacherId'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
    ],
  },
  {
    // Lets one prompt be set for several sections, the way deck_assignments
    // does for flashcard decks.
    id: 'writing_prompt_assignments',
    name: 'Writing Prompt Assignments',
    attributes: [
      S('promptId', { required: true }),
      S('classId', { required: true }),
      DATE('assignedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_promptId', type: 'key', attributes: ['promptId'] },
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
    ],
  },
  {
    id: 'writing_submissions',
    name: 'Writing Submissions',
    attributes: [
      S('promptId', { required: true }),
      S('classId', { required: true }),
      S('authorId', { required: true }),
      S('anonymousLabel', { required: false }),
      TXT('draftMarkdown', { required: false }),
      TXT('submittedMarkdown', { required: false }),
      INT('wordCount', { required: true }),
      ENUM('status', ['draft', 'submitted', 'revised'], { required: true }),
      DATE('submittedAt', { required: false }),
      TXT('finalMarkdown', { required: false }),
      DATE('finalUpdatedAt', { required: false }),
      DATE('createdAt', { required: true }),
      DATE('updatedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_promptId', type: 'key', attributes: ['promptId'] },
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
      { key: 'idx_authorId', type: 'key', attributes: ['authorId'] },
      { key: 'idx_prompt_author', type: 'key', attributes: ['promptId', 'authorId'] },
    ],
  },
  {
    id: 'peer_reviews',
    name: 'Peer Reviews',
    attributes: [
      S('promptId', { required: true }),
      S('submissionId', { required: true }),
      S('reviewerId', { required: true }),
      TXT('scoresJson', { required: false }),
      TXT('feedbackPointsJson', { required: false }),
      TXT('additionalComment', { required: false }),
      ENUM('status', ['assigned', 'submitted'], { required: true }),
      DATE('assignedAt', { required: true }),
      DATE('submittedAt', { required: false }),
    ],
    indexes: [
      { key: 'idx_promptId', type: 'key', attributes: ['promptId'] },
      { key: 'idx_submissionId', type: 'key', attributes: ['submissionId'] },
      { key: 'idx_reviewerId', type: 'key', attributes: ['reviewerId'] },
      { key: 'idx_prompt_reviewer', type: 'key', attributes: ['promptId', 'reviewerId'] },
      { key: 'idx_submission_reviewer', type: 'key', attributes: ['submissionId', 'reviewerId'] },
    ],
  },
  {
    id: 'peer_review_activities',
    name: 'Peer Review Activities',
    attributes: [S('classId', { required: true }), S('teacherId', { required: true }), S('title', { required: true }), ENUM('assignmentType', ['presentation_pvlegs'], { required: true }), INT('reviewsRequired', { required: true, min: 1, max: 20 }), ENUM('status', ['active','closed'], { required: true }), DATE('createdAt', { required: true }), DATE('updatedAt', { required: true })],
    indexes: [{ key: 'idx_classId', type: 'key', attributes: ['classId'] }, { key: 'idx_teacherId', type: 'key', attributes: ['teacherId'] }, { key: 'idx_status', type: 'key', attributes: ['status'] }],
  },
  {
    id: 'presentation_peer_reviews',
    name: 'Presentation Peer Reviews',
    attributes: [S('activityId', { required: true }), S('classId', { required: true }), S('presenterId', { required: true }), S('reviewerId', { required: true }), INT('poise', { required: true, min: 1, max: 3 }), INT('voice', { required: true, min: 1, max: 3 }), INT('life', { required: true, min: 1, max: 3 }), INT('eyeContact', { required: true, min: 1, max: 3 }), INT('gestures', { required: true, min: 1, max: 3 }), INT('speed', { required: true, min: 1, max: 3 }), TXT('strengthComment', { required: true }), TXT('nextStepComment', { required: true }), ENUM('moderationStatus', ['visible','hidden'], { required: true }), BOOL('flagged', { required: true }), TXT('flagReason', { required: false }), DATE('createdAt', { required: true }), DATE('updatedAt', { required: true })],
    indexes: [{ key: 'idx_activityId', type: 'key', attributes: ['activityId'] }, { key: 'idx_presenterId', type: 'key', attributes: ['presenterId'] }, { key: 'idx_reviewerId', type: 'key', attributes: ['reviewerId'] }, { key: 'idx_activity_presenter_reviewer', type: 'unique', attributes: ['activityId','presenterId','reviewerId'] }, { key: 'idx_flagged', type: 'key', attributes: ['flagged'] }],
  },
  {
    id: 'writing_ai_feedback', name: 'Writing AI Feedback',
    attributes: [S('submissionId', { required: true }), TXT('wwwSummary', { required: false }), TXT('improvementsJson', { required: false }), S('model', { required: true }), DATE('generatedAt', { required: true })],
    indexes: [{ key: 'idx_submissionId', type: 'unique', attributes: ['submissionId'] }],
  },
  {
    id: 'teacher_writing_feedback',
    name: 'Teacher Writing Feedback',
    attributes: [
      S('submissionId', { required: true }),
      S('teacherId', { required: true }),
      TXT('scoresJson', { required: false }),
      TXT('commentMarkdown', { required: false }),
      DATE('createdAt', { required: true }),
      DATE('updatedAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_submissionId', type: 'key', attributes: ['submissionId'] },
      { key: 'idx_teacherId', type: 'key', attributes: ['teacherId'] },
    ],
  },
  {
    id: 'quizzes',
    name: 'Quizzes',
    attributes: [
      S('classId', { required: true }),
      S('sourceClassId', { required: false }),
      S('createdBy', { required: true }),
      S('title', { required: true }),
      ENUM('sourceType', ['discussion', 'flashcards', 'mixed'], { required: true }),
      FLOAT('notesWeight', { required: true }),
      FLOAT('flashcardWeight', { required: true }),
      INT('questionCount', { required: true }),
      INT('timeLimitMinutes', { required: false }),
      INT('allowedAttempts', { required: false, min: 1, max: 2 }),
      BOOL('showAnswerFeedback', { required: false }),
      ENUM('status', ['draft', 'published', 'archived'], { required: true }),
      DATE('publishedAt', { required: false }),
      DATE('createdAt', { required: true }),
    ],
    indexes: [
      { key: 'idx_classId', type: 'key', attributes: ['classId'] },
      { key: 'idx_createdBy', type: 'key', attributes: ['createdBy'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
      { key: 'idx_createdAt', type: 'key', attributes: ['createdAt'] },
    ],
  },
  {
    id: 'quiz_assignments', name: 'Quiz Assignments',
    attributes: [S('quizId', { required: true }), S('classId', { required: true }), DATE('assignedAt', { required: true })],
    indexes: [{ key: 'idx_quizId', type: 'key', attributes: ['quizId'] }, { key: 'idx_classId', type: 'key', attributes: ['classId'] }, { key: 'idx_quiz_class', type: 'unique', attributes: ['quizId', 'classId'] }],
  },
  {
    id: 'quiz_questions',
    name: 'Quiz Questions',
    attributes: [
      S('quizId', { required: true }),
      ENUM('type', ['mc', 'cloze', 'matching'], { required: true }),
      TXT('questionText', { required: true }),
      TXT('options', { required: false }),
      INT('correctIndex', { required: false }),
      S('clozeAnswer', { required: false }),
      TXT('clozeVariants', { required: false }),
      TXT('matchingData', { required: false }),
      FLOAT('points', { required: false }),
      TXT('explanation', { required: false }),
      INT('sortOrder', { required: true }),
    ],
    indexes: [{ key: 'idx_quizId', type: 'key', attributes: ['quizId'] }],
  },
  {
    id: 'quiz_attempts',
    name: 'Quiz Attempts',
    attributes: [
      S('quizId', { required: true }),
      S('userId', { required: true }),
      DATE('startedAt', { required: true }),
      DATE('completedAt', { required: false }),
      INT('score', { required: true }),
      INT('totalQuestions', { required: true }),
      INT('scoreHalfPoints', { required: false }),
      INT('totalHalfPoints', { required: false }),
      TXT('answers', { required: false }),
    ],
    indexes: [
      { key: 'idx_quizId', type: 'key', attributes: ['quizId'] },
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
    ],
  },
  {
    id: 'texts', name: 'Texts',
    attributes: [S('teacherId', { required: true }), S('title', { required: true }), S('author', { required: false }), TXT('source', { required: false }), ENUM('contentMode', ['full','link'], { required: false }), TXT('externalUrl', { required: false }), ENUM('status', ['draft','published','archived'], { required: true }), DATE('createdAt', { required: true }), DATE('updatedAt', { required: true })],
    indexes: [{ key: 'idx_teacherId', type: 'key', attributes: ['teacherId'] }, { key: 'idx_status', type: 'key', attributes: ['status'] }],
  },
  {
    id: 'text_assignments', name: 'Text Assignments',
    attributes: [S('textId', { required: true }), S('classId', { required: true }), DATE('assignedAt', { required: true }), INT('dueClassNumber', { required: false, min: 1, max: 3 })],
    indexes: [{ key: 'idx_textId', type: 'key', attributes: ['textId'] }, { key: 'idx_classId', type: 'key', attributes: ['classId'] }, { key: 'idx_text_class', type: 'unique', attributes: ['textId','classId'] }],
  },
  {
    id: 'text_paragraphs', name: 'Text Paragraphs',
    attributes: [S('textId', { required: true }), INT('sortOrder', { required: true }), TXT('content', { required: true })],
    indexes: [{ key: 'idx_textId', type: 'key', attributes: ['textId'] }, { key: 'idx_text_order', type: 'key', attributes: ['textId','sortOrder'] }],
  },
  {
    id: 'text_versions', name: 'Text Support Versions',
    attributes: [S('textId', { required: true }), ENUM('level', ['supported','highly_supported'], { required: true }), ENUM('status', ['generating','ready','failed'], { required: true }), S('requestedBy', { required: true }), S('model', { required: true }), S('promptVersion', { required: true }), TXT('error', { required: false }), DATE('createdAt', { required: true }), DATE('updatedAt', { required: true })],
    indexes: [{ key: 'idx_textId', type: 'key', attributes: ['textId'] }, { key: 'idx_status', type: 'key', attributes: ['status'] }, { key: 'idx_text_level', type: 'unique', attributes: ['textId','level'] }],
  },
  {
    id: 'text_version_paragraphs', name: 'Text Support Paragraphs',
    attributes: [S('versionId', { required: true }), S('textId', { required: true }), S('originalParagraphId', { required: true }), INT('sortOrder', { required: true }), TXT('content', { required: true })],
    indexes: [{ key: 'idx_versionId', type: 'key', attributes: ['versionId'] }, { key: 'idx_textId', type: 'key', attributes: ['textId'] }, { key: 'idx_originalParagraphId', type: 'key', attributes: ['originalParagraphId'] }, { key: 'idx_version_order', type: 'unique', attributes: ['versionId','sortOrder'] }],
  },
  {
    id: 'text_annotations', name: 'Text Annotations',
    attributes: [S('textId', { required: true }), S('paragraphId', { required: true }), S('classId', { required: true }), S('authorId', { required: true }), S('anonymousLabel', { required: true }), ENUM('type', ['observation','question'], { required: true }), ENUM('kind', ['annotation','highlight','page_note','reply'], { required: false }), TXT('content', { required: true }), TXT('selectedText', { required: false }), TXT('tagsJson', { required: false }), S('parentId', { required: false }), ENUM('visibility', ['class','private'], { required: false }), ENUM('moderationStatus', ['visible','hidden'], { required: true }), BOOL('flagged', { required: false }), TXT('flagReason', { required: false }), DATE('createdAt', { required: true }), DATE('updatedAt', { required: true })],
    indexes: [{ key: 'idx_text_class', type: 'key', attributes: ['textId','classId'] }, { key: 'idx_paragraphId', type: 'key', attributes: ['paragraphId'] }, { key: 'idx_authorId', type: 'key', attributes: ['authorId'] }, { key: 'idx_parentId', type: 'key', attributes: ['parentId'] }, { key: 'idx_flagged', type: 'key', attributes: ['flagged'] }],
  },
  {
    id: 'nickname_reports', name: 'Nickname Reports',
    attributes: [S('classId', { required: true }), S('reporterId', { required: true }), S('targetUserId', { required: true }), S('nickname', { required: true }), TXT('reason', { required: true }), ENUM('status', ['open','dismissed','resolved'], { required: true }), S('resolvedBy', { required: false }), DATE('createdAt', { required: true }), DATE('resolvedAt', { required: false })],
    indexes: [{ key: 'idx_classId', type: 'key', attributes: ['classId'] }, { key: 'idx_targetUserId', type: 'key', attributes: ['targetUserId'] }, { key: 'idx_status', type: 'key', attributes: ['status'] }, { key: 'idx_reporter_target_class', type: 'key', attributes: ['reporterId','targetUserId','classId'] }],
  },
  {
    id: 'text_discussion_posts', name: 'Discussion Posts',
    attributes: [S('classSessionId', { required: true }), S('textId', { required: false }), S('classId', { required: true }), S('parentId', { required: false }), INT('depth', { required: true }), S('authorId', { required: true }), S('anonymousLabel', { required: true }), TXT('content', { required: true }), INT('score', { required: true }), ENUM('moderationStatus', ['visible','hidden'], { required: true }), BOOL('locked', { required: true }), BOOL('isTeacherPost', { required: true }), DATE('createdAt', { required: true }), DATE('updatedAt', { required: true })],
    indexes: [{ key: 'idx_sessionId', type: 'key', attributes: ['classSessionId'] }, { key: 'idx_parentId', type: 'key', attributes: ['parentId'] }, { key: 'idx_classId', type: 'key', attributes: ['classId'] }],
  },
  {
    id: 'text_discussion_votes', name: 'Discussion Votes',
    attributes: [S('postId', { required: true }), S('classSessionId', { required: true }), S('textId', { required: false }), S('classId', { required: true }), S('userId', { required: true }), INT('value', { required: true }), DATE('createdAt', { required: true }), DATE('updatedAt', { required: true })],
    indexes: [{ key: 'idx_sessionId', type: 'key', attributes: ['classSessionId'] }, { key: 'idx_post_user', type: 'unique', attributes: ['postId','userId'] }, { key: 'idx_userId', type: 'key', attributes: ['userId'] }],
  },
  {
    id: 'presentation_links', name: 'Presentation Links',
    attributes: [S('teacherId', { required: true }), S('classId', { required: true }), S('title', { required: true }), TXT('url', { required: true }), DATE('assignedAt', { required: true }), DATE('watchedAt', { required: false })],
    indexes: [{ key: 'idx_teacherId', type: 'key', attributes: ['teacherId'] }, { key: 'idx_classId', type: 'key', attributes: ['classId'] }, { key: 'idx_assignedAt', type: 'key', attributes: ['assignedAt'] }],
  },
  {
    id: 'planner_sources', name: 'Private Planner Sources',
    attributes: [S('teacherId',{required:true}),S('filename',{required:true}),S('schoolYear',{required:true}),INT('version',{required:true}),TXT('sourceText',{required:true}),TXT('parsedJson',{required:true}),TXT('mappingJson',{required:true}),BOOL('active',{required:true}),DATE('createdAt',{required:true})],
    indexes: [{key:'idx_teacherId',type:'key',attributes:['teacherId']},{key:'idx_teacher_active',type:'key',attributes:['teacherId','active']}],
  },
  {
    id: 'weekly_plans', name: 'Private Weekly Plans',
    attributes: [S('teacherId',{required:true}),S('sourceId',{required:true}),S('weekKey',{required:true}),DATE('weekStart',{required:true}),ENUM('status',['draft','ready','published'],{required:true}),TXT('planJson',{required:true}),TXT('publishedJson',{required:false}),DATE('createdAt',{required:true}),DATE('updatedAt',{required:true})],
    indexes: [{key:'idx_teacherId',type:'key',attributes:['teacherId']},{key:'idx_teacher_week',type:'unique',attributes:['teacherId','weekKey']},{key:'idx_weekStart',type:'key',attributes:['weekStart']}],
  },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForAttribute(collectionId, key) {
  for (let i = 0; i < 30; i++) {
    const attr = await databases.getAttribute(DATABASE_ID, collectionId, key);
    if (attr.status === 'available') return;
    if (attr.status === 'failed') throw new Error(`Attribute ${collectionId}.${key} failed to provision`);
    await sleep(1000);
  }
  throw new Error(`Attribute ${collectionId}.${key} did not become available in time`);
}

async function createAttribute(collectionId, def) {
  const { type, key, required = false, array = false } = def;
  try {
    if (type === 'string') {
      await databases.createStringAttribute(DATABASE_ID, collectionId, key, def.size, required, undefined, array);
    } else if (type === 'integer') {
      await databases.createIntegerAttribute(DATABASE_ID, collectionId, key, required, undefined, undefined, undefined, array);
    } else if (type === 'float') {
      await databases.createFloatAttribute(DATABASE_ID, collectionId, key, required, undefined, undefined, undefined, array);
    } else if (type === 'boolean') {
      await databases.createBooleanAttribute(DATABASE_ID, collectionId, key, required, undefined, array);
    } else if (type === 'enum') {
      await databases.createEnumAttribute(DATABASE_ID, collectionId, key, def.elements, required, undefined, array);
    } else {
      throw new Error(`Unknown attribute type: ${type}`);
    }
  } catch (err) {
    if (err.code === 409) {
      if (type === 'enum' && (key === 'role' || key === 'discussionType' || (collectionId === 'quiz_questions' && key === 'type'))) {
        await databases.updateEnumAttribute(DATABASE_ID, collectionId, key, def.elements, required, null);
        console.log(`  ~ ${collectionId}.${key} enum updated`);
        return;
      }
      console.log(`  = ${collectionId}.${key} already exists, skipping`);
      return;
    }
    throw err;
  }
  await waitForAttribute(collectionId, key);
  console.log(`  + ${collectionId}.${key}`);
}

async function createIndex(collectionId, def) {
  try {
    await databases.createIndex(DATABASE_ID, collectionId, def.key, def.type, def.attributes);
    console.log(`  + index ${collectionId}.${def.key}`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`  = index ${collectionId}.${def.key} already exists, skipping`);
      return;
    }
    throw err;
  }
}

async function main() {
  try {
    await databases.get(DATABASE_ID);
    console.log(`Database "${DATABASE_ID}" already exists`);
  } catch (err) {
    if (err.code !== 404) throw err;
    await databases.create(DATABASE_ID, 'Learning is Fun');
    console.log(`Created database "${DATABASE_ID}"`);
  }

  for (const col of COLLECTIONS) {
    try {
      await databases.getCollection(DATABASE_ID, col.id);
      console.log(`Collection ${col.id} already exists`);
    } catch (err) {
      if (err.code !== 404) throw err;
      await databases.createCollection(DATABASE_ID, col.id, col.name, PERMISSIONS, false);
      console.log(`Created collection ${col.id}`);
    }

    for (const attr of col.attributes) {
      await createAttribute(col.id, attr);
    }
    for (const idx of col.indexes) {
      await createIndex(col.id, idx);
    }
  }

  // Profile names are changed only through the authenticated function, which
  // enforces nickname filtering and the 24-hour cooldown. Registration still
  // needs create access and class rosters still need read access.
  await databases.updateCollection(
    DATABASE_ID,
    'users',
    'Users',
    [Permission.read(Role.users()), Permission.create(Role.users())],
    false,
  );
  console.log('Hardened users collection: authenticated read/create only');

  console.log('\nDone. Database ID:', DATABASE_ID);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
