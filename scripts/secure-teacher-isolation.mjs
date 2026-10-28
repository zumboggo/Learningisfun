// Back up affected records and permissions before closing legacy direct browser access.
import {Client,Databases,Storage,Query} from 'node-appwrite';
import {loadEnvFile} from 'node:process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {allRows} from '../functions/learning-content/src/teacher-workspace.js';
loadEnvFile(join(homedir(),'.config/learningisfun/appwrite.env'));
const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY),db=new Databases(client),storage=new Storage(client),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const json=value=>JSON.stringify(value,(_key,value)=>typeof value==='bigint'?value.toString():value);
const directory=join(homedir(),'.config/learningisfun/backups/teacher-isolation-'+new Date().toISOString().replaceAll(':','-'));await mkdir(directory,{recursive:true,mode:0o700});
const collections=[];let cursor;do{const page=await db.listCollections({databaseId,queries:[Query.limit(100),...(cursor?[Query.cursorAfter(cursor)]:[])]});collections.push(...page.collections);cursor=page.collections.length===100?page.collections.at(-1).$id:null;}while(cursor);
await writeFile(join(directory,'collections.json'),json(collections),{mode:0o600});
for(const collection of collections){if(!collection.$permissions.length&&!collection.documentSecurity)continue;const records=await allRows(db,databaseId,collection.$id);await writeFile(join(directory,collection.$id+'.json'),json(records),{mode:0o600});if(process.argv.includes('--apply'))await db.updateCollection({databaseId,collectionId:collection.$id,name:collection.name,permissions:[],documentSecurity:false,enabled:collection.enabled});console.log(process.argv.includes('--apply')?'Secured:':'Backed up:',collection.$id,records.length);}
const buckets=await storage.listBuckets({queries:[Query.limit(100)]});await writeFile(join(directory,'buckets.json'),json(buckets.buckets),{mode:0o600});for(const b of buckets.buckets)console.log('Bucket permissions:',b.$id,JSON.stringify(b.$permissions),'fileSecurity',b.fileSecurity);
console.log('Private backup:',directory);
