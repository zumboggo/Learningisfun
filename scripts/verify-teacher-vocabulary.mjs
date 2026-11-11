// Disposable records only: exercise real Appwrite transactions without AI calls or real class changes.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Client,Databases,Query} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {vocabularyAction,releasePrivateVocabulary,privateVocabulary} from '../functions/learning-content/src/private-vocabulary.js';
import {teachingDefaultsAction} from '../functions/learning-content/src/teaching-defaults.js';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const source=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY)),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const suffix=randomUUID().slice(0,8),owners=['verify-a-'+suffix,'verify-b-'+suffix],classIds=['verify-ca-'+suffix,'verify-cb-'+suffix],created=new Map();
const db={
 createTransaction:options=>source.createTransaction(options),updateTransaction:options=>source.updateTransaction(options),
 getDocument:(...args)=>source.getDocument(...args),updateDocument:(...args)=>source.updateDocument(...args),deleteDocument:(...args)=>source.deleteDocument(...args),
 createDocument:async(...args)=>{const r=await source.createDocument(...args);created.set(args[1]+':'+args[2],[args[1],args[2]]);return r;},
 listDocuments:(database,collection,queries=[],...rest)=>source.listDocuments(database,collection,[...queries,...(collection==='teacher_workspace'?[Query.equal('ownerId',owners)]:[])],...rest),
};
const args=(index,body)=>({db,databaseId,userId:owners[index],profile:{role:'teacher'},body});
try{
 for(let index=0;index<2;index++)await db.createDocument(databaseId,'classes',classIds[index],{name:'Temporary verification',courseName:'Same course name',schoolYear:'verification',teacherId:owners[index],joinCode:randomUUID().slice(0,12),joinCodeActive:false,status:'active',createdAt:new Date().toISOString()},[]);
 const value=index=>({name:'Temporary vocabulary',classId:classIds[index],firstWeek:'2026-01-05',wordsPerWeek:100,skipWeeks:[],active:true,cards:Array.from({length:101},(_,i)=>({id:'row-'+(i+1),front:'Term '+i,back:'Definition '+i}))});
 for(let i=0;i<2;i++)await vocabularyAction(args(i,{action:'savePrivateVocabulary',id:'test',revision:0,value:value(i)}));
 await assert.rejects(()=>vocabularyAction(args(0,{action:'savePrivateVocabulary',id:'foreign',revision:0,value:value(1)})),/own active class/);
 assert.equal(await releasePrivateVocabulary(db,databaseId,'2026-01-02T00:00:00.000Z'),2);
 for(let i=0;i<2;i++){const [list]=await privateVocabulary(args(i,{}));assert.equal(list.released.length,1);assert.equal(list.cards.length,101);assert.equal(list.releaseError,'');}
 assert.equal(await releasePrivateVocabulary(db,databaseId,'2026-01-02T00:00:00.000Z'),0);
 const defaults={ageRange:'8–10',audienceNotes:'Test',wordTarget:300};await teachingDefaultsAction(args(0,{action:'saveTeachingDefaults',revision:0,value:defaults}));assert.deepEqual((await teachingDefaultsAction(args(0,{action:'readTeachingDefaults',classId:classIds[0]}))).effective,defaults);assert.equal((await teachingDefaultsAction(args(1,{action:'readTeachingDefaults'}))).effective,null);
 console.log('PASS: real transactions, 100-card batches, retries, two-teacher isolation, future cards and inherited defaults.');
}finally{
 let failures=0;const entries=[...created.values()].reverse();for(let offset=0;offset<entries.length;offset+=10){const group=entries.slice(offset,offset+10),results=await Promise.allSettled(group.map(([collection,id])=>source.deleteDocument(databaseId,collection,id)));results.forEach((r,i)=>{if(r.status==='rejected'&&r.reason.code!==404){failures++;console.error('Temporary cleanup failed:',...group[i]);}});}if(failures)throw Error('Some temporary verification records could not be removed.');console.log('Removed all temporary verification records.');
}
