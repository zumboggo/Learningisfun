import {createHash, randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';
import {Query} from 'node-appwrite';
import {atomicDiscussion,guardWorkspace} from './curated-questions.js';
export const WORKSPACE='teacher_workspace';
export const recordId=(owner,key)=>createHash('sha256').update(owner+':'+key).digest('hex').slice(0,36);
export const fail=(message,code=400)=>{throw Object.assign(new Error(message),{code});};
export const isOwnerAdmin=userId=>Boolean(process.env.OWNER_ACCOUNT_ID)&&userId===process.env.OWNER_ACCOUNT_ID;
export async function readRecord(db,databaseId,owner,key){try{const row=await db.getDocument(databaseId,WORKSPACE,recordId(owner,key));if(row.ownerId!==owner||row.kind!==key)fail('Record unavailable',403);return {value:JSON.parse(row.dataJson),revision:row.revision};}catch(e){if(e.code===404)return {value:null,revision:0};throw e;}}
export async function writeRecord(db,databaseId,owner,key,value,revision){const data={ownerId:owner,kind:key,dataJson:JSON.stringify(value),revision:revision+1};if(data.dataJson.length>900000)fail('This workspace is too large; split the plan.');if(revision)await db.updateDocument(databaseId,WORKSPACE,recordId(owner,key),data);else await db.createDocument(databaseId,WORKSPACE,recordId(owner,key),data,[]);return {value,revision:revision+1};}
export const atomic=(args,run)=>atomicDiscussion({...args,body:{action:'teacherWorkspaceMutation'}},async tx=>{await guardWorkspace(tx.db,args.databaseId,recordId('teacher-lock',args.transactionOwner||args.userId));return run(tx);});
export async function allRows(db,databaseId,collection,queries=[]){const rows=[];let cursor;do{const page=await db.listDocuments(databaseId,collection,[...queries,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);rows.push(...page.documents);cursor=page.documents.length===100?page.documents.at(-1).$id:null;}while(cursor);return rows;}
export function hashInvitation(code){if(typeof code!=='string'||code.length<12||code.length>128)fail('Use an invitation code between 12 and 128 characters.');const salt=randomBytes(16).toString('hex');return {salt,hash:scryptSync(code,salt,32).toString('hex'),enabled:true};}
export function matchesInvitation(code,config){if(typeof code!=='string'||code.length>128||!config?.enabled||!config.hash||!config.salt)return false;const expected=Buffer.from(config.hash,'hex'),actual=scryptSync(code,config.salt,32);return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export async function teacherWorkspaceAction(args){const {body,profile,userId,db,databaseId}=args,admin=isOwnerAdmin(userId);
 if(body.action==='redeemTeacherInvitation'){
  if(profile.role==='teacher')return {ok:true};
  if(profile.role!=='student')fail('Only student accounts can redeem teacher invitations.',403);
  const result=await atomic(args,async({db})=>{const key='invite-attempts:'+new Date().toISOString().slice(0,13);const state=await readRecord(db,databaseId,userId,key);const attempts=state.value?.attempts||0;if(attempts>=5)return {error:'Too many attempts. Try again in an hour.'};await writeRecord(db,databaseId,userId,key,{attempts:attempts+1},state.revision);const {value:invite}=await readRecord(db,databaseId,'system','invitation');if(!matchesInvitation(body.code,invite))return {error:'The invitation code is invalid or disabled.'};await db.updateDocument(databaseId,'users',userId,{role:'teacher'});return {ok:true};});
  if(result.error)fail(result.error,403);return result;
 }
 if(!['teacher','admin'].includes(profile.role))fail('Teacher account required',403);
 if(body.action==='readTeacherPreferences'){const prefs=await readRecord(db,databaseId,userId,'preferences');return {...prefs,isOwnerAdmin:admin,legacyPlanner:admin};}
 if(body.action==='saveTeacherPreferences')return atomic(args,async({db})=>{const current=await readRecord(db,databaseId,userId,'preferences');if(body.revision!==current.revision)fail('Settings changed elsewhere. Reload before saving.',409);const value={...current.value};if(typeof body.presentationFolderUrl==='string'){const url=body.presentationFolderUrl.trim();if(url&&!/^https:\/\//i.test(url))fail('Use an HTTPS folder link.');if(url)new URL(url);value.presentationFolderUrl=url.slice(0,2048);}if(typeof body.authoringGuidance==='string')value.authoringGuidance=body.authoringGuidance.slice(0,16000);return writeRecord(db,databaseId,userId,'preferences',value,current.revision);});
 if(body.action==='manageTeacherInvitation'){if(!admin)fail('Administrator access required',403);return atomic(args,async({db})=>{const current=await readRecord(db,databaseId,'system','invitation');const value=body.code?hashInvitation(body.code):{...current.value,enabled:body.enabled===true};await writeRecord(db,databaseId,'system','invitation',value,current.revision);return {enabled:value.enabled};});}
 if(body.action==='readTeacherInvitation'){if(!admin)fail('Administrator access required',403);const current=await readRecord(db,databaseId,'system','invitation');return {enabled:current.value?.enabled===true};}
 fail('Unknown teacher operation');
}
