export interface Episode {id:string;version:number;title:string;profile:string;entry:string;classId:string;assignedDate:string|null;assignmentId:string;description:string;}
export const AP_CLASS_ID:string;
export const episodes:Episode[];
export function assignedEpisodes(classId:string,preview?:boolean,now?:number):Episode[];
export function requireEpisode(classId:string,id:string,version:number,preview?:boolean,now?:number):Episode;
