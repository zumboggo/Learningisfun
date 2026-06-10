import { account, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateDeviceId, getTimestamp } from '@/utils/helpers';
import type { User, UserRole } from '@/types';
import { ID, Query } from 'appwrite';

export async function register(email: string, password: string, name: string, role: UserRole = 'student'): Promise<User> {
  const appwriteUser = await account.create(ID.unique(), email, password, name);

  const userDoc: User = {
    $id: appwriteUser.$id,
    email,
    name,
    role,
    deviceId: generateDeviceId(),
    lastSyncAt: getTimestamp(),
    createdAt: getTimestamp(),
  };

  await databases.createDocument(DATABASE_ID, COLLECTIONS.users, appwriteUser.$id, {
    email,
    name,
    role,
    deviceId: userDoc.deviceId,
    lastSyncAt: userDoc.lastSyncAt,
    createdAt: userDoc.createdAt,
  });

  await db.users.put(userDoc);
  return userDoc;
}

export async function login(email: string, password: string): Promise<User> {
  await account.createEmailPasswordSession(email, password);
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
    if (localUser) return localUser;

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
      };
      await db.users.put(user);
      return user;
    } catch {
      return null;
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
