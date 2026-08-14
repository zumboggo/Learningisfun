import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { AssignPromptModal } from '@/components/writing/AssignPromptModal';
import {
  DEFAULT_PEER_REVIEWS_REQUIRED,
  createWritingPrompt,
  defaultRubric,
  getPromptsForClasses,
  parseRubric,
  rubricTotalPoints,
  updateWritingPromptStatus,
} from '@/services/writing.service';
import { classLabel } from '@/utils/helpers';
import type { RubricCriterion, WritingPrompt } from '@/types';

export function WritingPage() {
  const { user, isTeacher } = useAuth();
  if (!user) return null;
  return isTeacher ? <TeacherWriting /> : <StudentWriting />;
}

// ---------------------------------------------------------------------------
// Teacher
// ---------------------------------------------------------------------------

function TeacherWriting() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [assigning, setAssigning] = useState<WritingPrompt | null>(null);

  const classes = useLiveQuery(
    () => db.classes.where('teacherId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const rows = useLiveQuery(async () => {
    if (!classes?.length) return [];
    const classById = new Map(classes.map(c => [c.$id, c]));

    // One row per prompt, not per class: a prompt set for three sections is
    // still one piece of work to publish, close and mark.
    const prompts = await getPromptsForClasses(classes.map(c => c.$id));

    const result: Array<{
      prompt: WritingPrompt;
      classNames: string[];
      submitted: number;
      enrolled: number;
      reviewsDone: number;
      reviewsExpected: number;
    }> = [];

    for (const prompt of prompts) {
      const assignments = await db.writing_prompt_assignments
        .where('promptId')
        .equals(prompt.$id)
        .toArray();
      const assignedClassIds = assignments
        .map(a => a.classId)
        .filter(id => classById.has(id));

      const memberRows = assignedClassIds.length
        ? await db.class_members.where('classId').anyOf(assignedClassIds).toArray()
        : [];
      const enrolled = new Set(
        memberRows.filter(m => m.role === 'student').map(m => m.userId),
      ).size;

      const submissions = await db.writing_submissions.where('promptId').equals(prompt.$id).toArray();
      const submitted = submissions.filter(s => s.status !== 'draft').length;
      const reviews = await db.peer_reviews.where('promptId').equals(prompt.$id).toArray();

      result.push({
        prompt,
        classNames: assignedClassIds.map(id => classLabel(classById.get(id))),
        submitted,
        enrolled,
        reviewsDone: reviews.filter(r => r.status === 'submitted').length,
        reviewsExpected: submitted * prompt.peerReviewsRequired,
      });
    }

    return result;
  }, [classes]);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Writing</h1>
          <p className="text-gray-500 text-sm">
            Set a prompt, let students mark each other against your rubric, then add your own comments.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!classes?.length}>
          New prompt
        </Button>
      </div>

      {rows && rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map(row => (
            <Card key={row.prompt.$id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/writing/${row.prompt.$id}/responses`}
                    className="font-semibold hover:text-blue-700"
                  >
                    {row.prompt.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {row.classNames.length > 0 ? row.classNames.join(', ') : 'Not set for a class yet'} ·{' '}
                    {row.prompt.peerReviewsRequired} peer reviews each ·{' '}
                    {rubricTotalPoints(parseRubric(row.prompt.rubricJson))} points
                  </p>
                </div>
                <StatusBadge status={row.prompt.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>{row.submitted}/{row.enrolled} submitted</span>
                <span>{row.reviewsDone}/{row.reviewsExpected} peer reviews done</span>
                {row.prompt.dueAt && (
                  <span className="text-xs text-gray-400">
                    Due {new Date(row.prompt.dueAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/writing/${row.prompt.$id}/responses`}>
                  <Button size="sm" variant="secondary">View responses</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => setAssigning(row.prompt)}>
                  Add to class/es
                </Button>
                {row.prompt.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => void updateWritingPromptStatus(row.prompt.$id, 'published', user!.$id)}
                  >
                    Publish
                  </Button>
                )}
                {row.prompt.status === 'published' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void updateWritingPromptStatus(row.prompt.$id, 'closed', user!.$id)}
                  >
                    Close
                  </Button>
                )}
                {row.prompt.status === 'closed' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void updateWritingPromptStatus(row.prompt.$id, 'published', user!.$id)}
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No writing prompts yet"
          message={
            classes?.length
              ? 'Create a prompt and your students can draft, review each other and revise in one place.'
              : 'Create a class first, then you can set writing prompts for it.'
          }
          action={
            classes?.length
              ? <Button onClick={() => setShowCreate(true)}>Create your first prompt</Button>
              : <Link to="/classes/new"><Button>Create a class</Button></Link>
          }
        />
      )}

      {showCreate && classes && (
        <CreatePromptModal
          classes={classes.map(c => ({ id: c.$id, label: classLabel(c) }))}
          onClose={() => setShowCreate(false)}
        />
      )}

      <AssignPromptModal
        prompt={assigning}
        teacherId={user!.$id}
        onClose={() => setAssigning(null)}
      />
    </div>
  );
}

