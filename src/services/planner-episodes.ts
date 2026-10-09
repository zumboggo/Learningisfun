import {episodes} from '../../functions/learning-content/src/episode-catalog.js';
import type {WeeklyPlanData} from './planner.service';
import {courseCode} from './unit-planning';
import {prepareWeeklyBank} from './planner-bank';
/** Assigned episodes are references. Import into the private bank without publishing an agenda. */
export function addAssignedEpisodes(data:WeeklyPlanData,baseUrl:string){const next=prepareWeeklyBank(data);for(const episode of episodes){const lesson=next.lessons.find(l=>l.classId===episode.classId&&l.date===episode.assignedDate);if(!lesson)continue;const id='episode-'+episode.assignmentId;const url=new URL(baseUrl);url.hash=`/classes/${episode.classId}/episodes/${episode.id}`;if(next.dismissedAssignedTexts?.includes(id)||next.weeklyResources!.some(r=>r.id===id||r.url===url.href))continue;next.weeklyResources!.push({id,resourceId:id,course:courseCode(lesson.classCode),kind:'text',activityType:'game-episode',title:episode.title,content:episode.description,url:url.href,minutes:20,optional:false,publish:false,status:'planned',sourceWeek:data.week.startDate,dueDate:episode.assignedDate||undefined});}return next;}
