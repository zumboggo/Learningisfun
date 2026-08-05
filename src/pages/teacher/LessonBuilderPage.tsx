import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { MarkdownToolbar } from '@/components/common/MarkdownToolbar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { buildLesson, previewVocabCsv } from '@/services/lesson-builder.service';
import { todayKey } from '@/services/class-session.service';
import type { CsvMapping, CsvPreview } from '@/types';
import { useRef } from 'react';

export function LessonBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [lessonDate, setLessonDate] = useState(todayKey());
  const [content, setContent] = useState('');
  const [contentFormat, setContentFormat] = useState<'plain' | 'markdown'>('plain');
  const [promptMarkdown, setPromptMarkdown] = useState('');
  const [discussionGoalsMarkdown, setDiscussionGoalsMarkdown] = useState('');
  const [minResponseWords, setMinResponseWords] = useState(200);
  const [votesPerStudent, setVotesPerStudent] = useState(4);
  const [allowStackedVotes, setAllowStackedVotes] = useState(false);
  const [vocabFile, setVocabFile] = useState<File | null>(null);
  const [vocabPreview, setVocabPreview] = useState<CsvPreview | null>(null);
  const [vocabMapping, setVocabMapping] = useState<CsvMapping | null>(null);
  const [dailyTarget, setDailyTarget] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const goalsRef = useRef<HTMLTextAreaElement>(null);

  const classes = useLiveQuery(
    () => (user ? db.classes.where('teacherId').equals(user.$id).toArray() : []),
    [user?.$id],
  );

  const selectedClass = classes?.find(cls => cls.$id === classId);

  const handleVocabFile = async (file: File) => {
    setVocabFile(file);
    const { preview, mapping } = await previewVocabCsv(file);
    setVocabPreview(preview);
    setVocabMapping(mapping);
  };

  const refreshPreviewMapping = async (mapping: CsvMapping) => {
    if (!vocabFile) return;
    setVocabMapping(mapping);
    const { preview } = await previewVocabCsv(vocabFile, mapping);
    setVocabPreview(preview);
  };

  const handleBuild = async () => {
    if (!user || !classId || !title.trim() || !content.trim()) return;
    setSaving(true);
    setError('');
    try {
      const result = await buildLesson({
        teacherId: user.$id,
        classId,
        title: title.trim(),
        author,
        description,
        lessonDate,
        content,
        contentFormat,
        promptMarkdown,
        minResponseWords,
        votesPerStudent,
        allowStackedVotes,
        discussionGoalsMarkdown,
        vocabFile,
        vocabMapping,
        vocabDeckTitle: `${title.trim()} Vocabulary`,
        dailyTarget,
      });
      navigate(`/sessions/${result.session.$id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build lesson');
    } finally {
      setSaving(false);
    }
  };

  if (classes && classes.length === 0) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <EmptyState
          title="Create a class first"
          message="A lesson needs a class so the app knows where to assign the text, prompt, vocab, and class period."
          action={<Button onClick={() => navigate('/classes/new')}>Create class</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">New lesson</h1>
          <p className="text-sm text-gray-500">Paste a text, add the writing prompt, import vocab, and start the class period in one flow.</p>
        </div>
        <Button onClick={() => void handleBuild()} loading={saving} disabled={!classId || !title.trim() || !content.trim()}>
          Create lesson
        </Button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-4">Lesson basics</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Class">
                <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5">
                  <option value="">Choose class</option>
                  {classes?.map(cls => <option key={cls.$id} value={cls.$id}>{cls.name}</option>)}
                </select>
              </Field>
              <Field label="Lesson date">
                <input type="date" value={lessonDate} onChange={e => setLessonDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
              </Field>
              <Field label="Title">
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
              </Field>
              <Field label="Author">
                <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
              </Field>
            </div>
            <Field label="Short description" className="mt-4">
              <input value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
            </Field>
          </Card>

          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Lesson text</h2>
              <div className="flex rounded-lg bg-gray-100 p-1">
                <ModeButton active={contentFormat === 'plain'} onClick={() => setContentFormat('plain')}>Plain</ModeButton>
                <ModeButton active={contentFormat === 'markdown'} onClick={() => setContentFormat('markdown')}>Markdown</ModeButton>
              </div>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
              placeholder="Paste the lesson text or article here. Blank lines split it into teachable paragraphs."
            />
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">Prompt and discussion goals</h2>
            <Field label="Writing prompt">
              <MarkdownToolbar textareaRef={promptRef} value={promptMarkdown} onChange={setPromptMarkdown} />
              <textarea ref={promptRef} value={promptMarkdown} onChange={e => setPromptMarkdown(e.target.value)} rows={5} className="w-full rounded-b-lg border border-gray-300 px-3 py-2 font-mono text-sm" />
            </Field>
            <Field label="Teacher discussion goals" className="mt-4">
              <MarkdownToolbar textareaRef={goalsRef} value={discussionGoalsMarkdown} onChange={setDiscussionGoalsMarkdown} />
              <textarea ref={goalsRef} value={discussionGoalsMarkdown} onChange={e => setDiscussionGoalsMarkdown(e.target.value)} rows={5} className="w-full rounded-b-lg border border-gray-300 px-3 py-2 font-mono text-sm" />
            </Field>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Word minimum">
                <input type="number" min={0} value={minResponseWords} onChange={e => setMinResponseWords(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
              </Field>
              <Field label="Votes each">
                <input type="number" min={0} max={20} value={votesPerStudent} onChange={e => setVotesPerStudent(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
              </Field>
              <label className="mt-7 flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={allowStackedVotes} onChange={e => setAllowStackedVotes(e.target.checked)} />
                Allow stacked votes
              </label>
            </div>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Vocab CSV</h2>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) void handleVocabFile(file);
              }}
              className="w-full text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">Supports front/back, term/definition, word/meaning, question/answer, plus hint/tags/source.</p>

            {vocabPreview && vocabMapping && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <SummaryStat label="Cards" value={vocabPreview.rows.length} />
                  <SummaryStat label="Duplicates" value={vocabPreview.duplicates} />
                  <SummaryStat label="Invalid" value={vocabPreview.invalidRows} />
                  <SummaryStat label="Blank" value={vocabPreview.emptyRows} />
                </div>
                <VocabMappingControls mapping={vocabMapping} headers={vocabPreview.headers} onChange={mapping => void refreshPreviewMapping(mapping)} />
                <Field label="Daily target">
                  <input type="number" min={0} value={dailyTarget} onChange={e => setDailyTarget(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                </Field>
                <div className="rounded-lg border border-gray-200">
                  <div className="border-b bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">Sample cards</div>
                  {vocabPreview.rows.slice(0, 5).map((row, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 border-b px-3 py-2 text-sm last:border-b-0">
                      <span className="truncate">{row[vocabMapping.front]}</span>
                      <span className="truncate text-gray-500">{row[vocabMapping.back]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">What this creates</h2>
            <div className="space-y-2 text-sm">
              <CreationItem done={Boolean(selectedClass)} label={selectedClass ? `Assign to ${selectedClass.name}` : 'Choose a class'} />
              <CreationItem done={Boolean(title && content)} label="Reading text" />
              <CreationItem done={Boolean(promptMarkdown.trim())} label="Writing prompt" />
              <CreationItem done={Boolean(vocabPreview?.rows.length)} label="Vocab flashcard deck" />
              <CreationItem done label="Question board and class period" />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-md px-3 py-1.5 text-sm ${active ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>
      {children}
    </button>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function CreationItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <StatusBadge status={done ? 'ready' : 'draft'} label={done ? 'Ready' : 'Needed'} />
    </div>
  );
}

function VocabMappingControls({
  mapping,
  headers,
  onChange,
}: {
  mapping: CsvMapping;
  headers: string[];
  onChange: (mapping: CsvMapping) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MappingSelect label="Front" value={mapping.front} headers={headers} onChange={value => onChange({ ...mapping, front: value })} />
      <MappingSelect label="Back" value={mapping.back} headers={headers} onChange={value => onChange({ ...mapping, back: value })} />
      <MappingSelect label="Hint" value={mapping.hint || ''} headers={headers} optional onChange={value => onChange({ ...mapping, hint: value || undefined })} />
      <MappingSelect label="Tags" value={mapping.tags || ''} headers={headers} optional onChange={value => onChange({ ...mapping, tags: value || undefined })} />
      <MappingSelect label="Source" value={mapping.source || ''} headers={headers} optional onChange={value => onChange({ ...mapping, source: value || undefined })} />
    </div>
  );
}

function MappingSelect({
  label,
  value,
  headers,
  optional = false,
  onChange,
}: {
  label: string;
  value: string;
  headers: string[];
  optional?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
        {optional && <option value="">None</option>}
        {headers.map(header => <option key={header} value={header}>{header}</option>)}
      </select>
    </label>
  );
}
