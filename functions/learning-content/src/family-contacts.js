import { createHash } from 'node:crypto';
import { Query } from 'node-appwrite';
import { FAMILY_CONTACT_CLASS_ID, validateFamilyContacts } from './family-contact-schema.js';
export const FAMILY_CONTACT_COLLECTION = 'advisory_family_contacts';
const fail = (message, code=403) => { throw Object.assign(new Error(message), {code}); };
const recordId = userId => createHash('sha256').update(`${FAMILY_CONTACT_CLASS_ID}:${userId}`).digest('hex').slice(0,36);
const project = row => ({userId:row.userId,values:JSON.parse(row.valuesJson),updatedAt:row.updatedAt});
async function ownRecord(db,databaseId,userId) {
  try { return await db.getDocument(databaseId,FAMILY_CONTACT_COLLECTION,recordId(userId)); }
  catch(cause) { if(cause.code===404)return null;throw cause; }
}
export async function familyContactsAction({body,userId,profile,memberClassIds,db,databaseId}) {
  if(body.classId!==FAMILY_CONTACT_CLASS_ID)fail('This form is only for Gr. 9 Boys Advisory.');
  const cls=await db.getDocument(databaseId,'classes',FAMILY_CONTACT_CLASS_ID);
  if(cls.status!=='active')fail('This advisory form is closed.');
  const teacher=cls.teacherId===userId&&['teacher','admin'].includes(profile.role);
  if(!teacher&&!(profile.role==='student'&&memberClassIds.has(FAMILY_CONTACT_CLASS_ID)))fail('You must be enrolled as a student in Gr. 9 Boys Advisory.');
  if(body.action==='readFamilyContacts') {
    if(teacher&&body.preview===true)return {teacher:false,preview:true,response:null};
    if(!teacher){const row=await ownRecord(db,databaseId,userId);return {teacher:false,response:row?project(row):null};}
    const rows=[];let cursor;
    do {
      const page=await db.listDocuments(databaseId,FAMILY_CONTACT_COLLECTION,[Query.equal('classId',FAMILY_CONTACT_CLASS_ID),Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);
      rows.push(...page.documents.map(project));cursor=page.documents.length===100?page.documents.at(-1).$id:null;
    }while(cursor);
    return {teacher:true,rows};
  }
  if(body.action!=='saveFamilyContacts'||teacher)fail('Only enrolled students can submit their own contact details.');
  if(body.confirmed!==true)fail('Please check your details against your card before submitting.',400);
  let values;try{values=validateFamilyContacts(body.values);}catch(cause){fail(cause.message,400);}
  const data={classId:FAMILY_CONTACT_CLASS_ID,userId,valuesJson:JSON.stringify(values),updatedAt:new Date().toISOString()};
  const existing=await ownRecord(db,databaseId,userId);
  if(existing)await db.updateDocument(databaseId,FAMILY_CONTACT_COLLECTION,recordId(userId),data);
  else try{await db.createDocument(databaseId,FAMILY_CONTACT_COLLECTION,recordId(userId),data,[]);}catch(cause){if(cause.code!==409)throw cause;await db.updateDocument(databaseId,FAMILY_CONTACT_COLLECTION,recordId(userId),data);}
  return {saved:true,response:project(data)};
}
