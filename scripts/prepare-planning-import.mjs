// Build a private review package from the supplied local files. Does not contact Appwrite.
// Usage: node scripts/prepare-planning-import.mjs ANNUAL.txt CORE.csv REFERENCE.csv BRIEF.txt OUTPUT.local
import { readFile,writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
const [annual,core,reference,brief,output]=process.argv.slice(2);
if(!output?.endsWith('.local'))throw new Error('Supply annual source, two CSV files, planning brief, and a .local output path.');
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
  const {parsePlannerSource}=await server.ssrLoadModule('/src/services/planner-parser.ts');
  const {importVocabulary,importPlanningBrief}=await server.ssrLoadModule('/src/services/unit-planning.ts');
  const parsed=parsePlannerSource(await readFile(annual,'utf8'));
  let units=importVocabulary(await readFile(core,'utf8'),parsed.weeks);
  units=importVocabulary(await readFile(reference,'utf8'),parsed.weeks,units);
  units=importPlanningBrief(await readFile(brief,'utf8'),units,parsed.weeks);
  await writeFile(output,JSON.stringify({version:1,units},null,2),{mode:0o600});
  console.log(JSON.stringify({weeks:parsed.weeks.length,units:units.length,cards:units.reduce((n,u)=>n+u.cards.length,0),resources:units.reduce((n,u)=>n+u.resources.length,0),output}));
} finally {await server.close();}
