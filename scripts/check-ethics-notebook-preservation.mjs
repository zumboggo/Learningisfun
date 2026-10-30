// Read-only rollout guard: never print student identities or writing.
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {Client,Databases,Query} from 'node-appwrite';
import questions from '../functions/learning-content/src/ethics-notebook-questions.json' with {type:'json'};
import {STONE_CLASS_ID} from '../functions/learning-content/src/stone-engine.js';
if(!process.env.APPWRITE_API_KEY)loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
const protectedEpisodes=new Set();let cursor;
do{
 const page=await db.listDocuments({databaseId:process.env.APPWRITE_DATABASE_ID||'main',collectionId:'ethics_portfolio',queries:[Query.equal('classId',STONE_CLASS_ID),Query.equal('kind','entry'),Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]});
 // Inspect every revision: clearing a later draft must not erase its history.
 for(const row of page.documents){const e=JSON.parse(row.dataJson);if(e.source?.kind==='episode-notes'&&!e.notebook&&e.answers?.some(a=>a.trim()))protectedEpisodes.add(e.source.episode);}
 cursor=page.documents.length===100?page.documents.at(-1).$id:null;
}while(cursor);
const missing=[...protectedEpisodes].filter(id=>!questions.legacyEpisodes.includes(id));
if(missing.length)throw Error('Preserve these answered episodes in legacyEpisodes before deployment: '+missing.join(', '));
console.log('Original questions preserved for answered episodes:',[...protectedEpisodes].sort().join(', '));
