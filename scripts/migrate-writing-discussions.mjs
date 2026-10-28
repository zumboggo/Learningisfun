// Normalizes archives without deleting submissions, and closes legacy browser
// access that could bypass anonymity. Deploy learning-content before --apply.
import {Client,Databases,Query} from 'node-appwrite';
import {listAll,writingSettings,writingArchive,writingWorkspace} from '../functions/learning-content/src/writing-discussion.js';
import {atomicDiscussion,guardWorkspace} from '../functions/learning-content/src/curated-questions.js';
const apply=process.argv.includes('--apply');
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
const databaseId=process.env.APPWRITE_DATABASE_ID||'main';
for(const id of ['reading_posts','reading_settings','reading_reply_rounds','reading_question_state']){
 const c=await db.getCollection(databaseId,id);
 if(c.$permissions.length||c.documentSecurity)throw Error(`${id} must be server-only`);
}
for(const id of ['discussion_answers','discussion_questions','class_sessions']){
 const c=await db.getCollection(databaseId,id),permissions=[];
 if(apply)await db.updateCollection(databaseId,id,c.name,permissions,false,c.enabled);
 console.log(`${apply?'Applied':'Planned'} ${id}: ${id==='discussion_answers'?'server-only':'browser read-only; writes use authorized backend'}`);
}
const sessions=await listAll(db,databaseId,'class_sessions',[Query.equal('discussionType','presentation')]);
let changed=0;
for(const session of sessions){
 if(apply)await atomicDiscussion({body:{action:'migrateWriting'},db,databaseId},async({db})=>{
  await guardWorkspace(db,databaseId,writingWorkspace(session.$id));
  const current=await db.getDocument(databaseId,'class_sessions',session.$id);
  const next={notesMarkdown:JSON.stringify(writingSettings(current)),publishedNotesMarkdown:current.status==='published'?writingArchive(current):''};
  if(current.notesMarkdown!==next.notesMarkdown||current.publishedNotesMarkdown!==next.publishedNotesMarkdown){await db.updateDocument(databaseId,'class_sessions',current.$id,next);changed++;}
 });
}
console.log(JSON.stringify({mode:apply?'applied':'dry-run',writingSessions:sessions.length,normalized:changed}));
