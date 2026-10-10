export interface Episode {id:string;version:number;title:string;profile:string;entry:string;classId:string;assignedDate:string|null;assignmentId:string;description:string;releaseAt?:string;minutes?:number;}
export const AP_CLASS_ID:string;
export const episodes:Episode[];
export function assignedEpisodes(classId:string,preview?:boolean,now?:number):Episode[];
export function requireEpisode(classId:string,id:string,version:number,preview?:boolean,now?:number):Episode;

export function availableEpisodeVersions(classId:string,preview?:boolean,now?:number):Episode[];

export const WORLD_LIT_CLASSES:{id:string;section:string;canvasCourseId:string}[];
export function episodeReleaseAt(e:Episode):string|null;
