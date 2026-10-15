import {createHash} from 'node:crypto';
import {Query} from 'node-appwrite';
export const writingWorkspace = id => createHash('sha256').update(`writing:${id}`).digest('hex').slice(0,32);
export const writingSettings = session => {
  let saved={};try{saved=JSON.parse(session.notesMarkdown||'{}');}catch{/* legacy */}
  return {...saved,discussionMode:saved.discussionMode===true,studentsCanView:typeof saved.studentsCanView==='boolean'?saved.studentsCanView:session.status==='published'};
};
export const writingArchive = session => `# Writing Prompt\n\n${session.promptMarkdown||''}\n\n[Open writing prompt](/presentations/${session.$id}/live)`;
export async function listAll(db,databaseId,collection,queries=[]) {
  const rows=[];let cursor;
  do {const page=await db.listDocuments(databaseId,collection,[...queries,Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]);rows.push(...page.documents);cursor=page.documents.length===100?page.documents.at(-1).$id:null;}while(cursor);
  return rows;
}
export async function writingRoots(db,databaseId,session) {
  const questions=await listAll(db,databaseId,'discussion_questions',[Query.equal('classSessionId',session.$id)]);
  const rows=[];
  for(const question of questions) rows.push(...await listAll(db,databaseId,'discussion_answers',[Query.equal('questionId',question.$id)]));
  return rows.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.$id.localeCompare(b.$id)).map(row=>({id:row.$id,authorId:row.authorId,parentId:null,category:'question',content:row.answerText,quotation:'',paragraph:null,label:`Response ${createHash('sha256').update(row.$id).digest('hex').slice(0,8).toUpperCase()}`,teacher:false,createdAt:row.createdAt,...(row.updatedAt&&row.updatedAt!==row.createdAt?{updatedAt:row.updatedAt}:{}),hidden:false,locked:false,pinned:false,writingRoot:true}));
}
