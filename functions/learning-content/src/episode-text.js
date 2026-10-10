import {createHash} from 'node:crypto';
import {STONE_CLASS_ID} from './stone-engine.js';
import {Query} from 'node-appwrite';
import {requireEpisode} from './episode-catalog.js';
const collection='episode_records';
const fail=(message,code=400)=>{throw Object.assign(new Error(message),{code});};
const digest=value=>createHash('sha256').update(value).digest('hex').slice(0,32);
export async function episodeTextAction({body,profile,userId,memberClassIds,db,databaseId}) {
 const cls=await db.getDocument(databaseId,'classes',body.classId);
 const teacher=cls.teacherId===userId&&['teacher','admin'].includes(profile.role);
 if(!teacher&&(profile.role!=='student'||!memberClassIds.has(body.classId)))fail('Class membership required',403);
 if(body.action==='saveEpisodeText'&&!teacher)fail('Only this class’s teacher can edit episode text',403);
 if(body.episode==='teaching-stone') {
  if(body.version!==1||!teacher&&body.classId!==STONE_CLASS_ID)fail('Episode unavailable',403);
 } else requireEpisode(body.classId,body.episode,body.version,teacher);
 const kind='text-'+body.episode+'-v'+body.version;
 let rows;
 try{rows=await db.listDocuments(databaseId,collection,[Query.equal('classId',body.classId),Query.equal('kind',kind),Query.orderDesc('$id'),Query.limit(1)]);}
 catch(e){if(e.code!==404)throw e;if(body.action==='readEpisodeText')return {revision:0,patches:{}};throw new Error('Episode storage is unavailable. Reopen the episode and try again.');}
 const current=rows.documents.length?JSON.parse(rows.documents[0].dataJson):{revision:0,patches:{}};
 if(body.action==='readEpisodeText')return current;
 if(!Number.isSafeInteger(body.revision)||body.revision!==current.revision)fail('This episode was edited elsewhere. Reload the saved text before making this change again.',409);
 const {key,original,text}=body;
 if(typeof key!=='string'||!/^[a-f0-9]{16}$/.test(key)||typeof original!=='string'||!original.trim()||original.length>8000||typeof text!=='string'||!text.trim()||text.length>8000)fail('Choose text and enter between 1 and 8,000 characters.');
 const patches={...current.patches};
 if(text===original)delete patches[key];else patches[key]={original,text};
 const next={revision:current.revision+1,patches};
 if(JSON.stringify(next).length>28000)fail('This episode has reached its text-edit storage limit. Ask for a source update before adding more edits.');
 // Immutable revision IDs arbitrate simultaneous saves without overwriting anyone’s work.
 try{await db.createDocument(databaseId,collection,'et_'+digest(body.classId+':'+kind).slice(0,20)+'_'+String(next.revision).padStart(10,'0'),{classId:body.classId,userId,kind,dataJson:JSON.stringify(next)},[]);}
 catch(e){if(e.code===409)fail('This episode was edited elsewhere. Reload the saved text before making this change again.',409);throw e;}
 return next;
}
