import {isAssignedReading,isCopywork,resourceCategory} from '@/services/planner-appearance';
import type {LessonSlot} from '@/services/unit-planning';
export function PlannerTextBadges({item}:{item:LessonSlot}) {
 if(resourceCategory(item)!=='text')return null;
 return <>{isCopywork(item)&&<span aria-hidden="true" aria-label="Copywork" title="Copywork" className="mr-1 rounded border px-1 font-bold">C</span>}{isAssignedReading(item)&&<span aria-hidden="true" aria-label="Assigned reading" title="Assigned reading" className="mr-1 rounded border px-1 font-bold">A</span>}</>;
}
