import { Client, Account, Databases, Functions } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

export const account = new Account(client);
// Legacy service calls share one authenticated, owner-scoped server gateway.
export const databases = new Proxy(new Databases(client), {get(target,property){
 const operations:Record<string,string>={listDocuments:'list',getDocument:'get',createDocument:'create',updateDocument:'update',deleteDocument:'delete'};
 if(typeof property!=='string'||!operations[property]){const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;}
 return async (...args:unknown[])=>{const object=typeof args[0]==='object'&&args[0]!==null?args[0] as Record<string,unknown>:null;
 const collection=object?.collectionId??args[1],operation=operations[property],id=object?.documentId??(operation==='list'?undefined:args[2]),queries=object?.queries??(operation==='list'?args[2]:undefined),data=object?.data??args[3];
 const result=await functions.createExecution(FUNCTION_IDS.learningContent,JSON.stringify({action:'scopedData',collection,operation,id,queries,data}));
 const body=JSON.parse(result.responseBody||'{}');if(result.status==='failed'||result.responseStatusCode>=400||body.error)throw Object.assign(new Error(body.error||'Classroom request failed'),{code:result.responseStatusCode});return body;
 };
}});
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
  flashcard_reports: 'flashcard_reports',

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
  text_versions: 'text_versions',
  text_version_paragraphs: 'text_version_paragraphs',
  text_annotations: 'text_annotations',
  text_discussion_posts: 'text_discussion_posts',
  text_discussion_votes: 'text_discussion_votes',
  presentation_links: 'presentation_links',
  peer_review_activities: 'peer_review_activities',
  presentation_peer_reviews: 'presentation_peer_reviews',
  nickname_reports: 'nickname_reports',
} as const;

export const FUNCTION_IDS = {
  getQuestions: import.meta.env.VITE_APPWRITE_FN_GET_QUESTIONS || '',
  submitQuestion: import.meta.env.VITE_APPWRITE_FN_SUBMIT_QUESTION || '',
  toggleVote: import.meta.env.VITE_APPWRITE_FN_TOGGLE_VOTE || '',
  teacherProgress: import.meta.env.VITE_APPWRITE_FN_TEACHER_PROGRESS || '',
  learningContent: import.meta.env.VITE_APPWRITE_FN_LEARNING_CONTENT || 'learning-content',
  writingAiFeedback: import.meta.env.VITE_APPWRITE_FN_WRITING_AI_FEEDBACK || 'writing-ai-feedback',
} as const;
