import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateId, generateJoinCode, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import { Query } from 'appwrite';
import type { Class, ClassMember } from '@/types';

export async function createClass(
  teacherId: string,
  name: string,
  courseName: string,
  schoolYear: string,
): Promise<Class> {
  const id = generateId();
  const cls: Class = {
    $id: id,
    name,
    courseName,
    schoolYear,
    teacherId,
    joinCode: generateJoinCode(),
    joinCodeActive: true,
    status: 'active',
    createdAt: getTimestamp(),
  };

  await db.classes.put(cls);
  await db.class_members.put({
    $id: generateId(),
    classId: id,
    userId: teacherId,
    role: 'teacher',
    joinedAt: getTimestamp(),
  });

  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.classes, id, {
      name,
      courseName,
      schoolYear,
      teacherId,
      joinCode: cls.joinCode,
      joinCodeActive: true,
      status: 'active',
      createdAt: cls.createdAt,
    });
    await databases.createDocument(DATABASE_ID, COLLECTIONS.class_members, generateId(), {
      classId: id,
      userId: teacherId,
      role: 'teacher',
      joinedAt: getTimestamp(),
    });
  } catch {
    await addToQueue(teacherId, 'class', id, 'create', cls);
  }

  return cls;
}

export async function joinClass(userId: string, joinCode: string): Promise<Class | null> {
  const localClasses = await db.classes.where('joinCode').equals(joinCode).toArray();
  let cls = localClasses.find(c => c.joinCodeActive && c.status === 'active');

  if (!cls) {
    try {
      const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.classes, [
        Query.equal('joinCode', joinCode),
        Query.equal('joinCodeActive', true),
        Query.equal('status', 'active'),
      ]);
      if (result.documents.length === 0) return null;
      const doc = result.documents[0];
      cls = {
        $id: doc.$id,
        name: doc.name,
        courseName: doc.courseName,
        schoolYear: doc.schoolYear,
        teacherId: doc.teacherId,
        joinCode: doc.joinCode,
        joinCodeActive: doc.joinCodeActive,
        status: doc.status,
        createdAt: doc.createdAt,
      };
      await db.classes.put(cls);
    } catch {
      return null;
    }
  }

  if (!cls) return null;

  const existing = await db.class_members
    .where('[classId+userId]')
    .equals([cls.$id, userId])
    .first();

  if (existing) return cls;

  const memberId = generateId();
  const member: ClassMember = {
    $id: memberId,
    classId: cls.$id,
    userId,
    role: 'student',
    joinedAt: getTimestamp(),
  };

  await db.class_members.put(member);

  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.class_members, memberId, {
      classId: cls.$id,
      userId,
      role: 'student',
      joinedAt: member.joinedAt,
    });
  } catch {
    await addToQueue(userId, 'class_member', memberId, 'create', member);
  }

  return cls;
}

export async function getUserClasses(userId: string): Promise<Class[]> {
  const memberships = await db.class_members.where('userId').equals(userId).toArray();
  const classes: Class[] = [];
  for (const m of memberships) {
    const cls = await db.classes.get(m.classId);
    if (cls && cls.status === 'active') classes.push(cls);
  }
  return classes;
}

export async function getTeacherClasses(teacherId: string): Promise<Class[]> {
  return db.classes.where('teacherId').equals(teacherId).toArray();
}

export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  return db.class_members.where('classId').equals(classId).toArray();
}

export async function regenerateJoinCode(classId: string, teacherId: string): Promise<string> {
  const newCode = generateJoinCode();
  await db.classes.update(classId, { joinCode: newCode });
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.classes, classId, { joinCode: newCode });
  } catch {
    await addToQueue(teacherId, 'class', classId, 'update', { joinCode: newCode });
  }
  return newCode;
}

export async function removeStudent(classId: string, userId: string): Promise<void> {
  const member = await db.class_members
    .where('[classId+userId]')
    .equals([classId, userId])
    .first();
  if (member) {
    await db.class_members.delete(member.$id);
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.class_members, member.$id);
    } catch {
      // Will sync later
    }
  }
}

export async function syncClassesFromServer(userId: string): Promise<void> {
  try {
    const memberResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.class_members, [
      Query.equal('userId', userId),
    ]);

    for (const doc of memberResult.documents) {
      await db.class_members.put({
        $id: doc.$id,
        classId: doc.classId,
        userId: doc.userId,
        role: doc.role,
        joinedAt: doc.joinedAt,
      });

      try {
        const classDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.classes, doc.classId);
        await db.classes.put({
          $id: classDoc.$id,
          name: classDoc.name,
          courseName: classDoc.courseName,
          schoolYear: classDoc.schoolYear,
          teacherId: classDoc.teacherId,
          joinCode: classDoc.joinCode,
          joinCodeActive: classDoc.joinCodeActive,
          status: classDoc.status,
          createdAt: classDoc.createdAt,
        });
      } catch {
        // Class may have been deleted
      }
    }
  } catch {
    // Offline - will retry later
  }
}
