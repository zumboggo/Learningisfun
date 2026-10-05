import { test, expect, vi } from 'vitest';
import { selfProfile, canReadProfile, projectProfile } from './profiles.js';
const missing = Object.assign(new Error('Missing'), { code: 404 });
test('provisioning uses authenticated account and always assigns student', async () => {
  const db = { getDocument: vi.fn().mockRejectedValue(missing), createDocument: vi.fn(async (_, __, id, data) => ({ $id:id, ...data })) };
  const users = { get: vi.fn().mockResolvedValue({ email:'own@example.com', name:'Own account' }) };
  const result = await selfProfile({ db, users, databaseId:'main', userId:'self', role:'teacher', email:'forged@example.com' });
  expect(result).toMatchObject({ $id:'self', role:'student', email:'own@example.com' });
  expect(users.get).toHaveBeenCalledWith({ userId:'self' });
  expect(db.createDocument.mock.calls[0][4]).toEqual([]);
});
test('existing profiles are preserved and transient errors never create profiles', async () => {
  const db = { getDocument: vi.fn().mockResolvedValue({ $id:'self', role:'teacher' }), createDocument:vi.fn() };
  expect((await selfProfile({ db, databaseId:'main', userId:'self' })).role).toBe('teacher');
  db.getDocument.mockRejectedValue(Object.assign(new Error('Unavailable'), {code:503}));
  await expect(selfProfile({ db, databaseId:'main', userId:'self' })).rejects.toThrow('Unavailable');
  expect(db.createDocument).not.toHaveBeenCalled();
});
test('concurrent first login reads the winning profile', async () => {
  const db = { getDocument:vi.fn().mockRejectedValueOnce(missing).mockResolvedValue({$id:'self',role:'student'}), createDocument:vi.fn().mockRejectedValue({code:409}) };
  expect(await selfProfile({db,users:{get:async()=>({email:'own@example.com',name:'Own'})},databaseId:'main',userId:'self'})).toEqual({$id:'self',role:'student'});
});
test('profile reads require self or positive teacher class ownership', async () => {
  const db = { listDocuments:vi.fn().mockResolvedValue({documents:[{classId:'class'}]}), getDocument:vi.fn().mockResolvedValue({teacherId:'teacher'}) };
  const ctx = {db,databaseId:'main',userId:'teacher',profile:{role:'teacher'},targetId:'student'};
  expect(await canReadProfile(ctx)).toBe(true);
  expect(await canReadProfile({...ctx,userId:'other'})).toBe(false);
  expect(await canReadProfile({...ctx,profile:{role:'student'}})).toBe(false);
  expect(await canReadProfile({...ctx,userId:'student',profile:{role:'student'}})).toBe(true);
  db.listDocuments.mockResolvedValue({documents:[]});
  expect(await canReadProfile(ctx)).toBe(false);
});
test('profile projection excludes permissions and unexpected private fields', () => {
  expect(projectProfile({$id:'self',name:'Name',$permissions:['read("any")'],password:'secret'})).toEqual({$id:'self',name:'Name'});
});
