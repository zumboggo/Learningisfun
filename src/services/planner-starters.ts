import type {WeeklyPlanData} from './planner.service';
import type {PlannerWeekSource} from './planner-parser';
import {normalizePlan} from './planner-layout';
import {addWeeklyLessonDefaults,courseCode} from './unit-planning';
import {routineNames,routineSlot} from './planner-routines';
import {prepareWeeklyBank,type WeeklyResource} from './planner-bank';

/** Seed weekly defaults once and add reusable bank choices. */
export function preparePlannerStarters(data:WeeklyPlanData,source:PlannerWeekSource=data.week){
 const next=prepareWeeklyBank(addWeeklyLessonDefaults(normalizePlan(data)));
 if(data.plannerInteractionVersion!==1) {
   for(const item of next.weeklyResources||[])if(item.id.startsWith('starter:')&&item.kind==='text'&&item.sourceWeek&&!item.existingTextId)item.assignedReading=false;
 }
 next.plannerInteractionVersion=1;
 const clean=(title:string)=>title.replace(/^COPY\s*·\s*/i,'').trim();
 const add=(course:string,title:string,kind:WeeklyResource['kind'],extra:Partial<WeeklyResource>={})=>{
  const id='starter:'+course+':'+kind+':'+encodeURIComponent(title);
  if(next.dismissedStarterResources?.includes(id))return;
  if(next.weeklyResources!.some(item=>item.id===id||item.course===course&&item.kind===kind&&clean(item.title).toLowerCase()===clean(title).toLowerCase()))return;
  next.weeklyResources!.push({id,course,title,kind,content:'',url:'',minutes:10,optional:false,status:'planned',publish:true,...extra});
 };
 const courses=[...new Set(data.week.blocks.map(block=>courseCode(block.code)))];
 for(const course of courses){
  add(course,'Vocab Presentation','presentation');
  for(const name of routineNames)add(course,name,'activity',{...routineSlot(name),id:'starter:'+course+':activity:'+encodeURIComponent(name)});
  // The active source supplies current choices even when a saved lesson retains
  // its older source snapshot. Only use the matching week, never another week.
  const week=source.startDate===data.week.startDate?source:data.week;
  const readings=new Map<string,{title:string;copy:boolean;reading:boolean}>();
  for(const block of week.blocks.filter(b=>courseCode(b.code)===course)){
   for(const raw of block.textQueue){
    const copy=/^COPY\s*·/i.test(raw),title=clean(raw),key=title.toLowerCase();
    const prior=readings.get(key)||{title,copy:false,reading:false};
    prior.copy ||= copy;prior.reading ||= !copy;readings.set(key,prior);
   }
  }
  for(const item of readings.values())add(course,item.title,'text',{isCopywork:item.copy,assignedReading:false,sourceWeek:week.startDate});
 }
 return prepareWeeklyBank(next);
}
