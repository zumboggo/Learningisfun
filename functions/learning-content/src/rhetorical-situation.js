import {createHash} from 'node:crypto';
import {Query} from 'node-appwrite';
import {textAssignmentAvailable} from './text-schedule.js';

import {rhetoricalFields,isApLanguageCourse} from './rhetorical-fields.js';
const fail=(message,code=403)=>{throw Object.assign(new Error(message),{code});};
export async function rhetoricalSituationAction({body,profile,userId,memberClassIds,db,databaseId}) {
  if(!['readRhetoricalSituation','saveRhetoricalSituation'].includes(body.action))fail('Unknown practice action',400);
  if(!['student','teacher'].includes(profile.role))fail('Practice requires a student or teacher account');
  const cls=await db.getDocument(databaseId,'classes',body.classId);
  const teacher=profile.role==='teacher'&&cls.teacherId===userId;
  if(cls.status!=='active'||!isApLanguageCourse(cls.courseName,cls.$id)||(!teacher&&(profile.role!=='student'||!memberClassIds.has(cls.$id))))fail('AP Language class access required');
  const text=await db.getDocument(databaseId,'texts',body.textId);
  const assigned=await db.listDocuments(databaseId,'text_assignments',[Query.equal('textId',text.$id),Query.equal('classId',cls.$id),Query.limit(100)]);
  if(!assigned.documents.some(a=>a.isAssignedReading&&(teacher||textAssignmentAvailable(a)))||(!teacher&&text.status!=='published'))fail('This assigned reading is not available');
  // The caller never supplies an owner or record ID: practice is private to them.
  const id=createHash('sha256').update(JSON.stringify([userId,cls.$id,text.$id])).digest('hex').slice(0,32);
  let prior;try{prior=await db.getDocument(databaseId,'rhetorical_practice',id);}catch(e){if(e.code!==404)throw e;}
  if(body.action==='readRhetoricalSituation')return prior?JSON.parse(prior.dataJson):{responses:Object.fromEntries(rhetoricalFields.map(k=>[k,''])),updatedAt:null};
  if(!body.responses||typeof body.responses!=='object'||Array.isArray(body.responses))fail('Enter your practice responses',400);
  const responses={};for(const field of rhetoricalFields){const value=body.responses[field];if(typeof value!=='string'||value.length>3000)fail('Each response must be text of up to 3,000 characters',400);responses[field]=value;}
  const saved={responses,updatedAt:new Date().toISOString()},data={userId,classId:cls.$id,textId:text.$id,dataJson:JSON.stringify(saved)};
  if(prior)await db.updateDocument(databaseId,'rhetorical_practice',id,data);
  else {try{await db.createDocument(databaseId,'rhetorical_practice',id,data,[]);}catch(e){if(e.code!==409)throw e;await db.updateDocument(databaseId,'rhetorical_practice',id,data);}}
  return saved;
}
