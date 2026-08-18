import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { updateClassSession } from '@/services/class-session.service';
import { addDiscussionPost, editDiscussionPost, moderatePost, syncTextDiscussion, voteOnPost } from '@/services/text-discussion.service';
import type { ClassSession, TextDiscussionPost } from '@/types';

export function RedditDiscussionPage({ session }: { session: ClassSession }) {
  const { user, isTeacher, isParent } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [sort, setSort] = useState<'top' | 'new'>('top');
  const [editingSession,setEditingSession]=useState(false),[editTitle,setEditTitle]=useState(session.title),[editFocus,setEditFocus]=useState(session.promptMarkdown||'');
  useEffect(() => { void syncTextDiscussion(session.$id); }, [session.$id]);
  const cls = useLiveQuery(() => db.classes.get(session.classId), [session.classId]);
  const posts = useLiveQuery(() => db.text_discussion_posts.where('classSessionId').equals(session.$id).toArray(), [session.$id]);
  const votes = useLiveQuery(() => user ? db.text_discussion_votes.where('userId').equals(user.$id).toArray() : [], [user?.$id]);
  const roots = useMemo(() => sortPosts((posts || []).filter(post => !post.parentId), sort), [posts, sort]);
  if (!user) return null;

  const submitPost = async () => {
    if (!draft.trim()) return;
    await addDiscussionPost({ sessionId: session.$id, textId: session.textId, classId: session.classId, authorId: user.$id, content: draft.trim(), isTeacher });
    setDraft(''); setComposerOpen(false);
  };

  return <div className="reddit-discussion-page">
    <header className="reddit-discussion-header">
      <button className="reddit-back-button" onClick={() => navigate(-1)} aria-label="Back to discussions">‹</button>
      <div className="min-w-0 flex-1"><h1>{session.title}</h1><p>{cls ? `${cls.courseName} · ` : ''}{discussionTypeLabel(session)}{isParent ? ' · Parent read-only' : ''}</p></div>{isTeacher&&<Button size="sm" variant="secondary" onClick={()=>setEditingSession(true)}>Edit</Button>}
    </header>
    {session.promptMarkdown && <section className="reddit-pinned-prompt"><span className="reddit-pin" aria-hidden="true">◆</span><p>{session.promptMarkdown}</p></section>}
    {!isParent && <section className={`reddit-composer ${composerOpen ? 'reddit-composer-open' : ''}`}>
      {!composerOpen ? <button onClick={() => setComposerOpen(true)}><ChatIcon/><span>Share your thought or question…</span><span aria-hidden="true">⌄</span></button> : <><textarea autoFocus rows={4} placeholder="Share your thought or question…" value={draft} onChange={event => setDraft(event.target.value)}/><div className="reddit-composer-actions"><button onClick={() => { setDraft(''); setComposerOpen(false); }}>Cancel</button><Button size="sm" disabled={!draft.trim()} onClick={() => void submitPost()}>Post</Button></div></>}
    </section>}
    <div className="reddit-feed-toolbar"><div className="reddit-sort-control" aria-label="Sort discussion posts"><button className={sort === 'top' ? 'active' : ''} onClick={() => setSort('top')}>Top</button><button className={sort === 'new' ? 'active' : ''} onClick={() => setSort('new')}>New</button></div><span>{roots.length} {roots.length === 1 ? 'thread' : 'threads'}</span></div>
    <section className="reddit-feed">{roots.length ? roots.map(post => <Thread key={post.$id} post={post} all={posts || []} votes={votes || []} userId={user.$id} isTeacher={isTeacher} readOnly={isParent} sort={sort}/>) : <div className="reddit-empty-feed">No posts yet. Start the conversation.</div>}</section><Modal open={editingSession} onClose={()=>setEditingSession(false)} title="Edit discussion"><div className="space-y-4"><label className="block text-sm font-medium">Title<input className="mt-1 w-full rounded-lg border px-3 py-2" value={editTitle} onChange={e=>setEditTitle(e.target.value)}/></label><label className="block text-sm font-medium">Topic or focus<textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={4} value={editFocus} onChange={e=>setEditFocus(e.target.value)}/></label><Button className="w-full" disabled={!editTitle.trim()} onClick={()=>void updateClassSession(session.$id,user.$id,{title:editTitle.trim(),promptMarkdown:editFocus.trim()}).then(()=>setEditingSession(false))}>Save changes</Button></div></Modal>
  </div>;
}

function sortPosts(posts: TextDiscussionPost[], sort: 'top' | 'new') { return [...posts].sort((a, b) => sort === 'top' ? b.score - a.score || b.updatedAt.localeCompare(a.updatedAt) : b.createdAt.localeCompare(a.createdAt)); }

