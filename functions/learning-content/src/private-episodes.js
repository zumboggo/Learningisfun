import {privateMediaUrls} from './private-media.js';
import {readRecord,fail,isOwnerAdmin} from './teacher-workspace.js';
import {requireEpisode} from './episode-catalog.js';
import {STONE_CLASS_ID} from './stone-engine.js';
export async function privateEpisodeAction({body,profile,userId,memberClassIds,db,databaseId,storage}){
 if(typeof body.classId!=='string')fail('Class required');const cls=await db.getDocument(databaseId,'classes',body.classId),owner=['teacher','admin'].includes(profile.role)&&cls.teacherId===userId;
 if(!owner&&(profile.role!=='student'||!memberClassIds.has(body.classId)))fail('Episode unavailable',403);
 if(body.episode==='teaching-stone'){if(body.classId!==STONE_CLASS_ID||body.version!==1)fail('Episode unavailable',403);}else requireEpisode(body.classId,body.episode,body.version,owner);
 const record=await readRecord(db,databaseId,'system','private-episode:'+body.episode+':'+body.version);if(!record.value)fail('This episode is awaiting private migration.',503);
 const raw=await storage.getFileDownload({bucketId:'animated-episodes',fileId:record.value.fileId});return raw?.html?raw:JSON.parse(Buffer.from(raw).toString('utf8'));
}

export async function privateAnimatedPreviewAction({body,userId,db,databaseId,storage,tokens,endpoint,projectId}){
 if(!isOwnerAdmin(userId))fail('This preview belongs to another teacher.',403);
 if(typeof body.slug!=='string'||!/^[a-z0-9-]{1,80}$/.test(body.slug))fail('Invalid preview');
 const record=await readRecord(db,databaseId,'system','private-preview:'+body.slug);if(!record.value)fail('Preview unavailable',404);
 const raw=await storage.getFileDownload({bucketId:'animated-episodes',fileId:record.value.fileId}),pack=raw?.format?raw:JSON.parse(Buffer.from(raw).toString());
 return {pack,mediaUrls:await privateMediaUrls({pack,db,databaseId,tokens,endpoint,projectId})};
}
