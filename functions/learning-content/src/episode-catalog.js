import {textReleaseAt} from './text-schedule.js';
export const AP_CLASS_ID='88421c66-9cda-4002-8e15-086312b7805e';
const apEpisodes=[{id:'own-english',version:4,title:'The Ride That Wouldn’t Autocorrect',profile:'ap-language',entry:'stories/own-english/v4/index.html',classId:AP_CLASS_ID,assignedDate:'2026-10-13',assignmentId:'ap-own-english-v4',description:'Ride through a rift above CDIS to a university workshop in 2011. Follow your questions with Young, Jordan, and Lin; make three consequential choices about language and a magazine deadline. Answer an objection while advancing a claim.'}];
export const WORLD_LIT_CLASSES=[{id:'09d7f0a7-4c29-462c-820f-e11ea914d375',section:'Red - Sect. 1',canvasCourseId:'21695'},{id:'b0496f4d-5fe7-4cc2-8940-d1ba2e50a28c',section:'Blue Sect. 2',canvasCourseId:'21824'}];
const journalEpisodes=[{id:'a-knight-needs-a-witness',title:'A Knight Needs a Witness',description:'Step alone through the Question Journal into La Mancha. Become Quixote’s appointed chronicler; investigate books, armor, and names through characterization, diction, and parody.'},{id:'the-giants-have-sails',title:'The Giants Have Sails',description:'Witness the windmill encounter with Quixote and Sancho. Investigate irony, juxtaposition, counterevidence, and perspective; record a disagreement without erasing the evidence.'}];
export const episodes=[...apEpisodes,...WORLD_LIT_CLASSES.flatMap(cls=>journalEpisodes.map(e=>({...e,version:1,profile:'world-literature',entry:'stories/'+e.id+'/v1/index.html',classId:cls.id,assignedDate:'2026-10-12',releaseAt:'2026-10-12T00:00:00Z',assignmentId:cls.id+'-'+e.id+'-v1',minutes:15})))];
export const episodeReleaseAt=e=>e.releaseAt||e.assignedDate&&textReleaseAt(e.assignedDate);
const released=(e,preview,now)=>preview||Number.isFinite(Date.parse(episodeReleaseAt(e)))&&Date.parse(episodeReleaseAt(e))<=now;
export const archivedEpisodes=[1,2,3].flatMap(version=>apEpisodes.map(e=>({...e,version,entry:'stories/own-english/v'+version+'/index.html',assignmentId:'ap-own-english-v'+version})));
export function availableEpisodeVersions(classId,preview=false,now=Date.now()){return [...episodes,...archivedEpisodes].filter(e=>e.classId===classId&&released(e,preview,now));}
export function assignedEpisodes(classId,preview=false,now=Date.now()){return episodes.filter(e=>e.classId===classId&&released(e,preview,now));}
export function requireEpisode(classId,id,version,preview=false,now=Date.now()){
 const episode=availableEpisodeVersions(classId,preview,now).find(e=>e.id===id&&e.version===version);
 if(!episode)throw Object.assign(new Error('Episode is not assigned or released for this class.'),{code:403});return episode;
}
