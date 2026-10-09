import {GameLaunchLink} from '@/components/GameLaunchLink';
import {useLiveQuery} from 'dexie-react-hooks';
import {assignedEpisodes} from '../../functions/learning-content/src/episode-catalog.js';
import {episodeScore} from '../../functions/learning-content/src/young-scoring.js';
import {attemptsFor,episodeDb} from '@/services/episodes.service';
export function EpisodeCards({classId,userId,preview=false,week}:{classId:string;userId:string;preview?:boolean;week?:string}){
 const rows=useLiveQuery(()=>attemptsFor(userId,classId),[userId,classId],[]);
 const writing=useLiveQuery(()=>episodeDb.writing.where('userId').equals(userId).toArray(),[userId],[]);
 const catalog=assignedEpisodes(classId,preview).filter(e=>!week||e.assignedDate&&episodeWeek(e.assignedDate)===week);
 if(!catalog.length)return null;
 return <section className="space-y-3" aria-label="Game episodes">{catalog.map(e=>{const attempts=rows.filter(a=>a.episode===e.id&&a.version===e.version&&a.status==='complete'&&!a.preview);const scores=attempts.map(a=>episodeScore(a,writing)).filter((v):v is number=>v!==null);return <article key={e.assignmentId} className="rounded-xl border border-orange-300 bg-orange-50 p-5 text-orange-950"><p className="text-xs font-semibold uppercase">Game episode · {e.assignedDate}</p><h2 className="my-2 text-xl font-bold">{e.title}</h2><p>{e.description}</p><p className="mt-2 text-sm">Choices 40% · final writing 60%</p><p className="my-3 text-sm">{preview?'Teacher preview · excluded from rankings':scores.length?'Your highest score: '+Math.max(...scores)+'/100':attempts.length?'Story complete · writing score pending':'No completed attempt yet'}</p><GameLaunchLink className="inline-block rounded bg-orange-900 px-4 py-3 font-semibold text-white" to={`/classes/${classId}/episodes/${e.id}`}>{preview?'Preview episode':'Play / replay'}</GameLaunchLink></article>;})}</section>;
}
export function episodeWeek(date:string){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
