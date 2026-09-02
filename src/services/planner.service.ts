import { executeLearningContent } from './learning-content.service';
import type { PlannerWeekSource,ParsedPlannerSource } from './planner-parser';

export type PlannerProgress='on_track'|'partial'|'behind';
export type PlannerTaskStatus='todo'|'ready'|'unused';
export interface PlannerSourceRecord{$id:string;teacherId:string;filename:string;schoolYear:string;version:number;sourceText:string;parsedJson:string;mappingJson:string;active:boolean;createdAt:string}
export interface PlannerSourceVersion{sourceId:string;version:number;createdAt:string;changedWeeks:string[]}
export interface PlannerClassMapping{sourceCode:string;classId:string}
export interface PreparationTask{id:string;label:string;kind:'presentation'|'text'|'handout'|'quiz'|'assignment'|'other';status:PlannerTaskStatus;url?:string;dueAt?:string;classCode?:string}
export interface ExtraActivity{id:string;courseCode:string;label:string;lessonDates:string[]}
export interface LessonWriteback{status:'planned'|'partial'|'missed';note:string}
export interface LessonPlan{id:string;classCode:string;classId:string;classLabel:string;date:string;daytype:string;unit:string;goal:string;settle:string;iDo:string;weDo:string;theyDo:string;check:string;exit:string;due:string[];reminders:string[];texts:string[];presentations:string[];materials:string[];extraActivityIds:string[];privateNotes:string;writeback?:LessonWriteback}
export interface CourseWeekChoices{classCode:string;progress:PlannerProgress;weDoLead:'teacher'|'students'|'named';leadName:string;intention:string;texts:Array<{title:string;date:string;url:string;publish:boolean}>;presentations:Array<{title:string;date:string;givenBy:string;url:string;publish:boolean}>}
export interface WeeklyPlanData{week:PlannerWeekSource;flags:string[];weekNote:string;preparation:PreparationTask[];courses:CourseWeekChoices[];extras:ExtraActivity[];lessons:LessonPlan[];publishAgenda:boolean;includeIntentionsInPrint:boolean}
export interface WeeklyPlanRecord{$id:string;teacherId:string;sourceId:string;weekKey:string;weekStart:string;status:'draft'|'ready'|'published';planJson:string;publishedJson:string;createdAt:string;updatedAt:string}

export const readPlanner=()=>executeLearningContent<{sources:PlannerSourceRecord[];plans:WeeklyPlanRecord[]}>({action:'readPlanner'});
export const importPlannerSource=(filename:string,sourceText:string,parsed:ParsedPlannerSource,mapping:Record<string,string>,schoolYear='2026-27')=>executeLearningContent<{source:PlannerSourceRecord}>({action:'importPlannerSource',filename,sourceText,parsedJson:JSON.stringify(parsed),mappingJson:JSON.stringify(mapping),schoolYear});
export const updatePlannerMapping=(sourceId:string,mapping:Record<string,string>)=>executeLearningContent<{source:PlannerSourceRecord}>({action:'updatePlannerMapping',sourceId,mappingJson:JSON.stringify(mapping)});
export const saveWeeklyPlan=(sourceId:string,data:WeeklyPlanData,status:'draft'|'ready'='draft',planId?:string)=>executeLearningContent<{plan:WeeklyPlanRecord}>({action:'saveWeeklyPlan',sourceId,weekKey:data.week.key,weekStart:data.week.startDate,status,planJson:JSON.stringify(data),planId});
export const publishWeeklyPlan=(planId:string)=>executeLearningContent<{plan:WeeklyPlanRecord;published:{agendas:number;texts:number;presentations:number}}>({action:'publishWeeklyPlan',planId});

export function createWeeklyPlan(week:PlannerWeekSource,mapping:Record<string,string>,previous?:WeeklyPlanData):WeeklyPlanData{
 const order:Record<string,number>={'WL-B':0,'WL-R':1,AP:2,ETH:3};
 week={...week,blocks:[...week.blocks].sort((a,b)=>(order[a.code]??99)-(order[b.code]??99))};
 const prior=new Map(previous?.lessons.map(lesson=>[lesson.classCode,lesson.writeback])||[]);
 const courses:CourseWeekChoices[]=week.blocks.map(block=>({classCode:block.code,progress:prior.get(block.code)?.status==='missed'?'behind':prior.get(block.code)?.status==='partial'?'partial':'on_track',weDoLead:'teacher',leadName:'',intention:'',texts:[],presentations:block.presentationCandidates.map(title=>({title,date:block.days[0]?.iso||week.startDate,givenBy:'teacher',url:'',publish:false}))}));
 const lessons:LessonPlan[]=week.blocks.flatMap(block=>block.days.map((day,index)=>({id:`${block.code}-${day.iso||index}`,classCode:block.code,classId:mapping[block.code]||'',classLabel:block.label,date:day.iso,daytype:day.daytype,unit:block.unit,goal:block.goal,settle:'Deck review',iDo:day.I,weDo:day.W,theyDo:day.Y,check:day.C,exit:'Name the next reading and who owes what.',due:day.due,reminders:[],texts:[],presentations:[],materials:[],extraActivityIds:[],privateNotes:''})));
 for(const block of week.blocks){const blockLessons=lessons.filter(lesson=>lesson.classCode===block.code).sort((a,b)=>a.date.localeCompare(b.date));for(let index=0;index<blockLessons.length;index++){for(const due of blockLessons[index].due){const target=blockLessons[Math.max(0,index-1)];if(target.id!==blockLessons[index].id)target.reminders.push(`Upcoming: ${due}`);}}}
 const preparation:PreparationTask[]=[];for(const block of week.blocks){preparation.push({id:`cards-${block.code}`,label:`Flashcards updated · ${block.label}`,kind:'quiz',status:'todo',classCode:block.code});for(const title of block.presentationCandidates)preparation.push({id:`pres-${block.code}-${title}`,label:`Prepare presentation: ${title}`,kind:'presentation',status:'todo',classCode:block.code});}
 return {week,flags:[],weekNote:'',preparation,courses,extras:[],lessons,publishAgenda:true,includeIntentionsInPrint:false};
}
