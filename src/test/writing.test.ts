import { describe, expect, it } from 'vitest';
import {
  anonymousLabelFor,
  buildFeedbackDigest,
  countCompletedReviews,
  defaultRubric,
  formatScore,
  hasUnlockedFeedback,
  parseRubric,
  peerDisplayName,
  pickSubmissionsToReview,
  rubricTotalPoints,
  summariseScores,
  validateReview,
} from '@/services/writing.service';
import type { PeerReview, RubricCriterion, WritingSubmission } from '@/types';

const rubric: RubricCriterion[] = [
  {
    id: 'ideas',
    name: 'Ideas',
    description: '',
    maxPoints: 4,
    levels: [
      { points: 4, label: 'Excellent', descriptor: '' },
      { points: 1, label: 'Beginning', descriptor: '' },
    ],
  },
  {
    id: 'style',
    name: 'Style',
    description: '',
    maxPoints: 4,
    levels: [
      { points: 4, label: 'Excellent', descriptor: '' },
      { points: 1, label: 'Beginning', descriptor: '' },
    ],
  },
];

function submission(id: string, authorId: string, status: WritingSubmission['status'] = 'submitted'): WritingSubmission {
  return {
    $id: id,
    promptId: 'prompt-1',
    classId: 'class-1',
    authorId,
    anonymousLabel: anonymousLabelFor(id),
    draftMarkdown: '',
    submittedMarkdown: 'text',
    wordCount: 1,
    status,
    submittedAt: '2026-01-01T00:00:00.000Z',
    finalMarkdown: '',
    finalUpdatedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    syncStatus: 'local',
  };
}

function review(
  id: string,
  submissionId: string,
  reviewerId: string,
  overrides: Partial<PeerReview> = {},
): PeerReview {
  return {
    $id: id,
    promptId: 'prompt-1',
    submissionId,
    reviewerId,
    scoresJson: '{}',
    feedbackPointsJson: '["","",""]',
    additionalComment: '',
    status: 'assigned',
    assignedAt: '2026-01-01T00:00:00.000Z',
    submittedAt: null,
    syncStatus: 'local',
    ...overrides,
  };
}

describe('peer review assignment', () => {
  it('never assigns a student their own writing', () => {
    const picks = pickSubmissionsToReview({
      reviewerId: 'alice',
      submissions: [submission('s1', 'alice'), submission('s2', 'bob'), submission('s3', 'cara')],
      existingReviews: [],
      needed: 3,
    });
    expect(picks.map(s => s.authorId)).toEqual(['bob', 'cara']);
  });

  it('spreads reviews toward the least-reviewed drafts', () => {
    const picks = pickSubmissionsToReview({
      reviewerId: 'alice',
      submissions: [submission('s2', 'bob'), submission('s3', 'cara'), submission('s4', 'dan')],
      existingReviews: [
        review('r1', 's2', 'eve'),
        review('r2', 's2', 'fay'),
        review('r3', 's3', 'eve'),
      ],
      needed: 2,
    });
    expect(picks.map(s => s.$id)).toEqual(['s4', 's3']);
  });

  it('does not hand the same draft to a reviewer twice', () => {
    const picks = pickSubmissionsToReview({
      reviewerId: 'alice',
      submissions: [submission('s2', 'bob'), submission('s3', 'cara')],
      existingReviews: [review('r1', 's2', 'alice')],
      needed: 2,
    });
    expect(picks.map(s => s.$id)).toEqual(['s3']);
  });

  it('skips drafts that have not been submitted', () => {
    const picks = pickSubmissionsToReview({
      reviewerId: 'alice',
      submissions: [submission('s2', 'bob', 'draft'), submission('s3', 'cara')],
      existingReviews: [],
      needed: 3,
    });
    expect(picks.map(s => s.$id)).toEqual(['s3']);
  });
});

describe('review validation', () => {
  const goodPoints = [
    'Your opening paragraph states the claim clearly, keep that.',
    'The second example is never explained — add a why sentence.',
    'Try varying sentence length in the final paragraph.',
  ];

  it('accepts a fully scored review with three substantive points', () => {
    const result = validateReview(
      { scores: { ideas: 4, style: 3 }, feedbackPoints: goodPoints, additionalComment: '' },
      rubric,
    );
    expect(result.valid).toBe(true);
  });

  it('rejects a review that skips a criterion', () => {
    const result = validateReview(
      { scores: { ideas: 4 }, feedbackPoints: goodPoints, additionalComment: '' },
      rubric,
    );
    expect(result.valid).toBe(false);
    expect(result.problems[0]).toContain('Style');
  });

  it('rejects one-word feedback so reviews stay specific', () => {
    const result = validateReview(
      { scores: { ideas: 4, style: 4 }, feedbackPoints: ['Good job', ...goodPoints.slice(1)], additionalComment: '' },
      rubric,
    );
    expect(result.valid).toBe(false);
    expect(result.problems[0]).toContain('Feedback 1');
  });

  it('rejects scores above the criterion maximum', () => {
    const result = validateReview(
      { scores: { ideas: 9, style: 4 }, feedbackPoints: goodPoints, additionalComment: '' },
      rubric,
    );
    expect(result.valid).toBe(false);
  });
});

