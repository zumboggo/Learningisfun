import { account, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateDeviceId, getTimestamp } from '@/utils/helpers';
import type { User, UserRole } from '@/types';
import { ID, Query } from 'appwrite';

export async function register(email: string, password: string, name: string, role: UserRole = 'student'): Promise<User> {
  // A stale session left over from a previous student on a shared device makes
  // createEmailPasswordSession fail below, which used to abandon a brand-new
  // account halfway through signing up.
  await clearAnyExistingSession();

  const appwriteUser = await account.create(ID.unique(), email, password, name);

  // account.create() registers the account but does not sign it in. Without a
  // session the profile write below arrives as a guest, and the users
  // collection only grants create to authenticated users.
  await account.createEmailPasswordSession(email, password);

  const userDoc: User = {
    $id: appwriteUser.$id,
    email,
    name,
    role,
    deviceId: generateDeviceId(),
    lastSyncAt: getTimestamp(),
    createdAt: getTimestamp(),
  };

  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.users, appwriteUser.$id, {
      email,
      name,
      role,
      deviceId: userDoc.deviceId,
      lastSyncAt: userDoc.lastSyncAt,
      createdAt: userDoc.createdAt,
    });
  } catch {
    // The account and its session are real even if the profile document could
    // not be written. Throwing here would strand the student with an account
    // they cannot use — and login() recreates a missing profile anyway.
  }

  await db.users.put(userDoc);
  await db.app_metadata.put({ key: 'currentUserId', value: userDoc.$id });
  return userDoc;
}

/** Drop whatever session the browser is holding, if any. Never throws. */
async function clearAnyExistingSession(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch {
    // No session to clear, or offline.
  }
}

export async function createStudentAccount(email: string, password: string, name: string): Promise<User> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  try {
    return await register(email, password, name, 'student');
  } catch {
    const remoteExisting = await findUserByEmail(email);
    if (remoteExisting) return remoteExisting;
    throw new Error(`Could not create account for ${email}`);
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const local = await db.users.where('email').equals(email).first();
  if (local) return local;

  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.users, [
      Query.equal('email', email),
      Query.limit(1),
    ]);
    const doc = result.documents[0];
    if (!doc) return null;
    const user: User = {
      $id: doc.$id,
      email: doc.email,
      name: doc.name,
      role: doc.role as UserRole,
      deviceId: doc.deviceId,
      lastSyncAt: doc.lastSyncAt,
      createdAt: doc.createdAt,
      nicknameUpdatedAt: doc.nicknameUpdatedAt,
      nicknameModerationStatus: doc.nicknameModerationStatus,
    };
    await db.users.put(user);
    return user;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<User> {
  // Signing in as someone else on a shared device fails while the previous
  // student's session is still attached to the browser.
  await clearAnyExistingSession();
  try {
    await account.createEmailPasswordSession(email, password);
  } catch (err) {
    const localTeacher = await loginLocalDevelopmentTeacher(email, password);
    if (localTeacher) return localTeacher;
    throw err;
  }
  const appwriteUser = await account.get();

  let user: User;
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.users, appwriteUser.$id);
    user = {
      $id: doc.$id,
      email: doc.email,
      name: doc.name,
      role: doc.role as UserRole,
      deviceId: doc.deviceId,
      lastSyncAt: doc.lastSyncAt,
      createdAt: doc.createdAt,
      nicknameUpdatedAt: doc.nicknameUpdatedAt,
      nicknameModerationStatus: doc.nicknameModerationStatus,
    };
  } catch {
    user = {
      $id: appwriteUser.$id,
      email: appwriteUser.email,
      name: appwriteUser.name,
      role: 'student',
      deviceId: generateDeviceId(),
      lastSyncAt: getTimestamp(),
      createdAt: getTimestamp(),
    };
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.users, appwriteUser.$id, {
        email: user.email,
        name: user.name,
        role: user.role,
        deviceId: user.deviceId,
        lastSyncAt: user.lastSyncAt,
        createdAt: user.createdAt,
      });
    } catch {
      // Document may already exist
    }
  }

  await db.users.put(user);
  await db.app_metadata.put({ key: 'currentUserId', value: user.$id });
  return user;
}