function Thread({ post, all, votes, userId, isTeacher, readOnly, sort }: { post: TextDiscussionPost; all: TextDiscussionPost[]; votes: Array<{postId:string;value:number}>; userId:string; isTeacher:boolean; readOnly:boolean; sort:'top'|'new' }) {
  const [reply, setReply] = useState(''); const [replyOpen, setReplyOpen] = useState(false);
  const [editing,setEditing]=useState(false),[editContent,setEditContent]=useState(post.content);
  const mine = votes.find(vote => vote.postId === post.$id)?.value || 0;
  const children = sortPosts(all.filter(candidate => candidate.parentId === post.$id), sort);
  const descendantCount = countDescendants(post.$id, all);
  if (post.moderationStatus === 'hidden' && !isTeacher) return null;
  const submitReply = async () => { if (!reply.trim()) return; await addDiscussionPost({ sessionId:post.classSessionId, textId:post.textId, classId:post.classId, parentId:post.$id, authorId:userId, content:reply.trim(), isTeacher }); setReply(''); setReplyOpen(false); };

  return <div className={`reddit-thread reddit-thread-depth-${Math.min(post.depth, 3)}`}>
    <article className={`reddit-post ${post.moderationStatus === 'hidden' ? 'reddit-post-hidden' : ''}`}>
      <div className="reddit-vote-rail">
        {!readOnly && <button className={mine === 1 ? 'active' : ''} aria-label="Upvote" onClick={() => void voteOnPost(post.$id, userId, mine === 1 ? 0 : 1)}>▲</button>}
        <strong>{post.score}</strong>
        {!readOnly && <button className={mine === -1 ? 'active-down' : ''} aria-label="Downvote" onClick={() => void voteOnPost(post.$id, userId, mine === -1 ? 0 : -1)}>▼</button>}
      </div>
      <div className="reddit-post-main"><div className="reddit-post-meta"><span className={post.isTeacherPost ? 'reddit-teacher-author' : ''}>{post.isTeacherPost ? 'Teacher' : post.authorId === userId ? 'You' : post.anonymousLabel}</span><time dateTime={post.createdAt}>{formatDiscussionTime(post.createdAt)}</time></div>{editing?<div className="reddit-reply-composer"><textarea rows={3} value={editContent} onChange={event=>setEditContent(event.target.value)}/><div><button onClick={()=>setEditing(false)}>Cancel</button><Button size="sm" disabled={!editContent.trim()} onClick={()=>void editDiscussionPost(post.$id,userId,editContent).then(()=>setEditing(false))}>Save</Button></div></div>:<p className="reddit-post-content">{post.content}</p>}
        <div className="reddit-post-actions">{descendantCount > 0 && <span><ChatIcon/> {descendantCount} {descendantCount === 1 ? 'reply' : 'replies'}</span>}{!readOnly && post.depth < 3 && !post.locked && <button onClick={() => setReplyOpen(value => !value)}>↩ Reply</button>}{isTeacher&&post.isTeacherPost&&post.authorId===userId&&<button onClick={()=>setEditing(value=>!value)}>Edit</button>}{post.locked && <span>🔒 Locked</span>}{isTeacher && <details className="reddit-moderation-menu"><summary>Moderate</summary><div><button onClick={() => void moderatePost(post.$id,userId,post.moderationStatus==='hidden'?'show':'hide')}>{post.moderationStatus==='hidden'?'Show':'Hide'}</button><button onClick={() => void moderatePost(post.$id,userId,post.locked?'unlock':'lock')}>{post.locked?'Unlock':'Lock'}</button><button className="text-red-600" onClick={() => { if(confirm('Permanently delete this post?')) void moderatePost(post.$id,userId,'delete'); }}>Delete</button></div></details>}</div>
        {replyOpen && <div className="reddit-reply-composer"><textarea rows={3} value={reply} onChange={event => setReply(event.target.value)} placeholder="Write a reply…"/><div><button onClick={() => setReplyOpen(false)}>Cancel</button><Button size="sm" disabled={!reply.trim()} onClick={() => void submitReply()}>Reply</Button></div></div>}
      </div>
    </article>
    {children.length > 0 && <div className="reddit-children">{children.map(child => <Thread key={child.$id} post={child} all={all} votes={votes} userId={userId} isTeacher={isTeacher} readOnly={readOnly} sort={sort}/>)}</div>}
  </div>;
}

function discussionTypeLabel(session:ClassSession){if(session.discussionType==='text')return'Text discussion';if(session.discussionType==='question')return'Open question';return'QFT prompt';}
function countDescendants(parentId:string,posts:TextDiscussionPost[]):number{const children=posts.filter(post=>post.parentId===parentId);return children.length+children.reduce((total,child)=>total+countDescendants(child.$id,posts),0);}
function formatDiscussionTime(value:string){const date=new Date(value),now=new Date(),sameDay=date.toDateString()===now.toDateString();return sameDay?`Today, ${date.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`:date.toLocaleDateString([],{month:'short',day:'numeric'});}
function ChatIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4.5 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"/></svg>;}
