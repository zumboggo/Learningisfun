import { useLayoutEffect, useRef, useState } from 'react';
import { executeLearningContent } from '@/services/learning-content.service';
import type { WeeklyPlanData } from '@/services/planner.service';
import { attachVocabPresentation, vocabPresentationClassIds, vocabPresentationCourses } from '@/services/planner-vocab-presentations';

export function PlannerVocabUploads({ data, onChange }: { data: WeeklyPlanData; onChange: (data: WeeklyPlanData) => void }) {
  const latest = useRef({ data, onChange });
  useLayoutEffect(() => { latest.current = { data, onChange }; }, [data, onChange]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const upload = async (course: string, label: string, file?: File) => {
    if (!file) return;
    setBusy(course); setError(''); setMessage('');
    try {
      if (!/\.pptx?$/i.test(file.name) || file.size > 10 * 1024 * 1024) throw new Error('Choose a .ppt or .pptx file up to 10 MB.');
      const encoded = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read the presentation.'));
        reader.readAsDataURL(file);
      });
      const result = await executeLearningContent<{ url: string }>({ action: 'uploadPlannerPresentation', title: `Vocab Presentation · ${label}`, name: file.name, data: encoded });
      latest.current.onChange(attachVocabPresentation(latest.current.data, course, result.url));
      setMessage(`${label}: ${file.name} attached. Use Share with students to make it available in the mapped classes.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Upload failed. Please try again.'); }
    finally { setBusy(''); }
  };
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">{vocabPresentationCourses.map(course => {
      const mapped = vocabPresentationClassIds(data, course.code).length > 0;
      const attached = data.weeklyResources?.some(item => item.course === course.code && item.kind === 'presentation' && item.title.trim().toLowerCase() === 'vocab presentation' && item.url.startsWith('presentation-file:'));
      return <span key={course.code}>
        <button type="button" className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-900 disabled:opacity-50" disabled={Boolean(busy) || !mapped} title={mapped ? `Upload ${course.label} presentation` : `Map ${course.label} to a class in this week first`} onClick={() => inputs.current[course.code]?.click()}>{busy === course.code ? 'Uploading…' : `Upload ${course.label}`}{attached && busy !== course.code && <span aria-label="Presentation attached"> ✓</span>}</button>
        <input ref={element => { inputs.current[course.code] = element; }} type="file" className="hidden" accept=".ppt,.pptx" aria-label={`Upload ${course.label} presentation`} disabled={Boolean(busy) || !mapped} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void upload(course.code, course.label, file); }}/>
      </span>;
    })}</div>
    <p className="text-xs text-slate-500">PowerPoint files up to 10 MB. Shared presentations stay available in each class’s weekly materials. World Lit uploads cover both mapped sections.</p>
    {message && <p role="status" className="text-xs text-purple-900">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