export function passwordRecoveryRedirectUrl(origin = window.location.origin, baseUrl = import.meta.env.BASE_URL): string {
  const url = new URL(baseUrl, `${origin}/`);
  // Keeping a real query parameter before the hash makes Appwrite append its
  // recovery credentials in a location GitHub Pages preserves. The reset page
  // also accepts credentials appended inside the hash for compatibility.
  url.searchParams.set('recovery', '1');
  url.hash = '/reset-password';
  return url.toString();
}

export async function requestPasswordRecovery(email: string): Promise<void> {
  await account.createRecovery({ email: email.trim().toLowerCase(), url: passwordRecoveryRedirectUrl() });
}

export function passwordRecoveryParams(href = window.location.href): { userId: string; secret: string } | null {
  const url = new URL(href);
  const outer = url.searchParams;
  const hashQuery = url.hash.includes('?') ? new URLSearchParams(url.hash.slice(url.hash.indexOf('?') + 1)) : new URLSearchParams();
  const userId = outer.get('userId') || hashQuery.get('userId') || '';
  const secret = outer.get('secret') || hashQuery.get('secret') || '';
  return userId && secret ? { userId, secret } : null;
}

export async function completePasswordRecovery(userId: string, secret: string, password: string): Promise<void> {
  await account.updateRecovery({ userId, secret, password });
}

async function loginLocalDevelopmentTeacher(email: string, password: string): Promise<User | null> {
  if (!import.meta.env.DEV) return null;
  const localLogin = getLocalDevelopmentLogin(email, password);
  if (!localLogin) return null;

  const now = getTimestamp();
  const user: User = {
    $id: localLogin.id,
    email: localLogin.email,
    name: localLogin.name,
    role: localLogin.role,
    deviceId: generateDeviceId(),
    lastSyncAt: now,
    createdAt: now,
  };
  await db.users.put(user);
  await db.app_metadata.put({ key: 'currentUserId', value: user.$id });
  return user;
}

function getLocalDevelopmentLogin(
  email: string,
  password: string,
): { id: string; email: string; name: string; role: UserRole } | null {
  const candidates = [
    {
      id: 'local-teacher',
      email: import.meta.env.VITE_DEV_TEACHER_EMAIL,
      password: import.meta.env.VITE_DEV_TEACHER_PASSWORD,
      name: 'Teacher',
      role: 'teacher' as const,
    },
    {
      id: 'local-student',
      email: import.meta.env.VITE_DEV_STUDENT_EMAIL,
      password: import.meta.env.VITE_DEV_STUDENT_PASSWORD,
      name: import.meta.env.VITE_DEV_STUDENT_NICKNAME || 'Sunny',
      role: 'student' as const,
    },
  ];
  return candidates.find(candidate =>
    candidate.email
    && candidate.password
    && email.trim().toLowerCase() === candidate.email.trim().toLowerCase()
    && password === candidate.password,
  ) || null;
}

export async function logout(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch {
    // Session may already be invalid
  }
  await db.app_metadata.delete('currentUserId');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const appwriteUser = await account.get();
    const localUser = await db.users.get(appwriteUser.$id);
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.users, appwriteUser.$id);
      const user: User = {
        $id: doc.$id,
        email: doc.email,
        name: doc.name,
        role: doc.role as UserRole,
        deviceId: doc.deviceId,
        lastSyncAt: doc.lastSyncAt,
        createdAt: doc.createdAt,
        nicknameUpdatedAt: doc.nicknameUpdatedAt,
        nicknameModerationStatus: doc.nicknameModerationStatus,
      };
      await db.users.put(user);
      return user;
    } catch {
      return localUser || null;
    }
  } catch {
    const meta = await db.app_metadata.get('currentUserId');
    if (meta?.value) {
      const localUser = await db.users.get(meta.value);
      return localUser || null;
    }
    return null;
  }
}

export async function getCachedUser(): Promise<User | null> {
  const meta = await db.app_metadata.get('currentUserId');
  if (!meta?.value) return null;
  return (await db.users.get(meta.value)) || null;
}

export async function fetchClassStudents(classId: string): Promise<User[]> {
  const members = await db.class_members.where('classId').equals(classId).toArray();
  const studentIds = members.filter(m => m.role === 'student').map(m => m.userId);
  const students: User[] = [];
  for (const id of studentIds) {
    const user = await db.users.get(id);
    if (user) students.push(user);
  }
  return students;
}
