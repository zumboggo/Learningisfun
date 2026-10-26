// Read-only report verification. Logs aggregate counts only, never identities.
import {Client,Databases,Functions,Users,Query} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {FAMILY_CONTACT_CLASS_ID} from '../functions/learning-content/src/family-contact-schema.js';
import {usageSummary} from '../functions/learning-content/src/usage-summary.js';
loadEnvFile(join(homedir(),'.config','learningisfun','appwrite.env'));
const base=()=>new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID);
const admin=base().setKey(process.env.APPWRITE_API_KEY),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const db=new Databases(admin),cls=await db.getDocument(databaseId,'classes',FAMILY_CONTACT_CLASS_ID);
const profile=await db.getDocument(databaseId,'users',cls.teacherId);
const started=Date.now();
if(process.argv.includes('--local')) {
 const result=await usageSummary({body:{},profile,userId:cls.teacherId,db,databaseId});
 console.log(JSON.stringify({mode:'local server query',seconds:(Date.now()-started)/1000,students:result.students,activeStudents:result.activeStudents,totals:result.totals,missingSources:result.missingSources}));
} else {
 const callAs=async(userId,body)=>{
   const {jwt}=await new Users(admin).createJWT({userId,duration:120});
   const execution=await new Functions(base().setJWT(jwt)).createExecution({functionId:'learning-content',body:JSON.stringify(body)});
   return {status:execution.responseStatusCode,data:JSON.parse(execution.responseBody||'{}')};
 };
 const result=await callAs(cls.teacherId,{action:'usageSummary'});
 if(result.status!==200||!result.data.totals)throw Error('Teacher report failed: '+JSON.stringify(result));
 const serialized=JSON.stringify(result.data);
 if(/"(userId|authorId|email|dataJson|content|studentId)"/.test(serialized))throw Error('Report exposed record fields');
 const member=(await db.listDocuments(databaseId,'class_members',[Query.equal('classId',cls.$id),Query.equal('role','student'),Query.limit(1)])).documents[0];
 if(!member)throw Error('No student available for authorization verification');
 const denied=await callAs(member.userId,{action:'usageSummary'});
 if(denied.status!==403)throw Error('Student report access was not denied');
 console.log(JSON.stringify({mode:'deployed verification',studentAccess:'denied',seconds:(Date.now()-started)/1000,students:result.data.students,activeStudents:result.data.activeStudents,totals:result.data.totals,missingSources:result.data.missingSources}));
}
