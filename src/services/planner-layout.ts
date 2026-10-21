import type { PreparationTask, WeeklyPlanData } from './planner.service';
import { addDays } from './planner-parser';

export const plannerOrder: Record<string, number> = { 'WL-B': 0, 'WL-R': 1, ETH: 2, AP: 3 };
export const plannerLabel: Record<string, string> = { 'WL-B': 'World Lit Blue', 'WL-R': 'World Lit Red', ETH: 'Ethics', AP: 'AP Lang' };
export const progressLabels = { on_track: 'On Track', partial: '1 Class Behind', behind: '2 Classes Behind' } as const;
export const preparationCode = (code: string) => code.startsWith('WL-') ? 'WL' : code;

/** Upgrade the weekly UI without overwriting lesson edits or manual tasks. */
export function normalizePlan(value: WeeklyPlanData): WeeklyPlanData {
  const data = structuredClone(value);
  data.week.blocks.sort((a,b) => (plannerOrder[a.code] ?? 99) - (plannerOrder[b.code] ?? 99));
  data.courses.sort((a,b) => (plannerOrder[a.classCode] ?? 99) - (plannerOrder[b.classCode] ?? 99));
  data.preparation = data.preparation.filter(task =>
    !/^(flashcards-updated$|quiz-results-|add-cards-|cards-)/.test(task.id) &&
    !/^(Check quiz|Remind students:|Prepare presentation:)/i.test(task.label));
  const oldPresentations=data.preparation.filter(task=>task.id.startsWith('prepare-presentation-'));
  const courses=[...new Set(oldPresentations.map(task=>preparationCode(task.classCode||task.id.replace('prepare-presentation-',''))))];
  const vocabReady=courses.length>0&&courses.every(code=>oldPresentations.some(task=>preparationCode(task.classCode||task.id.replace('prepare-presentation-',''))===code&&task.status==='ready'));
  data.preparation=data.preparation.filter(task=>!oldPresentations.includes(task));
  const courseLabels:Record<string,string>={WL:'World Lit',AP:'AP Lang',ETH:'Ethics'};
  const activeCourses=new Set([...data.week.blocks.map(block=>block.code),...data.courses.map(course=>course.classCode)].map(preparationCode));
  const end=addDays(data.week.startDate,7);
  const inWeek=(date:string)=>date>=data.week.startDate&&date<end;
  // The current deadline inventory includes a look-ahead week: only this week's
  // deadlines create preparation. An empty inventory overrides old lesson dues.
  const copyworkCourses=new Set((data.week.deadlines!==undefined
    ? data.week.deadlines.filter(item=>inWeek(item.date)&&/\bcopywork\b/i.test(item.title)).map(item=>preparationCode(item.classCode))
    : [...data.lessons,...(data.cancelledLessons||[])].filter(lesson=>inWeek(lesson.date)&&lesson.due.some(title=>/\bcopywork\b/i.test(title))).map(lesson=>preparationCode(lesson.classCode))));
  const courseTasks:PreparationTask[]=['WL','AP','ETH'].filter(code=>activeCourses.has(code)).flatMap(classCode=>[
    ...(['WL','AP'].includes(classCode)&&copyworkCourses.has(classCode)?[{id:`prepare-copywork-text-${classCode}`,label:`Create Copywork Text · ${courseLabels[classCode]}`,kind:'text' as const,status:'todo' as const,classCode}]:[]),
    {id:`prepare-episode-${classCode}`,label:`Create Episode · ${courseLabels[classCode]}`,kind:'other' as const,status:'todo' as const,classCode},
  ]);
  const defaults:PreparationTask[]=[
    {id:'prepare-vocab-presentations',label:'Vocab Presentations',kind:'presentation' as const,status:vocabReady?'ready' as const:'todo' as const},
    {id:'prepare-readings-copywork',label:'Choose Assigned Readings and Copywork',kind:'text' as const,status:'todo' as const},
    ...courseTasks,
    {id:'prepare-upload-lesson-plans',label:'Upload Lesson Plans',kind:'other' as const,status:'todo' as const},
  ];
  data.preparation=[...defaults.map(task=>({...task,...data.preparation.find(item=>item.id===task.id),label:task.label})),...data.preparation.filter(task=>!defaults.some(item=>item.id===task.id)&&!/^prepare-(?:copywork-text|episode)-(?:WL|AP|ETH)$/.test(task.id))];
  return data;
}
