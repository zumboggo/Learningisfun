import { Client, Account, Databases, Functions } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';

export const COLLECTIONS = {
  users: 'users',
  classes: 'classes',
  class_members: 'class_members',
  class_sessions: 'class_sessions',
  class_session_items: 'class_session_items',
  discussion_questions: 'discussion_questions',
  discussion_answers: 'discussion_answers',
  question_votes: 'question_votes',

  flashcard_decks: 'flashcard_decks',
  flashcard_cards: 'flashcard_cards',
  deck_assignments: 'deck_assignments',
  card_reviews: 'card_reviews',
  flashcard_review_events: 'flashcard_review_events',
  flashcard_study_sessions: 'flashcard_study_sessions',
  student_card_state: 'student_card_state',
  student_deck_notes: 'student_deck_notes',

  writing_prompts: 'writing_prompts',
  writing_prompt_assignments: 'writing_prompt_assignments',
  writing_submissions: 'writing_submissions',
  peer_reviews: 'peer_reviews',
  writing_ai_feedback: 'writing_ai_feedback',
  teacher_writing_feedback: 'teacher_writing_feedback',

  quizzes: 'quizzes',
  quiz_assignments: 'quiz_assignments',
  quiz_questions: 'quiz_questions',
  quiz_attempts: 'quiz_attempts',

  texts: 'texts',
  text_assignments: 'text_assignments',
  text_paragraphs: 'text_paragraphs',
  text_annotations: 'text_annotations',
  text_discussion_posts: 'text_discussion_posts',
  text_discussion_votes: 'text_discussion_votes',
} as const;

export const FUNCTION_IDS = {
  getQuestions: import.meta.env.VITE_APPWRITE_FN_GET_QUESTIONS || '',
  submitQuestion: import.meta.env.VITE_APPWRITE_FN_SUBMIT_QUESTION || '',
  toggleVote: import.meta.env.VITE_APPWRITE_FN_TOGGLE_VOTE || '',
  teacherProgress: import.meta.env.VITE_APPWRITE_FN_TEACHER_PROGRESS || '',
  learningContent: import.meta.env.VITE_APPWRITE_FN_LEARNING_CONTENT || 'learning-content',
  writingAiFeedback: import.meta.env.VITE_APPWRITE_FN_WRITING_AI_FEEDBACK || 'writing-ai-feedback',
} as const;
