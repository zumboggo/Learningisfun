import {Client,Databases,Storage} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {PEER_WORK_BUCKET,PEER_WORK_COLLECTION} from '../functions/learning-content/src/peer-work.js';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(client),storage=new Storage(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
try{await db.getCollection({databaseId,collectionId:PEER_WORK_COLLECTION})}catch(e){if(e.code!==404)throw e;await db.createCollection({databaseId,collectionId:PEER_WORK_COLLECTION,name:'Peer Review Student Work',permissions:[],documentSecurity:false});}
const collection=await db.getCollection({databaseId,collectionId:PEER_WORK_COLLECTION});if(collection.$permissions.length||collection.documentSecurity)throw Error('Peer work collection must be server-only.');
for(const [collectionId,key,size,required] of [['peer_review_activities','workMode',20,false],['peer_review_activities','instructions',5000,false],...Object.entries({activityId:255,classId:255,studentId:255,title:200,text:20000,url:2000,fileId:255,fileName:180,createdAt:40}).map(([key,size])=>[PEER_WORK_COLLECTION,key,size,true])]){
 try{await db.getAttribute({databaseId,collectionId,key})}catch(e){if(e.code!==404)throw e;await db.createStringAttribute({databaseId,collectionId,key,size,required});}
 const deadline=Date.now()+120000;
 while(true){const a=await db.getAttribute({databaseId,collectionId,key});if(a.status==='available')break;if(a.status==='failed'||Date.now()>deadline)throw Error(`${collectionId}.${key}: ${a.status}`);await new Promise(r=>setTimeout(r,1000));}
 console.log(`${collectionId}.${key} available`);
}
for(const key of ['activityId','studentId']){try{await db.getIndex({databaseId,collectionId:PEER_WORK_COLLECTION,key:'idx_'+key})}catch(e){if(e.code!==404)throw e;await db.createIndex({databaseId,collectionId:PEER_WORK_COLLECTION,key:'idx_'+key,type:'key',attributes:[key]});}}
try{await storage.getBucket({bucketId:PEER_WORK_BUCKET})}catch(e){if(e.code!==404)throw e;await storage.createBucket({bucketId:PEER_WORK_BUCKET,name:'Peer Review Student Files',permissions:[],fileSecurity:false,enabled:true,maximumFileSize:5*1024*1024,allowedFileExtensions:['pdf','docx','pptx','txt','png','jpg','jpeg','webp'],encryption:true,antivirus:true});}
const bucket=await storage.getBucket({bucketId:PEER_WORK_BUCKET});if(bucket.$permissions.length||bucket.fileSecurity)throw Error('Peer work files must be server-only.');
console.log('Private peer review work storage ready.');
