import { ID } from 'appwrite';
import { db } from '@/db/schema';
import { getApiKey, generateWritingFeedback } from '@/services/ai.service';
import { addToQueue } from '@/services/sync.service';
import { countMarkdownWords } from '@/components/common/Markdown';
import { getTimestamp } from '@/utils/helpers';
import type {
  PeerReview,
  RubricCriterion,
  TeacherWritingFeedback,
  WritingAiFeedback,
  WritingPrompt,
  WritingSubmission,
} from '@/types';

export const FEEDBACK_POINT_SLOTS = 3;
export const DEFAULT_PEER_REVIEWS_REQUIRED = 3;

// ---------------------------------------------------------------------------
// Rubrics
// ---------------------------------------------------------------------------

/** A general-purpose starting rubric teachers can rename or rewrite per prompt. */
export function defaultRubric(): RubricCriterion[] {
  const levels = (labels: [string, string, string, string]): RubricCriterion['levels'] => [
    { points: 4, label: 'Excellent', descriptor: labels[0] },
    { points: 3, label: 'Good', descriptor: labels[1] },
    { points: 2, label: 'Developing', descriptor: labels[2] },
    { points: 1, label: 'Beginning', descriptor: labels[3] },
  ];

  return [
    {
      id: 'ideas',
      name: 'Ideas & Content',
      description: 'Answers the prompt with clear, developed thinking.',
      maxPoints: 4,
      levels: levels([
        'Insightful ideas, fully developed with convincing detail.',
        'Clear ideas supported with relevant detail.',
        'Ideas present but thin or repetitive.',
        'Ideas unclear or off the prompt.',
      ]),
    },
    {
      id: 'evidence',
      name: 'Evidence & Support',
      description: 'Uses specific examples, quotations or reasons.',
      maxPoints: 4,
      levels: levels([
        'Precise evidence, well chosen and fully explained.',
        'Relevant evidence, mostly explained.',
        'Some evidence, often unexplained.',
        'Little or no evidence.',
      ]),
    },
    {
      id: 'organisation',
      name: 'Organisation',
      description: 'Structure, paragraphing and transitions.',
      maxPoints: 4,
      levels: levels([
        'Purposeful structure; transitions guide the reader.',
        'Logical structure with mostly smooth transitions.',
        'Structure is loose; reader loses the thread at times.',
        'Little structure; hard to follow.',
      ]),
    },
    {
      id: 'language',
      name: 'Language & Style',
      description: 'Word choice, sentence variety and voice.',
      maxPoints: 4,
      levels: levels([
        'Precise, varied language with a clear voice.',
        'Clear language with some variety.',
        'Repetitive or vague word choice.',
        'Word choice obscures the meaning.',
      ]),
    },
    {
      id: 'conventions',
      name: 'Conventions',
      description: 'Grammar, spelling and punctuation.',
      maxPoints: 4,
      levels: levels([
        'Virtually error free.',
        'Minor errors that do not distract.',
        'Errors that sometimes distract the reader.',
        'Errors that block understanding.',
      ]),
    },
  ];
}

export function parseRubric(rubricJson: string): RubricCriterion[] {
  try {
    const parsed = JSON.parse(rubricJson);
    return Array.isArray(parsed) ? (parsed as RubricCriterion[]) : [];
  } catch {
    return [];
  }
}

export function rubricTotalPoints(rubric: RubricCriterion[]): number {
  return rubric.reduce((sum, c) => sum + c.maxPoints, 0);
}

