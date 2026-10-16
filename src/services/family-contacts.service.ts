import {executeLearningContent} from './learning-content.service';
export {FAMILY_CONTACT_CLASS_ID,FAMILY_CONTACT_FIELDS,blankFamilyContacts,validateFamilyContacts,familyContactsTsv} from '../../functions/learning-content/src/family-contact-schema.js';
export interface FamilyContactResponse {userId:string;values:string[];updatedAt:string;}
export type FamilyContactData = {teacher:true;rows:FamilyContactResponse[]}|{teacher:false;preview?:boolean;response:FamilyContactResponse|null};
// Intentionally online-only: no IndexedDB, sync queue, localStorage, or AI calls.
export const readFamilyContacts=(classId:string,preview=false)=>executeLearningContent<FamilyContactData>({action:'readFamilyContacts',classId,preview});
export const saveFamilyContacts=(classId:string,values:string[])=>executeLearningContent<{saved:true;response:FamilyContactResponse}>({action:'saveFamilyContacts',classId,values,confirmed:true});
