import { PresentQuestions } from '@/components/discussions/PresentQuestions';
import {useEffect,useRef,useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {Button} from '@/components/common/Button';
import {Modal} from '@/components/common/Modal';
import {discussionCall,type ReadingDiscussion} from '@/services/reading-discussion.service';
import {formatWritingExport,type WritingExport} from '@/services/writing-export';
import {ReadingThread} from './DiscussionThread';
import {ReplyAssignments} from './ReplyAssignments';
import '@/components/texts/reading-discussion.css';

export function WritingDiscussionPanel({sessionId,classId,data,refresh}:{sessionId:string;classId:string;data:ReadingDiscussion;refresh:()=>Promise<void>}) {
 const {user}=useAuth();
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[filter,setFilter]=useState(''),[activeReply,setActiveReply]=useState<string|null>(null);
 const [exporting,setExporting]=useState(false),[format,setFormat]=useState<'txt'|'csv'>('txt'),[replies,setReplies]=useState(false),[names,setNames]=useState(false);
 const [present,setPresent]=useState(false),[selected,setSelected]=useState(0);
 const surface=useRef<HTMLDivElement>(null);
 const target={kind:'writing' as const,sessionId};
 const roots=data.posts.filter(p=>!p.parentId);
 const shown=present?roots:roots.filter(p=>p.content.toLowerCase().includes(filter.toLowerCase()));
 const mutate=async(action:string,fields:Record<string,unknown>)=>{
  setBusy(true);setError('');try{await discussionCall(action,target,fields);await refresh();}catch(e){setError(e instanceof Error?e.message:'Could not save');throw e;}finally{setBusy(false);}
 };
 const settings=(fields:Record<string,unknown>)=>void mutate('setWritingDiscussionSettings',fields).catch(()=>{});
 const exit=()=>{setPresent(false);if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});};
 useEffect(()=>{
  if(!present)return;
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')exit();};
  const fullscreen=()=>{if(!document.fullscreenElement)setPresent(false);};
  document.addEventListener('keydown',key);document.addEventListener('fullscreenchange',fullscreen);
  return()=>{document.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',fullscreen);};
 },[present]);
 const jump=(index:number)=>{const next=Math.max(0,Math.min(roots.length-1,index));setSelected(next);document.getElementById(`question-${roots[next]?.id}`)?.scrollIntoView({behavior:'smooth',block:'start'});};
 const download=async()=>{
  setBusy(true);setError('');try{
   const result=await discussionCall<WritingExport>('exportWritingResponses',target,{includeReplies:replies,includeNames:names});
   const url=URL.createObjectURL(new Blob([formatWritingExport(result,format,names)],{type:format==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download=`writing-responses-${result.date}.${format}`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setExporting(false);
  }catch(e){setError(e instanceof Error?e.message:'Could not export responses');}finally{setBusy(false);}
 };
 return <div ref={surface} className={present?'reading-workspace fixed inset-0 z-50 overflow-y-auto bg-white p-5 text-slate-900 sm:p-10':'reading-workspace rounded-2xl bg-white p-4 text-slate-900'}>
  <div className={present?'sticky top-0 z-10 flex flex-wrap gap-2 bg-white p-3 shadow-sm':'flex flex-wrap items-center gap-3'}>
   {present?<><Button variant="secondary" onClick={exit}>Exit presentation</Button><Button disabled={!roots.length||selected===0} onClick={()=>jump(selected-1)}>Previous</Button><Button disabled={!roots.length||selected>=roots.length-1} onClick={()=>jump(selected+1)}>Next</Button><span className="self-center">{roots.length?selected+1:0} / {roots.length}</span></>:<>
    <h2 className="mr-auto text-xl font-bold">Submissions</h2>
    {(data.teacher||data.studentsCanView)&&<PresentQuestions picker={data.teacher ? {classId,students:data.participation} : undefined} questions={shown.filter(p=>!p.hidden).map(p=>p.content)} />}
    <Button variant="secondary" disabled={busy} onClick={()=>void refresh()}>Refresh responses</Button>
    {data.teacher&&<><Button variant="secondary" onClick={()=>setExporting(true)}>Export Responses</Button><Button onClick={()=>{setPresent(true);setSelected(0);void surface.current?.requestFullscreen?.().catch(()=>{});surface.current?.scrollTo?.(0,0);}}>Present</Button></>}
   </>}
  </div>
  {error&&<p role="alert" className="my-3 text-red-700">{error}</p>}
  {!present&&data.teacher&&<div className="my-4 flex flex-wrap gap-5 rounded-xl bg-slate-50 p-4">
   <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(data.discussionMode)} disabled={busy} onChange={e=>settings({discussionMode:e.target.checked})}/>Discussion Mode</label>
   <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(data.studentsCanView)} disabled={busy} onChange={e=>settings({studentsCanView:e.target.checked})}/>Students can see submissions</label>
   <p className="w-full text-sm text-slate-600">Student submissions and replies are anonymous to classmates. Hiding submissions pauses student discussion.</p>
  </div>}
  {!present&&(data.teacher||data.studentsCanView)&&<>
   {(data.discussionMode||Boolean(data.rounds?.length)||Boolean(data.assignments?.length))&&<ReplyAssignments data={data} target={target} textId="" classId="" busy={busy} mutate={mutate} onReply={id=>{setActiveReply(id);requestAnimationFrame(()=>document.getElementById(`question-${id}`)?.scrollIntoView({behavior:'smooth',block:'center'}));}}/>}
   <input aria-label="Filter responses" className="my-3 w-full rounded-lg border p-3" placeholder="Filter responses…" value={filter} onChange={e=>setFilter(e.target.value)}/>
  </>}
  {!data.teacher&&!data.studentsCanView?<p className="py-5 text-slate-600">Your teacher has not shared classmates’ submissions.</p>:<div className={present?'mx-auto max-w-5xl space-y-10 text-2xl':'space-y-3'}>
   {shown.map(post=><ReadingThread key={`${post.id}:${present}`} writing post={!present&&data.teacher?{...post,label:post.username?`${post.label} · ${post.username}`:post.label}:post} posts={data.posts.map(p=>!present&&data.teacher&&p.username?{...p,label:`${p.label} · ${p.username}`}:p)} teacher={data.teacher&&!present} canWrite={data.canWrite&&!present} busy={busy} mutate={mutate} readUrl="" draftPrefix={`writing:${user?.$id}:${sessionId}`} present={present} onSelect={()=>jump(roots.findIndex(p=>p.id===post.id))} activeReply={activeReply} setActiveReply={setActiveReply} consumeQuote={()=>{}}/>)}
   {!shown.length&&<p className="p-5 text-slate-500">{filter?'No matching submissions.':'No submissions yet.'}</p>}
  </div>}
  {exporting&&<Modal open title="Export Responses" onClose={()=>{if(!busy)setExporting(false);}}><div className="space-y-4">
   <label className="block">Format<select className="ml-3 rounded border p-2" value={format} onChange={e=>setFormat(e.target.value as 'txt'|'csv')}><option value="txt">TXT</option><option value="csv">CSV</option></select></label>
   <label className="flex gap-2"><input type="checkbox" checked={replies} onChange={e=>setReplies(e.target.checked)}/>Include replies</label>
   <label className="flex gap-2"><input type="checkbox" checked={names} onChange={e=>setNames(e.target.checked)}/>Include student names</label>
   <p className="text-sm text-slate-600">Downloads every submission, including responses outside the current filter.</p>
   {error&&<p role="alert" className="text-red-700">{error}</p>}
   <Button loading={busy} onClick={()=>void download()}>Download {format.toUpperCase()}</Button>
  </div></Modal>}
 </div>;
}
