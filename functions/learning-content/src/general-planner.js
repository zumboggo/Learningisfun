import {readPlan,writePlan} from './general-planner-storage.js';
import {atomic,readRecord,writeRecord,fail,recordId,allRows} from './teacher-workspace.js';
import {validatePlanner,emptyPlanner} from './general-planner-model.js';
import {animatedEpisodeAction} from './animated-episodes.js';
import {Query} from 'node-appwrite';
export async function generalPlannerAction(args){const {body,profile,userId,db,databaseId}=args;if(!['teacher','admin'].includes(profile.role))fail('Teacher account required',403);
 const key='general-planner';
 if(body.action==='readGeneralPlannerMaterials'){const rows=await allRows(db,databaseId,'episode_records',[Query.equal('classId','studio-'+userId)]);return {episodes:rows.map(r=>({...JSON.parse(r.dataJson),recordId:r.$id})).filter(r=>r.type==='animated-version'&&r.teacherId===userId).map(r=>({id:r.recordId,title:r.title}))};}
 if(body.action==='readGeneralPlanner'){const current=await readRecord(db,databaseId,userId,key);return {...current,value:current.value?await readPlan(db,databaseId,userId,current.value):emptyPlanner()};}
 if(body.action==='readGeneralPlannerHistory'){const rows=await allRows(db,databaseId,'teacher_workspace',[Query.equal('ownerId',userId),Query.startsWith('kind','general-plan-revision:')]);return {revisions:await Promise.all(rows.sort((a,b)=>Number(b.kind.split(':')[1])-Number(a.kind.split(':')[1])).slice(0,20).map(async r=>({revision:Number(r.kind.split(':')[1]),value:await readPlan(db,databaseId,userId,JSON.parse(r.dataJson))})))};}
 if(body.action==='saveGeneralPlanner'){
  const errors=validatePlanner(body.plan);if(errors.length)fail(errors.join(' '));
  for(const subject of body.plan.subjects){const cls=await db.getDocument(databaseId,'classes',subject.classId);if(cls.teacherId!==userId)fail('Use only your own classes.',403);}
  return atomic(args,async({db})=>{const current=await readRecord(db,databaseId,userId,key);if(current.revision!==body.revision)fail('Plan changed on another device. Reload or export your work before continuing.',409);const oldPlan=await readPlan(db,databaseId,userId,current.value);for(const lesson of oldPlan?.lessons||[]){if(lesson.completed&&JSON.stringify(body.plan.lessons.find(l=>l.id===lesson.id))!==JSON.stringify(lesson))fail('Completed lessons are preserved. Duplicate one to make changes.');}
   if(current.revision)await writeRecord(db,databaseId,userId,'general-plan-revision:'+current.revision,current.value,0);
   const snapshot=await writePlan(db,databaseId,userId,body.plan,current.revision+1);return writeRecord(db,databaseId,userId,key,snapshot,current.revision);
  });
 }
 if(body.action==='publishGeneralLesson'){
  const current=await readRecord(db,databaseId,userId,key);if(current.revision!==body.revision)fail('Save and preview the current plan before publishing.',409);const plan=await readPlan(db,databaseId,userId,current.value),lesson=plan?.lessons.find(l=>l.id===body.lessonId);if(!lesson)fail('Lesson unavailable',404);const block=plan.timetable.find(b=>b.id===lesson.blockId),subject=plan.subjects.find(s=>s.id===block?.subjectId);if(!subject)fail('This block has no class.');const cls=await db.getDocument(databaseId,'classes',subject.classId);if(cls.teacherId!==userId)fail('Class ownership required',403);
  const selected=lesson.items.filter(item=>body.itemIds?.includes(item.id));if(!selected.length)fail('Select material to publish.');
  // Validate the entire selection before any write; partial failures are safely retryable.
  for(const item of selected){if(item.kind==='text'){const text=await db.getDocument(databaseId,'texts',item.textId);if(text.teacherId!==userId||text.status!=='published')fail('Choose one of your published texts.');}else if(item.kind==='episode'){const version=JSON.parse((await db.getDocument(databaseId,'episode_records',item.versionId)).dataJson);if(version.type!=='animated-version'||version.teacherId!==userId)fail('Choose one of your published episodes.');}else if(item.kind==='link'){if(!/^https:\/\//.test(item.url||''))fail('Links must use HTTPS.');}else fail('Only texts, links and published episodes can be sent to students.');}
  const published=[];
  for(const item of selected){const id=recordId(userId,cls.$id+':'+lesson.id+':'+item.id+':'+(item.textId||item.versionId||item.url||''));if(item.kind==='text'){try{await db.createDocument(databaseId,'text_assignments',id,{textId:item.textId,classId:cls.$id,assignedAt:lesson.date},[])}catch(e){if(e.code!==409)throw e;}}
   if(item.kind==='link'){try{await db.createDocument(databaseId,'presentation_links',id,{teacherId:userId,classId:cls.$id,title:item.title,url:item.url,assignedAt:lesson.date,watchedAt:null},[])}catch(e){if(e.code!==409)throw e;}}
   if(item.kind==='episode')await animatedEpisodeAction({...args,body:{action:'animatedAssign',versionId:item.versionId,classId:cls.$id,date:lesson.date}});
   published.push(item.title);
  }return {published};
 }
 fail('Unknown planner operation');
}
