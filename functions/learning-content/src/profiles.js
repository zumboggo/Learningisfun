import { Query } from 'node-appwrite';

// Explicit projection: never return Appwrite metadata or future private fields.
export function projectProfile(row) {
  return Object.fromEntries(['$id','email','name','role','deviceId','lastSyncAt','createdAt','nicknameUpdatedAt','nicknameModerationStatus'].filter(key => row[key] !== undefined).map(key => [key,row[key]]));
}

export async function selfProfile({ db, users, databaseId, userId }) {
  try { return projectProfile(await db.getDocument(databaseId, 'users', userId)); }
  catch (error) { if (error.code !== 404) throw error; }
  const account = await users.get({ userId });
  const now = new Date().toISOString();
  const data = { email: account.email, name: account.name || 'Student', role: 'student', deviceId: 'server-provisioned', lastSyncAt: now, createdAt: now };
  try { return projectProfile(await db.createDocument(databaseId, 'users', userId, data, [])); }
  catch (error) {
    if (error.code !== 409) throw error;
    return projectProfile(await db.getDocument(databaseId, 'users', userId));
  }
}

export async function canReadProfile({ db, databaseId, userId, profile, targetId }) {
  if (targetId === userId) return true;
  if (profile.role !== 'teacher') return false;
  const memberships = await db.listDocuments(databaseId, 'class_members', [Query.equal('userId', targetId), Query.limit(500)]);
  for (const member of memberships.documents) {
    const cls = await db.getDocument(databaseId, 'classes', member.classId);
    if (cls.teacherId === userId) return true;
  }
  return false;
}
