import { EditReadingContribution } from '@/components/discussions/EditReadingContribution';
import { DiscussionTextInput, DiscussionVote, DiscussionModeration } from '@/components/discussions/DiscussionControls';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { ExpandableContribution } from '@/components/discussions/ExpandableContribution';
import { readingCategories, readingDiscussion, sortedReadingPosts, type ReadingCategory, type ReadingDiscussion, type ReadingDiscussionPost } from '@/services/reading-discussion.service';

export function ReadingDiscussionPage() {
  const {textId='',classId=''}=useParams();
  return <DiscussionWorkspace key={`${textId}:${classId}`} textId={textId} classId={classId}/>;
}
function DiscussionWorkspace({textId,classId}:{textId:string;classId:string}) {
  const {user}=useAuth();
  const [anonymous,setAnonymous]=useState(()=>{try{return localStorage.getItem('teacher-anonymous:'+classId)==='true';}catch{return false;}});
  const [data,setData]=useState<ReadingDiscussion>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[category,setCategory]=useState<ReadingCategory>('thought'),[sort,setSort]=useState<'new'|'top'|'unanswered'>('new'),[present,setPresent]=useState(false),[selected,setSelected]=useState<string|null>(null);
  const lastRead=useRef(0),readRevision=useRef(0);
  const refresh=useCallback(async()=>{const revision=++readRevision.current;try{const next=await readingDiscussion<ReadingDiscussion>('readReadingDiscussion',textId,classId);if(revision===readRevision.current){setData(next);setError('');lastRead.current=Date.now();}}catch(e){if(revision===readRevision.current)setError(e instanceof Error?e.message:'Could not refresh');}},[textId,classId]);
  useEffect(()=>{void Promise.resolve().then(refresh);const onFocus=()=>{if(document.visibilityState==='visible'&&Date.now()-lastRead.current>60000)void refresh();};window.addEventListener('focus',onFocus);const timer=window.setInterval(onFocus,120000);return()=>{clearInterval(timer);window.removeEventListener('focus',onFocus);};},[refresh]);
  const mutate=async(action:string,fields:Record<string,unknown>)=>{setBusy(true);setError('');try{await readingDiscussion(action,textId,classId,fields);await refresh();}catch(e){setError(e instanceof Error?e.message:'Could not save');throw e;}finally{setBusy(false);}};
  if(!data)return <div className="p-6"><Link to="/discussions">← Discussions</Link><p role={error?'alert':undefined}>{error||'Loading text discussion…'}</p><Button onClick={()=>void refresh()}>Retry</Button></div>;
  const visiblePosts=present?data.posts.filter(p=>!p.hidden):data.posts;
  const roots=sortedReadingPosts(visiblePosts,category,sort);
  const shown=present&&selected?roots.filter(p=>p.id===selected):roots;
  const readUrl=`/texts/${textId}?classId=${encodeURIComponent(classId)}`;
  return <div className={present?'fixed inset-0 z-50 overflow-auto bg-white p-6 sm:p-12':'mx-auto max-w-4xl space-y-5 p-4 sm:p-6'}>
    <header className="mb-5 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><Link to="/discussions" className="text-sm text-slate-600">← Discussions</Link><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={busy} onClick={()=>void refresh()}>Refresh</Button>{data.teacher&&<Button size="sm" variant="secondary" onClick={()=>{setPresent(!present);setSelected(null);}}>{present?'Exit presentation':'Present'}</Button>}</div></div><p className="text-sm text-slate-500">{data.className}</p><h1 className="font-serif text-3xl text-slate-900">{data.title}</h1><Link to={readUrl} className="inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-4 font-semibold text-blue-800">Read text →</Link><Link className="ml-4 text-sm text-slate-500 underline" to={`/texts/${textId}/legacy?classId=${encodeURIComponent(classId)}`}>Legacy annotations & TQE archive</Link></header>
    {data.teacher&&!present&&<label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={e=>{setAnonymous(e.target.checked);try{localStorage.setItem('teacher-anonymous:'+classId,String(e.target.checked));}catch{/* session preference still works */}}}/>Anonymous names in my view</label>}
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    <div aria-label="Contribution categories" className="mb-4 flex flex-wrap gap-2">{(Object.keys(readingCategories) as ReadingCategory[]).map(c=><button key={c} aria-pressed={c===category} className={`min-h-11 rounded-xl border px-4 py-2 ${category===c?'bg-slate-900 text-white':'bg-white text-slate-700'}`} onClick={()=>{setCategory(c);setSelected(null);if(c!=='question'&&sort==='unanswered')setSort('new');}}>{readingCategories[c]} <span className="ml-1 opacity-70">{data.posts.filter(p=>p.category===c&&!p.parentId&&!p.hidden).length}</span></button>)}</div>
    {!present&&data.canWrite&&<DiscussionComposer key={`${user?.$id}:${category}`} storageKey={`reading-draft:${user?.$id}:${textId}:${classId}:${category}`} category={category} busy={busy} onSubmit={fields=>mutate('postReadingDiscussion',{...fields,category})}/>}
    <div className="my-4 flex flex-wrap gap-3"><label className="text-sm">Show <select className="ml-2 rounded-lg border bg-white p-2" value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="new">New</option><option value="top">Top</option>{category==='question'&&<option value="unanswered">Unanswered questions</option>}</select></label>{category==='question'&&<p className="self-center text-sm text-slate-500">An upvote means “I’d like us to discuss this.”</p>}</div>
    {present&&selected&&<Button variant="secondary" onClick={()=>setSelected(null)}>Show all contributions</Button>}
    <div className="space-y-2">{shown.map(post=><ReadingThread key={post.id} post={data.teacher&&!anonymous?{...post,label:post.username||post.label}:post} posts={visiblePosts.map(p=>data.teacher&&!anonymous?{...p,label:p.username||p.label}:p)} teacher={data.teacher} canWrite={data.canWrite&&!present} busy={busy} mutate={mutate} readUrl={readUrl} draftPrefix={`reading-draft:${user?.$id}:${textId}:${classId}`} present={present} onSelect={()=>setSelected(post.id)}/>)}{!shown.length&&<p className="rounded-2xl bg-slate-50 p-5 text-slate-600">{sort==='unanswered'?'No unanswered questions.':'No contributions here yet. What stood out to you?'}</p>}</div>
    {!present&&data.teacher&&<details className="mt-6 rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Participation by category</summary><p className="my-2 text-sm text-slate-500">Votes help choose what to discuss; they are not grades.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Student','Thoughts','Questions','Connections & Insights','Replies'].map(t=><th className="p-2" key={t}>{t}</th>)}</tr></thead><tbody>{data.participation.map(p=><tr key={p.id}><td className="p-2">{p.name}</td><td>{p.thought}</td><td>{p.question}</td><td>{p.connection}</td><td>{p.replies}</td></tr>)}</tbody></table></div></details>}
  </div>;
}

type Draft={content:string;quotation:string;paragraph:string;requestId:string};
export function DiscussionComposer({storageKey,category,busy,onSubmit,onCancel}:{storageKey:string;category:ReadingCategory;busy:boolean;onSubmit:(fields:Record<string,unknown>)=>Promise<void>;onCancel?:()=>void}) {
  const blank=():Draft=>({content:'',quotation:'',paragraph:'',requestId:crypto.randomUUID()});
  const [draft,setDraft]=useState<Draft>(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'null')||blank();}catch{return blank();}});
  const [storageError,setStorageError]=useState('');
  const update=(field:keyof Draft,value:string)=>{const next={...draft,[field]:value};setDraft(next);try{localStorage.setItem(storageKey,JSON.stringify(next));setStorageError('');}catch{setStorageError('Draft storage is unavailable. Keep this page open until you post.');}};
  const prompts={thought:'I noticed… This suggests…',question:'I’m wondering… because…',connection:'This connects to… and helps me understand… Or: At first I thought…; now…'};
  return <form className="my-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={e=>{e.preventDefault();void onSubmit(draft).then(()=>{setDraft(blank());try{localStorage.removeItem(storageKey);}catch{setStorageError('Posted successfully, but the old local draft could not be cleared.');}}).catch(()=>{});}}>
    <DiscussionTextInput label={onCancel?'Your reply':'Your contribution'} value={draft.content} onChange={value=>update('content',value)} placeholder={onCancel?'Build on this idea…':prompts[category]}/>
    <details open={Boolean(draft.quotation||draft.paragraph)}><summary className="cursor-pointer text-sm text-slate-600">Add quotation / paragraph (optional)</summary><label className="mt-2 block text-sm">Quotation<textarea className="mt-1 w-full rounded-lg border bg-white p-2" rows={2} maxLength={3000} value={draft.quotation} onChange={e=>update('quotation',e.target.value)}/></label><label className="mt-2 block text-sm">Paragraph number <input className="ml-2 w-24 rounded-lg border bg-white p-2" type="number" min="1" max="10000" value={draft.paragraph} onChange={e=>update('paragraph',e.target.value)}/></label></details>
    <div className="flex items-center gap-3"><Button type="submit" disabled={busy||!draft.content.trim()}>Post {onCancel?'reply':'contribution'}</Button>{onCancel&&<Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}<small className="text-slate-500">Draft saved on this device</small></div>{storageError&&<p role="alert">{storageError}</p>}
  </form>;
}