describe('feedback unlocking', () => {
  const reviews = [
    review('r1', 's2', 'alice', { status: 'submitted' }),
    review('r2', 's3', 'alice', { status: 'submitted' }),
    review('r3', 's4', 'alice'),
    review('r4', 's5', 'bob', { status: 'submitted' }),
  ];

  it('counts only the reviewer\'s own submitted reviews', () => {
    expect(countCompletedReviews(reviews, 'alice')).toBe(2);
  });

  it('keeps feedback sealed until the quota is met', () => {
    expect(hasUnlockedFeedback(reviews, 'alice', 3)).toBe(false);
    expect(hasUnlockedFeedback(reviews, 'alice', 2)).toBe(true);
  });
});

describe('score aggregation', () => {
  const received = [
    review('r1', 's1', 'bob', { status: 'submitted', scoresJson: '{"ideas":4,"style":2}' }),
    review('r2', 's1', 'cara', { status: 'submitted', scoresJson: '{"ideas":3,"style":3}' }),
    review('r3', 's1', 'dan', { status: 'submitted', scoresJson: '{"ideas":2,"style":4}' }),
    review('r4', 's1', 'eve', { scoresJson: '{"ideas":1,"style":1}' }),
  ];

  it('reports each mark and the average of all three', () => {
    const breakdown = summariseScores(received, rubric);
    expect(breakdown.perReviewer.map(r => r.total)).toEqual([6, 6, 6]);
    expect(breakdown.averageTotal).toBe(6);
    expect(breakdown.perCriterion.ideas).toBe(3);
    expect(breakdown.maxTotal).toBe(8);
  });

  it('ignores reviews that were never submitted', () => {
    expect(summariseScores(received, rubric).perReviewer).toHaveLength(3);
  });

  it('returns null rather than zero when nobody has marked yet', () => {
    const breakdown = summariseScores([], rubric);
    expect(breakdown.averageTotal).toBeNull();
    expect(formatScore(breakdown.averageTotal)).toBe('—');
  });

  it('formats a fractional average to one decimal', () => {
    const breakdown = summariseScores(
      [
        review('r1', 's1', 'bob', { status: 'submitted', scoresJson: '{"ideas":4,"style":4}' }),
        review('r2', 's1', 'cara', { status: 'submitted', scoresJson: '{"ideas":3,"style":3}' }),
      ],
      rubric,
    );
    expect(formatScore(breakdown.averageTotal)).toBe('7');
    expect(formatScore(breakdown.perCriterion.ideas)).toBe('3.5');
  });
});

describe('anonymity', () => {
  it('gives the same submission the same label every time', () => {
    expect(anonymousLabelFor('abc123')).toBe(anonymousLabelFor('abc123'));
  });

  it('does not leak the author id into the label', () => {
    expect(anonymousLabelFor('student-alice-submission')).toMatch(/^Writer [A-Z]\d{2}$/);
  });

  it('names peers by arrival order only', () => {
    expect(peerDisplayName(0)).toBe('Peer 1');
    expect(peerDisplayName(2)).toBe('Peer 3');
  });
});

describe('rubric helpers', () => {
  it('round-trips the default rubric through JSON', () => {
    const rubricJson = JSON.stringify(defaultRubric());
    expect(parseRubric(rubricJson)).toHaveLength(defaultRubric().length);
    expect(rubricTotalPoints(parseRubric(rubricJson))).toBe(20);
  });

  it('degrades to an empty rubric rather than throwing on bad JSON', () => {
    expect(parseRubric('not json')).toEqual([]);
  });
});

describe('feedback digest', () => {
  it('bundles peer, AI and teacher feedback into copyable text', () => {
    const digest = buildFeedbackDigest({
      peerReviews: [{ points: ['Tighten the opening.', 'Explain example two.'], comment: 'Enjoyed it.', total: 6 }],
      ai: { www: 'Clear thesis.', improvements: ['Add a counterargument.'] },
      teacher: { comment: 'Strong progress.', total: 7 },
      maxTotal: 8,
      averageTotal: 6.5,
    });
    expect(digest).toContain('Peer average: 6.5 / 8');
    expect(digest).toContain('Peer 1 (6/8)');
    expect(digest).toContain('Tighten the opening.');
    expect(digest).toContain('AI coach — What went well');
    expect(digest).toContain('Teacher (7/8)');
  });
});
