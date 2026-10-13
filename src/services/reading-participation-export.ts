import { readingDiscussion, type ReadingDiscussion, type ReadingDiscussionListing } from './reading-discussion.service';
import { escapeCsvField } from '@/utils/csv-parser';

export type ParticipationStudent = { id: string; name: string; email?: string };
export type TextParticipation = { textId: string; title: string; students: ReadingDiscussion['participation'] };

// Escape formula prefixes as well as CSV delimiters for spreadsheet imports.
const cell = (value: string | number) => escapeCsvField(typeof value === 'string' && /^[\s]*[=+@-]/.test(value) ? `'${value}` : String(value));
export function buildReadingParticipationCsv(classId: string, className: string, roster: ParticipationStudent[], texts: TextParticipation[]): string {
  const students = new Map(roster.map(student => [student.id, student]));
  for (const text of texts) for (const student of text.students) students.set(student.id, { ...students.get(student.id), ...student });
  const rows: (string | number)[][] = [['Class', 'Class ID', 'Student', 'Email', 'Student ID', 'Row type', 'Text', 'Text ID', 'Questions', 'Replies', 'Total contributions']];
  const orderedTexts = [...texts].sort((a, b) => a.title.localeCompare(b.title) || a.textId.localeCompare(b.textId));
  for (const student of [...students.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))) {
    const details = orderedTexts.map(text => {
      const counts = text.students.find(row => row.id === student.id);
      const questions = counts?.question || 0, replies = counts?.replies || 0;
      return { text, questions, replies };
    });
    const questions = details.reduce((sum, row) => sum + row.questions, 0), replies = details.reduce((sum, row) => sum + row.replies, 0);
    rows.push([className, classId, student.name, student.email || '', student.id, 'Student total', 'All assigned readings', '', questions, replies, questions + replies]);
    for (const row of details) rows.push([className, classId, student.name, student.email || '', student.id, 'Text breakdown', row.text.title, row.text.textId, row.questions, row.replies, row.questions + row.replies]);
  }
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

export async function exportReadingParticipation(classId: string, className: string, roster: ParticipationStudent[]): Promise<string> {
  const { readings } = await readingDiscussion<{ readings: ReadingDiscussionListing[] }>('listReadingDiscussions', '', classId);
  const textIds = [...new Set(readings.filter(row => row.classId === classId).map(row => row.textId))];
  const texts: TextParticipation[] = [];
  // Bound concurrent reads, and abort the export if any reading cannot be loaded.
  for (let offset = 0; offset < textIds.length; offset += 4) {
    texts.push(...await Promise.all(textIds.slice(offset, offset + 4).map(async textId => {
      const result = await readingDiscussion<ReadingDiscussion>('readReadingDiscussion', textId, classId);
      if (!result.teacher) throw new Error('Only the class teacher can export participation.');
      return { textId, title: result.title, students: result.participation };
    })));
  }
  // Discussion reads return the current server roster, including students with no posts.
  const currentRoster = texts.length ? texts[0].students.map(student => ({ ...student, email: roster.find(row => row.id === student.id)?.email })) : roster;
  return buildReadingParticipationCsv(classId, className, currentRoster, texts);
}
