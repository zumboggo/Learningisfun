import {test,expect,vi} from 'vitest';
import {episodeSharingAction,readPublicEpisode} from './public-episode.js';
import {readPublicText} from './public-reading.js';
function setup(){
 const records=new Map([['version',{dataJson:JSON.stringify({type:'animated-version',teacherId:'owner',fileId:'file'})}]]);
 const db={getDocument:vi.fn(async(_,__,id)=>{if(!records.has(id))throw Object.assign(Error('missing'),{code:404});return records.get(id);}),createDocument:vi.fn(async(_,__,id,data)=>{records.set(id,data);}),updateDocument:vi.fn(async(_,__,id,data)=>records.set(id,{...records.get(id),...data}))};
 const storage={getFileDownload:vi.fn(async()=>({format:2,title:'Story'}))};
 const manage=(body={},role='teacher',userId='owner')=>episodeSharingAction({body:{action:'readEpisodePublicSharing',versionId:'version',...body},profile:{role},userId,db,databaseId:'db'});
 const read=shareId=>readPublicText({body:{action:'readEpisode',shareId},db,databaseId:'db',storage});return {manage,read,db,storage,records};
}
test('private by default, owner enables stable guest link, revocation blocks new reads',async()=>{
 const {manage,read,storage}=setup();const initial=await manage();expect(initial.enabled).toBe(false);await expect(read(initial.shareId)).rejects.toThrow();
 const publicState=await manage({action:'setEpisodePublicSharing',enabled:true});expect(publicState.shareId).toBe(initial.shareId);expect(await read(publicState.shareId)).toEqual({pack:{format:2,title:'Story'}});
 await manage({action:'setEpisodePublicSharing',enabled:false});await expect(read(publicState.shareId)).rejects.toThrow('not publicly');expect(storage.getFileDownload).toHaveBeenCalledTimes(1);
});
test('students and other teachers cannot read or change share settings',async()=>{
 const {manage,db}=setup();for(const action of ['readEpisodePublicSharing','setEpisodePublicSharing'])for(const [role,user] of [['student','owner'],['teacher','other']])await expect(manage({action,enabled:true},role,user)).rejects.toThrow('owner');expect(db.createDocument).not.toHaveBeenCalled();expect(db.updateDocument).not.toHaveBeenCalled();
});
test('guest reader rejects private-record IDs, invalid IDs, disabled records, and write actions',async()=>{
 const {db,storage,records,manage}=setup();const {shareId}=await manage();records.set(shareId,{dataJson:JSON.stringify({type:'animated-attempt',enabled:true,fileId:'file'})});
 for(const body of [{action:'readEpisode',shareId},{action:'readEpisode',shareId:'../secret'},{action:'setEpisodePublicSharing',shareId}])await expect(readPublicEpisode({body,db,databaseId:'db',storage})).rejects.toThrow();expect(storage.getFileDownload).not.toHaveBeenCalled();
});
