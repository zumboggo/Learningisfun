import {textReleaseAt} from './text-schedule.js';
export const AP_CLASS_ID='88421c66-9cda-4002-8e15-086312b7805e';
export const episodes=[{id:'own-english',version:4,title:'The Ride That Wouldn’t Autocorrect',profile:'ap-language',entry:'stories/own-english/v4/index.html',classId:AP_CLASS_ID,assignedDate:'2026-10-13',assignmentId:'ap-own-english-v4',description:'Ride through a rift above CDIS to a university workshop in 2011. Follow your questions with Young, Jordan, and Lin; make three consequential choices about language and a magazine deadline. Answer an objection while advancing a claim.'}];
export const archivedEpisodes=[1,2,3].flatMap(version=>episodes.map(e=>({...e,version,entry:'stories/own-english/v'+version+'/index.html',assignmentId:'ap-own-english-v'+version})));
export function availableEpisodeVersions(classId,preview=false,now=Date.now()){return [...episodes,...archivedEpisodes].filter(e=>e.classId===classId&&(preview||e.assignedDate&&Date.parse(textReleaseAt(e.assignedDate))<=now));}
export function assignedEpisodes(classId,preview=false,now=Date.now()){return episodes.filter(e=>e.classId===classId&&(preview||e.assignedDate&&Date.parse(textReleaseAt(e.assignedDate))<=now));}
export function requireEpisode(classId,id,version,preview=false,now=Date.now()){
 const episode=availableEpisodeVersions(classId,preview,now).find(e=>e.id===id&&e.version===version);
 if(!episode)throw Object.assign(new Error('Episode is not assigned or released for this class.'),{code:403});return episode;
}
