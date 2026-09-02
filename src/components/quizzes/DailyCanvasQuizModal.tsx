import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import {
  previewDailyQuiz,
  commitDailyQuiz,
  downloadBundle,
  formatDayKey,
  DEFAULT_DAILY_QUIZ_CONFIG,
  type DailyQuizConfig,
  type DailyQuizPreview,
} from '@/services/daily-quiz.service';
import { db } from '@/db/schema';

const COURSE_ID_KEY = 'canvas_course_id';
const GROUP_ID_KEY = 'canvas_assignment_group_id';

/**
 * Builds the day's quiz from the class's flashcards and hands you a JSON bundle
 * to push to Canvas with `npm run canvas:push`.
 *
 * The push is a separate local step by necessity: this app is a static site, and
 * Canvas's API neither allows browser cross-origin calls nor tolerates its token
 * being stored client-side. See daily-quiz.service.ts.
 */
export function DailyCanvasQuizModal({
  classes,
  userId,
  onClose,
}: {
  classes: Array<{ id: string; name: string }>;
  userId: string;
  onClose: () => void;
}) {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [quizDate, setQuizDate] = useState(formatDayKey(new Date()));
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [questionCount, setQuestionCount] = useState(DEFAULT_DAILY_QUIZ_CONFIG.questionCount);
  const [todayWeight, setTodayWeight] = useState(DEFAULT_DAILY_QUIZ_CONFIG.todayWeight);
  const [mcWeight, setMcWeight] = useState(DEFAULT_DAILY_QUIZ_CONFIG.multipleChoiceWeight);
  const [halfLife, setHalfLife] = useState(DEFAULT_DAILY_QUIZ_CONFIG.recencyHalfLifeDays);
  const [timeLimit, setTimeLimit] = useState<number | null>(DEFAULT_DAILY_QUIZ_CONFIG.timeLimitMinutes);
  const [attempts, setAttempts] = useState(DEFAULT_DAILY_QUIZ_CONFIG.allowedAttempts);

  const [step, setStep] = useState<'config' | 'review' | 'done'>('config');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<DailyQuizPreview | null>(null);
  const [downloadedFile, setDownloadedFile] = useState('');

  // Neither id is secret and neither changes day to day, so remember both.
  useEffect(() => {
    void db.app_metadata.get(COURSE_ID_KEY).then(entry => {
      if (entry?.value) setCourseId(entry.value);
    });
    void db.app_metadata.get(GROUP_ID_KEY).then(entry => {
      if (entry?.value) setGroupId(entry.value);
    });
  }, []);

  const buildConfig = (): DailyQuizConfig => ({
    classId,
    quizDate: parseLocalDate(quizDate),
    title,
    questionCount,
    todayWeight,
    multipleChoiceWeight: mcWeight,
    recencyHalfLifeDays: halfLife,
    pointsPerQuestion: 1,
    timeLimitMinutes: timeLimit,
    allowedAttempts: attempts,
    canvasCourseId: Number(courseId),
    canvasAssignmentGroupId: groupId.trim() ? Number(groupId) : null,
    // <input type="datetime-local"> has no zone; Canvas wants ISO 8601.
    dueAt: dueAt ? new Date(dueAt).toISOString() : null,
  });

  const handlePreview = async () => {
    setBusy(true);
    setError('');
    try {
      if (!classId) throw new Error('Pick a class first.');
      if (!/^\d+$/.test(courseId.trim())) {
        throw new Error('Canvas course ID must be the number from your course URL (/courses/12345).');
      }
      if (groupId.trim() && !/^\d+$/.test(groupId.trim())) {
        throw new Error('Assignment group ID must be a number, or left blank.');
      }
      await db.app_metadata.put({ key: COURSE_ID_KEY, value: courseId.trim() });
      await db.app_metadata.put({ key: GROUP_ID_KEY, value: groupId.trim() });
      setPreview(await previewDailyQuiz(buildConfig()));
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the quiz.');
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setBusy(true);
    setError('');
    try {
      const { bundle } = await commitDailyQuiz(preview, buildConfig(), userId);
      setDownloadedFile(downloadBundle(bundle));
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the quiz.');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done') {
    return (
      <Modal open onClose={onClose} title="Ready to push to Canvas">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Saved <span className="font-medium">{downloadedFile}</span> to your downloads folder.
            Run this from the <code className="bg-gray-100 px-1 rounded">edu-spark</code> folder:
          </p>
          <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-lg overflow-x-auto">
{`npm run canvas:push -- "%USERPROFILE%\\Downloads\\${downloadedFile}" --dry-run`}
          </pre>
          <p className="text-sm text-gray-600">
            That prints what would be sent without touching Canvas. Drop <code className="bg-gray-100 px-1 rounded">--dry-run</code> to
            create the quiz (unpublished), then add <code className="bg-gray-100 px-1 rounded">--publish</code> once it looks right.
          </p>
          <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg">
            First time only: copy <code>.env.canvas.example</code> to <code>.env.canvas.local</code> and add your Canvas token.
          </div>
          <Button onClick={onClose} className="w-full">Done</Button>
        </div>
      </Modal>
    );
  }

  if (step === 'review' && preview) {
    const { summary } = preview.result;
    return (
      <Modal open onClose={onClose} title="Review daily quiz">
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800">{preview.settings.title}</p>
            <p>
              {summary.totalPoints} points · {summary.fromToday} current-card prompts, {summary.fromReview} review prompts ·{' '}
              {summary.multipleChoice} multiple choice, {summary.matchingPairs} matches in {summary.matchingBlocks} blocks
            </p>
            <p className="text-xs text-gray-400">
              Card pool: {preview.pools.today} added on {preview.settings.quizDate}, {preview.pools.review} older
            </p>
          </div>

          {summary.produced < summary.requested && (
            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg">
              Asked for {summary.requested} questions but only {summary.produced} could be built.
              {summary.skipped.length > 0 && (
                <ul className="mt-1 list-disc list-inside">
                  {summary.skipped.map(s => (
                    <li key={s.cardId}>{s.front} — {s.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {preview.result.questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">Q{i + 1}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {q.type === 'mc' ? 'Multiple Choice' : q.type === 'matching' ? 'Matching' : 'Fill in the blank'}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  {q.bucket === 'today' ? 'today' : 'review'}
                </span>
              </div>
              <p className="text-sm font-medium whitespace-pre-line">{q.questionText}</p>
              {q.type === 'mc' && (
                <ul className="text-sm text-gray-600 space-y-1">
                  {q.options.map((opt, j) => (
                    <li key={j} className={j === q.correctIndex ? 'text-green-600 font-medium' : ''}>
                      {String.fromCharCode(65 + j)}. {opt}{j === q.correctIndex && ' ✓'}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === 'cloze' && q.cloze && (
                <div className="text-sm">
                  <p className="text-green-600 font-medium">Answer: {q.cloze.primary}</p>
                  {q.cloze.variants.length > 0 && (
                    <p className="text-xs text-gray-500">Also accepted: {q.cloze.variants.join(', ')}</p>
                  )}
                </div>
              )}
              {q.type === 'matching' && q.matching && <div className="space-y-1 text-sm">{q.matching.pairs.map(pair => <p key={pair.id}><span className="text-gray-600">{pair.definition}</span> → <strong className="text-green-700">{pair.term}</strong></p>)}<p className="text-xs text-gray-400">Unused term: {q.matching.distractorTerms.join(', ')}</p></div>}
            </div>
          ))}

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white">
            <Button onClick={handleCommit} loading={busy}>Save &amp; download for Canvas</Button>
            <Button onClick={() => setStep('config')} variant="secondary">Back</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Daily Canvas quiz">
      <div className="space-y-4 max-h-[70vh] overflow-auto">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Class">
            <select value={classId} onChange={e => setClassId(e.target.value)} className={inputClass}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Quiz date">
            <input type="date" value={quizDate} onChange={e => setQuizDate(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Title (optional)">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Defaults to “Class — Daily Quiz <date>”"
            className={inputClass}
          />
        </Field>

        <Field label="Canvas course ID">
          <input
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            placeholder="12345"
            inputMode="numeric"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">The number in your Canvas course URL: /courses/<b>12345</b></p>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignment group ID (optional)">
            <input
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              placeholder="e.g. 92409"
              inputMode="numeric"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              Blank files it under the course’s first group — often not your Quizzes group.
            </p>
          </Field>
          <Field label="Due date (optional)">
            <input
              type="datetime-local"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Puts it on students’ to-do lists and calendars.</p>
          </Field>
        </div>

        <Field label={`Source mix: ${todayWeight}% today’s cards / ${100 - todayWeight}% earlier review`}>
          <input
            type="range" min={0} max={100} step={10}
            value={todayWeight} onChange={e => setTodayWeight(Number(e.target.value))}
            className="w-full"
          />
        </Field>

        <Field label="Question types">
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">About half the points are multiple choice; the other half are definition-to-term matching.</p>
        </Field>

        <Field label={`Review recency: half-weight after ${halfLife} days`}>
          <input
            type="range" min={3} max={60} step={1}
            value={halfLife} onChange={e => setHalfLife(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">Lower favours what you taught recently; higher spreads across the term.</p>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Total points">
            <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className={inputClass}>
              {[3, 5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Time limit">
            <select
              value={timeLimit ?? 0}
              onChange={e => setTimeLimit(Number(e.target.value) || null)}
              className={inputClass}
            >
              <option value={0}>None</option>
              {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} min</option>)}
            </select>
          </Field>
          <Field label="Attempts">
            <select value={attempts} onChange={e => setAttempts(Number(e.target.value))} className={inputClass}>
              {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        </div>

        <Button onClick={handlePreview} loading={busy} className="w-full">Preview quiz</Button>
      </div>
    </Modal>
  );
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

/** `<input type="date">` gives `YYYY-MM-DD`; parse it as local midnight, not UTC. */
function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