/** Flattened rubric text used in AI prompts. */
export function rubricSummary(rubric: RubricCriterion[]): string {
  return rubric
    .map(c => {
      const levels = c.levels.map(l => `${l.points} = ${l.label}: ${l.descriptor}`).join('; ');
      return `- ${c.name} (0-${c.maxPoints}): ${c.description}${levels ? ` [${levels}]` : ''}`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Anonymity
// ---------------------------------------------------------------------------

const LABEL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Stable pseudonym derived from the submission id, so the same writer keeps the
 * same label across every peer's screen without ever exposing the author id.
 */
export function anonymousLabelFor(submissionId: string): string {
  let hash = 0;
  for (let i = 0; i < submissionId.length; i++) {
    hash = (hash * 31 + submissionId.charCodeAt(i)) >>> 0;
  }
  const letter = LABEL_ALPHABET[hash % LABEL_ALPHABET.length];
  const number = (hash >>> 5) % 90 + 10;
  return `Writer ${letter}${number}`;
}

/** Peers are shown as "Peer 1/2/3" in the order their reviews arrived. */
export function peerDisplayName(index: number): string {
  return `Peer ${index + 1}`;
}

// ---------------------------------------------------------------------------
// Peer review assignment (pure)
// ---------------------------------------------------------------------------

/**
 * Chooses which submissions a reviewer should get next. Spreads the load so no
 * draft is left unreviewed: fewest-reviews-first, ties broken by id for
 * determinism. Never returns the reviewer's own work or one already assigned.
 */
export function pickSubmissionsToReview(params: {
  reviewerId: string;
  submissions: WritingSubmission[];
  existingReviews: PeerReview[];
  needed: number;
}): WritingSubmission[] {
  const { reviewerId, submissions, existingReviews, needed } = params;
  if (needed <= 0) return [];

  const alreadyAssigned = new Set(
    existingReviews.filter(r => r.reviewerId === reviewerId).map(r => r.submissionId),
  );

  const reviewCounts = new Map<string, number>();
  for (const review of existingReviews) {
    reviewCounts.set(review.submissionId, (reviewCounts.get(review.submissionId) || 0) + 1);
  }

  return submissions
    .filter(s => s.authorId !== reviewerId)
    .filter(s => s.status !== 'draft')
    .filter(s => !alreadyAssigned.has(s.$id))
    .sort((a, b) => {
      const diff = (reviewCounts.get(a.$id) || 0) - (reviewCounts.get(b.$id) || 0);
      return diff !== 0 ? diff : a.$id.localeCompare(b.$id);
    })
    .slice(0, needed);
}

// ---------------------------------------------------------------------------
// Review validation and unlocking (pure)
// ---------------------------------------------------------------------------

export interface ReviewDraft {
  scores: Record<string, number>;
  feedbackPoints: string[];
  additionalComment: string;
}

/**
 * A review only counts when every rubric criterion is scored and all three
 * feedback slots hold something substantive — the whole point of the exchange
 * is that students practise judging against criteria, not clicking through.
 */
export function validateReview(
  draft: ReviewDraft,
  rubric: RubricCriterion[],
): { valid: boolean; problems: string[] } {
  const problems: string[] = [];

  const unscored = rubric.filter(c => {
    const score = draft.scores[c.id];
    return typeof score !== 'number' || Number.isNaN(score);
  });
  if (unscored.length > 0) {
    problems.push(`Score every criterion (missing: ${unscored.map(c => c.name).join(', ')}).`);
  }

  const outOfRange = rubric.filter(c => {
    const score = draft.scores[c.id];
    return typeof score === 'number' && (score < 0 || score > c.maxPoints);
  });
  if (outOfRange.length > 0) {
    problems.push(`Some scores are outside the allowed range: ${outOfRange.map(c => c.name).join(', ')}.`);
  }

  for (let i = 0; i < FEEDBACK_POINT_SLOTS; i++) {
    const point = (draft.feedbackPoints[i] || '').trim();
    if (point.length < 15) {
      problems.push(`Feedback ${i + 1} needs to be a specific sentence (at least 15 characters).`);
    }
  }

  return { valid: problems.length === 0, problems };
}

export function countCompletedReviews(reviews: PeerReview[], reviewerId: string): number {
  return reviews.filter(r => r.reviewerId === reviewerId && r.status === 'submitted').length;
}

/** Feedback stays sealed until the student has done their own share of reviewing. */
export function hasUnlockedFeedback(
  reviews: PeerReview[],
  reviewerId: string,
  required: number,
): boolean {
  return countCompletedReviews(reviews, reviewerId) >= required;
}

// ---------------------------------------------------------------------------
// Score aggregation (pure)
// ---------------------------------------------------------------------------

export interface ScoreBreakdown {
  /** One entry per reviewer, in submission order. */
  perReviewer: Array<{ reviewId: string; total: number; scores: Record<string, number> }>;
  /** Mean score for each criterion across all reviewers. */
  perCriterion: Record<string, number | null>;
  /** Mean of the reviewer totals. */
  averageTotal: number | null;
  maxTotal: number;
}

export function parseScores(scoresJson: string): Record<string, number> {
  try {
    const parsed = JSON.parse(scoresJson);
    if (!parsed || typeof parsed !== 'object') return {};
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const num = Number(value);
      if (!Number.isNaN(num)) result[key] = num;
    }
    return result;
  } catch {
    return {};
  }
}

export function parseFeedbackPoints(feedbackPointsJson: string): string[] {
  try {
    const parsed = JSON.parse(feedbackPointsJson);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function summariseScores(
  reviews: PeerReview[],
  rubric: RubricCriterion[],
): ScoreBreakdown {
  const submitted = reviews.filter(r => r.status === 'submitted');

  const perReviewer = submitted.map(review => {
    const scores = parseScores(review.scoresJson);
    const total = rubric.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0);
    return { reviewId: review.$id, total, scores };
  });

  const perCriterion: Record<string, number | null> = {};
  for (const criterion of rubric) {
    const values = perReviewer
      .map(r => r.scores[criterion.id])
      .filter((v): v is number => typeof v === 'number');
    perCriterion[criterion.id] = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  }

  const averageTotal = perReviewer.length
    ? perReviewer.reduce((sum, r) => sum + r.total, 0) / perReviewer.length
    : null;

  return {
    perReviewer,
    perCriterion,
    averageTotal,
    maxTotal: rubricTotalPoints(rubric),
  };
}

export function formatScore(value: number | null, digits = 1): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export async function createWritingPrompt(params: {
  classId: string;
  teacherId: string;
  title: string;
  promptMarkdown: string;
  instructions: string;
  rubric: RubricCriterion[];
  peerReviewsRequired: number;
  minWords: number;
  dueAt: string | null;
  aiFeedbackEnabled: boolean;
}): Promise<WritingPrompt> {
  const now = getTimestamp();
  const prompt: WritingPrompt = {
    $id: ID.unique(),
    classId: params.classId,
    teacherId: params.teacherId,
    title: params.title,
    promptMarkdown: params.promptMarkdown,
    instructions: params.instructions,
    rubricJson: JSON.stringify(params.rubric),
    peerReviewsRequired: params.peerReviewsRequired,
    minWords: params.minWords,
    dueAt: params.dueAt,
    status: 'draft',
    aiFeedbackEnabled: params.aiFeedbackEnabled,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'local',
  };
  await db.writing_prompts.put(prompt);
  await addToQueue(params.teacherId, 'writing_prompt', prompt.$id, 'create', prompt);
  return prompt;
}

export async function updateWritingPromptStatus(
  promptId: string,
  status: WritingPrompt['status'],
  userId: string,
): Promise<void> {
  await db.writing_prompts.update(promptId, { status, updatedAt: getTimestamp(), syncStatus: 'local' });
  const prompt = await db.writing_prompts.get(promptId);
  if (prompt) await addToQueue(userId, 'writing_prompt', promptId, 'update', prompt);
}

export async function getClassWritingPrompts(classId: string): Promise<WritingPrompt[]> {
  const prompts = await db.writing_prompts.where('classId').equals(classId).toArray();
  return prompts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function getOrCreateSubmission(
  promptId: string,
  authorId: string,
): Promise<WritingSubmission> {
  const existing = await db.writing_submissions
    .where('promptId')
    .equals(promptId)
    .and(s => s.authorId === authorId)
    .first();
  if (existing) return existing;

  const prompt = await db.writing_prompts.get(promptId);
  if (!prompt) throw new Error('Writing prompt not found');

  const now = getTimestamp();
  const id = ID.unique();
  const submission: WritingSubmission = {
    $id: id,
    promptId,
    classId: prompt.classId,
    authorId,
    anonymousLabel: anonymousLabelFor(id),
    draftMarkdown: '',
    submittedMarkdown: '',
    wordCount: 0,
    status: 'draft',
    submittedAt: null,
    finalMarkdown: '',
    finalUpdatedAt: null,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'local',
  };
  await db.writing_submissions.put(submission);
  return submission;
}

export async function saveDraft(submissionId: string, draftMarkdown: string): Promise<void> {
  await db.writing_submissions.update(submissionId, {
    draftMarkdown,
    wordCount: countMarkdownWords(draftMarkdown),
    updatedAt: getTimestamp(),
    syncStatus: 'local',
  });
}

export async function submitWriting(submissionId: string): Promise<WritingSubmission> {
  const submission = await db.writing_submissions.get(submissionId);
  if (!submission) throw new Error('Submission not found');

  const now = getTimestamp();
  await db.writing_submissions.update(submissionId, {
    submittedMarkdown: submission.draftMarkdown,
    wordCount: countMarkdownWords(submission.draftMarkdown),
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    syncStatus: 'local',
  });

  const updated = await db.writing_submissions.get(submissionId);
  if (updated) await addToQueue(updated.authorId, 'writing_submission', submissionId, 'create', updated);
  return updated!;
}

export async function saveFinalVersion(submissionId: string, finalMarkdown: string): Promise<void> {
  const now = getTimestamp();
  await db.writing_submissions.update(submissionId, {
    finalMarkdown,
    finalUpdatedAt: now,
    status: 'revised',
    updatedAt: now,
    syncStatus: 'local',
  });
  const updated = await db.writing_submissions.get(submissionId);
  if (updated) await addToQueue(updated.authorId, 'writing_submission', submissionId, 'update', updated);
}

export async function getPromptSubmissions(promptId: string): Promise<WritingSubmission[]> {
  return db.writing_submissions.where('promptId').equals(promptId).toArray();
}

// ---------------------------------------------------------------------------
// Peer reviews
// ---------------------------------------------------------------------------

/**
 * Tops the reviewer's queue back up to the required number. Called when the
 * student opens the review tab, so late submissions still enter the pool.
 */
export async function ensureReviewAssignments(
  promptId: string,
  reviewerId: string,
): Promise<PeerReview[]> {
  const prompt = await db.writing_prompts.get(promptId);
  if (!prompt) throw new Error('Writing prompt not found');

  const allReviews = await db.peer_reviews.where('promptId').equals(promptId).toArray();
  const mine = allReviews.filter(r => r.reviewerId === reviewerId);
  const needed = prompt.peerReviewsRequired - mine.length;

  if (needed > 0) {
    const submissions = await getPromptSubmissions(promptId);
    const picks = pickSubmissionsToReview({
      reviewerId,
      submissions,
      existingReviews: allReviews,
      needed,
    });

    for (const submission of picks) {
      const review: PeerReview = {
        $id: ID.unique(),
        promptId,
        submissionId: submission.$id,
        reviewerId,
        scoresJson: '{}',
        feedbackPointsJson: JSON.stringify(Array(FEEDBACK_POINT_SLOTS).fill('')),
        additionalComment: '',
        status: 'assigned',
        assignedAt: getTimestamp(),
        submittedAt: null,
        syncStatus: 'local',
      };
      await db.peer_reviews.put(review);
      mine.push(review);
    }
  }

  return mine.sort((a, b) => a.assignedAt.localeCompare(b.assignedAt));
}

export async function saveReviewDraft(reviewId: string, draft: ReviewDraft): Promise<void> {
  await db.peer_reviews.update(reviewId, {
    scoresJson: JSON.stringify(draft.scores),
    feedbackPointsJson: JSON.stringify(draft.feedbackPoints),
    additionalComment: draft.additionalComment,
    syncStatus: 'local',
  });
}

export async function submitReview(reviewId: string, draft: ReviewDraft): Promise<void> {
  const review = await db.peer_reviews.get(reviewId);
  if (!review) throw new Error('Review not found');

  const prompt = await db.writing_prompts.get(review.promptId);
  const rubric = prompt ? parseRubric(prompt.rubricJson) : [];
  const { valid, problems } = validateReview(draft, rubric);
  if (!valid) throw new Error(problems[0]);

  await db.peer_reviews.update(reviewId, {
    scoresJson: JSON.stringify(draft.scores),
    feedbackPointsJson: JSON.stringify(draft.feedbackPoints),
    additionalComment: draft.additionalComment,
    status: 'submitted',
    submittedAt: getTimestamp(),
    syncStatus: 'local',
  });

  const updated = await db.peer_reviews.get(reviewId);
  if (updated) await addToQueue(review.reviewerId, 'peer_review', reviewId, 'create', updated);
}

export async function getReviewsForSubmission(submissionId: string): Promise<PeerReview[]> {
  const reviews = await db.peer_reviews.where('submissionId').equals(submissionId).toArray();
  return reviews
    .filter(r => r.status === 'submitted')
    .sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''));
}

export async function getReviewsByReviewer(promptId: string, reviewerId: string): Promise<PeerReview[]> {
  return db.peer_reviews
    .where('promptId')
    .equals(promptId)
    .and(r => r.reviewerId === reviewerId)
    .toArray();
}

// ---------------------------------------------------------------------------
// AI feedback
// ---------------------------------------------------------------------------

export async function getAiFeedback(submissionId: string): Promise<WritingAiFeedback | undefined> {
  return db.writing_ai_feedback.where('submissionId').equals(submissionId).first();
}

export async function generateAiFeedbackForSubmission(
  submissionId: string,
): Promise<WritingAiFeedback> {
  const submission = await db.writing_submissions.get(submissionId);
  if (!submission) throw new Error('Submission not found');

  const prompt = await db.writing_prompts.get(submission.promptId);
  if (!prompt) throw new Error('Writing prompt not found');
  if (!prompt.aiFeedbackEnabled) throw new Error('AI feedback is turned off for this prompt');

  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key configured. Ask your teacher to add one in Settings.');

  const text = submission.submittedMarkdown || submission.draftMarkdown;
  if (!text.trim()) throw new Error('There is nothing written yet');

  const result = await generateWritingFeedback(
    {
      promptTitle: prompt.title,
      promptText: prompt.promptMarkdown,
      rubricSummary: rubricSummary(parseRubric(prompt.rubricJson)),
      studentText: text,
    },
    apiKey,
  );

  const existing = await getAiFeedback(submissionId);
  const record: WritingAiFeedback = {
    $id: existing?.$id || ID.unique(),
    submissionId,
    wwwSummary: result.www,
    improvementsJson: JSON.stringify(result.improvements),
    model: 'openrouter',
    generatedAt: getTimestamp(),
  };
  await db.writing_ai_feedback.put(record);
  return record;
}

export function parseImprovements(improvementsJson: string): string[] {
  try {
    const parsed = JSON.parse(improvementsJson);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Teacher feedback
// ---------------------------------------------------------------------------

export async function getTeacherFeedback(
  submissionId: string,
): Promise<TeacherWritingFeedback | undefined> {
  return db.teacher_writing_feedback.where('submissionId').equals(submissionId).first();
}

export async function saveTeacherFeedback(params: {
  submissionId: string;
  teacherId: string;
  scores: Record<string, number>;
  commentMarkdown: string;
}): Promise<TeacherWritingFeedback> {
  const existing = await getTeacherFeedback(params.submissionId);
  const now = getTimestamp();
  const record: TeacherWritingFeedback = {
    $id: existing?.$id || ID.unique(),
    submissionId: params.submissionId,
    teacherId: params.teacherId,
    scoresJson: JSON.stringify(params.scores),
    commentMarkdown: params.commentMarkdown,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    syncStatus: 'local',
  };
  await db.teacher_writing_feedback.put(record);
  await addToQueue(
    params.teacherId,
    'teacher_writing_feedback',
    record.$id,
    existing ? 'update' : 'create',
    record,
  );
  return record;
}

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

/**
 * Plain-text bundle of everything a student received, so they can paste the
 * feedback into a revision journal alongside the draft they hand in on Canvas.
 */
export function buildFeedbackDigest(params: {
  peerReviews: Array<{ points: string[]; comment: string; total: number }>;
  ai: { www: string; improvements: string[] } | null;
  teacher: { comment: string; total: number | null } | null;
  maxTotal: number;
  averageTotal: number | null;
}): string {
  const lines: string[] = [];

  if (params.averageTotal !== null) {
    lines.push(`Peer average: ${formatScore(params.averageTotal)} / ${params.maxTotal}`, '');
  }

  params.peerReviews.forEach((review, index) => {
    lines.push(`${peerDisplayName(index)} (${review.total}/${params.maxTotal})`);
    review.points.filter(Boolean).forEach((point, i) => lines.push(`  ${i + 1}. ${point}`));
    if (review.comment.trim()) lines.push(`  More: ${review.comment.trim()}`);
    lines.push('');
  });

  if (params.ai) {
    lines.push('AI coach — What went well');
    lines.push(`  ${params.ai.www}`);
    lines.push('AI coach — Next steps');
    params.ai.improvements.forEach((point, i) => lines.push(`  ${i + 1}. ${point}`));
    lines.push('');
  }

  if (params.teacher) {
    const score = params.teacher.total !== null
      ? ` (${formatScore(params.teacher.total)}/${params.maxTotal})`
      : '';
    lines.push(`Teacher${score}`);
    lines.push(`  ${params.teacher.comment}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}
