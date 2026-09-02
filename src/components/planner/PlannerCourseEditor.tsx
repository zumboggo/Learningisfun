import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import type { PlannerBlockSource } from '@/services/planner-parser';
import type { CourseWeekChoices, WeeklyPlanData } from '@/services/planner.service';

type Change = (change: (draft: WeeklyPlanData) => void) => void;
type TextChoice = CourseWeekChoices['texts'][number];
type PresentationChoice = CourseWeekChoices['presentations'][number];

const targets = (goal: string) => goal.split(/\s*(?=\d+\)\s)/).map(value => value.replace(/^\d+\)\s*/, '').trim()).filter(Boolean);
const uniqueByTitle = <T extends { title: string }>(items: T[]) => [...new Map(items.map(item => [item.title, item])).values()];

export function PlannerCourseEditor({ blocks, data, mutate }: { blocks: PlannerBlockSource[]; data: WeeklyPlanData; mutate: Change }) {
  const codes = blocks.map(block => block.code);
  const courses = data.courses.filter(course => codes.includes(course.classCode));
  const primary = courses[0];
  const [activity, setActivity] = useState('');
  const [activityTarget, setActivityTarget] = useState('');
  const weeklyTargets = useMemo(() => [...new Set(blocks.flatMap(block => targets(block.goal)))], [blocks]);
  const texts = uniqueByTitle(courses.flatMap(course => course.texts));
  const presentations = uniqueByTitle(courses.flatMap(course => course.presentations));
  const extras = [...new Map(data.extras.filter(extra => codes.includes(extra.courseCode)).map(extra => [`${extra.label}\n${extra.target || ''}`, extra])).values()];
  const title = blocks.length > 1 ? 'World Literature' : blocks[0].label;
  const unit = [...new Set(blocks.map(block => block.unit))].join(' · ');

  if (!primary) return null;
  const updateCourses = (change: (course: CourseWeekChoices) => void) => mutate(draft => draft.courses.filter(course => codes.includes(course.classCode)).forEach(change));
  const syncText = (oldTitle: string, value: Partial<TextChoice>) => updateCourses(course => {
    const existing = course.texts.find(item => item.title === oldTitle);
    if (existing) Object.assign(existing, value);
    else course.texts.push({ ...texts.find(item => item.title === oldTitle)!, ...value });
  });
  const syncPresentation = (oldTitle: string, value: Partial<PresentationChoice>) => updateCourses(course => {
    const existing = course.presentations.find(item => item.title === oldTitle);
    if (existing) Object.assign(existing, value);
    else course.presentations.push({ ...presentations.find(item => item.title === oldTitle)!, ...value });
  });
  const addItem = (kind: 'text' | 'presentation') => {
    const name = window.prompt(`Name of the ${kind}`)?.trim();
    if (!name) return;
    const date = blocks[0].days[0]?.iso || data.week.startDate;
    updateCourses(course => kind === 'text'
      ? course.texts.push({ title: name, date, url: '', publish: false })
      : course.presentations.push({ title: name, date, givenBy: 'teacher', url: '', publish: false }));
  };

  return <Card>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{title}</h3><p className="text-xs text-gray-500">{unit}</p>{blocks.length > 1 && <p className="mt-1 text-xs font-medium text-blue-700">Blue + Red planned together</p>}</div><label className="text-sm">WE DO lead <select className="ml-2 rounded border px-2 py-1" value={primary.weDoLead} onChange={event => updateCourses(course => { course.weDoLead = event.target.value as CourseWeekChoices['weDoLead']; })}><option value="teacher">I lead</option><option value="students">Students lead</option><option value="named">Named student</option></select></label></div>
    <section className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3"><h4 className="text-xs font-bold uppercase tracking-wide text-blue-700">Weekly knowledge &amp; skills targets</h4><ul className="mt-2 space-y-1 text-sm text-blue-950">{weeklyTargets.map((target, index) => <li key={target} className="flex gap-2"><b>{index + 1}.</b><span>{target}</span></li>)}</ul><p className="mt-2 text-xs text-blue-600">Standards: {[...new Set(blocks.map(block => block.std).filter(Boolean))].join(' · ')}</p></section>
    <textarea className="mt-3 w-full rounded-lg border p-2 text-sm" rows={2} placeholder="One thing you want to happen this week (private)" value={primary.intention} onChange={event => updateCourses(course => { course.intention = event.target.value; })} />
    {blocks.length > 1 && <label className="mt-3 block text-sm font-semibold">Keep Blue and Red aligned<textarea className="mt-1 w-full rounded-lg border border-amber-200 bg-amber-50 p-2 font-normal" rows={2} placeholder="Anything one section needs to cover, repeat, or catch up on?" value={primary.sectionBalanceNote || ''} onChange={event => updateCourses(course => { course.sectionBalanceNote = event.target.value; })} /></label>}
    <section className="mt-5"><h4 className="font-semibold">Activities aimed at these targets</h4><div className="mt-2 space-y-2">{extras.map(extra => <div key={`${extra.label}-${extra.target}`} className="flex items-start justify-between gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm"><span>{extra.label}{extra.target && <small className="mt-1 block text-blue-700">Targets: {extra.target}</small>}</span><button className="text-red-600" title="Remove activity" onClick={() => mutate(draft => { draft.extras = draft.extras.filter(item => !(codes.includes(item.courseCode) && item.label === extra.label && item.target === extra.target)); })}>×</button></div>)}</div><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input className="rounded-lg border px-3 py-2 text-sm" placeholder="Add an activity or extra option" value={activity} onChange={event => setActivity(event.target.value)} /><select className="rounded-lg border px-3 py-2 text-sm" value={activityTarget} onChange={event => setActivityTarget(event.target.value)}><option value="">All weekly targets</option>{weeklyTargets.map((target, index) => <option key={target} value={`${index + 1}. ${target}`}>Target {index + 1}: {target}</option>)}</select><Button size="sm" variant="secondary" disabled={!activity.trim()} onClick={() => { mutate(draft => codes.forEach(code => draft.extras.push({ id: crypto.randomUUID(), courseCode: code, label: activity.trim(), target: activityTarget || 'All weekly targets', lessonDates: [] }))); setActivity(''); setActivityTarget(''); }}>Add</Button></div></section>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section><div className="flex items-center justify-between"><h4 className="font-semibold text-emerald-800">Texts and links</h4><button className="rounded border px-2 py-1 text-xs" onClick={() => addItem('text')}>+ Add</button></div>{texts.map(text => <div key={text.title} className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs"><div className="flex justify-between gap-2"><strong>{text.title}</strong><span><button className="mr-1 rounded border bg-white px-2 py-1" title="Edit name" onClick={() => { const name = window.prompt('Edit text name', text.title)?.trim(); if (name) syncText(text.title, { title: name }); }}>✎</button><button className="rounded border bg-white px-2 py-1 text-red-600" title="Remove" onClick={() => updateCourses(course => { course.texts = course.texts.filter(item => item.title !== text.title); })}>×</button></span></div><div className="mt-2 grid gap-2 sm:grid-cols-[9rem_1fr_auto]"><input type="date" className="rounded border px-2 py-1" value={text.date} onChange={event => syncText(text.title, { date: event.target.value })} /><input className="rounded border px-2 py-1" placeholder="Optional link" value={text.url} onChange={event => syncText(text.title, { url: event.target.value })} /><label className="flex items-center gap-1"><input type="checkbox" checked={text.publish} disabled={!text.url} onChange={event => syncText(text.title, { publish: event.target.checked })} />Publish</label></div></div>)}</section>
      <section><div className="flex items-center justify-between"><h4 className="font-semibold text-fuchsia-800">Presentations</h4><button className="rounded border px-2 py-1 text-xs" onClick={() => addItem('presentation')}>+ Add</button></div>{presentations.map(item => <div key={item.title} className="mt-2 rounded-lg bg-fuchsia-50 p-2 text-xs"><div className="flex justify-between gap-2"><label className="flex gap-2"><input type="checkbox" checked={item.publish} onChange={event => syncPresentation(item.title, { publish: event.target.checked })} /><strong>{item.title}</strong></label><span><button className="mr-1 rounded border bg-white px-2 py-1" title="Edit name" onClick={() => { const name = window.prompt('Edit presentation name', item.title)?.trim(); if (name) syncPresentation(item.title, { title: name }); }}>✎</button><button className="rounded border bg-white px-2 py-1 text-red-600" title="Remove" onClick={() => updateCourses(course => { course.presentations = course.presentations.filter(row => row.title !== item.title); })}>×</button></span></div><div className="mt-2 grid gap-2 sm:grid-cols-[9rem_10rem_1fr]"><input type="date" className="rounded border px-2 py-1" value={item.date} onChange={event => syncPresentation(item.title, { date: event.target.value })} /><input className="rounded border px-2 py-1" placeholder="Presenter" value={item.givenBy} onChange={event => syncPresentation(item.title, { givenBy: event.target.value })} /><input className="rounded border px-2 py-1" placeholder="Optional link" value={item.url} onChange={event => syncPresentation(item.title, { url: event.target.value })} /></div></div>)}</section>
    </div>
  </Card>;
}
