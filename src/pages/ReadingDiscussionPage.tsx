import { EditReadingContribution } from '@/components/discussions/EditReadingContribution';
import { DiscussionTextInput, DiscussionVote, DiscussionModeration } from '@/components/discussions/DiscussionControls';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { ExpandableContribution } from '@/components/discussions/ExpandableContribution';
import { ParallelReading } from '@/components/texts/ParallelReading';
import '@/components/texts/reading-discussion.css';
import { readingDiscussion, sortedReadingPosts, topReadingReplies, type ReadingCategory, type ReadingDiscussion, type ReadingDiscussionPost } from '@/services/reading-discussion.service';

export function ReadingDiscussionPage() {
  const {textId='',classId=''}=useParams();
  return <DiscussionWorkspace key={`${textId}:${classId}`} textId={textId} classId={classId}/>;
}
function DiscussionWorkspace({textId,classId}:{textId:string;classId:string}) {
  const {user}=useAuth();
  const [anonymous,setAnonymous]=useState(()=>{try{return localStorage.getItem('teacher-anonymous:'+classId)==='true';}catch{return false;}});
  const [data,setData]=useState<ReadingDiscussion>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[parallel,setParallel]=useState(false),[present,setPresent]=useState(false),[selected,setSelected]=useState<string|null>(null);
  const lastRead=useRef(0),readRevision=useRef(0);
  const refresh=useCallback(async()=>{const revision=++readRevision.current;try{const next=await readingDiscussion<ReadingDiscussion>('readReadingDiscussion',textId,classId);if(revision===readRevision.current){setData(next);setError('');lastRead.current=Date.now();}}catch(e){if(revision===readRevision.current)setError(e instanceof Error?e.message:'Could not refresh');}},[textId,classId]);
  useEffect(()=>{void Promise.resolve().then(refresh);const onFocus=()=>{if(document.visibilityState==='visible'&&Date.now()-lastRead.current>60000)void refresh();};window.addEventListener('focus',onFocus);const timer=window.setInterval(onFocus,120000);return()=>{clearInterval(timer);window.removeEventListener('focus',onFocus);};},[refresh]);
  const mutate=async(action:string,fields:Record<string,unknown>)=>{setBusy(true);setError('');try{await readingDiscussion(action,textId,classId,fields);await refresh();}catch(e){setError(e instanceof Error?e.message:'Could not save');throw e;}finally{setBusy(false);}};
  if(!data)return <div className="p-6"><Link to="/discussions">← Discussions</Link><p role={error?'alert':undefined}>{error||'Loading text discussion…'}</p><Button onClick={()=>void refresh()}>Retry</Button></div>;
  const showNames=data.teacher?!anonymous:data.showStudentNames===true;
  const visiblePosts=present?data.posts.filter(p=>!p.hidden):data.posts;
  const roots=sortedReadingPosts(visiblePosts,'question','top');
  const archived=visiblePosts.filter(p=>!p.parentId&&p.category!=='question').sort((a,b)=>b.score-a.score);
  const shown=present&&selected?roots.filter(p=>p.id===selected):roots;
  const readUrl=`/texts/${textId}?classId=${encodeURIComponent(classId)}`;
  return <div className={present?'fixed inset-0 z-50 overflow-auto bg-white p-6 sm:p-12':`reading-discussion ${parallel?'reading-parallel':''} mx-auto space-y-5 p-4 sm:p-6`}>
    <header className="mb-3 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><Link to="/discussions" className="text-sm text-slate-600">← Discussions</Link><div className="flex flex-wrap gap-2">{!present&&<Button size="sm" variant={parallel?'primary':'secondary'} aria-pressed={parallel} onClick={()=>setParallel(!parallel)}>Parallel mode</Button>}<Button size="sm" variant="secondary" disabled={busy} onClick={()=>void refresh()}>Refresh</Button>{data.teacher&&<Button size="sm" variant="secondary" onClick={()=>{setPresent(!present);setSelected(null);}}>{present?'Exit presentation':'Present'}</Button>}</div></div><p className="text-sm text-slate-500">{data.className}</p><h1 className="font-serif text-3xl text-slate-900">{data.title}</h1><Link to={readUrl} className="inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-4 font-semibold text-blue-800">Read text →</Link></header>
    {data.teacher&&!present&&<details className="reading-settings"><summary>Teacher settings</summary>    {data.teacher&&!present&&<label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={e=>{setAnonymous(e.target.checked);try{localStorage.setItem('teacher-anonymous:'+classId,String(e.target.checked));}catch{/* session preference still works */}}}/>Anonymous names in my view</label>}
    {data.teacher&&!present&&<div className="rounded-xl border p-3"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={data.showStudentNames===true} onChange={e=>{const enabled=e.target.checked;if(enabled&&!window.confirm('Show usernames to classmates for all existing and future posts and replies in this text discussion? Confirm that you have discussed this with the class. Names already seen cannot be taken back.'))return;void mutate('setReadingDiscussionIdentity',{showStudentNames:enabled}).catch(()=>{});}}/>Show usernames to classmates</label><p className="text-xs text-slate-500">Applies only to this text and class, including existing contributions.</p></div>}
</details>}
    {!present&&<p className="text-xs text-slate-500">{data.showStudentNames?'Classmates can see usernames on posts and replies.':'Posts and replies are anonymous to classmates. Your teacher can see who wrote them.'}</p>}
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    <div className="reading-columns">
    {parallel&&!present&&<ParallelReading textId={textId} classId={classId}/>}
    <section className="reading-conversation" aria-label="Questions and replies">
    <div className="reading-feed-heading"><h2>Questions <span>{roots.length}</span></h2><span className="reading-top">↑ Top</span></div>
    {!present&&data.canWrite&&<DiscussionComposer key={user?.$id} storageKey={`reading-draft:${user?.$id}:${textId}:${classId}:question`} category="question" busy={busy} onSubmit={fields=>mutate('postReadingDiscussion',{...fields,category:'question'})}/>}
    {!present&&<p className="mb-4 text-xs text-slate-500">Upvote as many questions and replies as you find useful. One vote per item. Highest voted first.</p>}
    {present&&selected&&<Button variant="secondary" onClick={()=>setSelected(null)}>Show all contributions</Button>}
    <div className="space-y-2">{shown.map(post=><ReadingThread key={post.id} post={showNames?{...post,label:post.username||post.label}:post} posts={visiblePosts.map(p=>showNames?{...p,label:p.username||p.label}:p)} teacher={data.teacher} canWrite={data.canWrite&&!present} busy={busy} mutate={mutate} readUrl={readUrl} draftPrefix={`reading-draft:${user?.$id}:${textId}:${classId}`} present={present} onSelect={()=>setSelected(post.id)}/>)}{!shown.length&&<p className="rounded-2xl bg-slate-50 p-5 text-slate-600">Ask the first question about this reading.</p>}</div>
    {!present&&archived.length>0&&<details className="mt-6 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm text-slate-500">Earlier contributions · {archived.length}</summary><div className="mt-4 space-y-3">{archived.map(post=><ReadingThread key={post.id} post={showNames?{...post,label:post.username||post.label}:post} posts={visiblePosts.map(p=>showNames?{...p,label:p.username||p.label}:p)} teacher={data.teacher} canWrite={data.canWrite} busy={busy} mutate={mutate} readUrl={readUrl} draftPrefix={`reading-draft:${user?.$id}:${textId}:${classId}`} present={false} onSelect={()=>{}}/>)}</div></details>}
    {!present&&data.teacher&&<details className="mt-6 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Participation</summary><p className="my-2 text-sm text-slate-500">Votes help choose what to discuss; they are not grades.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Student','Questions','Replies','Earlier contributions'].map(t=><th className="p-2" key={t}>{t}</th>)}</tr></thead><tbody>{data.participation.map(p=><tr key={p.id}><td className="p-2">{p.name}</td><td>{p.question}</td><td>{p.replies}</td><td>{p.thought+p.connection}</td></tr>)}</tbody></table></div></details>}
    {!present&&<Link className="mt-6 block text-xs text-slate-400 underline" to={`/texts/${textId}/legacy?classId=${encodeURIComponent(classId)}`}>Legacy annotations & TQE archive</Link>}
    </section></div>
  </div>;
}

type Draft={content:string;quotation:string;paragraph:string;requestId:string};
export function DiscussionComposer({storageKey,category,busy,onSubmit,onCancel}:{storageKey:string;category:ReadingCategory;busy:boolean;onSubmit:(fields:Record<string,unknown>)=>Promise<void>;onCancel?:()=>void}) {
  const blank=():Draft=>({content:'',quotation:'',paragraph:'',requestId:crypto.randomUUID()});
  const [draft,setDraft]=useState<Draft>(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'null')||blank();}catch{return blank();}});
  const [storageError,setStorageError]=useState('');
  const update=(field:keyof Draft,value:string)=>{const next={...draft,[field]:value};setDraft(next);try{localStorage.setItem(storageKey,JSON.stringify(next));setStorageError('');}catch{setStorageError('Draft storage is unavailable. Keep this page open until you post.');}};
  const prompts={thought:'Share a thought…',question:'What question does this text raise for you?',connection:'Share a connection…'};
  return <form className="my-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-3" onSubmit={e=>{e.preventDefault();void onSubmit(draft).then(()=>{setDraft(blank());try{localStorage.removeItem(storageKey);}catch{setStorageError('Posted successfully, but the old local draft could not be cleared.');}}).catch(()=>{});}}>
    <DiscussionTextInput label={onCancel?'Your reply':'Your question'} value={draft.content} onChange={value=>update('content',value)} placeholder={onCancel?'Share your answer or a thought…':prompts[category]} rows={2} compact={!onCancel}/>
    {onCancel&&<><input aria-label="Quotation" className="quote-input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400" placeholder="Paste quote here" maxLength={3000} value={draft.quotation} onChange={e=>update('quotation',e.target.value)}/>{draft.quotation&&<label className="block text-xs text-slate-500">Paragraph number (optional) <input className="ml-2 w-20 rounded-lg border bg-white p-2" type="number" min="1" max="10000" value={draft.paragraph} onChange={e=>update('paragraph',e.target.value)}/></label>}</>}

    <div className="flex items-center gap-3"><Button type="submit" disabled={busy||!draft.content.trim()}>Post {onCancel?'reply':'question'}</Button>{onCancel&&<Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}<small className="text-slate-500">Draft saved on this device</small></div>{storageError&&<p role="alert">{storageError}</p>}
  </form>;
}

