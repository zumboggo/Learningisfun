// Move only unreleased Friday 17:00 jobs to Friday 08:00 China time.
// Stable IDs preserve retry safety; completed jobs and student progress are untouched.
import {Client,Databases,Query} from 'node-appwrite';
import {listAll,releaseDue} from '../functions/learning-content/src/planning.js';
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY)),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const jobs=await listAll(db,databaseId,'planning_releases',[Query.equal('status',['pending','failed'])]);
let count=0;
for(const job of jobs){
  const payload=JSON.parse(job.payloadJson);
  if(!['core','copywork'].includes(payload.kind)||!job.releaseAt.endsWith('T09:00:00.000Z')||new Date(job.releaseAt).getUTCDay()!==5)continue;
  const releaseAt=job.releaseAt.replace('T09:00:00.000Z','T00:00:00.000Z');
  if(payload.releaseAt)payload.releaseAt=releaseAt;
  if(process.argv.includes('--apply'))await db.updateDocument(databaseId,'planning_releases',job.$id,{releaseAt,payloadJson:JSON.stringify(payload)});
  count++;
}
console.log(`${process.argv.includes('--apply')?'Updated':'Would update'} ${count} pending weekly releases; completed jobs and reference releases unchanged.`);
if(process.argv.includes('--apply')&&process.argv.includes('--release-due'))console.log(await releaseDue(db,databaseId));
