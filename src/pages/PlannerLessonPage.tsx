import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { readPlanner, saveWeeklyPlan, type LessonPlan, type WeeklyPlanData, type WeeklyPlanRecord } from '@/services/planner.service';

const fields: [keyof LessonPlan, string][] = [['settle', 'Settle'], ['iDo', 'I Do'], ['weDo', 'We Do'], ['theyDo', 'They Do'], ['check', 'Check'], ['exit', 'Exit']];

export function PlannerLessonPage() {
  const { planId, lessonId } = useParams();
  const [record, setRecord] = useState<WeeklyPlanRecord | null>(null);
  const [data, setData] = useState<WeeklyPlanData | null>(null);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void readPlanner().then(result => {
      const row = result.plans.find(plan => plan.$id === planId);
      if (!row) return;
      const parsed = JSON.parse(row.planJson) as WeeklyPlanData;
      setRecord(row);
      setData(parsed);
      setLesson(parsed.lessons.find(item => item.id === decodeURIComponent(lessonId || '')) || null);
    });
  }, [planId, lessonId]);

  const update = (key: keyof LessonPlan, value: unknown) => setLesson(current => current ? { ...current, [key]: value } : current);
  const save = async () => {
    if (!record || !data || !lesson) return;
    setBusy(true);
    try {
      const next = structuredClone(data);
      next.lessons = next.lessons.map(item => item.id === lesson.id ? lesson : item);
      await saveWeeklyPlan(record.sourceId, next, record.status === 'ready' ? 'ready' : 'draft', record.$id);
      setData(next);
      setMessage('Lesson saved.');
    } finally { setBusy(false); }
  };

  if (!lesson || !record || !data) return <div className="p-6 text-gray-500">Loading lesson…</div>;
  const extras = data.extras.filter(extra => extra.courseCode === lesson.classCode);
  const course = data.courses.find(item => item.classCode === lesson.classCode);

  return <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
    <header className="flex items-center justify-between gap-3"><div><Link className="text-sm text-gray-500" to="/planner">← Weekly Planner</Link><h1 className="mt-2 text-2xl font-bold">{lesson.classLabel}</h1><p className="text-sm text-gray-500">{lesson.date} · {lesson.daytype} · {lesson.unit}</p></div><Button loading={busy} onClick={() => void save()}>Save lesson</Button></header>
    {message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
    <Card><label className="text-sm font-semibold">Concise learning goal<textarea className="mt-1 w-full rounded-lg border p-3 font-normal" rows={2} value={lesson.goal} onChange={event => update('goal', event.target.value)} /></label></Card>
    <div className="space-y-3">{fields.map(([key, label]) => <Card key={key}><div className="grid gap-3 sm:grid-cols-[7rem_1fr]"><span className="text-xs font-bold uppercase tracking-wide text-blue-700">{label}</span><textarea className="w-full rounded-lg border p-3 text-sm" rows={key === 'weDo' ? 4 : 3} value={String(lesson[key] || '')} onChange={event => update(key, event.target.value)} /></div></Card>)}</div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card><h2 className="font-semibold">Scheduled for this lesson</h2><p className="mt-2 text-sm"><strong>Texts:</strong> {lesson.texts.join(' · ') || 'None selected'}</p><p className="mt-2 text-sm"><strong>Presentations:</strong> {lesson.presentations.join(' · ') || 'None selected'}</p><p className="mt-2 text-sm"><strong>Due:</strong> {lesson.due.join(' · ') || 'Nothing listed'}</p>{course?.weDoLead === 'named' && <p className="mt-2 text-sm"><strong>WE DO lead:</strong> {course.leadName || 'Name not entered'}</p>}{course?.sectionBalanceNote && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-900"><strong>Blue/Red alignment:</strong> {course.sectionBalanceNote}</p>}</Card>
      <Card><h2 className="font-semibold">Extra options</h2><p className="mt-1 text-xs text-gray-500">Attach more than you expect to use; choose in the moment.</p><div className="mt-3 space-y-2">{extras.length ? extras.map(extra => <label key={extra.id} className="flex gap-2 text-sm"><input type="checkbox" checked={lesson.extraActivityIds.includes(extra.id)} onChange={event => update('extraActivityIds', event.target.checked ? [...lesson.extraActivityIds, extra.id] : lesson.extraActivityIds.filter(id => id !== extra.id))} /><span>{extra.label}</span></label>) : <p className="text-sm text-gray-500">Add reusable options from the weekly form.</p>}</div></Card>
    </div>
    <div className="grid gap-4 md:grid-cols-2"><Card><h2 className="font-semibold">Materials and reminders</h2><label className="mt-3 block text-sm">Materials, one per line<textarea className="mt-1 w-full rounded-lg border p-2" rows={4} value={lesson.materials.join('\n')} onChange={event => update('materials', event.target.value.split('\n').filter(Boolean))} /></label><label className="mt-3 block text-sm">Student reminders, one per line<textarea className="mt-1 w-full rounded-lg border p-2" rows={4} value={lesson.reminders.join('\n')} onChange={event => update('reminders', event.target.value.split('\n').filter(Boolean))} /></label></Card><Card><h2 className="font-semibold">Private notes</h2><textarea className="mt-3 w-full rounded-lg border p-3" rows={8} placeholder="Anything you want visible during this lesson…" value={lesson.privateNotes} onChange={event => update('privateNotes', event.target.value)} /></Card></div>
    <Card><h2 className="font-semibold">After class</h2><div className="mt-3 flex flex-wrap gap-2">{(['planned', 'partial', 'missed'] as const).map(status => <button key={status} className={`rounded-lg border px-3 py-2 text-sm ${lesson.writeback?.status === status ? 'border-blue-400 bg-blue-50' : ''}`} onClick={() => update('writeback', { status, note: lesson.writeback?.note || '' })}>{status === 'planned' ? 'As planned' : status === 'partial' ? 'Partly completed' : "Didn't happen"}</button>)}</div><input className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Optional carryover note" value={lesson.writeback?.note || ''} onChange={event => update('writeback', { status: lesson.writeback?.status || 'partial', note: event.target.value })} /></Card>
  </div>;
}
