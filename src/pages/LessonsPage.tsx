import {useEffect,useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {executeLearningContent as call} from '@/services/learning-content.service';

type Item={id:string;classId:string;title:string;objective:string;minutes:number|string;className:string};
type Question={prompt:string;options?:string[]};
type Stage={title:string;explanation:string;model:string;sourceUrl?:string;questions:Question[]};
type Attempt={text:string;feedback?:string;criteria?:boolean[]};
type Progress={step:number;misses:number;checks:{step:number;correct:boolean;answer:string}[];draft:string;submissions:Attempt[];outcome:string;notice:string;reviewed?:boolean};
type Task={title:string;prompt:string;source:string;sourceUrl:string;rubric:string[];delayedCheck:string};
type Player={lesson:Item&{stages:Stage[];final:Task};state:Progress;revision:number;warning?:string};
type Row={studentId:string;name:string;revision:number;state:Progress|null};
const outcomes=['Completed','Demonstrated with support','Demonstrated independently','Needs another attempt'];
const panel='space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const btn='rounded-lg bg-teal-800 px-4 py-2 font-semibold text-white disabled:opacity-50';
const secondary='rounded-lg border border-teal-700 px-4 py-2 font-semibold text-teal-900 disabled:opacity-50';
const label='text-xs font-bold uppercase tracking-wider text-teal-800';
const message=(e:unknown)=>e instanceof Error?e.message:'Something went wrong. Please try again.';
function Library({teacher}:{teacher:boolean}){
 const [items,setItems]=useState<Item[]>(),[error,setError]=useState(''),[load,setLoad]=useState(0);
 const [choice,choose]=useState<{item:Item;report:boolean}|null>(null);
 useEffect(()=>{let live=true;call<{items:Item[]}>({action:'lessonLibrary'}).then(r=>{if(live)setItems(r.items)}).catch(e=>{if(live)setError(message(e))});return()=>{live=false}},[load]);
 const item=choice?.item;
 return <main className="mx-auto max-w-3xl space-y-5 p-4 pb-24 text-slate-900">
 <header className="rounded-2xl bg-teal-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-teal-200">Learning is Fun · Practice studio</p><h1 className="my-2 text-3xl font-bold">Lessons</h1><p>{teacher?'Preview the practice and see how your students are doing.':'Study a model, try it yourself, and put feedback to work.'}</p></header>
 {error&&<p role="alert">{error} <button onClick={()=>{setError('');setLoad(load+1)}}>Retry</button></p>}
 {choice&&item?<><button className={secondary} onClick={()=>choose(null)}>← All lessons</button>{choice.report?<Report item={item}/>:<Practice item={item}/>}</>:
 !items?(!error&&<p>Loading lessons…</p>):items.length===0?<p className={panel}>No lessons are available for your classes yet.</p>:items.map(i=><article className={panel} key={i.id+i.classId}><p className={label}>{i.className} · {i.minutes} min</p><h2 className="text-xl font-bold">{i.title}</h2><p>{i.objective}</p><div className="flex flex-wrap gap-3"><button className={btn} onClick={()=>choose({item:i,report:false})}>{teacher?'Preview lesson':'Open lesson'}</button>{teacher&&<button className={secondary} onClick={()=>choose({item:i,report:true})}>Student progress</button>}</div></article>)}</main>
}
export function LessonsPage(){const {user,isTeacher}=useAuth();return <Library key={user?.$id+String(isTeacher)} teacher={isTeacher}/>;}
const scope=(i:Item)=>({classId:i.classId,lessonId:i.id});
function Practice({item}:{item:Item}){
 const [data,setData]=useState<Player>(),[answer,setAnswer]=useState(''),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const {user}=useAuth(),cache='lesson-draft:'+user?.$id+':'+item.classId+':'+item.id;
 useEffect(()=>{let live=true;call<Player>({action:'lessonRead',...scope(item)}).then(r=>{if(live){setData(r);let d=r.state.draft;try{d=localStorage.getItem(cache)??d}catch{/* storage unavailable */}setDraft(d)}}).catch(e=>{if(live)setError(message(e))});return()=>{live=false}},[item,cache,reload]);
 async function send(action:string){
 if(!data||busy)return;setBusy(true);setError('');
 try{const r=await call<Player>({action,...scope(item),revision:data.revision,...(action==='lessonAnswer'?{answer}:{draft})});setData(r);setAnswer('');if(action!=='lessonAnswer'){try{localStorage.removeItem(cache)}catch{/* already saved remotely */}}}catch(e){setError(message(e))}finally{setBusy(false)}}
 const states=data?.lesson.stages.flatMap((stage,si)=>stage.questions.map(q=>({q,stage,si}))),current=states?.[data?.state.step??0],final=data?.lesson.final,last=data?.state.submissions.at(-1);
 return <div className="space-y-4">{error&&<p className={panel} role="alert">{error} <button className={secondary} onClick={()=>{setError('');setReload(reload+1)}}>Reload saved work</button></p>}{!data?<p>Opening lesson…</p>:<>
 <h2 className="text-2xl font-bold">{item.title}</h2><progress aria-label="Lesson progress" className="w-full accent-teal-700" max={(states?.length||0)+1} value={data.state.step+(last?1:0)} />
 {data.state.notice&&<p role="status" className="rounded-xl bg-teal-50 p-4">{data.state.notice}</p>}
 {current?<section className={panel}><p className={label}>Stage {current.si+1} · Check {data.state.step+1} of {states?.length}</p><h3 className="text-xl font-bold">{current.stage.title}</h3><p className="whitespace-pre-line">{current.stage.explanation}</p><aside className="whitespace-pre-line rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4">{current.stage.model}{current.stage.sourceUrl&&<><br/><a className="text-teal-800 underline" href={current.stage.sourceUrl} target="_blank" rel="noreferrer">Read the source ↗</a></>}</aside>
 <fieldset disabled={busy} className="space-y-2"><legend className="mb-2 font-semibold">{current.q.prompt}</legend>{current.q.options?current.q.options.map(o=><label key={o} className="flex items-start gap-3 rounded-lg border p-3"><input type="radio" className="mt-1" name="choice" checked={answer===o} onChange={()=>setAnswer(o)}/>{o}</label>):<input aria-label="Your answer" className="w-full rounded-lg border p-3" value={answer} maxLength={600} onChange={e=>setAnswer(e.target.value)}/>}</fieldset><button className={btn} disabled={busy||!answer.trim()} onClick={()=>void send('lessonAnswer')}>Check answer</button></section>:
 final&&<section className={panel}><p className={label}>Independent application</p><h3 className="text-xl font-bold">{final.title}</h3><p className="whitespace-pre-line">{final.prompt}</p><aside className="whitespace-pre-line rounded-xl bg-slate-50 p-4">{final.source}<br/><a className="text-teal-800 underline" href={final.sourceUrl} target="_blank" rel="noreferrer">Open original source ↗</a></aside><details><summary>Success criteria</summary><ul className="list-disc pl-6">{final.rubric.map(r=><li key={r}>{r}</li>)}</ul></details>
 <label className="block font-semibold">Your entry<textarea disabled={busy} rows={7} maxLength={4500} className="mt-2 w-full rounded-lg border p-3 font-normal" value={draft} onChange={e=>{setDraft(e.target.value);try{localStorage.setItem(cache,e.target.value)}catch{/* Save draft is also available */}}}/></label>
 <div className="flex flex-wrap gap-2"><button className={btn} disabled={busy||!draft.trim()||(!!last?.feedback&&last.text.trim()===draft.trim())||data.state.submissions.filter(a=>a.feedback).length>=5} onClick={()=>void send('lessonSubmit')}>{busy?'Saving…':last?'Submit for feedback again':'Submit for feedback'}</button><button className={secondary} disabled={busy||draft===data.state.draft} onClick={()=>void send('lessonDraft')}>Save draft</button></div>
 {last&&<div role="status" className="space-y-2 rounded-xl bg-teal-50 p-4"><strong>{data.state.outcome}</strong><p>{last.feedback||data.warning||'Entry saved for teacher review.'}</p>{last.criteria&&<ul>{final.rubric.map((r,i)=><li key={r}>{last.criteria?.[i]?'✓ Met':'○ Revisit'} · {r}</li>)}</ul>}<p className="text-sm">Next time: {final.delayedCheck}</p></div>}</section>}</>}</div>
}
function Report({item}:{item:Item}){
 const [report,setReport]=useState<{rows:Row[];rubric:string[]}>(),[error,setError]=useState(''),[n,setN]=useState(0),[busy,setBusy]=useState(false);
 useEffect(()=>{let live=true;call<{rows:Row[];rubric:string[]}>({action:'lessonRoster',...scope(item)}).then(r=>{if(live)setReport(r)}).catch(e=>{if(live)setError(message(e))});return()=>{live=false}},[item,n]);
 async function review(r:Row,outcome:string){setBusy(true);setError('');try{await call({action:'lessonReview',...scope(item),studentId:r.studentId,revision:r.revision,outcome});setN(v=>v+1)}catch(e){setError(message(e))}finally{setBusy(false)}}
 return <section className={panel}><h2 className="text-xl font-bold">{item.className} · Student progress</h2><button className={secondary} onClick={()=>{setError('');setN(n+1)}}>Refresh</button>{error&&<p role="alert">{error}</p>}{!report?'Loading…':!report.rows.length?'No enrolled students.':report.rows.map(r=><details className="rounded-lg border p-3" key={r.studentId}><summary>{r.name} · {r.state?.outcome||(r.state?'In progress':'Not started')}</summary>{r.state&&<div className="space-y-3 pt-3"><p>Checks advanced: {r.state.step} · Correct on first try: {r.state.checks.filter((c,i,a)=>c.correct&&a.findIndex(v=>v.step===c.step)===i).length}</p>{r.state.checks.filter(c=>!c.correct).map((c,i)=><p key={i}>Check {c.step+1} · Revisit: {c.answer}</p>)}{r.state.submissions.map((a,i)=><div className="rounded bg-slate-50 p-3" key={i}><strong>Submission {i+1}</strong><p className="whitespace-pre-line">{a.text}</p><p>{a.feedback}</p>{a.criteria?.map((ok,j)=><p key={j}>{ok?'Met':'Revisit'}: {report.rubric[j]}</p>)}</div>)}{!!r.state.submissions.length&&<label>Teacher review <select disabled={busy} value={r.state.outcome} onChange={e=>void review(r,e.target.value)}>{outcomes.map(o=><option key={o}>{o}</option>)}</select></label>}</div>}</details>)}</section>
}
