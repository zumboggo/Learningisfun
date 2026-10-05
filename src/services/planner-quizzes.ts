import type {WeeklyPlanData} from './planner.service';
import type {LessonSlot} from './unit-planning';
const datedQuiz=/^(?:Q|Quiz)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/i;
export function quizDateLabel(slot:Pick<LessonSlot,'title'|'content'>) {
 const match=slot.title.trim().match(datedQuiz)||slot.content.trim().match(datedQuiz);
 if(!match||Number(match[1])<1||Number(match[1])>12||Number(match[2])<1||Number(match[2])>31)return undefined;
 return `${Number(match[1])}/${String(Number(match[2])).padStart(2,'0')}`;
}
export const isDatedQuiz=(slot:Pick<LessonSlot,'title'|'content'>)=>Boolean(quizDateLabel(slot));
export function mergePlannerQuizzes(data:WeeklyPlanData) {
 const next=structuredClone(data);
 for(const item of next.weeklyResources||[]) {
   const date=quizDateLabel(item);
   if(date){item.title=`Quiz ${date}`;item.kind='quiz';if(datedQuiz.test(item.content.trim()))item.content='';}
 }
 for(const lesson of [...next.lessons,...(next.cancelledLessons||[])]) {
   const slots=lesson.slots||[],overflow=lesson.overflow||[];
   const dated=[...slots,...overflow].filter(isDatedQuiz);
   if(!dated.length)continue;
   for(const date of new Set(dated.map(quizDateLabel))) {
     const matching=[...slots,...overflow].filter(slot=>quizDateLabel(slot)===date||slot.kind==='quiz'&&/^quiz$/i.test(slot.title.trim()));
     const canonical=matching.find(slot=>slots.includes(slot)&&slot.kind==='quiz'&&/^quiz$/i.test(slot.title.trim()))||matching[0];
     canonical.title=`Quiz ${date}`;canonical.kind='quiz';
     canonical.content=[...new Set(matching.map(slot=>slot.content).filter(content=>content&&!datedQuiz.test(content.trim())))].join('\n\n');
     canonical.url=matching.find(slot=>slot.url)?.url||'';
     if(matching.some(slot=>slot.status==='completed'))canonical.status='completed';
     // A generic bank quiz may be shared across different dates. Link this dated
     // placement anew so editing another date cannot rename it back to Quiz.
     if(!next.weeklyResources?.some(item=>item.id===canonical.planningItemId&&item.title===canonical.title))canonical.planningItemId=undefined;
     const redundant=new Set(matching.filter(slot=>slot!==canonical).map(slot=>slot.id));
     lesson.slots=lesson.slots?.filter(slot=>!redundant.has(slot.id));
     lesson.overflow=lesson.overflow?.filter(slot=>!redundant.has(slot.id));
   }
 }
 // Remove only obsolete quiz bank entries created by the redundant placements.
 const live=new Set([...next.lessons,...(next.cancelledLessons||[])].flatMap(lesson=>[...(lesson.slots||[]),...(lesson.overflow||[])]).map(slot=>slot.planningItemId));
 const removedIds=new Set([...data.lessons,...(data.cancelledLessons||[])].flatMap(lesson=>[...(lesson.slots||[]),...(lesson.overflow||[])])
   .filter(slot=>isDatedQuiz(slot)||slot.kind==='quiz'&&/^quiz$/i.test(slot.title.trim())).map(slot=>slot.planningItemId));
 next.weeklyResources=next.weeklyResources?.filter(item=>!removedIds.has(item.id)||live.has(item.id));
 return next;
}
