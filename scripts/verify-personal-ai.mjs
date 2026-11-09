// Live isolation and rejection checks. Synthetic tokens cannot incur provider charges.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {Client,Databases,Functions,Users,Query} from 'node-appwrite';
import {encryptCredential,monthKey} from '../functions/learning-content/src/ai-billing.js';
import {allRows,writeRecord,readRecord,recordId} from '../functions/learning-content/src/teacher-workspace.js';
loadEnvFile(homedir()+'/.config/learningisfun/appwrite.env');
process.env.AI_CREDENTIAL_ENCRYPTION_KEY=readFileSync(homedir()+'/.config/learningisfun/ai-credential-encryption.key','utf8').trim();
const endpoint=process.env.APPWRITE_ENDPOINT,project=process.env.APPWRITE_PROJECT_ID,databaseId=process.env.APPWRITE_DATABASE_ID||'main',admin=new Client().setEndpoint(endpoint).setProject(project).setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin),created=[];
async function call(client,body){const r=await new Functions(client).createExecution({functionId:'learning-content',body:JSON.stringify(body)});const value=JSON.parse(r.responseBody||'{}');if(r.responseStatusCode>=400||value.error)throw Object.assign(Error(value.error||'Execution failed'),{code:r.responseStatusCode});return value;}
async function account(role){const id='aicheck-'+randomUUID().slice(0,20);await users.create({userId:id,email:id+'@example.invalid',password:randomUUID()+'Aa1!',name:'Temporary AI connection check'});created.push(id);const session=await users.createSession({userId:id}),jwt=await users.createJWT({userId:id,sessionId:session.$id,duration:900}),client=new Client().setEndpoint(endpoint).setProject(project).setJWT(jwt.jwt);await call(client,{action:'selfProfile'});if(role==='teacher')await db.updateDocument(databaseId,'users',id,{role});return {id,client};}
try{
 const teacher=await account('teacher'),other=await account('teacher'),student=await account('student');
 let status=await call(teacher.client,{action:'readAIConnections'});assert(status.configured);assert(!status.providers.openrouter.connected);assert(!status.providers.replicate.connected);
 await assert.rejects(call(student.client,{action:'readAIConnections'}),e=>e.code===403);
 await assert.rejects(call(student.client,{action:'generateCharacterRecipes',description:'A reader'}),e=>e.code===403);
 await assert.rejects(call(teacher.client,{action:'connectAIProvider',provider:'openrouter',revision:0,token:'synthetic-invalid-test-token'}),/validate/);
 assert.equal((await call(teacher.client,{action:'readAIConnections'})).providers.openrouter.revision,0);
 await writeRecord(db,databaseId,teacher.id,'ai-allowance',{usd:0},0);
 // Seed only disposable test credentials to exercise the deployed decrypt/routing path.
 for(const provider of ['openrouter','replicate']){const id=randomUUID(),epoch=randomUUID(),token='invalid-live-check-'+randomUUID(),envelope=encryptCredential(token,teacher.id,provider,id);await writeRecord(db,databaseId,teacher.id,'ai-secret:'+provider+':'+id,{envelope,epoch,account:'synthetic test account'},0);await writeRecord(db,databaseId,teacher.id,'ai-connection:'+provider,{credentialId:id,versions:[id],epoch,masked:'••••test',validatedAt:null},0);await assert.rejects(new Databases(teacher.client).getDocument({databaseId,collectionId:'teacher_workspace',documentId:recordId(teacher.id,'ai-secret:'+provider+':'+id)}));}
 status=await call(teacher.client,{action:'readAIConnections'});assert(status.providers.openrouter.connected);assert(!JSON.stringify(status).includes('envelope'));assert(!JSON.stringify(status).includes('invalid-live-check'));
 assert(!(await call(other.client,{action:'readAIConnections',ownerId:teacher.id})).providers.openrouter.connected);
 const catalog=await call(teacher.client,{action:'readImageModels'});assert.equal(catalog.billing,'personal');assert.equal(catalog.models.filter(m=>m.enabled).length,1);
 await call(teacher.client,{action:'saveAIImageSettings',ceiling:.04});assert.equal((await call(teacher.client,{action:'readImageModels'})).models.filter(m=>m.enabled).length,3);
 await assert.rejects(call(teacher.client,{action:'generateTeacherAI',feature:'flashcards',notes:'Synthetic connection check'}),/personal OpenRouter/);
 assert.equal((await readRecord(db,databaseId,teacher.id,'ai-month:'+monthKey())).revision,0);
 const requestId='image-check-'+randomUUID();await assert.rejects(call(teacher.client,{action:'generateEpisodeBackground',requestId,prompt:'Synthetic check',modelId:'pro',expectedBilling:'personal'}));
 const job=await readRecord(db,databaseId,teacher.id,'background:'+requestId);assert.equal(job.value.billing.source,'personal');assert.equal(job.value.status,'rejected');assert.equal(job.value.actual,0);
 assert.equal((await readRecord(db,databaseId,teacher.id,'ai-month:'+monthKey())).revision,0);
 for(const provider of ['openrouter','replicate']){status=await call(teacher.client,{action:'readAIConnections'});await call(teacher.client,{action:'disconnectAIProvider',provider,revision:status.providers[provider].revision});}
 assert.equal((await call(teacher.client,{action:'readImageModels'})).billing,'shared');
 const retired=await new Functions(teacher.client).createExecution({functionId:'writing-ai-feedback',body:'{}'});assert.equal(retired.responseStatusCode,410);
 console.log('PASS: live encryption, teacher isolation, student denial, masked status, price ceiling, rejected personal requests without shared spending, disconnect, and retired Writing feedback. No paid generations submitted with valid credentials.');
}finally{
 for(const id of created){for(const row of await allRows(db,databaseId,'teacher_workspace',[Query.equal('ownerId',id)]))await db.deleteDocument(databaseId,'teacher_workspace',row.$id);await db.deleteDocument(databaseId,'reading_question_state',recordId('teacher-lock',id)).catch(e=>{if(e.code!==404)throw e});await db.deleteDocument(databaseId,'users',id).catch(e=>{if(e.code!==404)throw e});await users.delete({userId:id});}
 console.log('Disposable verification accounts and records removed.');
}
