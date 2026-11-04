import 'fake-indexeddb/auto';
import { expect, it, vi } from 'vitest';
import { db, selectAccountDatabase } from '@/db/schema';
import { account } from '@/lib/appwrite';
import { executeLearningContent } from '@/services/learning-content.service';
import { getCachedUser, getCurrentUser, login, logout } from '@/services/auth.service';

vi.mock('@/lib/appwrite', () => ({
  account: { deleteSession: vi.fn(), get: vi.fn(), createEmailPasswordSession: vi.fn() },
}));
vi.mock('@/services/learning-content.service', () => ({ executeLearningContent: vi.fn() }));

it('keeps the device locked through an interrupted sign-out until a new session and profile match', async () => {
  const previous = { $id: 'student-a', role: 'student' as const, email: 'a@example.invalid',
    name: 'Student A', createdAt: '', deviceId: 'test', lastSyncAt: '' };
  await selectAccountDatabase(previous.$id);
  await db.users.put(previous);
  await db.app_metadata.put({ key: 'currentUserId', value: previous.$id });
  expect(await getCachedUser()).toEqual(previous);

  let finishRequest!: () => void;
  const deletion = new Promise<void>(resolve => { finishRequest = resolve; });
  vi.mocked(account.deleteSession).mockImplementationOnce(async () => {
    await deletion;
    throw new Error('Connection lost');
  });
  const signingOut = logout();
  expect(await getCachedUser()).toBeNull();
  expect(await getCurrentUser()).toBeNull();
  finishRequest();
  await signingOut;

  vi.mocked(account.createEmailPasswordSession).mockRejectedValueOnce(new Error('Wrong password'));
  await expect(login('b@example.invalid', 'wrong')).rejects.toThrow('Wrong password');
  expect(await getCurrentUser()).toBeNull();
  expect(account.get).not.toHaveBeenCalled();

  vi.mocked(account.createEmailPasswordSession).mockResolvedValue({ userId: 'student-b' } as Awaited<ReturnType<typeof account.createEmailPasswordSession>>);
  vi.mocked(executeLearningContent).mockResolvedValueOnce({ profile: previous });
  await expect(login('b@example.invalid', 'correct')).rejects.toThrow('account changed');
  expect(await getCachedUser()).toBeNull();

  const next = { ...previous, $id: 'student-b', name: 'Student B', email: 'b@example.invalid' };
  vi.mocked(executeLearningContent).mockResolvedValueOnce({ profile: next });
  expect(await login(next.email, 'correct')).toEqual(next);
  expect(await getCachedUser()).toEqual(next);
});
