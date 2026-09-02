import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { readPlanner, type WeeklyPlanData } from '@/services/planner.service';

const targets = (goal: string) => goal.split(/\s*(?=\d+\)\s)/).map(value => value.replace(/^\d+\)\s*/, '').trim()).filter(Boolean);
const activityTone: Record<string, string> = { I: 'bg-blue-50', We: 'bg-violet-50', They: 'bg-emerald-50', Check: 'bg-amber-50' };

function ActivityRow({ label, children }: { label: 'I' | 'We' | 'They' | 'Check'; children: string }) {
  return <div className={`grid grid-cols-[2.5rem_1fr] gap-1 rounded-md px-1.5 py-1 ${activityTone[label]}`}><b>{label}</b><span>{children || '—'}</span></div>;
}

export function PlannerPrintPage() {
  const { planId } = useParams();
  const [data, setData] = useState<WeeklyPlanData | null>(null);
  useEffect(() => { void readPlanner().then(result => { const row = result.plans.find(plan => plan.$id === planId); if (row) setData(JSON.parse(row.planJson)); }); }, [planId]);
  if (!data) return <div className="p-6">Loading summary…</div>;

  const worldLit = data.week.blocks.filter(block => block.code === 'WL-B' || block.code === 'WL-R');
  const groups = [worldLit, ...data.week.blocks.filter(block => !block.code.startsWith('WL-')).map(block => [block])].filter(group => group.length);

  return <main className="planner-print mx-auto max-w-[900px] bg-white p-5 text-gray-950">
    <div className="print-controls mb-4 flex justify-between"><Link to="/planner">← Planner</Link><Button onClick={() => window.print()}>Print / Save PDF</Button></div>
    <header className="border-b-2 border-gray-900 pb-2"><h1 className="text-xl font-bold">Weekly Lesson Plan · {data.week.key}</h1><p className="text-xs">Week of {data.week.startDate}{data.week.calendar ? ` · ${data.week.calendar}` : ''}</p></header>
    <section className="mt-2 border-b pb-2 text-[10px]"><h2 className="font-bold uppercase">Before the week</h2><div className="mt-1 flex flex-wrap gap-1">{data.preparation.filter(task => task.status !== 'unused').map(task => <span key={task.id} className={`rounded-full border px-2 py-1 ${task.status === 'ready' ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 bg-white'}`}>{task.status === 'ready' ? '✓' : '○'} {task.label}</span>)}</div>{data.weekNote && <p className="mt-1 rounded-md bg-gray-100 px-2 py-1"><b>Week note:</b> {data.weekNote}</p>}</section>
    <section className="mt-2 space-y-2">{groups.map(blocks => {
      const codes = blocks.map(block => block.code);
      const courses = data.courses.filter(course => codes.includes(course.classCode));
      const lessons = data.lessons.filter(lesson => codes.includes(lesson.classCode)).sort((a, b) => a.date.localeCompare(b.date) || a.classCode.localeCompare(b.classCode));
      const weeklyTargets = [...new Set(blocks.flatMap(block => targets(block.goal)))];
      const extras = [...new Map(data.extras.filter(extra => codes.includes(extra.courseCode)).map(extra => [`${extra.label}\n${extra.target || ''}`, extra])).values()];
      const texts = [...new Map(courses.flatMap(course => course.texts).map(item => [item.title, item])).values()];
      const presentations = [...new Map(courses.flatMap(course => course.presentations).filter(item => item.publish).map(item => [item.title, item])).values()];
      const primary = courses[0];
      const title = blocks.length > 1 ? 'World Literature · Blue + Red' : blocks[0].label;
      return <article key={title} className="planner-course-panel break-inside-avoid rounded border border-gray-400 p-2">
        <div className="flex items-baseline justify-between gap-3"><h2 className="text-sm font-bold">{title}</h2><span className="text-[9px] text-gray-600">{[...new Set(blocks.map(block => block.unit))].join(' · ')}</span></div>
        <div className="mt-1 grid grid-cols-[1.2fr_1fr] gap-3">
          <section><h3 className="text-[9px] font-bold uppercase text-blue-800">Weekly knowledge &amp; skills</h3><ol className="mt-0.5 list-decimal space-y-0.5 pl-4 text-[9px] leading-tight">{weeklyTargets.map(target => <li key={target}>{target}</li>)}</ol></section>
          <section className="text-[9px] leading-tight"><h3 className="font-bold uppercase text-gray-700">Materials and options</h3>{texts.length > 0 && <p className="mt-1 rounded-md bg-emerald-50 px-1.5 py-1"><b>Texts:</b> {texts.map(item => `${item.title}${item.date ? ` (${item.date.slice(5)})` : ''}`).join(' · ')}</p>}{presentations.length > 0 && <p className="mt-1 rounded-md bg-fuchsia-50 px-1.5 py-1"><b>Presentations:</b> {presentations.map(item => `${item.title}${item.givenBy && item.givenBy !== 'teacher' ? ` — ${item.givenBy}` : ''}`).join(' · ')}</p>}{extras.length > 0 && <div className="mt-1"><b>Possible activities</b><div className="mt-0.5 flex flex-wrap gap-1">{extras.map(item => <span key={`${item.label}-${item.target}`} className="rounded-md border border-slate-300 bg-slate-50 px-1.5 py-1">{item.label}{item.target ? <small className="block text-blue-700">{item.target}</small> : null}</span>)}</div></div>}{primary?.sectionBalanceNote && <p className="mt-1 rounded-md bg-amber-50 px-1.5 py-1"><b>Keep Blue/Red aligned:</b> {primary.sectionBalanceNote}</p>}</section>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">{lessons.map(lesson => <section key={lesson.id} className="rounded-lg border border-gray-300 bg-white p-1.5 text-[9px] leading-tight shadow-sm"><h3 className="mb-1 flex items-center justify-between gap-2 font-bold uppercase"><span className="rounded bg-gray-900 px-1.5 py-0.5 text-white">{lesson.date.slice(5)}</span><span>{blocks.length > 1 ? lesson.classLabel.replace('World Literature · ', 'WL ') : lesson.daytype}</span></h3><div className="space-y-1"><ActivityRow label="I">{lesson.iDo}</ActivityRow><ActivityRow label="We">{lesson.weDo}</ActivityRow><ActivityRow label="They">{lesson.theyDo}</ActivityRow><ActivityRow label="Check">{lesson.check}</ActivityRow></div>{lesson.due.length > 0 && <p className="mt-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-1"><b>Due:</b> {lesson.due.join(' · ')}</p>}{lesson.reminders.length > 0 && <p className="mt-1 rounded-md border border-orange-200 bg-orange-50 px-1.5 py-1"><b>Remind:</b> {lesson.reminders.join(' · ')}</p>}</section>)}</div>
        {data.includeIntentionsInPrint && primary?.intention && <p className="mt-1 border-t pt-1 text-[9px] italic"><b>Private intention:</b> {primary.intention}</p>}
      </article>;
    })}</section>
  </main>;
}
