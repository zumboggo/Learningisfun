import {useEffect, useState} from 'react';
import {executeLearningContent} from '@/services/learning-content.service';
import {downloadCsv} from '@/services/report.service';

type Metric = 'questions'|'replies'|'discussionStarters'|'writingResponses'|'annotations'|'flashcardReviews'|'studySeconds'|'episodeAttempts'|'episodeCompletions';
type Counts = Record<Metric,number>;
interface Summary {
  generatedAt:string; since:string|null; days:number; students:number; activeStudents:number;
  totals:Counts; missingSources:string[];
  classes:Array<Counts & {name:string; students:number; activeStudents:number}>;
}
const metrics:Array<{key:Metric; label:string; note:string}> = [
  {key:'questions',label:'Questions asked',note:'Student questions in session and reading discussions.'},
  {key:'replies',label:'Replies written',note:'Student replies across session, text, and writing discussions.'},
  {key:'episodeAttempts',label:'Saved episode attempts',note:'Distinct saved attempts, including replays. Repeated saves count once.'},
  {key:'episodeCompletions',label:'Episode completions',note:'Attempts that reached the episode’s completion check.'},
  {key:'discussionStarters',label:'Other discussion starters',note:'Thoughts, connections, and older uncategorized text posts.'},
  {key:'writingResponses',label:'Writing prompt responses',note:'Saved responses in the writing discussion workspace.'},
  {key:'annotations',label:'Shared reading annotations',note:'Visible class annotations. Private notes are excluded.'},
  {key:'flashcardReviews',label:'Flashcard reviews',note:'Recorded review events, including repeat practice.'},
  {key:'studySeconds',label:'Flashcard practice hours',note:'Recorded active time, grouped by session start date.'},
];
const display = (key:Metric,value:number) => key==='studySeconds'?(value/3600).toLocaleString(undefined,{maximumFractionDigits:1}):value.toLocaleString();
export default function UsagePage() {
  const [days,setDays]=useState(0),[reload,setReload]=useState(0);
  const [summary,setSummary]=useState<Summary|null>(null),[error,setError]=useState('');
  useEffect(()=>{
    let live=true;
    executeLearningContent<Summary>({action:'usageSummary',days}).then(value=>{if(live)setSummary(value);}).catch(()=>{if(live)setError('The server summary could not be loaded. Check your connection and try Refresh.');});
    return ()=>{live=false;};
  },[days,reload]);
  const refresh=()=>{setSummary(null);setError('');setReload(n=>n+1);};
  const exportSummary=()=>{
    if(!summary)return;
    const rows=[['Learning is Fun — Usage & impact'],['Generated at',summary.generatedAt],['Period',summary.days?`Last ${summary.days} days`:'All retained history'],['Scope','Current students in classes owned by this teacher; synced records only'],['Coverage',summary.missingSources.length?'Partial — some sources unavailable':'Available sources loaded'],['Enrolled students',summary.students],['Students with recorded activity',summary.activeStudents],...metrics.map(m=>[m.label,display(m.key,summary.totals[m.key]),m.note]),['Interpretation','Activity is evidence of participation, not proof of learning gains.'],['Limitations','Deleted records, unsynced work, public episode views, and unsupported older activity are not included. Current enrollment is not an all-time user count.']];
    downloadCsv('learning-is-fun-usage.csv',rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\n'));
  };
  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold text-teal-700">TEACHER REPORT</p><h1 className="text-3xl font-bold text-slate-900">Usage &amp; impact</h1><p className="mt-2 max-w-2xl text-slate-600">Evidence of student participation across your classes, ready to share in a school technology meeting.</p></div>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="usage-period">Reporting period</label>
        <select id="usage-period" value={days} onChange={e=>{setSummary(null);setError('');setDays(Number(e.target.value));}} className="rounded-lg border bg-white px-3 py-2"><option value={0}>All retained history</option><option value={30}>Last 30 days</option><option value={7}>Last 7 days</option></select>
        <button className="rounded-lg border px-3 py-2" onClick={refresh}>Refresh</button>
        <button disabled={!summary} className="rounded-lg bg-teal-800 px-3 py-2 text-white disabled:opacity-40" onClick={exportSummary}>Download summary</button>
      </div>
    </header>
    {error?<div role="alert" className="rounded-xl bg-amber-50 p-5 text-amber-900">{error}</div>:!summary?<p role="status" className="p-8 text-slate-600">Counting saved activity across your classes…</p>:<>
      {summary.missingSources.length>0&&<div role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-900">Partial report: some activity sources are unavailable. Totals below are lower bounds; zero does not confirm no activity. Unavailable: {summary.missingSources.join(', ')}.</div>}
      <p className="text-sm text-slate-500">{summary.classes.length} classes you own · Server snapshot {new Date(summary.generatedAt).toLocaleString()}{summary.since?` · Since ${new Date(summary.since).toLocaleString()}`:''}</p>
      <section aria-label="Student participation" className="grid gap-4 sm:grid-cols-3">
        {[
          {label:'Enrolled students',value:summary.students.toLocaleString(),note:'Current student accounts, counted once across your classes.'},
          {label:'Students with recorded activity',value:summary.activeStudents.toLocaleString(),note:'A recorded contribution, practice session, or episode progress save during the selected period.'},
          {label:'Participation reach',value:summary.students?`${Math.round(summary.activeStudents/summary.students*100)}%`:'—',note:'Students with recorded activity as a share of current enrollment.'},
        ].map(m=><article key={m.label} className="rounded-2xl bg-teal-900 p-5 text-white"><h2 className="text-sm font-medium text-teal-100">{m.label}</h2><p className="my-3 text-4xl font-bold">{m.value}</p><p className="text-sm text-teal-100">{m.note}</p></article>)}
      </section>
      <section aria-label="Recorded learning activity" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(m=><article key={m.key} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-700">{m.label}</h2><p className="my-3 text-3xl font-bold text-slate-900">{display(m.key,summary.totals[m.key])}</p><p className="text-sm text-slate-500">{m.note}</p></article>)}</section>
      {summary.classes.length===0?<p>No owned classes found. Create a class and enroll students to begin.</p>:<section className="overflow-x-auto rounded-2xl border bg-white p-5"><h2 className="mb-4 text-lg font-bold">Participation by class</h2><table className="w-full text-left text-sm"><thead><tr>{['Class','Enrolled','Active','Questions','Replies','Episode attempts'].map(label=><th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{summary.classes.map((cls,i)=><tr key={i} className="border-t"><td className="p-2 font-medium">{cls.name}</td>{[cls.students,cls.activeStudents,cls.questions,cls.replies,cls.episodeAttempts].map((value,j)=><td key={j} className="p-2">{value.toLocaleString()}</td>)}</tr>)}</tbody></table><p className="mt-3 text-xs text-slate-500">A student in two classes appears in both rows but only once in the overall student counts.</p></section>}
    </>}
    <section className="space-y-3 rounded-2xl bg-slate-100 p-6 text-sm text-slate-700">
      <h2 className="text-lg font-bold">How to read these numbers</h2>
      <p>These are participation measures, not proof of improved learning. Pair them with student work, feedback, or assessment results when discussing educational value.</p>
      <p>The report covers synced, retained records from current students in classes you own. It excludes teacher previews, removed or hidden posts, withdrawn questions, and private annotations. Deleted records and activity from former members are absent. Older flashcard records without a class or review event are not counted.</p>
      <p>Episode starts and completions are counted on their first saved date, so a completion can fall in a different period from its start. Public episode views, unsaved plays, page views, and reading time are not tracked here. Enrolled accounts do not prove use; recorded activity gives a more useful measure.</p>
      <h2 className="pt-2 text-lg font-bold">Sharing this report</h2>
      <p>This teacher-only report returns aggregate counts without student names, emails, IDs, or writing. The downloadable summary also omits class names. No new tracking service is added. Small groups may still be recognizable in context.</p>
      <p>These safeguards apply to this report. They do not establish that the whole app meets your school’s privacy requirements; the CTO should separately review access permissions, data storage, retention, and any AI processing.</p>
    </section>
  </main>;
}
