import TeacherSection from '@/components/teachers/TeacherSection';
import {useNavigate} from 'react-router-dom';
import TeacherExamples from '@/components/teachers/TeacherExamples';
import {previewState,previewView,previewAnswer,type LessonDefinition} from '@/services/lesson-authoring';
import './lessons.css';
import {CitationBuilder} from './CitationBuilder';
import {useEffect,useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {executeLearningContent as call} from '@/services/learning-content.service';
import {lessonClassLabel} from '@/services/lesson-class-label';

type Item={id:string;dueOn?:string|null;assignedOn?:string|null;progressId?:string;releaseAt?:string|null;courseName?:string;classId:string;title:string;objective:string;minutes:number|string;className:string};
type Question={rehearsal?:{prompt:string;sample:string};pieces?:string[];italicPieces?:string[];prompt:string;options?:string[]};
type Stage={image?:{path?:string;url?:string;fileId?:string;alt:string;caption:string};teachFirst?:boolean;shortTitle?:string;modelRows?:[string,string][];title:string;explanation:string;model:string;sourceUrl?:string;questions:Question[]};
type Attempt={text:string;feedback?:string;criteria?:boolean[]};
type Progress={practiceSubmittedAt?:string;step:number;misses:number;checks:{step:number;correct:boolean;answer:string}[];draft:string;submissions:Attempt[];outcome:string;notice:string;reviewed?:boolean};
type Task={shortTitle?:string;title:string;prompt:string;source:string;sourceUrl:string;rubric:string[];delayedCheck:string};
type Player={previewDefinition?:LessonDefinition;lesson:Item&{finalOptional?:boolean;stages:Stage[];final:Task};state:Progress;revision:number;warning?:string};
type Row={studentId:string;name:string;revision:number;state:Progress|null};
const outcomes=['Completed','Demonstrated with support','Demonstrated independently','Needs another attempt'];
const panel='space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const btn='rounded-lg bg-teal-800 px-4 py-2 font-semibold text-white disabled:opacity-50';
const secondary='rounded-lg border border-teal-700 px-4 py-2 font-semibold text-teal-900 disabled:opacity-50';
const label='text-xs font-bold uppercase tracking-wider text-teal-800';
const message=(e:unknown)=>e instanceof Error?e.message:'Something went wrong. Please try again.';
function dueLabel(item:Item){return item.dueOn?' · Due '+new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(item.dueOn+'T12:00:00+08:00')):'';}
function LessonDates({item}:{item:Item}){
 const date=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'Asia/Shanghai'});
 return <div className="lesson-dates"><span>{item.releaseAt?'Release: '+date.format(new Date(item.releaseAt)):item.assignedOn?'Assigned: '+date.format(new Date(item.assignedOn+'T12:00:00+08:00')):'Available now'}</span>{item.dueOn&&<span>Due {date.format(new Date(item.dueOn+'T12:00:00+08:00'))}</span>}</div>;
}
function classFilterLabels(items:Item[],teacher:boolean){
 const sections=new Map(items.map(item=>[item.classId,item]));
 const titles=new Map<string,string>(),counts=new Map<string,number>();
 for(const [id,{courseName,className}] of sections){
  const title=courseName?.trim()||className;
  const label=teacher?lessonClassLabel(id,title):title;
  titles.set(id,label);counts.set(label,(counts.get(label)||0)+1);
 }
 for(const [id,title] of titles){
  const section=sections.get(id)?.className.trim();
  if((counts.get(title)||0)>1&&section&&section!==title)titles.set(id,title+' · '+section);
 }
 return titles;
}
function TeacherLibrary({items,onChoose,onEdit,busy,expandAll=false}:{expandAll?:boolean;items:Item[];onEdit:(item:Item)=>void;busy:boolean;onChoose:(selection:{item:Item;report:boolean})=>void}){
 const groups=new Map<string,Item[]>();
 for(const item of items){const rows=groups.get(item.classId)||[];rows.push(item);groups.set(item.classId,rows);}
 const labels=classFilterLabels(items,true);
 return <section aria-label="Lessons by class" className="teacher-lesson-groups">{[...groups.entries()].sort(([a],[b])=>(labels.get(a)||a).localeCompare(labels.get(b)||b)).map(([classId,rows],index)=><TeacherSection key={classId} title={labels.get(classId)||rows[0].className} tone={(['sage','peach','lavender','blue'] as const)[index%4]} defaultOpen={expandAll||index===0} meta={`${rows.length} ${rows.length===1?'lesson':'lessons'}`}>
 {rows.sort((a,b)=>a.title.localeCompare(b.title)).map((item,index)=><details open={index===0} key={item.id} className="teacher-lesson-row">
 <summary><span className="teacher-lesson-title">{item.title}</span><span className="lesson-meta">{item.minutes} min{dueLabel(item)}</span></summary>
 <div className="teacher-lesson-body"><p>{item.objective}</p><LessonDates item={item}/><div className="lesson-row-actions"><button onClick={()=>onChoose({item,report:false})}>Preview lesson</button><button onClick={()=>onChoose({item,report:true})}>Student progress</button><button disabled={busy} onClick={()=>onEdit(item)}>Edit with AI</button></div></div>
 </details>)}
 </TeacherSection>)}</section>;
}

