import { account } from '@/lib/appwrite';
import { executeLearningContent } from './learning-content.service';
import { db, selectAccountDatabase, selectGuestDatabase, SIGN_OUT_LOCK } from '@/db/schema';
import { generateDeviceId, getTimestamp } from '@/utils/helpers';
import type { User, UserRole } from '@/types';
import { ID } from 'appwrite';

export const UNCONFIRMED_SIGN_OUT = 'learning-unconfirmed-sign-out';

export async function register(email: string, password: string, name: string, role: UserRole = 'student'): Promise<User> {
  if (role !== 'student') throw new Error('Teacher accounts must be provisioned by an administrator.');
  const lock = localStorage.getItem(SIGN_OUT_LOCK);
  await clearAnyExistingSession();
  await account.create(ID.unique(), email, password, name);
  const session = await account.createEmailPasswordSession(email, password);
  return completeSignIn(session.userId, lock);
}

async function completeSignIn(userId: string, lock: string | null): Promise<User> {
  const profile = await loadSelfProfile(userId, lock);
  if (localStorage.getItem(SIGN_OUT_LOCK) !== lock) throw new Error('Please sign in again.');
  localStorage.removeItem(SIGN_OUT_LOCK);
  sessionStorage.removeItem(UNCONFIRMED_SIGN_OUT);
  return profile;
}

async function loadSelfProfile(expectedUserId: string, lock: string | null): Promise<User> {
  const { profile } = await executeLearningContent<{ profile: User }>({ action: 'selfProfile' });
  if (profile.$id !== expectedUserId || localStorage.getItem(SIGN_OUT_LOCK) !== lock) {
    throw new Error('The account changed. Please sign in again.');
  }
  await selectAccountDatabase(profile.$id);
  await db.users.put(profile);
  await db.app_metadata.put({ key: 'currentUserId', value: profile.$id });
  return profile;
}

/** Drop whatever session the browser is holding, if any. Never throws. */
async function clearAnyExistingSession(): Promise<boolean> {
  try {
    await account.deleteSession('current');
    return true;
  } catch (error) {
    return !!error && typeof error === 'object' && 'code' in error && error.code === 401;
  }
}

export async function login(email: string, password: string): Promise<User> {
  // Signing in as someone else on a shared device fails while the previous
  // student's session is still attached to the browser.
  const lock = localStorage.getItem(SIGN_OUT_LOCK);
  await clearAnyExistingSession();
  let session;
  try {
    session = await account.createEmailPasswordSession(email, password);
  } catch (err) {
    const localTeacher = await loginLocalDevelopmentTeacher(email, password);
    if (localTeacher && localStorage.getItem(SIGN_OUT_LOCK) === lock) {
      localStorage.removeItem(SIGN_OUT_LOCK);
      return localTeacher;
    }
    throw err;
  }
  return completeSignIn(session.userId, lock);
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
  await selectAccountDatabase(user.$id);
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
  // Persist the local lock before the first await, even if the tab closes mid-request.
  localStorage.setItem(SIGN_OUT_LOCK, crypto.randomUUID());
  sessionStorage.setItem(UNCONFIRMED_SIGN_OUT, '1');
  const revoke = clearAnyExistingSession();
  await db.app_metadata.delete('currentUserId');
  await selectGuestDatabase();
  if (await revoke) sessionStorage.removeItem(UNCONFIRMED_SIGN_OUT);
}

export async function getCurrentUser(): Promise<User | null> {
  if (localStorage.getItem(SIGN_OUT_LOCK)) return null;
  try {
    const identity = await account.get();
    const profile = await loadSelfProfile(identity.$id, null);
    return localStorage.getItem(SIGN_OUT_LOCK) ? null : profile;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error.code === 401 || error.code === 403)) {
      await db.app_metadata.delete('currentUserId');
      return null;
    }
    // Preserve offline access, but never fabricate a new role/profile.
    return getCachedUser();
  }
}

export async function getCachedUser(): Promise<User | null> {
  if (localStorage.getItem(SIGN_OUT_LOCK)) return null;
  const meta = await db.app_metadata.get('currentUserId');
  if (!meta?.value) return null;
  const user = await db.users.get(meta.value);
  return localStorage.getItem(SIGN_OUT_LOCK) ? null : user || null;
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
