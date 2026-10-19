// Keep the annual source private and preserve saved lesson edits and class mappings.
// Usage: node --env-file=PRIVATE_ENV scripts/update-planner-source.mjs SOURCE [--apply]
import {readFile,writeFile} from 'node:fs/promises';
import {basename} from 'node:path';
import {Client,Databases,Query} from 'node-appwrite';
import {createServer} from 'vite';
const path=process.argv[2];
if(!path)throw new Error('Provide the annual source file.');
const sourceText=await readFile(path,'utf8');
const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true},appType:'custom'});
try {
 const {parsePlannerSource}=await server.ssrLoadModule('/src/services/planner-parser.ts');
 const parsed=parsePlannerSource(sourceText);
 if(parsed.weeks.length!==36 || !parsed.weeks.every(week=>week.deadlines))throw new Error('Incomplete annual source.');
 const client=new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
 const db=new Databases(client),database=process.env.APPWRITE_DATABASE_ID||'main';
 const sources=await db.listDocuments(database,'planner_sources',[Query.equal('active',true),Query.limit(100)]);
 if(sources.documents.length!==1)throw new Error('Expected one active planner source.');
 const source=sources.documents[0];
 const plans=await db.listDocuments(database,'weekly_plans',[Query.equal('teacherId',source.teacherId),Query.limit(100)]);
 console.log(JSON.stringify({weeks:parsed.weeks.length,deadlines:new Set(parsed.weeks.flatMap(w=>w.deadlines.map(d=>d.url))).size,savedPlans:plans.total,mapping:JSON.parse(source.mappingJson)}));
 if(!process.argv.includes('--apply'))process.exitCode=0;
 else {
  const backup='/private/tmp/planner-source-backup-'+Date.now()+'.json';
  await writeFile(backup,JSON.stringify({source,plans:plans.documents}),{mode:0o600});
  await db.updateDocument(database,'planner_sources',source.$id,{sourceText,parsedJson:JSON.stringify(parsed),filename:basename(path),version:source.version+1});
  // Update only deadline metadata, leaving teaching cards, notes and published snapshots intact.
  for(const plan of plans.documents){
   const data=JSON.parse(plan.planJson),week=parsed.weeks.find(w=>w.startDate===data.week.startDate);
   if(!week)continue;
   data.week.deadlines=week.deadlines;
   await db.updateDocument(database,'weekly_plans',plan.$id,{planJson:JSON.stringify(data),updatedAt:new Date().toISOString()});
  }
  const saved=await db.getDocument(database,'planner_sources',source.$id);
  if(saved.sourceText!==sourceText)throw new Error('Source verification failed.');
  console.log('Updated private source and saved plan deadlines. Backup: '+backup);
 }
} finally {await server.close();}