function CreatePromptModal({
  classes,
  onClose,
}: {
  classes: Array<{ id: string; label: string }>;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [classIds, setClassIds] = useState<Set<string>>(
    () => new Set(classes.length === 1 ? [classes[0].id] : []),
  );
  const [title, setTitle] = useState('');
  const [promptMarkdown, setPromptMarkdown] = useState('');
  const [instructions, setInstructions] = useState('');
  const [minWords, setMinWords] = useState(150);
  const [peerReviewsRequired, setPeerReviewsRequired] = useState(DEFAULT_PEER_REVIEWS_REQUIRED);
  const [dueAt, setDueAt] = useState('');
  const [aiFeedbackEnabled, setAiFeedbackEnabled] = useState(true);
  const [rubric, setRubric] = useState<RubricCriterion[]>(defaultRubric());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateCriterion = (index: number, patch: Partial<RubricCriterion>) => {
    setRubric(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const updateLevel = (criterionIndex: number, levelIndex: number, descriptor: string) => {
    setRubric(prev =>
      prev.map((c, i) =>
        i === criterionIndex
          ? { ...c, levels: c.levels.map((l, j) => (j === levelIndex ? { ...l, descriptor } : l)) }
          : c,
      ),
    );
  };

  const addCriterion = () => {
    setRubric(prev => [
      ...prev,
      {
        id: `criterion-${Date.now()}`,
        name: 'New criterion',
        description: '',
        maxPoints: 4,
        levels: [
          { points: 4, label: 'Excellent', descriptor: '' },
          { points: 3, label: 'Good', descriptor: '' },
          { points: 2, label: 'Developing', descriptor: '' },
          { points: 1, label: 'Beginning', descriptor: '' },
        ],
      },
    ]);
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!title.trim()) { setError('Give the prompt a title.'); return; }
    if (!promptMarkdown.trim()) { setError('Write the prompt students will answer.'); return; }
    if (!rubric.length) { setError('A rubric needs at least one criterion.'); return; }

    setSaving(true);
    setError('');
    try {
      await createWritingPrompt({
        classIds: [...classIds],
        teacherId: user.$id,
        title: title.trim(),
        promptMarkdown: promptMarkdown.trim(),
        instructions: instructions.trim(),
        rubric,
        peerReviewsRequired,
        minWords,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        aiFeedbackEnabled,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the prompt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New writing prompt">
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Classes</label>
          <div className="space-y-1.5 rounded-lg border border-gray-200 p-3">
            {classes.map(c => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={classIds.has(c.id)}
                  onChange={() => setClassIds(prev => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })}
                  className="rounded"
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Pick as many as you like, or none — you can add classes later with "Add to class/es".
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Persuasive essay: school uniforms"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Prompt</label>
          <textarea
            value={promptMarkdown}
            onChange={e => setPromptMarkdown(e.target.value)}
            rows={4}
            placeholder="What should students write about?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Instructions <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={2}
            placeholder="Length, format, what to focus on…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Minimum words</label>
            <input
              type="number"
              min={0}
              value={minWords}
              onChange={e => setMinWords(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Peer reviews required</label>
            <select
              value={peerReviewsRequired}
              onChange={e => setPeerReviewsRequired(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Due date <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            value={dueAt}
            onChange={e => setDueAt(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={aiFeedbackEnabled}
            onChange={e => setAiFeedbackEnabled(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-gray-800">Let students request AI feedback</span>
            <span className="block text-xs text-gray-500">
              Uses your OpenRouter key from Settings. Returns three actionable next steps and a
              "what went well" summary — never a grade.
            </span>
          </span>
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Rubric</h3>
              <p className="text-xs text-gray-500">
                {rubric.length} criteria · {rubricTotalPoints(rubric)} points total
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={addCriterion}>Add criterion</Button>
          </div>

          {rubric.map((criterion, index) => (
            <div key={criterion.id} className="space-y-2 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={criterion.name}
                  onChange={e => updateCriterion(index, { name: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setRubric(prev => prev.filter((_, i) => i !== index))}
                  className="px-2 text-sm text-gray-400 hover:text-red-600"
                  aria-label={`Remove ${criterion.name}`}
                >
                  Remove
                </button>
              </div>
              <input
                value={criterion.description}
                onChange={e => updateCriterion(index, { description: e.target.value })}
                placeholder="What this criterion is looking for"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
              />
              <details>
                <summary className="cursor-pointer text-xs text-blue-600">Edit level descriptors</summary>
                <div className="mt-2 space-y-1.5">
                  {criterion.levels.map((level, levelIndex) => (
                    <div key={level.points} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-xs text-gray-500">
                        {level.points} · {level.label}
                      </span>
                      <input
                        value={level.descriptor}
                        onChange={e => updateLevel(index, levelIndex, e.target.value)}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>

        <Button onClick={() => void handleCreate()} loading={saving} className="w-full">
          Create prompt
        </Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

function StudentWriting() {
  const { user } = useAuth();

  const memberships = useLiveQuery(
    () => db.class_members.where('userId').equals(user!.$id).toArray(),
    [user?.$id],
  );

  const rows = useLiveQuery(async () => {
    if (!memberships?.length) return [];
    const result: Array<{
      prompt: WritingPrompt;
      className: string;
      wordCount: number;
      submitted: boolean;
      reviewsDone: number;
      hasFinal: boolean;
    }> = [];

    // A prompt set for several of the student's classes should still show once.
    const seen = new Set<string>();

    for (const membership of memberships) {
      const cls = await db.classes.get(membership.classId);
      const prompts = (await getPromptsForClasses([membership.classId]))
        .filter(p => p.status !== 'draft');

      for (const prompt of prompts) {
        if (seen.has(prompt.$id)) continue;
        seen.add(prompt.$id);

        const submission = await db.writing_submissions
          .where('promptId')
          .equals(prompt.$id)
          .and(s => s.authorId === user!.$id)
          .first();
        const reviews = await db.peer_reviews
          .where('promptId')
          .equals(prompt.$id)
          .and(r => r.reviewerId === user!.$id && r.status === 'submitted')
          .toArray();

        result.push({
          prompt,
          className: classLabel(cls),
          wordCount: submission?.wordCount || 0,
          submitted: submission?.status !== undefined && submission.status !== 'draft',
          reviewsDone: reviews.length,
          hasFinal: Boolean(submission?.finalMarkdown),
        });
      }
    }

    return result.sort((a, b) => b.prompt.createdAt.localeCompare(a.prompt.createdAt));
  }, [memberships]);

  return (
    <div className="student-page space-y-5 p-4">
      <header>
        <h1 className="text-2xl font-bold">Writing</h1>
        <p className="text-sm text-gray-500">
          Write, review three classmates, then unlock the feedback on your own piece.
        </p>
      </header>

      {rows && rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map(row => {
            const stage = !row.submitted
              ? 'Draft'
              : row.reviewsDone < row.prompt.peerReviewsRequired
                ? `${row.reviewsDone}/${row.prompt.peerReviewsRequired} reviews given`
                : row.hasFinal
                  ? 'Final version ready'
                  : 'Feedback unlocked';

            return (
              <Card key={row.prompt.$id}>
                <Link to={`/writing/${row.prompt.$id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{row.prompt.title}</h3>
                      <p className="text-sm text-gray-500">{row.className}</p>
                    </div>
                    <StatusBadge
                      status={stage}
                      tone={
                        row.hasFinal ? 'green'
                          : row.reviewsDone >= row.prompt.peerReviewsRequired ? 'blue'
                            : row.submitted ? 'orange'
                              : 'gray'
                      }
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>{row.wordCount} words written</span>
                    {row.prompt.minWords > 0 && <span>Target: {row.prompt.minWords}+</span>}
                    {row.prompt.dueAt && (
                      <span>Due {new Date(row.prompt.dueAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No writing prompts yet"
          message="When your teacher sets a writing task it will appear here."
        />
      )}
    </div>
  );
}
