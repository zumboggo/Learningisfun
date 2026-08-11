import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { defaultRubric } from '@/services/writing.service';
import type { PeerReview, WritingPrompt, WritingSubmission } from '@/types';

const rubric = defaultRubric();

const prompt: WritingPrompt = {
  $id: 'prompt-1',
  classId: 'class-1',
  teacherId: 'teacher-1',
  title: 'Persuasive essay: school uniforms',
  promptMarkdown: 'Should students wear uniforms?',
  instructions: 'At least three paragraphs.',
  rubricJson: JSON.stringify(rubric),
  peerReviewsRequired: 3,
  minWords: 10,
  dueAt: null,
  status: 'published',
  aiFeedbackEnabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  syncStatus: 'local',
};

const mySubmission: WritingSubmission = {
  $id: 'sub-alice',
  promptId: 'prompt-1',
  classId: 'class-1',
  authorId: 'alice',
  anonymousLabel: 'Writer K42',
  draftMarkdown: 'My essay about uniforms.',
  submittedMarkdown: 'My essay about uniforms.',
  wordCount: 4,
  status: 'submitted',
  submittedAt: '2026-01-02T00:00:00.000Z',
  finalMarkdown: '',
  finalUpdatedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  syncStatus: 'local',
};

const peerSubmission: WritingSubmission = {
  ...mySubmission,
  $id: 'sub-bob',
  authorId: 'bob',
  anonymousLabel: 'Writer T17',
  submittedMarkdown: 'Uniforms save time in the morning.',
};

const fullScores = JSON.stringify(
  Object.fromEntries(rubric.map(c => [c.id, 3])),
);

function submittedReview(id: string, reviewerId: string, submissionId: string): PeerReview {
  return {
    $id: id,
    promptId: 'prompt-1',
    submissionId,
    reviewerId,
    scoresJson: fullScores,
    feedbackPointsJson: JSON.stringify([
      `Point one from ${reviewerId}`,
      `Point two from ${reviewerId}`,
      `Point three from ${reviewerId}`,
    ]),
    additionalComment: `Extra thoughts from ${reviewerId}`,
    status: 'submitted',
    assignedAt: '2026-01-03T00:00:00.000Z',
    submittedAt: `2026-01-03T0${id.slice(-1)}:00:00.000Z`,
    syncStatus: 'local',
  };
}

// Mutable fixtures the fake Dexie reads from, reset per test.
let submissions: WritingSubmission[] = [];
let peerReviews: PeerReview[] = [];

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { $id: 'alice', name: 'Alice Chen' }, isTeacher: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useParams: () => ({ promptId: 'prompt-1' }) };
});

/** Minimal stand-in for the Dexie query chain the workspace page uses. */
function fakeTable<T extends { $id: string }>(getRows: () => T[]) {
  const query = (rows: T[]) => ({
    and: (fn: (row: T) => boolean) => query(rows.filter(fn)),
    toArray: () => Promise.resolve(rows),
    first: () => Promise.resolve(rows[0]),
  });
  return {
    get: (id: string) => Promise.resolve(getRows().find(r => r.$id === id)),
    where: (field: string) => ({
      equals: (value: unknown) =>
        query(getRows().filter(r => (r as unknown as Record<string, unknown>)[field] === value)),
    }),
  };
}

vi.mock('@/db/schema', () => ({
  db: {
    writing_prompts: fakeTable(() => [prompt]),
    writing_submissions: fakeTable(() => submissions),
    peer_reviews: fakeTable(() => peerReviews),
    writing_ai_feedback: fakeTable(() => []),
    teacher_writing_feedback: fakeTable(() => []),
  },
}));

