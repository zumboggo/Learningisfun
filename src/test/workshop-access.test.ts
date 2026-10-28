import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error Deployed server module.
import { harness } from '../../functions/learning-content/src/reading-discussion-test-harness.mjs';
import { WORKSHOP_CLASS_ID as workshopId } from '../../functions/learning-content/src/workshop-policy.js';
const mock = vi.hoisted(() => ({ db: {} }));
vi.mock('node-appwrite', async original => ({
  ...await original<typeof import('node-appwrite')>(),
  Databases: class { constructor() { return mock.db; } },
}));
// @ts-expect-error Deployed server module.
import handler from '../../functions/learning-content/src/main.js';
let fixture: ReturnType<typeof harness>;
const invoke = (body: object, userId = 'participant') => handler({
  req: { headers: { 'x-appwrite-user-id': userId }, bodyText: JSON.stringify(body) },
  res: { json: (body: unknown, code = 200) => ({ body, code }) }, error: vi.fn(),
});
const join = (extra = {}) => invoke({ action: 'joinClass', classId: workshopId, joinCode: 'ABC123', role: 'student', ...extra });
beforeEach(() => {
  vi.stubEnv('APPWRITE_ENDPOINT', 'https://example.invalid/v1');
  vi.stubEnv('APPWRITE_FUNCTION_PROJECT_ID', 'test-project');
  vi.stubEnv('APPWRITE_API_KEY', 'test-only');
  vi.stubEnv('OWNER_ACCOUNT_ID', 'teacher');
  fixture = harness(); mock.db = fixture.db;
  fixture.storage.classes.push({ $id: workshopId, teacherId: 'teacher', courseName: 'Lifeplus Workshop', name: 'Teachers', status: 'active', joinCode: 'ABC123', joinCodeActive: true });
  Object.assign(fixture.storage.classes[0], { joinCode: 'OTHER1', joinCodeActive: true, status: 'active' });
  fixture.storage.users.push({ $id: 'participant', role: 'teacher', name: 'Participant' }, { $id: 'teacher', role: 'teacher' });
  Object.assign(fixture.storage.texts[0], { teacherId: 'teacher', updatedAt: '2026-01-01' });
  fixture.storage.text_assignments.push({ $id: 'workshop-assignment', textId: 'text', classId: workshopId, isAssignedReading: true, assignedAt: '2026-01-01' });
  fixture.storage.class_sessions = [{ $id: 'other-session', classId: 'blue', status: 'active', discussionType: 'discussion' }];
});
afterEach(() => vi.unstubAllEnvs());
describe('single-class teacher participation', () => {
  it('requires enrollment and a valid active code, preserves teacher role, and joins idempotently', async () => {
    expect((await invoke({ action: 'readTexts', workshop: true, classIds: [workshopId] })).code).toBe(403);
    expect((await join({ joinCode: 'WRONG1' })).code).toBe(403);
    expect((await join()).code).toBe(200);
    expect((await join()).code).toBe(200);
    expect(fixture.storage.class_members.filter((m: { userId: string }) => m.userId === 'participant')).toHaveLength(1);
    expect(fixture.storage.users.find((u: { $id: string }) => u.$id === 'participant').role).toBe('teacher');
    expect((await invoke({ action: 'readWorkshopAccess' })).body).toMatchObject({ enrolled: true, owner: false, eligible: true });
    const reading = await invoke({ action: 'readTexts', workshop: true, classIds: [workshopId] });
    expect(reading.code).toBe(200); expect(reading.body.texts).toHaveLength(1);
    expect((await invoke({ action: 'readReadingDiscussion', workshop: true, textId: 'text', classId: workshopId })).body).toMatchObject({ teacher: false, canWrite: true });
  });
  it('rejects another class, an inactive code, a renamed lookalike and an owner mismatch', async () => {
    expect((await join({ classId: 'blue', joinCode: 'OTHER1' })).code).toBe(403);
    const cls = fixture.storage.classes.at(-1);
    cls.joinCodeActive = false; expect((await join()).code).toBe(403);
    cls.joinCodeActive = true; cls.status = 'archived'; expect((await join()).code).toBe(403);
    cls.status = 'active'; cls.teacherId = 'other-teacher'; expect((await join()).code).toBe(403);
    fixture.storage.classes[0].courseName = 'Lifeplus Workshop';
    expect((await join({ classId: 'blue', joinCode: 'OTHER1' })).code).toBe(403);
  });
  it('cannot use the exception without the verified owner or with an expired membership', async () => {
    await join(); vi.stubEnv('OWNER_ACCOUNT_ID', '');
    expect((await invoke({ action: 'readTexts', workshop: true, classIds: [workshopId] })).code).toBe(403);
    vi.stubEnv('OWNER_ACCOUNT_ID', 'teacher');
    fixture.storage.class_members.find((m: { userId: string }) => m.userId === 'participant').expiresAt = '2020-01-01';
    expect((await invoke({ action: 'readTexts', workshop: true, classIds: [workshopId] })).code).toBe(403);
  });
  it('does not grant workshop management, reports, or access to a different class by record ID', async () => {
    await join();
    for (const body of [
      { action: 'updateClassDetails', classId: workshopId, courseName: 'Changed', name: 'Changed' },
      { action: 'exportWritingResponses', classId: workshopId },
      { action: 'readTexts', classIds: ['blue'] },
      { action: 'readClassDiscussion', sessionId: 'other-session' },
      { action: 'mutate', collection: 'classes', operation: 'update', id: workshopId, data: { linksJson: '[]' } },
    ]) expect((await invoke({ ...body, workshop: true })).code).toBe(403);
    expect((await invoke({ action: 'updateClassDetails', classId: workshopId, courseName: 'Changed', name: 'Changed' })).code).toBe(403);
  });
  it('leaves the owner in control and normal teacher operations available outside the workshop', async () => {
    expect((await invoke({ action: 'readWorkshopAccess' }, 'teacher')).body.owner).toBe(true);
    expect((await invoke({ action: 'joinClass', classId: workshopId, role: 'student', joinCode: 'ABC123' }, 'teacher')).code).toBe(403);
    fixture.storage.classes.push({ $id: 'own', teacherId: 'participant', courseName: 'Old', name: 'Old' });
    const result = await invoke({ action: 'updateClassDetails', classId: 'own', courseName: 'New', name: 'New' });
    expect(result.code).toBe(200); expect(result.body.class.courseName).toBe('New');
  });
});
