import { executeLearningContent } from './learning-content.service';

export interface ManagedUser {$id:string;name:string;email:string;role:'student'|'parent'|'substitute';classNames:string[];hasLogin:boolean;verified:boolean}
export const listManagedUsers=()=>executeLearningContent<{users:ManagedUser[]}>({action:'listManagedUsers'});
export const updateManagedUserRole=(targetUserId:string,role:'student'|'parent')=>executeLearningContent({action:'updateManagedUserRole',targetUserId,role});
export const resetManagedUserAccount=(targetUserId:string)=>executeLearningContent({action:'resetManagedUserAccount',targetUserId});
