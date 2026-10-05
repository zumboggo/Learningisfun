import { randomUUID } from 'node:crypto';

export const curatedActions = ['saveReadingQuestionDraft','deleteReadingQuestionDraft','publishReadingQuestions','withdrawReadingQuestion','previewReadingAssignments','publishReadingAssignments'];
export const readingMutation = action => !['readReadingDiscussion','listReadingDiscussions','previewReadingAssignments'].includes(action);

// Stage the shared workspace guard BEFORE reading posts or rounds. Every writer
// touches it, so a conflicting commit retries with fresh quota/thread state.
export async function atomicDiscussion(args, run) {
  if (!readingMutation(args.body.action)) return run(args);
  for (let attempt = 0; attempt < 5; attempt++) {
    const transaction = await args.db.createTransaction({ttl:60});
    const transactionId = transaction.$id, source = args.db;
    const db = {
      getDocument:(databaseId,collectionId,documentId)=>source.getDocument(databaseId,collectionId,documentId,[],transactionId),
      listDocuments:(databaseId,collectionId,queries)=>source.listDocuments(databaseId,collectionId,queries,transactionId),
      createDocument:(databaseId,collectionId,documentId,data,permissions=[])=>source.createDocument(databaseId,collectionId,documentId,data,permissions,transactionId),
      updateDocument:(databaseId,collectionId,documentId,data)=>source.updateDocument(databaseId,collectionId,documentId,data,undefined,transactionId),
      deleteDocument:(databaseId,collectionId,documentId)=>source.deleteDocument(databaseId,collectionId,documentId,transactionId),
    };
    try {
      const result = await run({...args,db,transactionId});
      await source.updateTransaction({transactionId,commit:true});
      return result;
    } catch (error) {
      await source.updateTransaction({transactionId,rollback:true}).catch(()=>{});
      if (error.code !== 409 || attempt === 4) throw error;
    }
  }
}
export async function guardWorkspace(db,databaseId,workspaceId) {
  const data={workspaceId,dataJson:JSON.stringify({revision:randomUUID()})};
  try { await db.getDocument(databaseId,'reading_question_state',workspaceId); }
  catch(error) { if(error.code!==404)throw error;await db.createDocument(databaseId,'reading_question_state',workspaceId,data,[]);return; }
  await db.updateDocument(databaseId,'reading_question_state',workspaceId,data);
}

// Augmenting paths maximize distinct coverage even when self-answer exclusions
// make a greedy shuffle leave avoidable gaps. Rank questions before matching;
// shuffle student priority, then fill spare students from eligible top questions.
export function allocateQuestions(students, questions, random=Math.random) {
  const shuffled=[...students];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const ranked=[...questions].sort((a,b)=>Number(b.unanswered)-Number(a.unanswered)||b.score-a.score||a.id.localeCompare(b.id));
  const owners=new Map(), assignments=new Map();
  const match=(question,seen)=>{
    for(const student of shuffled){
      if(student===question.authorId||seen.has(student))continue;
      seen.add(student);
      const previous=assignments.get(student);
      if(!previous||match(previous,seen)){assignments.set(student,question);owners.set(question.id,student);return true;}
    }
    return false;
  };
  for(const question of ranked)match(question,new Set());
  // Any question evicted along an augmenting path retains its new owner; derive
  // loads from final assignments rather than the intermediate owner map.
  const loads=new Map();for(const q of assignments.values())loads.set(q.id,(loads.get(q.id)||0)+1);
  for(const student of shuffled){
    if(assignments.has(student))continue;
    const eligible=ranked.filter(q=>q.authorId!==student);
    const unanswered=eligible.filter(q=>q.unanswered);
    const pool=unanswered.length?unanswered:eligible;
    const chosen=[...pool].sort((a,b)=>(loads.get(a.id)||0)-(loads.get(b.id)||0)||b.score-a.score||a.id.localeCompare(b.id))[0];
    if(chosen){assignments.set(student,chosen);loads.set(chosen.id,(loads.get(chosen.id)||0)+1);}
  }
  return students.map(studentId=>({studentId,questionId:assignments.get(studentId)?.id||null,status:assignments.has(studentId)?'pending':'gap'}));
}