vi.mock('dexie-react-hooks', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    useLiveQuery: (fn: () => unknown, deps: unknown[] = []) => {
      const [value, setValue] = React.useState<unknown>(undefined);
      React.useEffect(() => {
        let cancelled = false;
        void Promise.resolve(fn()).then(resolved => {
          if (!cancelled) setValue(resolved);
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, deps);
      return value;
    },
  };
});

const ensureReviewAssignments = vi.fn(() => Promise.resolve(peerReviews.filter(r => r.reviewerId === 'alice')));

vi.mock('@/services/writing.service', async () => {
  const actual = await vi.importActual<typeof import('@/services/writing.service')>('@/services/writing.service');
  return {
    ...actual,
    getOrCreateSubmission: () => Promise.resolve(mySubmission),
    ensureReviewAssignments: (...args: unknown[]) => ensureReviewAssignments(...(args as [])),
    saveDraft: () => Promise.resolve(),
    saveReviewDraft: () => Promise.resolve(),
    saveFinalVersion: () => Promise.resolve(),
    submitReview: () => Promise.resolve(),
    generateAiFeedbackForSubmission: () => Promise.resolve(),
  };
});

const { WritingWorkspacePage } = await import('@/pages/WritingWorkspacePage');

function renderPage() {
  return render(
    <MemoryRouter>
      <WritingWorkspacePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  submissions = [mySubmission, peerSubmission];
  peerReviews = [];
  ensureReviewAssignments.mockClear();
});

describe('Writing workspace', () => {
  it('keeps feedback sealed until the reviewer has done their share', async () => {
    peerReviews = [
      submittedReview('rev-1', 'alice', 'sub-bob'),
      submittedReview('rev-9', 'bob', 'sub-alice'),
    ];

    renderPage();
    await screen.findByRole('heading', { name: prompt.title });

    await userEvent.click(screen.getByRole('tab', { name: /My feedback/ }));

    expect(await screen.findByText('Your feedback is waiting')).toBeInTheDocument();
    expect(screen.getByText(/Give 2 more careful reviews/)).toBeInTheDocument();
    // Bob has already reviewed Alice, but she must not see any of it yet.
    expect(screen.queryByText('Point one from bob')).not.toBeInTheDocument();
  });

  it('shows every mark and the average once the quota is met', async () => {
    peerReviews = [
      submittedReview('rev-1', 'alice', 'sub-bob'),
      submittedReview('rev-2', 'alice', 'sub-cara'),
      submittedReview('rev-3', 'alice', 'sub-dan'),
      submittedReview('rev-4', 'bob', 'sub-alice'),
      submittedReview('rev-5', 'cara', 'sub-alice'),
      submittedReview('rev-6', 'dan', 'sub-alice'),
    ];

    renderPage();
    await screen.findByRole('heading', { name: prompt.title });

    await userEvent.click(screen.getByRole('tab', { name: /My feedback/ }));

    expect(await screen.findByText('What your classmates gave you')).toBeInTheDocument();

    // Three markers, each 3 points on five criteria = 15/20, average 15.
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('Peer 1');
    expect(table).toHaveTextContent('Peer 3');
    expect(table).toHaveTextContent('15/20');

    expect(screen.getByText('Point one from bob')).toBeInTheDocument();
    expect(screen.getByText('Extra thoughts from cara')).toBeInTheDocument();
  });

  it('never names the reviewers who marked the student', async () => {
    peerReviews = [
      submittedReview('rev-1', 'alice', 'sub-bob'),
      submittedReview('rev-2', 'alice', 'sub-cara'),
      submittedReview('rev-3', 'alice', 'sub-dan'),
      submittedReview('rev-4', 'bob', 'sub-alice'),
    ];

    renderPage();
    await screen.findByRole('heading', { name: prompt.title });
    await userEvent.click(screen.getByRole('tab', { name: /My feedback/ }));

    // "Peer 1" appears both as a score-table column and as the feedback heading.
    await waitFor(() => expect(screen.getAllByText('Peer 1').length).toBeGreaterThan(0));

    // The only trace of the reviewer is the text they wrote — never an
    // attribution, a heading, or a column label carrying their identity.
    const mentions = screen.getAllByText(/bob/i).map(el => el.textContent || '');
    expect(mentions).toHaveLength(4);
    for (const mention of mentions) {
      expect(mention).toMatch(/(Point (one|two|three)|Extra thoughts) from bob$/);
    }
    // The optional comment is attributed to the pseudonym, not the writer.
    expect(mentions[3]).toContain('More from Peer 1');
    expect(screen.queryByText(/reviewed by/i)).not.toBeInTheDocument();
  });

  it('shows a classmate by pseudonym when reviewing their work', async () => {
    peerReviews = [
      {
        ...submittedReview('rev-1', 'alice', 'sub-bob'),
        status: 'assigned',
        submittedAt: null,
        scoresJson: '{}',
        feedbackPointsJson: '["","",""]',
        additionalComment: '',
      },
    ];

    renderPage();
    await screen.findByRole('heading', { name: prompt.title });
    await userEvent.click(screen.getByRole('tab', { name: /Review peers/ }));

    await waitFor(() => expect(ensureReviewAssignments).toHaveBeenCalledWith('prompt-1', 'alice'));
    expect(await screen.findByText(/Writer T17/)).toBeInTheDocument();
    expect(screen.queryByText(/bob/i)).not.toBeInTheDocument();
  });

  it('blocks the review tab until the student has submitted their own writing', async () => {
    submissions = [{ ...mySubmission, status: 'draft', submittedAt: null }, peerSubmission];

    renderPage();
    await screen.findByRole('heading', { name: prompt.title });
    await userEvent.click(screen.getByRole('tab', { name: /Review peers/ }));

    expect(await screen.findByText('Submit your own writing first')).toBeInTheDocument();
  });
});
