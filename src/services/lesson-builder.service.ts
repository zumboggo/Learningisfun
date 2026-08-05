import { createReading, publishReading, assignReading } from './reading.service';
import { createDeck, addCard, publishDeck, assignDeck } from './flashcard.service';
import { createClassSession, todayKey } from './class-session.service';
import { parseCsvContent, readFileAsText, detectMapping } from '@/utils/csv-parser';
import type { CsvMapping, FlashcardCard, FlashcardDeck, Reading, ReadingAssignment, ClassSession } from '@/types';

export interface LessonBuildInput {
  teacherId: string;
  classId: string;
  title: string;
  author: string;
  description: string;
  lessonDate: string;
  content: string;
  contentFormat: 'plain' | 'markdown';
  promptMarkdown: string;
  minResponseWords: number;
  votesPerStudent: number;
  allowStackedVotes: boolean;
  discussionGoalsMarkdown: string;
  vocabFile?: File | null;
  vocabMapping?: CsvMapping | null;
  vocabDeckTitle?: string;
  dailyTarget?: number | null;
}

export interface LessonBuildResult {
  reading: Reading;
  assignment: ReadingAssignment;
  session: ClassSession;
  deck?: FlashcardDeck;
  cards: FlashcardCard[];
}

export async function buildLesson(input: LessonBuildInput): Promise<LessonBuildResult> {
  const reading = await createReading(input.teacherId, input.title, input.content, {
    author: input.author,
    description: input.description,
    contentFormat: input.contentFormat,
  });
  await publishReading(reading.$id, input.teacherId);
  const assignment = await assignReading(reading.$id, input.classId, undefined, {
    promptMarkdown: input.promptMarkdown,
    minResponseWords: input.minResponseWords,
  });
  const session = await createClassSession(input.classId, input.teacherId, {
    title: input.title,
    sessionDate: input.lessonDate || todayKey(),
    assignmentId: assignment.$id,
    votesPerStudent: input.votesPerStudent,
    allowStackedVotes: input.allowStackedVotes,
  });
  if (input.discussionGoalsMarkdown.trim()) {
    // Avoid a second service import cycle; class sessions are local-first and can be updated directly here.
    const { updateClassSession } = await import('./class-session.service');
    await updateClassSession(session.$id, input.teacherId, { notesMarkdown: input.discussionGoalsMarkdown });
  }

  const cards: FlashcardCard[] = [];
  let deck: FlashcardDeck | undefined;
  if (input.vocabFile && input.vocabMapping) {
    const content = await readFileAsText(input.vocabFile);
    const preview = parseCsvContent(content, input.vocabMapping);
    deck = await createDeck(
      input.teacherId,
      input.vocabDeckTitle?.trim() || `${input.title} Vocabulary`,
      `Vocabulary for ${input.title}`,
      'teacher',
    );
    for (const row of preview.rows) {
      const front = row[input.vocabMapping.front] || '';
      const back = row[input.vocabMapping.back] || '';
      if (!front || !back) continue;
      const hint = input.vocabMapping.hint ? row[input.vocabMapping.hint] || '' : '';
      const tags = parseTags(input.vocabMapping.tags ? row[input.vocabMapping.tags] || '' : '');
      const source = input.vocabMapping.source ? row[input.vocabMapping.source] || '' : '';
      if (source && !tags.includes(source)) tags.push(source);
      cards.push(await addCard(deck.$id, front, back, { hint, tags }));
    }
    await publishDeck(deck.$id, input.teacherId);
    await assignDeck(deck.$id, input.classId, true, input.dailyTarget ?? null);
  }

  return { reading, assignment, session, deck, cards };
}

export async function previewVocabCsv(file: File, mapping?: CsvMapping | null) {
  const content = await readFileAsText(file);
  const preview = parseCsvContent(content, mapping || null);
  return { preview, mapping: mapping || detectMapping(preview.headers) };
}

function parseTags(value: string): string[] {
  return value
    .split(/[;,]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}
