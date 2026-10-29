import {useEffect, useState, type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {executeLearningContent} from '@/services/learning-content.service';

type ClassOption = {id:string; name:string; courseName:string};
type StudentRow = {userId:string; name:string; questions:number; replies:number; discussionStarters:number; writingResponses:number; annotations:number; flashcardReviews:number; studySeconds:number; episodeAttempts:number; episodeCompletions:number; lastActivity:string|null};
type EpisodeRow = {userId:string; assignmentId:string; title:string; assignedDate:string; firstScore:number|null; latestScore:number|null; bestScore:number|null; quizTries:number; plays:number; complete:boolean; assessmentMode:string; lastActivity:string};
type Report = {studentRows:StudentRow[]; episodeRows:EpisodeRow[]; generatedAt:string; missingSources:string[]};
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
  const episodes=report?.episodeRows.filter(e=>matches(`${names.get(e.userId)||''} ${e.title}`)&&(!lowOnly||e.firstScore!==null&&e.firstScore<75))||[];
  const lowStudents=new Set(report?.episodeRows.filter(e=>e.firstScore!==null&&e.firstScore<75).map(e=>e.userId));
  const noDiscussion=report?.studentRows.filter(s=>s.questions+s.replies+s.discussionStarters===0).length||0;
  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold text-slate-950">Data</h1><p className="mt-1 text-slate-600">A quick check on participation and learning. Visible only to the class teacher.</p></div><button className="rounded-lg border px-4 py-2" disabled={loading} onClick={()=>setRefresh(n=>n+1)}>Refresh data</button></header>
    <div className="flex flex-wrap gap-4"><label className="grid gap-1 text-sm font-medium">Class<select className="rounded-lg border bg-white p-2" value={classId} onChange={e=>setClassId(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.courseName ? `${c.courseName} · ` : ''}{c.name}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Period<select className="rounded-lg border bg-white p-2" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={0}>All time</option></select></label></div>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">Could not load data: {error}. Use Refresh data to retry.</p>}
    {loading&&<p role="status">Loading class data…</p>}
    {!loading&&!error&&!classes.length&&<p>No classes yet. Data appears here once you have a class.</p>}
    {report&&!loading&&<>
      {report.missingSources.length>0&&<p role="alert" className="rounded-lg bg-amber-50 p-3">Some sources are unavailable ({report.missingSources.join(', ')}). Counts may be incomplete.</p>}
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-100 p-4"><strong className="text-2xl">{report.studentRows.length}</strong><p>Currently enrolled students</p></div><button className="rounded-xl bg-amber-50 p-4 text-left" onClick={()=>{setSection('episodes');setLowOnly(true);setSearch('');}}><strong className="text-2xl">{lowStudents.size}</strong><p>Students with a first MC score below 75%</p></button><div className="rounded-xl bg-slate-100 p-4"><strong className="text-2xl">{noDiscussion}</strong><p>No recorded discussion contributions in this period</p></div></div>
      <div className="flex flex-wrap items-center gap-3"><div className="flex gap-2" role="group" aria-label="Data views">{(['participation','episodes'] as const).map(s=><button key={s} aria-pressed={section===s} className={`rounded-lg px-4 py-2 ${section===s?'bg-teal-900 text-white':'border bg-white'}`} onClick={()=>setSection(s)}>{s==='participation'?'Participation':'Episode scores'}</button>)}</div><label className="sm:ml-auto"><span className="sr-only">Search students or episodes</span><input className="rounded-lg border p-2" placeholder="Search students or episodes" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
      {section==='participation'?<>
        <p className="text-sm text-slate-600">Counts include recorded class discussions and reading discussions. Writing responses are separate. Zero means no recorded activity in this period, not a judgment of effort.</p>
        <Table headers={['Student','Questions','Replies','Other posts','Writing responses','Shared annotations','Card reviews','Study minutes','Episode plays started','Plays completed','Last activity']}>
          {students.map(s=><tr key={s.userId}><th scope="row" className="whitespace-nowrap p-3 font-medium"><Link className="text-teal-800 underline" to={`/classes/${classId}/students/${s.userId}/progress`}>{s.name}</Link></th>{[s.questions,s.replies,s.discussionStarters,s.writingResponses,s.annotations,s.flashcardReviews,Math.round(s.studySeconds/60),s.episodeAttempts,s.episodeCompletions,date(s.lastActivity)].map((v,i)=><td className="p-3" key={i}>{v}</td>)}</tr>)}
        </Table>{!students.length&&<p>No matching students.</p>}
      </>:<>
        <div className="space-y-2 text-sm text-slate-600"><p>MC scores for animated episodes with activity in this period. First scores and tries include the full saved history, including replays. Older episode formats are included in participation counts, not these MC scores.</p><p>Completion requires at least 75% for quiz episodes (plus writing where assigned). A low first score is a prompt to check in; it does not establish why a student struggled.</p><label className="flex items-center gap-2 font-medium text-slate-900"><input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)}/>Only first MC scores below 75%</label></div>
        <Table headers={['Student','Episode','First MC','Latest MC','Best MC','Quiz tries','Plays','Status','Last activity']}>
          {episodes.map(e=><tr key={`${e.userId}:${e.assignmentId}`} className={e.firstScore!==null&&e.firstScore<75?'bg-amber-50':''}><th scope="row" className="whitespace-nowrap p-3 font-medium">{names.get(e.userId)||'Student'}</th><td className="min-w-48 p-3">{e.title}<span className="block text-xs text-slate-500">Assigned {e.assignedDate}</span></td><td className="p-3 font-semibold">{score(e.firstScore)}{e.firstScore!==null&&e.firstScore<75&&<span className="block text-xs">Below 75%</span>}</td><td className="p-3">{score(e.latestScore)}</td><td className="p-3">{score(e.bestScore)}</td><td className="p-3">{e.quizTries}</td><td className="p-3">{e.plays}</td><td className="p-3">{e.complete?'Complete':'In progress'}{e.assessmentMode==='none'?' · No quiz':e.quizTries===0?' · Quiz not submitted':''}</td><td className="whitespace-nowrap p-3">{date(e.lastActivity)}</td></tr>)}
        </Table>{!episodes.length&&<p>No {lowOnly?'scores below 75%':'recorded episode attempts'} match these filters.</p>}
      </>}
      <footer className="flex flex-wrap justify-between gap-3 text-sm text-slate-500"><p>Updated {new Date(report.generatedAt).toLocaleString()} · Saved account data; unsynced work is not included.</p><Link className="text-teal-800 underline" to={`/classes/${classId}/reports`}>Open detailed class participation report</Link></footer>
    </>}
  </main>;
}