function Library({teacher}:{teacher:boolean}){
 const navigate=useNavigate();
 const [editing,setEditing]=useState(false);
 async function editAssigned(item:Item){if(editing)return;setEditing(true);setError('');try{const result=await call<{draftId:string}>({action:'lessonEditAssigned',classId:item.classId,lessonId:item.id});navigate('/create/lesson?draft='+encodeURIComponent(result.draftId))}catch(e){setError(message(e))}finally{setEditing(false)}}
 const [query,setQuery]=useState(''),[classFilter,setClassFilter]=useState(''),[previousVersions,setPreviousVersions]=useState(false);
 const [items,setItems]=useState<Item[]>(),[error,setError]=useState(''),[load,setLoad]=useState(0);
 const [choice,choose]=useState<{item:Item;report:boolean}|null>(null);
 useEffect(()=>{let live=true;call<{items:Item[]}>({action:'lessonLibrary',previousVersions}).then(r=>{if(live)setItems(r.items)}).catch(e=>{if(live)setError(message(e))});return()=>{live=false}},[load,previousVersions]);
 const item=choice?.item,classLabels=classFilterLabels(items||[],teacher);
 const classes=[...classLabels].sort((a,b)=>a[1].localeCompare(b[1]));
 const filtered=(items||[]).filter(i=>(!classFilter||i.classId===classFilter)&&[i.title,i.objective,i.className,i.courseName,classLabels.get(i.classId)].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const lessonCount=new Set(filtered.map(i=>i.id)).size;
 return <div className="lesson-studio lesson-library mx-auto space-y-4 p-4 pb-24 text-slate-900">
 {!choice&&<><header className="lesson-library-head"><div><p className="lesson-eyebrow">Learning is Fun · {teacher?'Teaching studio':'Practice studio'}</p><h1>Lessons</h1><p>{teacher?'Find assigned lessons, resume a draft, or create something new.':'Study a model, try it yourself, and put feedback to work.'}</p></div>{teacher&&<button className="lesson-create" onClick={()=>navigate('/create/lesson')}><span aria-hidden="true">＋</span> Create lesson</button>}</header>
 <div className="lesson-library-tools">{teacher&&<nav aria-label="Lesson library"><button aria-current="page">Assigned</button><button onClick={()=>navigate('/create/lesson?resume=1')}>Drafts</button></nav>}<div className="lesson-filters"><label><span className="sr-only">Search lessons</span><input type="search" placeholder="Search lessons" value={query} onChange={e=>setQuery(e.target.value)}/></label><label><span className="sr-only">Filter by class</span><select value={classFilter} onChange={e=>setClassFilter(e.target.value)}><option value="">All classes</option>{classes.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label></div></div></>}
 {!choice&&<label className="lesson-meta"><input type="checkbox" checked={previousVersions} onChange={e=>{setItems(undefined);setPreviousVersions(e.target.checked)}}/> Previous lesson versions · earlier work stays here</label>}
 <div className={teacher&&!choice?"teacher-library-grid":""}><div className="teacher-library-main space-y-4">
 {editing&&<p role="status">Opening a revision draft… Existing student work stays with the original version.</p>}
 {error&&<p role="alert" className="lesson-empty">{error} <button onClick={()=>{setError('');setLoad(load+1)}}>Retry</button></p>}
 {choice&&item?<><button className={secondary} onClick={()=>choose(null)}>← All lessons</button>{teacher&&<button className={secondary} disabled={editing} onClick={()=>void editAssigned(item)}>Edit with AI</button>}{choice.report?<Report item={item}/>:<Practice item={item}/>}</>:
 !items?(!error&&<p className="lesson-empty" role="status">Loading lessons…</p>):!filtered.length?<div className="lesson-empty"><h2>{items.length?'No matching lessons':'No assigned lessons yet'}</h2><p>{items.length?'Try another title or class.':teacher?'Create a lesson or open Drafts to continue one.':'Your assigned lessons will appear here.'}</p>{items.length>0&&<button onClick={()=>{setQuery('');setClassFilter('')}}>Clear filters</button>}</div>:<><p className="lesson-result-count">{lessonCount} {lessonCount===1?'lesson':'lessons'}</p>{teacher?<TeacherLibrary key={query+classFilter} expandAll={!!query||!!classFilter} items={filtered} onChoose={choose} busy={editing} onEdit={item=>void editAssigned(item)}/>:filtered.map(i=><article className="lesson-student-row" key={i.id+i.classId}><div><p className="lesson-meta">{i.className} · {i.minutes} min{dueLabel(i)}</p><h2>{i.title}</h2><p>{i.objective}</p></div><button className="lesson-create" onClick={()=>choose({item:i,report:false})}>Open lesson</button></article>)}</>}
 </div>{teacher&&!choice&&<aside className="teacher-library-aside"><TeacherExamples section="lessons"/></aside>}</div>
 </div>;
}
export function LessonsPage(){const {user,isTeacher}=useAuth();return <Library key={user?.$id+String(isTeacher)} teacher={isTeacher}/>;}
const scope=(i:Item)=>({citationBuilder:true,classId:i.classId,lessonId:i.id});
export function Practice({item,definition}:{item:Item;definition?:LessonDefinition}){
 const [practice,setPractice]=useState({key:'',text:'',compared:false});
 const [data,setData]=useState<Player>(),[answer,setAnswer]=useState(''),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const {user}=useAuth(),cache='lesson-draft:'+user?.$id+':'+item.classId+':'+(item.progressId||item.id);
 useEffect(()=>{if(definition){const state=previewState();setData({lesson:{...item,...previewView(definition,state)},state,revision:0,previewDefinition:definition});return;}let live=true;call<Player>({action:'lessonRead',...scope(item)}).then(r=>{if(live){setData(r);let d=r.state.draft;try{if(!r.previewDefinition)d=localStorage.getItem(cache)??d}catch{/* storage unavailable */}setDraft(d)}}).catch(e=>{if(live)setError(message(e))});return()=>{live=false}},[item,cache,reload,definition]);
 async function send(action:string){
 if(!data||busy)return;setBusy(true);setError('');
 try{if(data.previewDefinition){const state=previewAnswer(data.previewDefinition,data.state as ReturnType<typeof previewState>,answer);setData({...data,lesson:{...data.lesson,...previewView(data.previewDefinition,state)},state});setAnswer('');return;}const r=await call<Player>({action,...scope(item),revision:data.revision,...(action==='lessonAnswer'?{answer}:{draft})});setData(r);if(!current?.q.pieces||r.state.step!==data.state.step||(r.state.misses>=2)!==(data.state.misses>=2))setAnswer('');if(action==='lessonSubmit'||action==='lessonDraft'){try{localStorage.removeItem(cache)}catch{/* already saved remotely */}}}catch(e){setError(message(e))}finally{setBusy(false)}}
 const states=data?.lesson.stages.flatMap((stage,si)=>stage.questions.map((q,qi)=>({q,stage,si,qi}))),current=states?.[data?.state.step??0],final=data?.lesson.final,last=data?.state.submissions.at(-1);
 const rehearsal=current?.q.rehearsal;const practiceText=practice.key===rehearsal?.prompt?practice.text:'';const compared=!!practiceText.trim()&&practice.compared;
 return <div className="space-y-4">{error&&<p className={panel} role="alert">{error} <button className={secondary} onClick={()=>{setError('');setReload(reload+1)}}>Reload saved work</button></p>}{!data?<p>Opening lesson…</p>:<>
 {data.previewDefinition&&<p role="status" className="rounded-lg bg-amber-50 p-3">Teacher preview · Practice stays here. No student work is saved and no AI feedback is requested.</p>}
 <header className="lesson-intro"><p className={label}>Lessons · Practice studio</p><h1>{item.title}</h1><p>{item.className} <span aria-hidden="true">·</span> {item.minutes} min{dueLabel(item)}</p></header>
 <ol className="lesson-trail" aria-label="Lesson stages">{[...data.lesson.stages.map(s=>s.shortTitle||s.title),final?.shortTitle||'Independent application'].map((title,i)=>{
 const active=current?.si??data.lesson.stages.length;return <li key={i} aria-current={i===active?'step':undefined} className={i<active?'done':''}><b aria-hidden="true">{i<active?'✓':i+1}</b>{title}</li>})}</ol>
 {data.state.notice&&<p role="status" className="rounded-xl bg-teal-50 p-4">{data.state.notice}</p>}
 {current?<><section className="lesson-practice"><p className="lesson-band">Stage {current.si+1} · Check {data.state.step+1} of {states?.length}</p><div className="lesson-question"><h2>{current.stage.title}</h2>
 {current.stage.teachFirst&&<p className="lesson-mini">{current.stage.explanation}</p>}
 {current.stage.image&&current.qi===0&&<figure className="my-4"><img className="w-full max-w-2xl rounded-lg" src={current.stage.image.url||import.meta.env.BASE_URL+current.stage.image.path} alt={current.stage.image.alt}/><figcaption className="mt-1 text-sm">{current.stage.image.caption}</figcaption></figure>}
 {rehearsal&&<div className="lesson-mini"><label className="block">{rehearsal.prompt}<textarea rows={2} maxLength={1500} className="my-2 block w-full rounded border bg-white p-2" aria-label="Practice in your own words" value={practiceText} onChange={e=>setPractice({key:rehearsal.prompt,text:e.target.value,compared:false})}/></label>
 <button type="button" disabled={!practiceText.trim()} className={secondary} onClick={()=>setPractice({...practice,compared:true})}>Compare with a model</button>{compared&&<p role="status" className="mt-3">{rehearsal.sample}</p>}</div>}
 {rehearsal&&!compared&&<p role="status" className="lesson-mini">You can select an answer below. Before checking it, write your short response above, then choose “Compare with a model”.</p>}
 <fieldset disabled={busy} className="space-y-2"><legend className="mb-2 font-semibold">{current.q.prompt}</legend>{current.q.pieces?<CitationBuilder key={data.state.step+':'+(data.state.misses>=2)} pieces={current.q.pieces} italicPieces={current.q.italicPieces} onChange={setAnswer}/>:current.q.options?current.q.options.map(o=><label key={o} className={"lesson-choice flex items-start gap-3 rounded-lg border p-3"+(answer===o?" lesson-choice-selected":"")}><input type="radio" className="mt-1" name="choice" checked={answer===o} onChange={()=>setAnswer(o)}/>{o}</label>):<input aria-label="Your answer" className="w-full rounded-lg border p-3" value={answer} maxLength={600} onChange={e=>setAnswer(e.target.value)}/>}</fieldset><button className={btn} disabled={busy||!answer.trim()||!!rehearsal&&!compared} onClick={()=>void send('lessonAnswer')}>Check answer</button></div></section>
 <details className="lesson-model" key={data.state.step+':'+(data.state.misses>=2)} open={current.qi===0||data.state.misses>=2}>
 <summary>Worked example <span>Study the model</span></summary>
 <div className="lesson-model-body">{current.stage.modelRows?<dl>{current.stage.modelRows.map(([name,text])=><div key={name}><dt>{name}</dt><dd>{text}</dd></div>)}</dl>:<p className="whitespace-pre-line">{current.stage.model}</p>}
 {!current.stage.teachFirst&&<p className="lesson-explanation">{current.stage.explanation}</p>}{current.stage.sourceUrl&&<a href={current.stage.sourceUrl} target="_blank" rel="noreferrer">Read the source ↗</a>}</div></details></>:
 final&&<section className={panel}>{data.lesson.finalOptional&&<div className="space-y-3 rounded-xl bg-teal-50 p-4"><p>You have finished the practice checks. You can submit this lesson now without completing the final application.</p><button className={btn} disabled={!!data.previewDefinition||busy||!!data.state.practiceSubmittedAt} onClick={()=>void send('lessonComplete')}>{data.state.practiceSubmittedAt?'Lesson submitted without final application':busy?'Saving…':'Submit lesson without final application'}</button><p className="text-sm">The final application below is optional.</p></div>}<p className={label}>Independent application{data.lesson.finalOptional?' · Optional':''}</p><h3 className="text-xl font-bold">{final.title}</h3><p className="whitespace-pre-line">{final.prompt}</p><aside className="whitespace-pre-line rounded-xl bg-slate-50 p-4">{final.source}<br/>{final.sourceUrl&&<a className="text-teal-800 underline" href={final.sourceUrl} target="_blank" rel="noreferrer">Open original source ↗</a>}</aside><details><summary>Success criteria</summary><ul className="list-disc pl-6">{final.rubric.map(r=><li key={r}>{r}</li>)}</ul></details>
 <label className="block font-semibold">Your entry<textarea disabled={busy} rows={7} maxLength={4500} className="mt-2 w-full rounded-lg border p-3 font-normal" value={draft} onChange={e=>{setDraft(e.target.value);try{if(!data.previewDefinition)localStorage.setItem(cache,e.target.value)}catch{/* Save draft is also available */}}}/></label>
 <div className="flex flex-wrap gap-2"><button className={btn} disabled={!!data.previewDefinition||busy||!draft.trim()||(!!last?.feedback&&last.text.trim()===draft.trim())||data.state.submissions.filter(a=>a.feedback).length>=5} onClick={()=>void send('lessonSubmit')}>{busy?'Saving…':last?'Submit for feedback again':'Submit for feedback'}</button><button className={secondary} disabled={!!data.previewDefinition||busy||draft===data.state.draft} onClick={()=>void send('lessonDraft')}>Save draft</button></div>
 {last&&<div role="status" className="space-y-2 rounded-xl bg-teal-50 p-4"><strong>{data.state.outcome}</strong><p>{last.feedback||data.warning||'Entry saved for teacher review.'}</p>{last.criteria&&<ul>{final.rubric.map((r,i)=><li key={r}>{last.criteria?.[i]?'✓ Met':'○ Revisit'} · {r}</li>)}</ul>}<p className="text-sm">Next time: {final.delayedCheck}</p></div>}</section>}</>}</div>
}
function Report({item}:{item:Item}){
 const [report,setReport]=useState<{rows:Row[];rubric:string[]}>(),[error,setError]=useState(''),[n,setN]=useState(0),[busy,setBusy]=useState(false);
 useEffect(()=>{let live=true;call<{rows:Row[];rubric:string[]}>({action:'lessonRoster',...scope(item)}).then(r=>{if(live)setReport(r)}).catch(e=>{if(live)setError(message(e))});return()=>{live=false}},[item,n]);
 async function review(r:Row,outcome:string){setBusy(true);setError('');try{await call({action:'lessonReview',...scope(item),studentId:r.studentId,revision:r.revision,outcome});setN(v=>v+1)}catch(e){setError(message(e))}finally{setBusy(false)}}
 return <section className={panel}><h2 className="text-xl font-bold">{item.className} · Student progress</h2><button className={secondary} onClick={()=>{setError('');setN(n+1)}}>Refresh</button>{error&&<p role="alert">{error}</p>}{!report?'Loading…':!report.rows.length?'No enrolled students.':report.rows.map(r=><details className="rounded-lg border p-3" key={r.studentId}><summary>{r.name} · {r.state?.outcome||(r.state?'In progress':'Not started')}</summary>{r.state&&<div className="space-y-3 pt-3">{r.state.practiceSubmittedAt&&<p>Practice submitted · Final application optional.</p>}<p>Checks advanced: {r.state.step} · Correct on first try: {r.state.checks.filter((c,i,a)=>c.correct&&a.findIndex(v=>v.step===c.step)===i).length}</p>{r.state.checks.filter(c=>!c.correct).map((c,i)=><p key={i}>Check {c.step+1} · Revisit: {c.answer}</p>)}{r.state.submissions.map((a,i)=><div className="rounded bg-slate-50 p-3" key={i}><strong>Submission {i+1}</strong><p className="whitespace-pre-line">{a.text}</p><p>{a.feedback}</p>{a.criteria?.map((ok,j)=><p key={j}>{ok?'Met':'Revisit'}: {report.rubric[j]}</p>)}</div>)}{!!r.state.submissions.length&&<label>Teacher review <select disabled={busy} value={r.state.outcome} onChange={e=>void review(r,e.target.value)}>{outcomes.map(o=><option key={o}>{o}</option>)}</select></label>}</div>}</details>)}</section>
}
