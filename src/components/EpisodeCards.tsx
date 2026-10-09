import {GameLaunchLink} from '@/components/GameLaunchLink';
import {useLiveQuery} from 'dexie-react-hooks';
import {assignedEpisodes} from '../../functions/learning-content/src/episode-catalog.js';
import {assessYoung} from '../../functions/learning-content/src/young-content.js';
import {attemptsFor} from '@/services/episodes.service';
export function EpisodeCards({classId,userId,preview=false,week}:{classId:string;userId:string;preview?:boolean;week?:string}){
 const rows=useLiveQuery(()=>attemptsFor(userId,classId),[userId,classId],[]);
 const catalog=assignedEpisodes(classId,preview).filter(e=>!week||e.assignedDate&&episodeWeek(e.assignedDate)===week);
 if(!catalog.length)return null;
 return <section className="space-y-3" aria-label="Game episodes">{catalog.map(e=>{const attempts=rows.filter(a=>a.episode===e.id&&a.version===e.version&&a.status==='complete'&&!a.preview);return <article key={e.assignmentId} className="rounded-xl border border-orange-300 bg-orange-50 p-5 text-orange-950"><p className="text-xs font-semibold uppercase">Game episode · {e.assignedDate}</p><h2 className="my-2 text-xl font-bold">{e.title}</h2><p>{e.description}</p><p className="my-3 text-sm">{preview?'Teacher preview · excluded from rankings':attempts.length?'Your highest score: '+Math.max(...attempts.map(a=>assessYoung(a.choices).total))+'/100':'No completed attempt yet'}</p><GameLaunchLink className="inline-block rounded bg-orange-900 px-4 py-3 font-semibold text-white" to={`/classes/${classId}/episodes/${e.id}`}>{preview?'Preview episode':'Play / replay'}</GameLaunchLink></article>;})}</section>;
}
export function episodeWeek(date:string){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
