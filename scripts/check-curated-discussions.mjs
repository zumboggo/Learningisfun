// Run with an existing server credential file using node --env-file=... .
// Checks private schema and real transaction conflict detection before rollout.
import {Client,Databases,ID} from 'node-appwrite';
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const db=new Databases(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
for(const collectionId of ['reading_question_state','reading_question_drafts','reading_reply_rounds']){
 const c=await db.getCollection({databaseId,collectionId});
 if(c.$permissions.length||c.documentSecurity)throw Error(`${collectionId} must be server-only`);
 if(c.attributes.some(a=>a.status!=='available')||c.indexes.some(i=>i.status!=='available'))throw Error(`${collectionId}: schema still building`);
 console.log(`${collectionId}: private schema ready`);
}
const documentId=ID.unique(),collectionId='reading_question_state';
const transactions=[];
try{
 await db.createDocument({databaseId,collectionId,documentId,data:{workspaceId:'deployment-probe',dataJson:'{}'},permissions:[]});
 for(let i=0;i<2;i++){
  const t=await db.createTransaction({ttl:60});transactions.push(t.$id);
  await db.updateDocument({databaseId,collectionId,documentId,data:{dataJson:JSON.stringify({probe:i})},transactionId:t.$id});
 }
 await db.updateTransaction({transactionId:transactions[0],commit:true});
 let conflict=false;
 try{await db.updateTransaction({transactionId:transactions[1],commit:true});}catch(e){if(e.code!==409)throw e;conflict=true;}
 if(!conflict)throw Error('Server did not reject a conflicting transaction; do not enable the interface');
 console.log('Deployed transactions: atomic commits and conflicts verified');
}finally{
 for(const transactionId of transactions)await db.updateTransaction({transactionId,rollback:true}).catch(()=>{});
 await db.deleteDocument({databaseId,collectionId,documentId}).catch(()=>{});
}