function ReadingThread({post,posts,teacher,canWrite,busy,mutate,readUrl,draftPrefix,present,onSelect,depth=0,ancestorLocked=false}:{post:ReadingDiscussionPost;posts:ReadingDiscussionPost[];teacher:boolean;canWrite:boolean;busy:boolean;mutate:(action:string,fields:Record<string,unknown>)=>Promise<void>;readUrl:string;draftPrefix:string;present:boolean;onSelect:()=>void;depth?:number;ancestorLocked?:boolean}) {
  const [editing,setEditing]=useState(false);
  const [reply,setReply]=useState(false),[report,setReport]=useState(false),[reason,setReason]=useState('');
  const send=(action:string,fields:Record<string,unknown>)=>void mutate(action,{postId:post.id,...fields}).catch(()=>{});
  const locked=ancestorLocked||post.locked||post.hidden;
  return <article className={`rounded-xl border border-slate-200 bg-white p-3 ${post.hidden?'opacity-60':''}`}>
    <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-500"><strong>{post.mine&&!present?'You':post.label}</strong><time>{new Date(post.createdAt).toLocaleString()}</time>{post.updatedAt&&<span>Edited</span>}{post.pinned&&<span>📌 Pinned</span>}{post.locked&&<span>Locked</span>}{post.hidden&&<span>Hidden</span>}</div>
    {post.quotation&&<blockquote className="mb-3 whitespace-pre-wrap border-l-2 border-slate-300 bg-slate-50 p-3 font-serif text-slate-600"><ExpandableContribution content={post.quotation} present={present} quote/></blockquote>}
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
    {reply&&canWrite&&!locked&&<DiscussionComposer storageKey={`${draftPrefix}:reply:${post.id}`} category={post.category} busy={busy} onCancel={()=>setReply(false)} onSubmit={fields=>mutate('postReadingDiscussion',{...fields,parentId:post.id}).then(()=>setReply(false))}/>}
    <div className="mt-2 space-y-2 border-l border-slate-200 pl-2 sm:pl-4">{posts.filter(p=>p.parentId===post.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(child=><ReadingThread key={child.id} {...{posts,teacher,canWrite,busy,mutate,readUrl,draftPrefix,present,onSelect}} post={child} depth={depth+1} ancestorLocked={locked}/>)}</div>
  </article>;
}
