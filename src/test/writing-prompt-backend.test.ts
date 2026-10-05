import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ getDocument: vi.fn(), listDocuments: vi.fn(), updateDocument: vi.fn(), createDocument: vi.fn() }));
vi.mock('node-appwrite', async importOriginal => ({
  ...await importOriginal<typeof import('node-appwrite')>(),
  Databases: class { constructor() { return db; } },
}));
// @ts-expect-error Server functions are JavaScript deployed independently.
import handler from '../../functions/learning-content/src/main.js';
let status: string, enrolled: boolean, questionType: string;
let saved: { $id: string; questionId: string; authorId: string; answerText: string; createdAt: string };
const invoke = async (action: string, extra = {}) => {
  const json = vi.fn((body, code = 200) => ({ body, code }));
  return handler({ req: { headers: { 'x-appwrite-user-id': 'student-1' }, bodyText: JSON.stringify({ action, sessionId: 'session-1', ...extra }) }, res: { json }, error: vi.fn() });
};
beforeEach(() => {
  vi.stubEnv('APPWRITE_ENDPOINT', 'https://example.invalid/v1');
  vi.stubEnv('APPWRITE_FUNCTION_PROJECT_ID', 'test-project');
  vi.stubEnv('APPWRITE_API_KEY', 'test-only');
  vi.clearAllMocks(); status = 'active'; enrolled = true; questionType = 'paragraph';
  saved = { $id: 'response-1', questionId: 'question-1', authorId: 'student-1', answerText: 'Original answer', createdAt: '2026-10-01T00:00:00.000Z' };
  db.getDocument.mockImplementation(async (_database, collection) => {
    if (collection === 'users') return { role: 'student' };
    if (collection === 'classes') return { teacherId: 'teacher-1' };
    if (collection === 'class_sessions') return { $id: 'session-1', classId: 'class-1', discussionType: 'presentation', assignmentId: 'question-1', status, notesMarkdown: '{"allowResubmission":false}' };
    throw Error('Unexpected collection');
  });
  db.listDocuments.mockImplementation(async (_database, collection) => {
    const documents = collection === 'class_members' ? (enrolled ? [{ classId: 'class-1', role: 'student' }] : [])
      : collection === 'discussion_questions' ? [{ $id: 'question-1', questionText: 'Explain the ending', selectedPassage: JSON.stringify({ type: questionType }), voteCount: 0 }]
      : collection === 'discussion_answers' ? [saved] : [];
    return { documents, total: documents.length };
  });
  db.updateDocument.mockImplementation(async (_database, _collection, _id, data) => { saved = { ...saved, ...data }; return saved; });
});
afterEach(() => vi.unstubAllEnvs());
describe('writing prompt response revisions on the server', () => {
  it('revises existing prompts repeatedly even when their old resubmission setting is false', async () => {
    expect((await invoke('readLivePresentation')).body.allowResubmission).toBe(true);
    for (const answer of ['Second answer', 'Third answer']) {
      expect((await invoke('submitLiveAnswer', { answer })).code).toBe(200);
      expect(saved.answerText).toBe(answer);
      expect(saved.authorId).toBe('student-1');
      expect(saved.createdAt).toBe('2026-10-01T00:00:00.000Z');
      expect(db.updateDocument).toHaveBeenLastCalledWith('main', 'discussion_answers', 'response-1', expect.objectContaining({ answerText: answer }));
    }
    expect(db.createDocument).not.toHaveBeenCalled();
  });
  it('rejects changes after the teacher finishes the prompt', async () => {
    status = 'published';
    expect((await invoke('submitLiveAnswer', { answer: 'Too late' })).code).toBe(403);
    expect(db.updateDocument).not.toHaveBeenCalled();
  });
  it('rejects students outside the class', async () => {
    enrolled = false;
    expect((await invoke('submitLiveAnswer', { answer: 'Not enrolled' })).code).toBe(403);
    expect(db.updateDocument).not.toHaveBeenCalled();
  });
  it('preserves the single-response setting for other question types', async () => {
    questionType = 'short';
    expect((await invoke('submitLiveAnswer', { answer: 'Another answer' })).code).toBe(409);
    expect(db.updateDocument).not.toHaveBeenCalled();
  });
});
