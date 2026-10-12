import {episodeDb,type EpisodeAttempt,type JournalReflection} from './episodes.service';
import {executeLearningContent} from './learning-content.service';
export const reflectionId=(a:EpisodeAttempt)=>[a.userId,a.classId,a.assignmentId,a.attemptId].join(':');
export async function draftReflection(a:EpisodeAttempt,text:string){
 if(text.length>4000)throw new Error('Keep your response within 4000 characters.');
 return episodeDb.transaction('rw',episodeDb.reflections,async()=>{const id=reflectionId(a),old=await episodeDb.reflections.get(id);const row:JournalReflection={id,userId:a.userId,classId:a.classId,attemptId:a.attemptId,episode:a.episode,version:a.version,assignmentId:a.assignmentId,text,revision:old?.revision||0,editRevision:(old?.editRevision||0)+1,pending:!a.preview,updatedAt:new Date().toISOString()};await episodeDb.reflections.put(row);return row;});
}
const request=(a:EpisodeAttempt,action:string,extra:Record<string,unknown>={})=>executeLearningContent<{reflection:{text:string;revision:number;updatedAt:string}|null}>({action,classId:a.classId,episode:a.episode,version:a.version,attemptId:a.attemptId,...extra});
export async function loadReflection(a:EpisodeAttempt){
 const id=reflectionId(a),local=await episodeDb.reflections.get(id);if(a.preview||!navigator.onLine)return local;
 const result=await request(a,'readJournalReflection');
 return episodeDb.transaction('rw',episodeDb.reflections,async()=>{const current=await episodeDb.reflections.get(id);if(current?.pending||!result.reflection)return current;const row:JournalReflection={id,userId:a.userId,classId:a.classId,attemptId:a.attemptId,episode:a.episode,version:a.version,assignmentId:a.assignmentId,...result.reflection,editRevision:current?.editRevision||0,pending:false};await episodeDb.reflections.put(row);return row;});
}
export async function syncReflection(a:EpisodeAttempt){
 const id=reflectionId(a),sent=await episodeDb.reflections.get(id);if(!sent||a.preview||!sent.pending)return;if(!navigator.onLine)throw new Error('Saved on this device. Reconnect to save to your account.');
 const {reflection}=await request(a,'saveJournalReflection',{text:sent.text,baseRevision:sent.revision});if(!reflection)throw new Error('Writing acknowledgement missing.');
 await episodeDb.transaction('rw',episodeDb.reflections,async()=>{const current=await episodeDb.reflections.get(id);if(!current)return;await episodeDb.reflections.put({...current,revision:Math.max(current.revision,reflection.revision),pending:current.editRevision!==sent.editRevision});});
}
