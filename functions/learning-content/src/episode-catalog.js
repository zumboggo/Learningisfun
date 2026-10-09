import {textReleaseAt} from './text-schedule.js';
export const AP_CLASS_ID='88421c66-9cda-4002-8e15-086312b7805e';
export const episodes=[{id:'own-english',version:1,title:'The Ride That Wouldn’t Autocorrect',profile:'ap-language',entry:'stories/own-english/v1/index.html',classId:AP_CLASS_ID,assignedDate:'2026-10-13',assignmentId:'ap-own-english-v1',description:'A magical DiDi, a lecture, and a magazine decision. Answer an objection while advancing a claim.'}];
export function assignedEpisodes(classId,preview=false,now=Date.now()){return episodes.filter(e=>e.classId===classId&&(preview||e.assignedDate&&Date.parse(textReleaseAt(e.assignedDate))<=now));}
export function requireEpisode(classId,id,version,preview=false,now=Date.now()){
 const episode=assignedEpisodes(classId,preview,now).find(e=>e.id===id&&e.version===version);
 if(!episode)throw Object.assign(new Error('Episode is not assigned or released for this class.'),{code:403});return episode;
}