function ReadingThread({post,posts,teacher,canWrite,busy,mutate,readUrl,draftPrefix,present,onSelect,depth=0,ancestorLocked=false}:{post:ReadingDiscussionPost;posts:ReadingDiscussionPost[];teacher:boolean;canWrite:boolean;busy:boolean;mutate:(action:string,fields:Record<string,unknown>)=>Promise<void>;readUrl:string;draftPrefix:string;present:boolean;onSelect:()=>void;depth?:number;ancestorLocked?:boolean}) {
  const [editing,setEditing]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const children=topReadingReplies(posts,post.id);
  const [reply,setReply]=useState(false),[report,setReport]=useState(false),[reason,setReason]=useState('');
  const send=(action:string,fields:Record<string,unknown>)=>void mutate(action,{postId:post.id,...fields}).catch(()=>{});
  const locked=ancestorLocked||post.locked||post.hidden;
  return <article className={`reading-thread ${depth>0?'reading-reply':'reading-question'} ${post.hidden?'opacity-60':''}`}>
    <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-500"><strong>{post.mine&&!present?'You':post.label}</strong><time>{new Date(post.createdAt).toLocaleString()}</time>{post.updatedAt&&<span>Edited</span>}{post.pinned&&<span>📌 Pinned</span>}{post.locked&&<span>Locked</span>}{post.hidden&&<span>Hidden</span>}</div>
    {post.quotation&&<blockquote className="reading-quote"><ExpandableContribution content={post.quotation} present={present} quote/></blockquote>}
    {post.paragraph&&<Link className="mb-2 inline-block text-sm text-blue-700 underline" to={`${readUrl}&paragraph=${post.paragraph}`}>Read paragraph {post.paragraph} ↗</Link>}
    {editing?<EditReadingContribution post={post} busy={busy} onCancel={()=>setEditing(false)} onSave={fields=>mutate('editReadingDiscussion',{postId:post.id,...fields})}/>:<ExpandableContribution content={post.content} present={present}/>}
    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
      <DiscussionVote announceScore score={post.score} value={post.voted?1:0} disabled={!canWrite||busy||post.hidden} upvoteTitle={post.category==='question'?'I’d like us to discuss this':'Upvote'} onVote={value=>mutate('voteReadingDiscussion',{postId:post.id,upvoted:value===1})}/>
      {canWrite&&post.mine&&!locked&&<Button size="sm" variant="secondary" onClick={()=>setEditing(!editing)}>{editing?'Cancel edit':'Edit'}</Button>}
      {canWrite&&!locked&&depth<3&&<Button size="sm" variant="secondary" onClick={()=>setReply(!reply)}>{reply?'Cancel reply':'Reply'}</Button>}
      {canWrite&&<button className="min-h-11 px-2 text-slate-500" onClick={()=>setReport(!report)}>{report?'Cancel report':'Report'}</button>}
      {present&&<Button size="sm" variant="secondary" onClick={onSelect}>Focus</Button>}
      {teacher&&!present&&<DiscussionModeration disabled={busy} actions={(['pin','hide','lock'] as const).map(operation=>{const active=operation==='pin'?post.pinned:operation==='hide'?post.hidden:post.locked;const action=active?({pin:'unpin',hide:'show',lock:'unlock'} as const)[operation]:operation;return {label:action,run:()=>mutate('moderateReadingDiscussion',{postId:post.id,operation:action})};})}/>}
    </div>
    {report&&<form onSubmit={e=>{e.preventDefault();void mutate('reportReadingDiscussion',{postId:post.id,reason}).then(()=>{setReport(false);setReason('');}).catch(()=>{});}}><label className="block text-sm">What concerns you?<textarea required minLength={3} maxLength={1000} className="mt-2 w-full rounded border p-2" value={reason} onChange={e=>setReason(e.target.value)}/></label><Button type="submit" disabled={busy}>Send report privately to teacher</Button></form>}
    {teacher&&!present&&Boolean(post.reports?.length)&&<div className="my-3 rounded-lg bg-amber-50 p-3"><h3 className="font-medium">Reported concerns</h3>{post.reports?.map(r=><p key={r.id} className="text-sm">{r.reason}</p>)}<Button size="sm" variant="secondary" disabled={busy} onClick={()=>send('moderateReadingDiscussion',{operation:'dismissReports'})}>Dismiss reports</Button></div>}
    {reply&&canWrite&&!locked&&<DiscussionComposer storageKey={`${draftPrefix}:reply:${post.id}`} category={post.category} busy={busy} onCancel={()=>setReply(false)} onSubmit={fields=>mutate('postReadingDiscussion',{...fields,parentId:post.id}).then(()=>{setReply(false);setExpanded(true);})}/>}
    {children.length>0&&<button type="button" className="reading-see-replies" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Hide replies':'See replies'} <span>({children.length})</span></button>}
    {(expanded||present)&&children.length>0&&<div className="reading-replies">{children.map(child=><ReadingThread key={child.id} {...{posts,teacher,canWrite,busy,mutate,readUrl,draftPrefix,present,onSelect}} post={child} depth={depth+1} ancestorLocked={locked}/>)}</div>}
  </article>;
}
