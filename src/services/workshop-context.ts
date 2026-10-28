import {WORKSHOP_CLASS_ID,WORKSHOP_LEARNER_ACTIONS} from '../../functions/learning-content/src/workshop-policy.js';
export {WORKSHOP_CLASS_ID};
export interface WorkshopAccess {classId:string;name:string;section:string;owner:boolean;enrolled:boolean;eligible:boolean}
export function isWorkshopPath(pathname:string,search=''){
 return pathname==='/workshop'||pathname===`/classes/${WORKSHOP_CLASS_ID}`||pathname.startsWith(`/classes/${WORKSHOP_CLASS_ID}/`)||pathname.startsWith('/discussions/texts/')&&pathname.endsWith('/'+WORKSHOP_CLASS_ID)||new URLSearchParams(search).get('workshop')===WORKSHOP_CLASS_ID||new URLSearchParams(search).get('classId')===WORKSHOP_CLASS_ID||new URLSearchParams(search).get('class')===WORKSHOP_CLASS_ID;
}
export function workshopLocation(){const [path,search='']=window.location.hash.slice(1).split('?');return isWorkshopPath(path,search);}
export function workshopPayload(body:Record<string,unknown>){return body.workshop===undefined&&workshopLocation()&&WORKSHOP_LEARNER_ACTIONS.includes(String(body.action))?{...body,workshop:true}:body;}
export function workshopLink(to:string){if(!workshopLocation()||!/^\/(texts\/|discussions\/|decks\/[^/]+\/review|quizzes\/[^/]+\/take|game\/play\/|presentations\/|peer-reviews\/)/.test(to))return to;const [path,search='']=to.split('?'),params=new URLSearchParams(search);params.set('workshop',WORKSHOP_CLASS_ID);return path+'?'+params;}

export const workshopReturn = (fallback:string) => workshopLocation() ? `/classes/${WORKSHOP_CLASS_ID}` : fallback;
