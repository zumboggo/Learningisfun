import {ClassReadingRequirements} from '@/components/texts/ReadingRequirements';
import {useEffect, useState, type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {executeLearningContent} from '@/services/learning-content.service';

type ClassOption = {id:string; name:string; courseName:string};
type StudentRow = {userId:string; name:string; questions:number; replies:number; discussionStarters:number; writingResponses:number; annotations:number; flashcardReviews:number; studySeconds:number; episodeAttempts:number; episodeCompletions:number; lastActivity:string|null};
type EpisodeOption = {assignmentId:string; title:string; assignedDate:string; archived:boolean};
type EpisodeRow = {userId:string; assignmentId:string; firstScore:number|null; latestScore:number|null; bestScore:number|null; quizTries:number; plays:number; complete:boolean; assessmentMode:string; lastActivity:string};
type EpisodeDetail = {episodeRows:(EpisodeRow & {hasWriting:boolean; answers:{prompt:string; text:string}[]})[]; missingSources:string[]};
type Report = {studentRows:StudentRow[]; episodeRows:EpisodeRow[]; episodeCatalog:EpisodeOption[]; generatedAt:string; missingSources:string[]};
const score = (value:number|null) => value === null ? '—' : `${value}%`;
const date = (value:string|null) => value ? new Date(value).toLocaleDateString() : 'No recorded activity';
function Table({headers, children}:{headers:string[];children:ReactNode}) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{headers.map(h=><th key={h} scope="col" className="whitespace-nowrap p-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{children}</tbody></table></div>;
}
export default function TeacherDataPage() {
  const {user} = useAuth();
  const [classes,setClasses]=useState<ClassOption[]>([]),[classId,setClassId]=useState(''),[days,setDays]=useState(30);
  const [report,setReport]=useState<Report|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const [section,setSection]=useState<'participation'|'episodes'>('participation'),[search,setSearch]=useState(''),[lowOnly,setLowOnly]=useState(false);
  useEffect(()=>{
    let active=true; setLoading(true);setError('');setReport(null);
    void executeLearningContent<{classes:ClassOption[]}>({action:'teacherData'}).then(r=>{if(active){setClasses(r.classes);setClassId(current=>r.classes.some(c=>c.id===current)?current:r.classes[0]?.id||'');setLoading(false);}}).catch(e=>{if(active){setError(e.message);setLoading(false);}});
    return ()=>{active=false;};
  },[user?.$id,refresh]);
  useEffect(()=>{
    if(!classId)return;
    let active=true;setLoading(true);setError('');setReport(null);
    void executeLearningContent<Report>({action:'teacherData',classId,days}).then(r=>{if(active)setReport(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[classId,days,user?.$id,refresh]);
  const names=new Map(report?.studentRows.map(s=>[s.userId,s.name]));
  const matches=(text:string)=>text.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  const students=report?.studentRows.filter(s=>matches(s.name))||[];
  const lowStudents=new Set(report?.episodeRows.filter(e=>e.firstScore!==null&&e.firstScore<75).map(e=>e.userId));
  const noDiscussion=report?.studentRows.filter(s=>s.questions+s.replies+s.discussionStarters===0).length||0;
  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold text-slate-950">Data</h1><p className="mt-1 text-slate-600">A quick check on participation and learning. Visible only to the class teacher.</p></div><button className="rounded-lg border px-4 py-2" disabled={loading} onClick={()=>setRefresh(n=>n+1)}>Refresh data</button></header>
    <div className="flex flex-wrap gap-4"><label className="grid gap-1 text-sm font-medium">Class<select className="rounded-lg border bg-white p-2" value={classId} onChange={e=>setClassId(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.courseName ? `${c.courseName} · ` : ''}{c.name}</option>)}</select></label>{section==='participation'&&<label className="grid gap-1 text-sm font-medium">Period<select className="rounded-lg border bg-white p-2" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={0}>All time</option></select></label>}</div>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">Could not load data: {error}. Use Refresh data to retry.</p>}
    {loading&&<p role="status">Loading class data…</p>}
    {!loading&&!error&&!classes.length&&<p>No classes yet. Data appears here once you have a class.</p>}
    {report&&!loading&&<>
      {report.missingSources.length>0&&<p role="alert" className="rounded-lg bg-amber-50 p-3">Some sources are unavailable ({report.missingSources.join(', ')}). Counts may be incomplete.</p>}
      {section==='participation'&&<div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-green-100 bg-green-50 p-4"><strong className="text-2xl">{report.studentRows.length}</strong><p>Currently enrolled students</p></div><button className="rounded-xl bg-amber-50 p-4 text-left" onClick={()=>{setSection('episodes');setLowOnly(true);setSearch('');}}><strong className="text-2xl">{lowStudents.size}</strong><p>Students with a first MC score below 75%</p></button><div className="rounded-xl border border-violet-100 bg-violet-50 p-4"><strong className="text-2xl">{noDiscussion}</strong><p>No recorded discussion contributions in this period</p></div></div>}
      <div className="flex flex-wrap items-center gap-3"><div className="flex gap-2" role="group" aria-label="Data views">{(['participation','episodes'] as const).map(s=><button key={s} aria-pressed={section===s} className={`rounded-lg px-4 py-2 ${section===s?'bg-teal-900 text-white':'border bg-white'}`} onClick={()=>{setSection(s);setLowOnly(false);}}>{s==='participation'?'Participation':'Episodes'}</button>)}</div>{section==='participation'&&<label className="sm:ml-auto"><span className="sr-only">Search students</span><input className="rounded-lg border p-2" placeholder="Search students" value={search} onChange={e=>setSearch(e.target.value)}/></label>}</div>
      {section==='participation'?<>
        <ClassReadingRequirements key={classId} classId={classId}/>
        <p className="text-sm text-slate-600">Counts include recorded class discussions and reading discussions. Writing responses are separate. Zero means no recorded activity in this period, not a judgment of effort.</p>
        <Table headers={['Student','Questions','Replies','Other posts','Writing responses','Shared annotations','Card reviews','Study minutes','Episode plays started','Plays completed','Last activity']}>
          {students.map(s=><tr key={s.userId}><th scope="row" className="whitespace-nowrap p-3 font-medium"><Link className="text-teal-800 underline" to={`/classes/${classId}/students/${s.userId}/progress`}>{s.name}</Link></th>{[s.questions,s.replies,s.discussionStarters,s.writingResponses,s.annotations,s.flashcardReviews,Math.round(s.studySeconds/60),s.episodeAttempts,s.episodeCompletions,date(s.lastActivity)].map((v,i)=><td className="p-3" key={i}>{v}</td>)}</tr>)}
        </Table>{!students.length&&<p>No matching students.</p>}
      </>:<EpisodeReport key={classId} classId={classId} catalog={report.episodeCatalog} names={names} lowOnly={lowOnly} setLowOnly={setLowOnly}/>}
      <footer className="flex flex-wrap justify-between gap-3 text-sm text-slate-500"><p>Updated {new Date(report.generatedAt).toLocaleString()} · Saved account data; unsynced work is not included.</p><Link className="text-teal-800 underline" to={`/classes/${classId}/reports`}>Open detailed class participation report</Link></footer>
    </>}
  </main>;
}

const lowFirstScore = (row:EpisodeRow) => row.firstScore !== null && row.firstScore < 75;
const completionRank = (row:EpisodeDetail['episodeRows'][number]) =>
  row.complete ? 4 : row.answers.length ? 3 : (row.bestScore ?? -1) >= 75 ? 2 : row.quizTries ? 1 : 0;

function EpisodeReport({classId,catalog,names,lowOnly,setLowOnly}:{
  classId:string; catalog:EpisodeOption[]; names:Map<string,string>; lowOnly:boolean; setLowOnly:(value:boolean)=>void;
}) {
  const [selected,setSelected]=useState<EpisodeOption|null>(null);
  const [query,setQuery]=useState('');
  const options=catalog.filter(e=>e.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a,b)=>b.assignedDate.localeCompare(a.assignedDate)||a.title.localeCompare(b.title));
  if (selected) return <EpisodeStudents key={selected.assignmentId} classId={classId} episode={selected} names={names}
    lowOnly={lowOnly} setLowOnly={setLowOnly} goBack={()=>setSelected(null)}/>;
  return <section className="space-y-3" aria-labelledby="choose-episode">
    <h2 id="choose-episode" className="text-xl font-bold">Choose an episode</h2>
    <p className="text-sm text-slate-600">Select an animated episode to see every currently enrolled student with a saved start, including older activity.</p>
    {!!catalog.length && <label className="block"><span className="sr-only">Search episodes</span><input className="rounded-lg border p-2" placeholder="Search episodes" value={query} onChange={e=>setQuery(e.target.value)}/></label>}
    <ul className="grid gap-2 sm:grid-cols-2">
      {options.map(e=><li key={e.assignmentId}>
        <button type="button" className="flex w-full items-center justify-between gap-3 rounded-xl border bg-white p-4 text-left hover:border-teal-700" onClick={()=>setSelected(e)}>
          <span><strong>{e.title}</strong><span className="block text-sm text-slate-600">Assigned {e.assignedDate}{e.archived?' · Archived':''}</span></span>
          <span aria-hidden="true" className="text-teal-800">→</span>
        </button>
      </li>)}
    </ul>
    {!options.length&&<p>{catalog.length?'No matching episodes.':'No animated episodes assigned to this class.'}</p>}
  </section>;
}

function EpisodeStudents({classId,episode,names,lowOnly,setLowOnly,goBack}:{
  classId:string; episode:EpisodeOption; names:Map<string,string>; lowOnly:boolean; setLowOnly:(value:boolean)=>void; goBack:()=>void;
}) {
  const [detail,setDetail]=useState<EpisodeDetail|null>(null),[error,setError]=useState('');
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true;
    void executeLearningContent<EpisodeDetail>({action:'teacherData',classId,episodeAssignmentId:episode.assignmentId})
      .then(result=>{if(active)setDetail(result);}).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[classId,episode.assignmentId,retry]);
  const name=(id:string)=>names.get(id)||'Unavailable student profile';
  const rows=detail?.episodeRows.filter(row=>!lowOnly||lowFirstScore(row)).sort((a,b)=>
    completionRank(b)-completionRank(a)||(b.bestScore??-1)-(a.bestScore??-1)||name(a.userId).localeCompare(name(b.userId)));
  return <section className="space-y-3" aria-labelledby="episode-title">
    <button type="button" className="text-teal-800 underline" onClick={goBack}>← All episodes</button>
    <div><h2 id="episode-title" className="text-xl font-bold">{episode.title}</h2>
      <p className="text-sm text-slate-600">Assigned {episode.assignedDate} · All-time activity{detail&&` · ${detail.episodeRows.length} started`}</p></div>
    {error?<div role="alert"><p>Could not load episode data: {error}</p><button type="button" className="text-teal-800 underline" onClick={()=>{setError('');setRetry(n=>n+1);}}>Try again</button></div>:!detail?<p role="status">Loading episode data…</p>:<>
      {!!detail.missingSources.length&&<p role="alert">Some sources are unavailable ({detail.missingSources.join(', ')}). Results may be incomplete.</p>}
      <p className="text-sm text-slate-600">Students are ordered by completion, then best quiz score. Quiz attempts include retries and replays.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)}/>Only first quiz scores below 75%</label>
      {!!rows?.length?<Table headers={['Student','Best quiz score','Quiz attempts','Final answer','Status','Last activity']}>
        {rows.map(row=><tr key={row.userId} className={lowFirstScore(row)?'bg-amber-50':''}>
          <th scope="row" className="whitespace-nowrap p-3 font-medium">{name(row.userId)}</th>
          <td className="whitespace-nowrap p-3"><strong>{row.assessmentMode==='none'?'No quiz':score(row.bestScore)}</strong>
            {row.firstScore!==null&&<span className="block text-xs text-slate-600">First {score(row.firstScore)} · Latest {score(row.latestScore)}</span>}</td>
          <td className="p-3 font-semibold">{row.assessmentMode==='none'?'—':row.quizTries}</td>
          <td className="p-3">{row.answers.length?<details>
            <summary className="cursor-pointer font-medium text-teal-800">{row.answers.length===1?'View answer':`View ${row.answers.length} answers`}</summary>
            {row.answers.map((answer,i)=><div key={i} className="mt-2 max-w-lg space-y-1 rounded-lg bg-slate-50 p-3">
              <p className="font-semibold">{answer.prompt}</p><p className="whitespace-pre-wrap break-words">{answer.text}</p>
            </div>)}
          </details>:row.hasWriting?'Not submitted':'Not assigned'}</td>
          <td className="whitespace-nowrap p-3">{row.complete?'Complete':(row.bestScore??-1)>=75?'Quiz passed':row.quizTries?'Quiz attempted':'Started'}</td>
          <td className="whitespace-nowrap p-3">{date(row.lastActivity)}</td>
        </tr>)}
      </Table>:<p>{lowOnly?'No first quiz scores below 75%.':'No students have a saved start for this episode yet.'}</p>}
    </>}
  </section>;
}
