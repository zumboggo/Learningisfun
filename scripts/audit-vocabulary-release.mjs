import {Client,Databases,Query} from 'node-appwrite';
import {readFileSync} from 'node:fs';
import {listAll} from '../functions/learning-content/src/planning.js';
const db=new Databases(new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY)),databaseId=process.env.APPWRITE_DATABASE_ID||'main';
const [classes,assignments,jobs]=await Promise.all(['classes','deck_assignments','planning_releases'].map(c=>listAll(db,databaseId,c)));
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const expected={AP:[],ETH:[],WL:[]};let course='',week=0;
for(const line of readFileSync(process.argv[2],'utf8').split('\n')){
  if(/^AP English/.test(line)){course='AP';week=0;}else if(/^Introduction to Ethics/i.test(line)){course='ETH';week=0;}else if(/^English III\/IV World Literature/i.test(line)){course='WL';week=0;}
  const match=line.match(/^  W(\d{2})\s/);if(match){week=Number(match[1]);continue;}
  if(course&&week>0&&week<=Number(process.argv[3]||6)&&/^\s{6}[ *+]?\s*\S/.test(line)&&!line.trim().startsWith('standards:'))expected[course].push(line.trim().replace(/^[*+]\s*/,''));
}
for(const cls of classes){
  const label=`${cls.courseName||''} ${cls.name||''}`,key=/world/i.test(label)?'WL':/ethic/i.test(label)?'ETH':/\bAP\b/i.test(label)?'AP':null;
  if(!key)continue;
  const deckIds=[...new Set(assignments.filter(a=>a.classId===cls.$id).map(a=>a.deckId))];
  const cards=deckIds.length?await listAll(db,databaseId,'flashcard_cards',[Query.equal('deckId',deckIds)]):[];
  const terms=new Set(cards.map(c=>norm(c.front)));
  const missing=expected[key].filter(term=>!terms.has(norm(term)));
  console.log(JSON.stringify({classId:cls.$id,class:label,expected:expected[key].length,matched:expected[key].length-missing.length,missing,deckCount:deckIds.length,cardCount:cards.length}));
}
const due=jobs.filter(j=>j.releaseAt<=new Date().toISOString());
console.log(JSON.stringify({totalJobs:jobs.length,dueJobs:due.length,completedDue:due.filter(j=>j.status==='done').length,unfinishedDue:due.filter(j=>j.status!=='done').map(j=>({id:j.$id,status:j.status,releaseAt:j.releaseAt,error:j.lastError}))}));
