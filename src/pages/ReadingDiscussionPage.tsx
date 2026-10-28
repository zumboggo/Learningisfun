import {WorkshopLink as Link} from '@/components/WorkshopLink';
import { PresentQuestions } from '@/components/discussions/PresentQuestions';
import {DiscussionComposer, ReadingThread} from '@/components/discussions/DiscussionThread';
import { QuestionNotebook } from '@/components/discussions/QuestionNotebook';
import { ReplyAssignments } from '@/components/discussions/ReplyAssignments';
import { QuestionVoting } from '@/components/discussions/QuestionVoting';
import { useCallback, useEffect, useRef, useState } from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { ParallelReading } from '@/components/texts/ParallelReading';
import '@/components/texts/reading-discussion.css';
import { readingDiscussion, sortedReadingPosts, type ReadingDiscussion } from '@/services/reading-discussion.service';

export function ReadingDiscussionPage() {
  const {textId='',classId=''}=useParams();
  return <DiscussionWorkspace key={`${textId}:${classId}`} textId={textId} classId={classId}/>;
}
function DiscussionWorkspace({textId,classId}:{textId:string;classId:string}) {
  const {user}=useAuth();
  const location=useLocation(),navigate=useNavigate();
  const incomingQuote=location.state?.selectedQuote as {quotation:string;paragraph:number;token:string;destination:'question'|'reply'}|undefined;
  const [questionQuote,setQuestionQuote]=useState<{quotation:string;paragraph:number;token:string}|undefined>(incomingQuote?.destination==='question'?incomingQuote:undefined);
  useEffect(()=>{if(incomingQuote)navigate(location.pathname+location.search,{replace:true,state:null});},[incomingQuote,location.pathname,location.search,navigate]);
  const [anonymous,setAnonymous]=useState(()=>{try{return localStorage.getItem('teacher-anonymous:'+classId)==='true';}catch{return false;}});
  const [data,setData]=useState<ReadingDiscussion>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[view,setView]=useState<'text'|'discussion'|'parallel'>('parallel');
  const [activeReply,setActiveReply]=useState<string|null>(null),[pendingQuote,setPendingQuote]=useState<{quotation:string;paragraph:number;token:string}|undefined>(incomingQuote?.destination==='reply'?incomingQuote:undefined);
  const replyTools={activeReply,setActiveReply,pendingQuote,consumeQuote:()=>setPendingQuote(undefined)};
  const openReply=(id:string)=>{setActiveReply(id);requestAnimationFrame(()=>document.getElementById(`question-${id}`)?.scrollIntoView({behavior:'smooth',block:'center'}));};
  const [optimisticVotes,setOptimisticVotes]=useState<Record<string,boolean>>({});
  const voting=useRef(new Set<string>());
  const lastRead=useRef(0),readRevision=useRef(0);
  const [refreshedAt,setRefreshedAt]=useState(0),[clock,setClock]=useState(()=>Date.now()),[refreshing,setRefreshing]=useState(false);
  const voteVersion=useRef(0);
  const confirmedVotes=useRef(new Map<string,{version:number;voted:boolean}>());
  const refresh=useCallback(async()=>{
    setRefreshing(true);
    const revision=++readRevision.current;
    const versionAtStart=voteVersion.current;
    try {
      const next=await readingDiscussion<ReadingDiscussion>('readReadingDiscussion',textId,classId);
      if(revision===readRevision.current){
        // Keep new posts and moderation changes from the read, while protecting
        // votes saved after that read started from an older server snapshot.
        next.posts=next.posts.map(post=>{
          const saved=confirmedVotes.current.get(post.id);
          return saved&&saved.version>versionAtStart
            ? {...post,score:post.score+Number(saved.voted)-Number(post.voted),voted:saved.voted}
            : post;
        });
        setData(next);setError('');lastRead.current=Date.now();setRefreshedAt(lastRead.current);setClock(Date.now());
      }
    }catch(e){if(revision===readRevision.current)setError(e instanceof Error?e.message:'Could not refresh');}finally{if(revision===readRevision.current)setRefreshing(false);}
  },[textId,classId]);
  useEffect(()=>{void refresh();},[refresh]);
  // This timer updates the age label only; it never requests discussion data.
  useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer);},[]);
  const vote = async (postId: string, upvoted: boolean) => {
    // Each item saves independently. Keep the interface responsive without
    // waiting for a second request to reload the entire discussion.
    if (voting.current.has(postId)) return;
    voting.current.add(postId);
    setOptimisticVotes(current => ({ ...current, [postId]: upvoted }));
    try {
      await readingDiscussion('voteReadingDiscussion', textId, classId, { postId, upvoted });
      confirmedVotes.current.set(postId,{version:++voteVersion.current,voted:upvoted});
      setData(current => current && ({ ...current, posts: current.posts.map(post => post.id === postId
        ? { ...post, score: post.score + Number(upvoted) - Number(post.voted), voted: upvoted }
        : post) }));
    } finally {
      voting.current.delete(postId);
      setOptimisticVotes(current => { const next = { ...current }; delete next[postId]; return next; });
    }
  };
  const mutate=async(action:string,fields:Record<string,unknown>)=>{if(action==='voteReadingDiscussion')return vote(String(fields.postId),fields.upvoted===true);setBusy(true);setError('');try{await readingDiscussion(action,textId,classId,fields);await refresh();}catch(e){setError(e instanceof Error?e.message:'Could not save');throw e;}finally{setBusy(false);}};
  if(!data)return <div className="p-6"><Link to="/discussions">← Discussions</Link><p role={error?'alert':undefined}>{error||'Loading text discussion…'}</p><Button onClick={()=>void refresh()}>Retry</Button></div>;
  const showNames=data.teacher?!anonymous:data.showStudentNames===true;
  const votedPosts=data.posts.map(post => Object.prototype.hasOwnProperty.call(optimisticVotes,post.id)
    ? {...post,voted:optimisticVotes[post.id],score:post.score+Number(optimisticVotes[post.id])-Number(post.voted)} : post);
  const visiblePosts=votedPosts;
  const roots=sortedReadingPosts(visiblePosts,'question','top');
  const archived=visiblePosts.filter(p=>!p.parentId&&p.category!=='question').sort((a,b)=>b.score-a.score);
  const shown=roots;
  const readUrl=`/texts/${textId}?classId=${encodeURIComponent(classId)}`;
  return <div className={`reading-discussion ${view==='parallel'?'reading-parallel':''} mx-auto space-y-3 p-4 sm:p-5`}>
    <header className="mb-3 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><Link to="/discussions" className="text-sm text-slate-600">← Discussions</Link><div className="flex flex-wrap gap-2"><div className="reading-view-toggle" role="group" aria-label="Reading view">{([['text','Text only'],['discussion','Discussion only'],['parallel','Parallel']] as const).map(([mode,label])=><button key={mode} type="button" aria-pressed={view===mode} onClick={()=>setView(mode)}>{label}</button>)}</div><div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-2"><Button size="lg" disabled={busy||refreshing} onClick={()=>void refresh()}>{refreshing?'Refreshing…':'Refresh discussion'}</Button><span className="text-sm text-slate-600">{refreshedAt?`Updated ${Math.floor((clock-refreshedAt)/60000)<1?'just now':Math.floor((clock-refreshedAt)/60000)+' minutes ago'}`:'Not refreshed yet'} · Manual refresh</span></div><PresentQuestions picker={data.teacher ? {classId,students:data.participation} : undefined} questions={roots.filter(p=>!p.hidden).map(p=>p.content)} /></div></div><p className="text-sm text-slate-500">{data.className}</p><h1 className="font-serif text-3xl text-slate-900">{data.title}</h1><Link to={readUrl} className="inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-4 font-semibold text-blue-800">Read text →</Link></header>
    {data.teacher&&<details className="reading-settings"><summary>Teacher settings</summary>    {data.teacher&&<label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={e=>{setAnonymous(e.target.checked);try{localStorage.setItem('teacher-anonymous:'+classId,String(e.target.checked));}catch{/* session preference still works */}}}/>Anonymous names in my view</label>}
    {data.teacher&&<div className="rounded-xl border p-3"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={data.showStudentNames===true} onChange={e=>{const enabled=e.target.checked;if(enabled&&!window.confirm('Show usernames to classmates for all existing and future posts and replies in this text discussion? Confirm that you have discussed this with the class. Names already seen cannot be taken back.'))return;void mutate('setReadingDiscussionIdentity',{showStudentNames:enabled}).catch(()=>{});}}/>Show usernames to classmates</label><p className="text-xs text-slate-500">Applies only to this text and class, including existing contributions.</p></div>}
</details>}
    <p className="text-xs text-slate-500">{data.showStudentNames?'Classmates can see usernames on posts and replies.':'Posts and replies are anonymous to classmates. Your teacher can see who wrote them.'}</p>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    <div className="reading-columns">
    <div hidden={view==='discussion'}><ParallelReading textId={textId} classId={classId} onUseQuote={data.canWrite?(quote,destination)=>{const selected={...quote,token:crypto.randomUUID()};if(destination==='question'){setQuestionQuote(selected);}else{setPendingQuote(selected);}if(view==='text')setView('parallel');requestAnimationFrame(()=>document.querySelector<HTMLTextAreaElement>(destination==='question'?'textarea[aria-label="Your question"]':'textarea[aria-label="Your reply"]')?.focus());}:undefined}/></div>
    <section hidden={view==='text'} className="reading-conversation" aria-label="Questions and replies">
    <div className="reading-feed-heading"><h2>Questions <span>{roots.length}</span></h2><span className="reading-top">↑ Top</span></div>
    {data.curatedReady&&<QuestionVoting {...{data,busy,mutate}}/>}
    <>
    {data.curatedReady&&<ReplyAssignments {...{data,textId,classId,busy,mutate}} onReply={openReply}/>}
    {pendingQuote&&!activeReply&&<p role="status" className="rounded-lg bg-blue-50 p-3 text-sm">Passage retained. Choose a question and select Reply to use it.</p>}
    {data.canWrite&&!data.teacher&&Boolean(data.notebook?.length)&&<QuestionNotebook {...{data,busy,mutate}} storageKey={`question-notebook:${user?.$id}:${textId}:${classId}`}/>}
    {data.canWrite&&<DiscussionComposer quote={questionQuote} onQuoteUsed={()=>setQuestionQuote(undefined)} key={user?.$id} storageKey={`reading-draft:${user?.$id}:${textId}:${classId}:question`} category="question" busy={busy} onSubmit={fields=>mutate('postReadingDiscussion',{...fields,category:'question'})}/>}
    <p className="mb-2 text-xs text-slate-500">An upvote means “This question could deepen our understanding.” One vote per item. Highest voted first.</p>

    <div className="space-y-2">{shown.map(post=><ReadingThread {...replyTools} key={post.id} post={showNames?{...post,label:post.username||post.label}:post} posts={visiblePosts.map(p=>showNames?{...p,label:p.username||p.label}:p)} teacher={data.teacher} canWrite={data.canWrite} busy={busy} mutate={mutate} readUrl={readUrl} draftPrefix={`reading-draft:${user?.$id}:${textId}:${classId}`} present={false} onSelect={()=>{}}/>)}{!shown.length&&<p className="rounded-2xl bg-slate-50 p-5 text-slate-600">Ask the first question about this reading.</p>}</div>
    {archived.length>0&&<details className="mt-6 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm text-slate-500">Earlier contributions · {archived.length}</summary><div className="mt-4 space-y-3">{archived.map(post=><ReadingThread {...replyTools} key={post.id} post={showNames?{...post,label:post.username||post.label}:post} posts={visiblePosts.map(p=>showNames?{...p,label:p.username||p.label}:p)} teacher={data.teacher} canWrite={data.canWrite} busy={busy} mutate={mutate} readUrl={readUrl} draftPrefix={`reading-draft:${user?.$id}:${textId}:${classId}`} present={false} onSelect={()=>{}}/>)}</div></details>}
    </>
    {data.teacher&&<details className="mt-6 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Participation</summary><p className="my-2 text-sm text-slate-500">Votes help choose what to discuss; they are not grades.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Student','Questions','Replies','Earlier contributions'].map(t=><th className="p-2" key={t}>{t}</th>)}</tr></thead><tbody>{data.participation.map(p=><tr key={p.id}><td className="p-2">{p.name}</td><td>{p.question}</td><td>{p.replies}</td><td>{p.thought+p.connection}</td></tr>)}</tbody></table></div></details>}
    <Link className="mt-6 block text-xs text-slate-400 underline" to={`/texts/${textId}/legacy?classId=${encodeURIComponent(classId)}`}>Legacy annotations & TQE archive</Link>
    </section></div>
  </div>;
}


export {DiscussionComposer} from '@/components/discussions/DiscussionThread';
