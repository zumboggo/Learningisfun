import {atomic,readRecord,writeRecord,fail} from './teacher-workspace.js';
export function validateDefaults(value){
 if(value===null)return null;
 if(!value||typeof value!=='object')fail('Enter teaching defaults.');
 const {ageRange='',audienceNotes='',wordTarget=null}=value;
 if(typeof ageRange!=='string'||ageRange.length>100||typeof audienceNotes!=='string'||audienceNotes.length>1000||wordTarget!==null&&(!Number.isInteger(wordTarget)||wordTarget<100||wordTarget>4000))fail('Use an age range and a word target between 100 and 4,000.');
 return {ageRange:ageRange.trim(),audienceNotes:audienceNotes.trim(),wordTarget};
}
export async function teachingDefaultsAction(args){
 const {body,userId,profile,databaseId}=args;if(!['teacher','admin'].includes(profile.role))fail('Teacher account required.',403);
 if(body.classId){const cls=await args.db.getDocument(databaseId,'classes',body.classId);if(cls.teacherId!==userId)fail('Choose your own class.',403);}
 const key=body.classId?'class-defaults:'+body.classId:'teaching-defaults';
 const read=async db=>{const own=await readRecord(db,databaseId,userId,key),teacher=await readRecord(db,databaseId,userId,'teaching-defaults');return {...own,effective:own.value??teacher.value??null};};
 if(body.action==='readTeachingDefaults')return read(args.db);
 return atomic(args,async({db})=>{const prior=await readRecord(db,databaseId,userId,key);if(prior.revision!==body.revision)fail('Settings changed elsewhere. Reload first.',409);await writeRecord(db,databaseId,userId,key,validateDefaults(body.value),prior.revision);return read(db);});
}
