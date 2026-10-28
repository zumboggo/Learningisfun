import {Query} from 'node-appwrite';
import {WORKSHOP_CLASS_ID,WORKSHOP_LEARNER_ACTIONS} from './workshop-policy.js';
const fail=message=>{throw Object.assign(Error(message),{code:403})};
export async function verifiedWorkshop(db,databaseId){
 const cls=await db.getDocument(databaseId,'classes',WORKSHOP_CLASS_ID);
 if(!process.env.OWNER_ACCOUNT_ID||cls.teacherId!==process.env.OWNER_ACCOUNT_ID||cls.status!=='active')fail('The teacher workshop is unavailable.');
 return cls;
}
export async function canJoinWorkshop({profile,userId,cls}){
 return ['teacher','admin'].includes(profile.role)&&cls.$id===WORKSHOP_CLASS_ID&&Boolean(process.env.OWNER_ACCOUNT_ID)&&cls.teacherId===process.env.OWNER_ACCOUNT_ID&&cls.status==='active'&&cls.teacherId!==userId;
}
export async function workshopAccess({db,databaseId,userId,profile}){
 const cls=await verifiedWorkshop(db,databaseId);
 const members=await db.listDocuments(databaseId,'class_members',[Query.equal('classId',cls.$id),Query.equal('userId',userId),Query.equal('role','student'),Query.limit(100)]);
 const enrolled=members.documents.some(m=>!m.expiresAt||Date.parse(m.expiresAt)>Date.now());
 return {classId:cls.$id,name:cls.courseName,section:cls.name,owner:cls.teacherId===userId,enrolled,eligible:['teacher','admin'].includes(profile.role)};
}
export async function workshopRequestContext(args){
 if(args.body.workshop!==true)return {profile:args.profile,learner:false};
 if(!WORKSHOP_LEARNER_ACTIONS.includes(args.body.action))fail('This operation is not available as a workshop participant.');
 const access=await workshopAccess(args);
 if(access.owner)return {profile:args.profile,learner:false};
 if(!access.enrolled)fail('Join Lifeplus Workshop with its class code first.');
 if(args.body.classId&&args.body.classId!==WORKSHOP_CLASS_ID||args.body.data?.classId&&args.body.data.classId!==WORKSHOP_CLASS_ID||Array.isArray(args.body.classIds)&&args.body.classIds.some(id=>id!==WORKSHOP_CLASS_ID))fail('Workshop access applies only to Lifeplus Workshop.');
 if(!['student','teacher','admin'].includes(args.profile.role))fail('A learner or teacher account is required.');
 return {profile:{...args.profile,role:'student'},learner:true};
}
