import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/common/Button';
import {EditReadingContribution} from './EditReadingContribution';
import {DiscussionTextInput,DiscussionVote,DiscussionModeration} from './DiscussionControls';
import {ExpandableContribution} from './ExpandableContribution';
import {topReadingReplies,type ReadingCategory,type ReadingDiscussionPost} from '@/services/reading-discussion.service';
type Draft={content:string;quotation:string;paragraph:string;requestId:string};
export function DiscussionComposer({storageKey,category,busy,onSubmit,onCancel,quote,onQuoteUsed,writing=false}:{writing?:boolean;quote?:{quotation:string;paragraph:number;token:string};onQuoteUsed?:()=>void;storageKey:string;category:ReadingCategory;busy:boolean;onSubmit:(fields:Record<string,unknown>)=>Promise<void>;onCancel?:()=>void}) {
  const blank=():Draft=>({content:'',quotation:'',paragraph:'',requestId:crypto.randomUUID()});
  const [draft,setDraft]=useState<Draft>(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'null')||blank();}catch{return blank();}});
  const [storageError,setStorageError]=useState('');
  const usedQuote=useRef<string|undefined>(undefined);
  useEffect(()=>{if(!quote||usedQuote.current===quote.token)return;usedQuote.current=quote.token;setDraft(current=>{const quotation=current.quotation?`${current.quotation}\n\n${quote.quotation} — paragraph ${quote.paragraph}`:quote.quotation;if(quotation.length>3000){setStorageError('Your quotation is full. Shorten it before adding another passage.');return current;}const next={...current,quotation,paragraph:current.quotation?current.paragraph:String(quote.paragraph)};try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{/* writing remains in memory */}return next;});onQuoteUsed?.();},[quote,onQuoteUsed,storageKey]);
  const update=(field:keyof Draft,value:string)=>{const next={...draft,[field]:value};setDraft(next);try{localStorage.setItem(storageKey,JSON.stringify(next));setStorageError('');}catch{setStorageError('Draft storage is unavailable. Keep this page open until you post.');}};
  const prompts={thought:'Share a thought…',question:'What question does this text raise for you?',connection:'Share a connection…'};
  return <form className="my-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-3" onSubmit={e=>{e.preventDefault();void onSubmit(draft).then(()=>{setDraft(blank());try{localStorage.removeItem(storageKey);}catch{setStorageError('Posted successfully, but the old local draft could not be cleared.');}}).catch(()=>{});}}>
    <DiscussionTextInput label={onCancel?'Your reply':'Your question'} value={draft.content} onChange={value=>update('content',value)} placeholder={onCancel?'Share your answer or a thought…':prompts[category]} rows={2} compact={!onCancel}/>
    {!writing&&<><textarea rows={2} aria-label="Quotation" className="quote-input w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400" placeholder="Paste quote here" maxLength={3000} value={draft.quotation} onChange={e=>update('quotation',e.target.value)}/>{draft.quotation&&<blockquote className="reading-quote">{draft.quotation}</blockquote>}{draft.quotation&&<label className="block text-xs text-slate-500">Paragraph number (optional) <input className="ml-2 w-20 rounded-lg border bg-white p-2" type="number" min="1" max="10000" value={draft.paragraph} onChange={e=>update('paragraph',e.target.value)}/></label>}</>}

    <div className="flex items-center gap-3"><Button type="submit" disabled={busy||!draft.content.trim()}>Post {onCancel?'reply':'question'}</Button>{onCancel&&<Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}<small className="text-slate-500">{onCancel ? 'Unsent reply saved on this device' : 'Posting shares your question with everyone in this class'}</small></div>{storageError&&<p role="alert">{storageError}</p>}
  </form>;
}

