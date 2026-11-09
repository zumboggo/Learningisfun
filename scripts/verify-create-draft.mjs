// Explicit private draft round-trip. No AI calls, publication, class assignment, or student data.
import assert from 'node:assert/strict';
import {Client,Databases,Functions,Users} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import {newTextDraft} from '../functions/learning-content/src/text-authoring-model.js';
import catalog from '../functions/learning-content/src/lesson-catalog.json' with {type:'json'};
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const client=()=>new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID);
const admin=client().setKey(process.env.APPWRITE_API_KEY),db=new Databases(admin),users=new Users(admin);
const cls=await db.getDocument(process.env.APPWRITE_DATABASE_ID||'main','classes',catalog[0].classIds[0]);
const token=await users.createJWT({userId:cls.teacherId,duration:300}),fn=new Functions(client().setJWT(token.jwt)),draftId='create-studio-verification-20261109';
async function call(action,extra={}){const e=await fn.createExecution({functionId:'learning-content',body:JSON.stringify({action,draftId,...extra})});const r=JSON.parse(e.responseBody||'{}');if(e.responseStatusCode>=400)throw Object.assign(Error(action+': '+r.error),{code:e.responseStatusCode});return r;}
let saved;try{saved=await call('textReadDraft')}catch(e){if(e.code!==404)throw e;const value=newTextDraft();value.brief.topic='Create studio verification';value.title='Create studio verification — private layout draft';value.content=['This private draft checks paragraph layout and image placement. It is not assigned to any class.','The second paragraph follows a separate illustration.','The third paragraph keeps its own image and caption.','The final paragraph completes the four-image layout check.'].join('\n\n');value.scenes=['#334f40','#72886e','#b8c5a5','#dedbc8'].map((color,i)=>({id:'test-scene-'+i,prompt:'Layout verification swatch '+color,alt:'Layout test colour swatch '+(i+1),caption:'Layout test image; no historical claim.',after:i}));saved=await call('textSaveDraft',{value,revision:0});}
for(let i=0;i<saved.value.scenes.length;i++){const scene=saved.value.scenes[i];if(!scene.fileId){const bytes=await sharp({create:{width:640,height:360,channels:3,background:['#334f40','#72886e','#b8c5a5','#dedbc8'][i]}}).webp().toBuffer();saved=await call('textUploadImage',{revision:saved.revision,sceneId:scene.id,source:'data:image/webp;base64,'+bytes.toString('base64')});}const r=await call('textDraftImage',{fileId:saved.value.scenes[i].fileId});const fetched=await fetch(r.url);assert.equal(fetched.status,200);assert.match(fetched.headers.get('content-type'),/image/);}
const reread=await call('textReadDraft');assert.equal(reread.value.scenes.length,4);assert.equal(reread.value.brief.length,'standard');assert.equal(reread.value.reviewed,false);
console.log('Verified: private draft save, resume, four image uploads and authenticated image reads.');
console.log('No AI charges, publication, or class assignments.');
console.log('Preview: https://zumboggo.github.io/Learningisfun/#/create/text?draft='+draftId);
