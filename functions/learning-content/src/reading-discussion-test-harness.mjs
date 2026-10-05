import {vi} from 'vitest';
import {readingDiscussionAction} from './reading-discussion.js';
export function harness() {
  const storage={
    classes:[{$id:'blue',teacherId:'teacher',courseName:'Literature',name:'Blue'},{$id:'red',teacherId:'teacher',courseName:'Literature',name:'Red'}],
    texts:[{$id:'text',title:'A reading',status:'published'}],
    text_assignments:[{$id:'ab',textId:'text',classId:'blue',isAssignedReading:true,assignedAt:'2026-09-01',dueDate:'2026-09-15'},{$id:'ar',textId:'text',classId:'red',isAssignedReading:true,assignedAt:'2026-09-01',dueDate:'2026-09-16'}],
    class_members:[{$id:'mb',userId:'student',classId:'blue',role:'student'},{$id:'mr',userId:'peer',classId:'red',role:'student'}],
    reading_question_state:[],reading_question_drafts:[],reading_reply_rounds:[],reading_settings:[],users:[{$id:'student',name:'Student'},{$id:'peer',name:'Peer'}],reading_posts:[],reading_votes:[],reading_reports:[],
  };
  const transactions=new Map();let revision=0,nextTransaction=0;
  const store=transactionId=>transactionId?transactions.get(transactionId).storage:storage;
  const db={
    createTransaction:vi.fn(async()=>{const id=String(++nextTransaction);transactions.set(id,{storage:structuredClone(storage),revision});return {$id:id};}),
    updateTransaction:vi.fn(async({transactionId,commit})=>{const t=transactions.get(transactionId);if(commit){if(t.revision!==revision)throw Object.assign(Error('Transaction conflict'),{code:409});Object.assign(storage,t.storage);revision++;}transactions.delete(transactionId);}),
    getDocument:vi.fn(async(_,collection,id,queries,transactionId)=>{const doc=store(transactionId)[collection].find(r=>r.$id===id);if(!doc)throw Object.assign(Error('Missing'),{code:404});return structuredClone(doc);}),
    listDocuments:vi.fn(async(_,collection,queries,transactionId)=>{
      let rows=structuredClone(store(transactionId)[collection]);let limit=100;
      for(const raw of queries){const q=JSON.parse(raw);if(q.method==='equal')rows=rows.filter(r=>q.values.includes(r[q.attribute]));if(q.method==='cursorAfter')rows=rows.slice(rows.findIndex(r=>r.$id===q.values[0])+1);if(q.method==='limit')limit=q.values[0];}
      return {documents:rows.slice(0,limit),total:rows.length};
    }),
    createDocument:vi.fn(async(_,collection,id,data,permissions,transactionId)=>{const current=store(transactionId);if(current[collection].some(r=>r.$id===id))throw Object.assign(Error('Conflict'),{code:409});const doc={$id:id,...data};current[collection].push(doc);return structuredClone(doc);}),
    updateDocument:vi.fn(async(_,collection,id,data,permissions,transactionId)=>Object.assign(store(transactionId)[collection].find(r=>r.$id===id),data)),
    deleteDocument:vi.fn(async(_,collection,id,transactionId)=>{const current=store(transactionId);current[collection]=current[collection].filter(r=>r.$id!==id);}),
  };
  const call=(body,identity={userId:'student',role:'student',classIds:['blue']})=>readingDiscussionAction({body:{textId:'text',classId:'blue',...body},profile:{role:identity.role},userId:identity.userId,memberClassIds:new Set(identity.classIds),db,databaseId:'main'});
  const teacher={userId:'teacher',role:'teacher',classIds:[]};
  return {storage,db,call,teacher};
}