export function ReadingThread({post,posts,teacher,canWrite,busy,mutate,readUrl,draftPrefix,present,onSelect,depth=0,ancestorLocked=false,activeReply,setActiveReply,pendingQuote,consumeQuote,writing=false}:{writing?:boolean;post:ReadingDiscussionPost;posts:ReadingDiscussionPost[];teacher:boolean;canWrite:boolean;busy:boolean;mutate:(action:string,fields:Record<string,unknown>)=>Promise<void>;readUrl:string;draftPrefix:string;present:boolean;onSelect:()=>void;depth?:number;ancestorLocked?:boolean;activeReply:string|null;setActiveReply:(id:string|null)=>void;pendingQuote?:{quotation:string;paragraph:number;token:string};consumeQuote:()=>void}) {
  const [editing,setEditing]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const children=topReadingReplies(posts,post.id);
  const reply=activeReply===post.id;
  const setReply=(open:boolean)=>setActiveReply(open?post.id:null);
  const [report,setReport]=useState(false),[reason,setReason]=useState('');
  const send=(action:string,fields:Record<string,unknown>)=>void mutate(action,{postId:post.id,...fields}).catch(()=>{});
  const locked=ancestorLocked||post.locked||post.hidden;
  return <article id={`question-${post.id}`} className={`scroll-mt-24 reading-thread ${depth>0?'reading-reply':'reading-question'} ${post.hidden?'opacity-60':''}`}>
    <div className="reading-post-meta mb-1 flex flex-wrap gap-2 text-xs text-slate-500"><strong>{post.mine&&!present?'You':post.label}</strong><time>{new Date(post.createdAt).toLocaleString()}</time>{post.updatedAt&&<span>Edited</span>}{post.pinned&&<span>📌 Pinned</span>}{post.locked&&<span>Locked</span>}{post.hidden&&<span>Hidden</span>}</div>
    {post.quotation&&<blockquote className="reading-quote"><ExpandableContribution content={post.quotation} present={present} quote/></blockquote>}
    {post.paragraph&&<Link className="mb-2 inline-block text-sm text-blue-700 underline" to={`${readUrl}&paragraph=${post.paragraph}`}>Read paragraph {post.paragraph} ↗</Link>}
    {editing?<EditReadingContribution writing={writing} post={post} busy={busy} onCancel={()=>setEditing(false)} onSave={fields=>mutate('editReadingDiscussion',{postId:post.id,...fields})}/>:<div className="reading-post-content"><ExpandableContribution content={post.content} present={present}/></div>}
    {(!writing||!present)&&<div className="reading-post-actions mt-1 flex flex-wrap items-center gap-1 text-sm">
      <DiscussionVote announceScore score={post.score} value={post.voted?1:0} disabled={!canWrite||busy||post.hidden} upvoteTitle={!writing&&post.category==='question'?'This question could deepen our understanding':'Upvote'} onVote={value=>mutate('voteReadingDiscussion',{postId:post.id,upvoted:value===1})}/>
      {!writing&&canWrite&&!teacher&&post.mine&&!post.parentId&&post.category==='question'&&!post.everReplied&&!children.length&&!post.locked&&<Button size="sm" variant="secondary" disabled={busy} onClick={()=>send('withdrawReadingQuestion',{})}>Withdraw question</Button>}
      {canWrite&&post.mine&&!locked&&(!writing||Boolean(post.parentId))&&<Button size="sm" variant="secondary" onClick={()=>setEditing(!editing)}>{editing?'Cancel edit':'Edit'}</Button>}
      {canWrite&&!locked&&depth<3&&<Button size="sm" variant="secondary" onClick={()=>setReply(!reply)}>{reply?'Cancel reply':'Reply'}</Button>}
      {canWrite&&<button className="min-h-11 px-2 text-slate-500" onClick={()=>setReport(!report)}>{report?'Cancel report':'Report'}</button>}
      {present&&<Button size="sm" variant="secondary" onClick={onSelect}>Focus</Button>}
      {teacher&&!present&&<DiscussionModeration disabled={busy} actions={(['pin','hide','lock'] as const).map(operation=>{const active=operation==='pin'?post.pinned:operation==='hide'?post.hidden:post.locked;const action=active?({pin:'unpin',hide:'show',lock:'unlock'} as const)[operation]:operation;return {label:action,run:()=>mutate('moderateReadingDiscussion',{postId:post.id,operation:action})};})}/>}
    </div>}
    {report&&<form onSubmit={e=>{e.preventDefault();void mutate('reportReadingDiscussion',{postId:post.id,reason}).then(()=>{setReport(false);setReason('');}).catch(()=>{});}}><label className="block text-sm">What concerns you?<textarea required minLength={3} maxLength={1000} className="mt-2 w-full rounded border p-2" value={reason} onChange={e=>setReason(e.target.value)}/></label><Button type="submit" disabled={busy}>Send report privately to teacher</Button></form>}
    {teacher&&!present&&Boolean(post.reports?.length)&&<div className="my-3 rounded-lg bg-amber-50 p-3"><h3 className="font-medium">Reported concerns</h3>{post.reports?.map(r=><p key={r.id} className="text-sm">{r.reason}</p>)}<Button size="sm" variant="secondary" disabled={busy} onClick={()=>send('moderateReadingDiscussion',{operation:'dismissReports'})}>Dismiss reports</Button></div>}
    {post.mine&&children.length>0&&!post.parentId&&!present&&<p className="mt-2 text-sm text-slate-600">Optional follow-up: What did this reply help you notice or reconsider?</p>}
    {reply&&canWrite&&!locked&&<DiscussionComposer writing={writing} quote={pendingQuote} onQuoteUsed={consumeQuote} storageKey={`${draftPrefix}:reply:${post.id}`} category={post.category} busy={busy} onCancel={()=>setReply(false)} onSubmit={fields=>mutate('postReadingDiscussion',{...fields,parentId:post.id}).then(()=>{setReply(false);setExpanded(true);})}/>}
    {children.length>0&&<button type="button" className="reading-see-replies" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Hide replies':'See replies'} <span>({children.length})</span></button>}
    {(expanded||(present&&!writing))&&children.length>0&&<div className="reading-replies">{children.map(child=><ReadingThread key={child.id} {...{posts,teacher,canWrite,busy,mutate,readUrl,draftPrefix,present,onSelect,activeReply,setActiveReply,pendingQuote,consumeQuote,writing}} post={child} depth={depth+1} ancestorLocked={locked}/>)}</div>}
  </article>;
}
