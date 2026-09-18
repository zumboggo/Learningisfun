import type {WeeklyPlanData} from './planner.service';
export function togglePlannerLesson(data:WeeklyPlanData,id:string):WeeklyPlanData {
 const next=structuredClone(data);
 const active=next.lessons.find(lesson=>lesson.id===id);
 if(active){next.lessons=next.lessons.filter(lesson=>lesson.id!==id);next.cancelledLessons=[...(next.cancelledLessons||[]),active];}
 else {const saved=next.cancelledLessons?.find(lesson=>lesson.id===id);if(saved){next.lessons.push(saved);next.lessons.sort((a,b)=>a.date.localeCompare(b.date));next.cancelledLessons=next.cancelledLessons!.filter(lesson=>lesson.id!==id);}}
 return next;
}
