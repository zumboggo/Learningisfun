import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateId, generateJoinCode, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import { createStudentAccount, findUserByEmail } from './auth.service';
import { parseCsvLine, readFileAsText } from '@/utils/csv-parser';
import { Query } from 'appwrite';
import type { Class, ClassMember } from '@/types';

export interface RosterImportRow {
  name: string;
  email: string;
  password: string;
  status: 'created' | 'existing' | 'skipped' | 'error';
  message: string;
}

export interface RosterImportResult {
  created: number;
  existing: number;
  added: number;
  skipped: number;
  rows: RosterImportRow[];
}

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

export async function importClassRoster(
  classId: string,
  teacherId: string,
  file: File,
): Promise<RosterImportResult> {
  const content = await readFileAsText(file);
  const rosterRows = parseRosterCsv(content);
  const result: RosterImportResult = { created: 0, existing: 0, added: 0, skipped: 0, rows: [] };

  for (const row of rosterRows) {
    if (!row.email || !row.name) {
      result.skipped++;
      result.rows.push({ name: row.name, email: row.email, password: row.password, status: 'skipped', message: 'Missing name or email' });
      continue;
    }

    const password = row.password || generateTemporaryPassword();
    const existedBefore = Boolean(await findUserByEmail(row.email));
    try {
      const student = await createStudentAccount(row.email, password, row.name);
      const existingMember = await db.class_members
        .where('[classId+userId]')
        .equals([classId, student.$id])
        .first();
      if (!existingMember) {
        const member: ClassMember = {
          $id: generateId(),
          classId,
          userId: student.$id,
          role: 'student',
          joinedAt: getTimestamp(),
        };
        await db.class_members.put(member);
        try {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.class_members, member.$id, {
            classId,
            userId: student.$id,
            role: 'student',
            joinedAt: member.joinedAt,
          });
        } catch {
          await addToQueue(teacherId, 'class_member', member.$id, 'create', member);
        }
        result.added++;
      }
      if (existedBefore) result.existing++;
      else result.created++;
      result.rows.push({
        name: student.name,
        email: student.email,
        password,
        status: existedBefore ? 'existing' : 'created',
        message: existingMember ? 'Already in class' : 'Added to class',
      });
    } catch (error) {
      result.skipped++;
      result.rows.push({
        name: row.name,
        email: row.email,
        password,
        status: 'error',
        message: error instanceof Error ? error.message : 'Import failed',
      });
    }
  }

  return result;
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

function parseRosterCsv(content: string): Array<{ name: string; email: string; password: string }> {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  const normalized = headers.map(header => header.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
  const nameIndex = findHeader(normalized, ['name', 'fullname', 'studentname']);
  const emailIndex = findHeader(normalized, ['email', 'emailaddress', 'login']);
  const passwordIndex = findHeader(normalized, ['password', 'tempassword', 'temporarypassword', 'initialpassword']);

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return {
      name: nameIndex >= 0 ? values[nameIndex]?.trim() || '' : '',
      email: emailIndex >= 0 ? values[emailIndex]?.trim().toLowerCase() || '' : '',
      password: passwordIndex >= 0 ? values[passwordIndex]?.trim() || '' : '',
    };
  });
}

function findHeader(headers: string[], candidates: string[]): number {
  return headers.findIndex(header => candidates.includes(header));
}

function generateTemporaryPassword(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, byte => byte.toString(36).padStart(2, '0')).join('').slice(0, 10);
  return `Edu-${token}!`;
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
