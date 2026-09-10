import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { readPlanner, type WeeklyPlanData, type LessonPlan } from '@/services/planner.service';
import { normalizePlan } from '@/services/planner-layout';
import { compactPrintText, printActivityText, printLessonSlots, selectPrintActivities, PRINT_LESSON_LIMIT } from '@/services/planner-print';

export function PrintCheck() { return <span aria-label="Completion checkbox" className="planner-paper-check"/>; }
const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
const list = (values: string[], limit = 3, words = 8) => {
  const all = unique(values);
  return all.slice(0,limit).map(value=>compactPrintText(value,words)).join(' · ') + (all.length>limit ? ` · +${all.length-limit} in planner` : '');
};
const dateLabel = (value:string) => {
  const date = new Date(value+'T12:00:00');
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US',{weekday:'short',day:'numeric'});
};
export function PlannerPrintPage() {
  const { planId } = useParams();
  const [data, setData] = useState<WeeklyPlanData | null>(null);
  useEffect(() => { void readPlanner().then(result => { const row = result.plans.find(plan => plan.$id === planId); if (row) setData(normalizePlan(JSON.parse(row.planJson))); }); }, [planId]);
  if (!data) return <div className="p-6">Loading summary…</div>;
  return <PlannerPrintSheet data={data}/>;
}
export function PlannerPrintSheet({data}: {data: WeeklyPlanData}) {
  const rank:Record<string,number> = {'WL-B':0,'WL-R':1,ETH:2,AP:3};
  const blocks = [...data.week.blocks].sort((a,b)=>(rank[a.code]??4)-(rank[b.code]??4));
  const perPage = Math.max(1,Math.ceil(blocks.length/2));
  const pages = blocks.length ? [blocks.slice(0,perPage), blocks.slice(perPage)].filter(page=>page.length) : [[]];
  const preparation = data.preparation.filter(task=>task.status!=='unused');
  return <main className="planner-print">
    <div className="print-controls mx-auto mb-4 max-w-4xl space-y-3 p-4">
      <div className="flex items-center justify-between"><Link to="/planner">← Planning</Link><Button onClick={()=>window.print()}>Print / Save PDF</Button></div>
      <p className="text-sm text-slate-600">Two-page maximum · A4 portrait, 100% scale. Titles and essentials come first; long descriptions and crowded lists are shortened. Your full plan remains unchanged.</p>
    </div>
    {pages.map((page,pageIndex)=><section key={pageIndex} className="planner-paper-page" aria-label={`Weekly summary page ${pageIndex+1}`}>
      <div className="planner-print-header">
        <div><h1>{compactPrintText(data.week.key,8,45)}</h1><p>Weekly teaching plan</p></div>
        <div className="planner-print-prep"><b>Prepare</b>{preparation.slice(0,6).map(task=><span key={task.id}>{task.status==='ready'?'✓':'□'} {compactPrintText(task.label.replace(/^Prepare Presentation\s*·\s*/,'Slides · '),5,42)}</span>)}{preparation.length>6&&<span>+{preparation.length-6} in planner</span>}<small>{compactPrintText([data.week.calendar,data.weekNote].filter(Boolean).join(' · '),20,170)}</small></div>
      </div>
      <div className="planner-page-courses" style={{gridTemplateRows:`repeat(${Math.max(1,page.length)}, minmax(0, 1fr))`}}>
        {page.map(block=><PrintCourse key={block.code} data={data} block={block}/>)}
        {!page.length&&<p>No classes planned for this week.</p>}
      </div>
      <footer className="planner-print-footer">
        {pageIndex===pages.length-1 ? <div className="planner-improvements"><b>Improvements for next time</b><span/></div> : <span>Shortened print summary · Full details remain in Planning</span>}
        <span>{pageIndex+1} / {pages.length}</span>
      </footer>
    </section>)}
  </main>;
}
function PrintCourse({data,block}:{data:WeeklyPlanData;block:WeeklyPlanData['week']['blocks'][number]}) {
  const course = data.courses.find(row=>row.classCode===block.code);
  const allLessons = data.lessons.filter(lesson=>lesson.classCode===block.code).sort((a,b)=>a.date.localeCompare(b.date));
  const lessons = allLessons.slice(0,PRINT_LESSON_LIMIT);
  const scheduled = lessons.flatMap(printLessonSlots);
  const texts = unique([...scheduled.filter(slot=>slot.kind==='text').map(slot=>slot.title),...(course?.texts||[]).map(item=>item.title)]);
  const presentations = unique([...scheduled.filter(slot=>slot.kind==='presentation').map(slot=>slot.title),...(course?.presentations||[]).map(item=>item.title)]);
  const goals = block.goal.split(/\s*(?=\d+\)\s)/).map(value=>value.replace(/^\d+\)\s*/,'').trim()).filter(Boolean);
  const vocabulary = data.unitSnapshot?.flatMap(unit=>unit.cards).filter(card=>card.week===data.week.startDate && block.code.startsWith(card.id.split('-')[0])).map(card=>card.front)||[];
  const extras = data.extras.filter(extra=>extra.courseCode===block.code).map(extra=>extra.label);
  return <article className="planner-course-panel">
    <div className="planner-course-heading"><h2>{compactPrintText(block.label,8,70)}</h2><span>{compactPrintText(block.unit,12,90)}</span></div>
    <div className="planner-course-overview">
      <div className="planner-skills-strip"><p><b>Skills:</b> {list(goals,3,9)}</p>{vocabulary.length>0&&<p><b>Vocab:</b> {list(vocabulary,10,3)}</p>}</div>
      <div className="planner-resource-strip">{texts.length>0&&<p><b>Texts:</b> {list(texts,3)}</p>}{presentations.length>0&&<p><b>Present:</b> {list(presentations,2)}</p>}</div>
    </div>
    <div className="planner-lesson-grid" style={{gridTemplateColumns:`repeat(${Math.max(1,lessons.length)}, minmax(0, 1fr))`}}>
      {lessons.map(lesson=><PrintLesson key={lesson.id} lesson={lesson}/>)}
      {!lessons.length&&<p>No meetings planned.</p>}
    </div>
    <div className="planner-course-bottom">
      {extras.length>0&&<span><b>Options:</b> {list(extras,3)}</span>}
      {course?.sectionBalanceNote&&<span><b>Blue / Red:</b> {compactPrintText(course.sectionBalanceNote,10)}</span>}
      {data.includeIntentionsInPrint&&course?.intention&&<span><b>Intention:</b> {compactPrintText(course.intention,10)}</span>}
      {allLessons.length>lessons.length&&<span>+{allLessons.length-lessons.length} meetings in planner</span>}
    </div>
  </article>;
}
function PrintLesson({lesson}:{lesson:LessonPlan}) {
  const allSlots = printLessonSlots(lesson);
  const slots = selectPrintActivities(allSlots);
  const plannedTitles = new Set(allSlots.map(slot=>slot.title.trim().toLowerCase()));
  const reserves = [...new Map((lesson.overflow||[]).filter(slot=>!plannedTitles.has(slot.title.trim().toLowerCase())).map(slot=>[slot.title.trim().toLowerCase(),slot])).values()];
  const shownReserves = [...reserves].sort((a,b)=>Number(b.kind==='activity')-Number(a.kind==='activity')).slice(0,Math.min(3,Math.max(0,10-slots.length)));
  const dense = slots.length+shownReserves.length>6;
  const omitted = allSlots.length-slots.length+reserves.length-shownReserves.length;
  return <section className={`planner-printed-lesson ${dense?'planner-lesson-dense':''}`}>
    <h3><span>{dateLabel(lesson.date)}</span><small>{compactPrintText(lesson.daytype,3,24)}</small></h3>
    <div className="planner-print-activities">
      {slots.map(slot=>{const {title,description}=printActivityText(slot);return <div key={slot.id} className={`planner-print-activity planner-activity-${slot.kind}`}>
        <PrintCheck/><div><b>{title}</b>{description&&<p>{description}</p>}</div>
        <small>{slot.minutes>0?`${slot.minutes}m`:''}{slot.optional?' *':''}</small>
      </div>;})}
      {shownReserves.length>0&&<div className="planner-print-reserves"><b>Reserve · not scheduled</b>{shownReserves.map(slot=><p key={slot.id}>• {compactPrintText(slot.title,12,90)}</p>)}</div>}
    </div>
    <div className="planner-lesson-end">
      {omitted>0&&<p className="planner-print-overflow">+{omitted} additional activities in planner</p>}
      {lesson.due.length>0&&<p className="planner-print-due"><b>Due:</b> {list(lesson.due,2,16)}</p>}
      {lesson.reminders.length>0&&<p className="planner-print-reminder"><b>Remind:</b> {list(lesson.reminders,2,13)}</p>}
      <div className="planner-we-did"><b>We Did:</b></div>
    </div>
  </section>;
}
