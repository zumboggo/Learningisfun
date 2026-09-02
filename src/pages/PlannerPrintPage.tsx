import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { readPlanner, type WeeklyPlanData } from '@/services/planner.service';

const targets = (goal: string) => goal.split(/\s*(?=\d+\)\s)/).map(value => value.replace(/^\d+\)\s*/, '').trim()).filter(Boolean);

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
    <section className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 border-b pb-2 text-[10px]"><h2 className="font-bold uppercase">Preparation</h2><div className="flex flex-wrap gap-x-4 gap-y-1">{data.preparation.filter(task => task.status !== 'unused').map(task => <span key={task.id}>{task.status === 'ready' ? '☑' : '☐'} {task.label}</span>)}</div>{data.weekNote && <><b>Week note</b><span>{data.weekNote}</span></>}</section>
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
          <section className="text-[9px] leading-tight"><h3 className="font-bold uppercase text-gray-700">Materials and options</h3>{texts.length > 0 && <p className="mt-0.5"><b>Texts:</b> {texts.map(item => `${item.title}${item.date ? ` (${item.date.slice(5)})` : ''}`).join(' · ')}</p>}{presentations.length > 0 && <p className="mt-0.5"><b>Presentations:</b> {presentations.map(item => `${item.title}${item.givenBy && item.givenBy !== 'teacher' ? ` — ${item.givenBy}` : ''}`).join(' · ')}</p>}{extras.length > 0 && <p className="mt-0.5"><b>Possible activities:</b> {extras.map(item => `${item.label}${item.target ? ` [${item.target}]` : ''}`).join(' · ')}</p>}{primary?.sectionBalanceNote && <p className="mt-0.5 rounded bg-amber-50 p-1"><b>Keep Blue/Red aligned:</b> {primary.sectionBalanceNote}</p>}</section>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-1">{lessons.map(lesson => <section key={lesson.id} className="text-[9px] leading-tight"><h3 className="font-bold uppercase">{lesson.date.slice(5)} · {blocks.length > 1 ? lesson.classLabel.replace('World Literature · ', 'WL ') : lesson.daytype}</h3><p><b>I:</b> {lesson.iDo}</p><p><b>We:</b> {lesson.weDo}</p><p><b>They:</b> {lesson.theyDo}</p><p><b>Check:</b> {lesson.check}</p>{lesson.due.length > 0 && <p><b>Due:</b> {lesson.due.join(' · ')}</p>}{lesson.reminders.length > 0 && <p><b>Remind:</b> {lesson.reminders.join(' · ')}</p>}</section>)}</div>
        {data.includeIntentionsInPrint && primary?.intention && <p className="mt-1 border-t pt-1 text-[9px] italic"><b>Private intention:</b> {primary.intention}</p>}
      </article>;
    })}</section>
  </main>;
}
