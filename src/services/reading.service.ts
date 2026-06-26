import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { db } from '@/db/schema';
import { generateId, getTimestamp } from '@/utils/helpers';
import { addToQueue } from './sync.service';
import { Query } from 'appwrite';
import type { Reading, ReadingAssignment, ReadingProgress } from '@/types';

export async function createReading(
  teacherId: string,
  title: string,
  content: string,
  options: { author?: string; sourceUrl?: string; description?: string; contentFormat?: 'plain' | 'markdown' } = {},
): Promise<Reading> {
  const id = generateId();
  const now = getTimestamp();
  const reading: Reading = {
    $id: id,
    teacherId,
    title,
    author: options.author || '',
    sourceUrl: options.sourceUrl || '',
    description: options.description || '',
    content,
    contentFormat: options.contentFormat || 'plain',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  await db.readings.put(reading);
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.readings, id, {
      teacherId,
      title,
      author: reading.author,
      sourceUrl: reading.sourceUrl,
      description: reading.description,
      content,
      contentFormat: reading.contentFormat,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    await addToQueue(teacherId, 'reading', id, 'create', reading);
  }

  return reading;
}

export async function publishReading(readingId: string, teacherId: string): Promise<void> {
  const now = getTimestamp();
  await db.readings.update(readingId, { status: 'published', updatedAt: now });
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.readings, readingId, { status: 'published', updatedAt: now });
  } catch {
    await addToQueue(teacherId, 'reading', readingId, 'update', { status: 'published' });
  }
}

export async function assignReading(
  readingId: string,
  classId: string,
  dueDate?: string,
  options: { promptMarkdown?: string; minResponseWords?: number; minQuestions?: number } = {},
): Promise<ReadingAssignment> {
  const id = generateId();
  const now = getTimestamp();
  const assignment: ReadingAssignment = {
    $id: id,
    readingId,
    classId,
    promptMarkdown: options.promptMarkdown || '',
    minResponseWords: options.minResponseWords || 0,
    minQuestions: options.minQuestions || 0,
    status: 'published',
    assignedAt: now,
    dueDate: dueDate || null,
    publishedAt: now,
  };

  await db.reading_assignments.put(assignment);
  try {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.reading_assignments, id, {
      readingId,
      classId,
      promptMarkdown: assignment.promptMarkdown,
      minResponseWords: assignment.minResponseWords,
      minQuestions: assignment.minQuestions,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      dueDate: assignment.dueDate,
      publishedAt: assignment.publishedAt,
    });
  } catch {
    await addToQueue('', 'reading_assignment', id, 'create', assignment);
  }

  return assignment;
}

export async function getClassReadings(classId: string): Promise<Reading[]> {
  const assignments = await db.reading_assignments.where('classId').equals(classId).toArray();
  const readings: Reading[] = [];
  for (const a of assignments) {
    const reading = await db.readings.get(a.readingId);
    if (reading && reading.status === 'published') readings.push(reading);
  }
  return readings;
}

export async function getStudentReadings(userId: string): Promise<Reading[]> {
  const memberships = await db.class_members.where('userId').equals(userId).toArray();
  const readings: Reading[] = [];
  const seen = new Set<string>();

  for (const m of memberships) {
    const assignments = await db.reading_assignments.where('classId').equals(m.classId).toArray();
    for (const a of assignments) {
      if (seen.has(a.readingId)) continue;
      seen.add(a.readingId);
      const reading = await db.readings.get(a.readingId);
      if (reading && reading.status === 'published') readings.push(reading);
    }
  }

  return readings;
}

export async function getReading(readingId: string): Promise<Reading | undefined> {
  return db.readings.get(readingId);
}

export async function updateReadingProgress(
  userId: string,
  readingId: string,
  scrollPercent: number,
  lastPosition: number,
  bookmarked: boolean,
): Promise<void> {
  const id = `${userId}_${readingId}`;
  const now = getTimestamp();
  const progress: ReadingProgress = {
    $id: id,
    userId,
    readingId,
    scrollPercent,
    lastPosition,
    bookmarked,
    updatedAt: now,
    syncStatus: 'local',
  };

  await db.reading_progress.put(progress);
  await addToQueue(userId, 'reading_progress', id, 'update', progress);
}

export async function getReadingProgress(userId: string, readingId: string): Promise<ReadingProgress | undefined> {
  return db.reading_progress.get(`${userId}_${readingId}`);
}

export async function syncReadingsFromServer(): Promise<void> {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.readings, [
      Query.equal('status', 'published'),
      Query.limit(100),
    ]);

    for (const doc of result.documents) {
      await db.readings.put({
        $id: doc.$id,
        teacherId: doc.teacherId,
        title: doc.title,
        author: doc.author,
        sourceUrl: doc.sourceUrl,
        description: doc.description,
        content: doc.content,
        contentFormat: doc.contentFormat,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      });
    }

    const assignResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.reading_assignments, [
      Query.limit(100),
    ]);
    for (const doc of assignResult.documents) {
      await db.reading_assignments.put({
        $id: doc.$id,
        readingId: doc.readingId,
        classId: doc.classId,
        promptMarkdown: doc.promptMarkdown || '',
        minResponseWords: doc.minResponseWords || 0,
        minQuestions: doc.minQuestions || 0,
        status: doc.status || 'published',
        assignedAt: doc.assignedAt,
        dueDate: doc.dueDate,
        publishedAt: doc.publishedAt || doc.assignedAt || null,
      });
    }
  } catch {
    // Offline
  }
}
