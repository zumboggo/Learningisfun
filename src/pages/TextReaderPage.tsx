import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Markdown } from '@/components/common/Markdown';
import { Modal } from '@/components/common/Modal';
import { addAnnotation, ANNOTATIONS_TO_UNLOCK, canSeePeerAnnotations, deleteAnnotation, flagAnnotation, moderateAnnotation, syncTextFromServer, updateAnnotation } from '@/services/text.service';
import { runCachedSync } from '@/services/sync-policy';
import type { TextAnnotation, TextParagraph } from '@/types';

type ComposerState = { paragraphId: string; selectedText: string; parentId?: string; kind: 'annotation'|'page_note'|'reply' };

export function TextReaderPage() {
  const { textId } = useParams();
  const { user, isTeacher, isParent } = useAuth();
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [draft, setDraft] = useState('');
  const [type, setType] = useState<'observation'|'question'>('observation');
  const [tags, setTags] = useState('');
  const [privateNote, setPrivateNote] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all'|'question'|'observation'|'page_note'|'mine'>('all');
  const [sort, setSort] = useState<'location'|'newest'|'oldest'>('location');
  const [editing, setEditing] = useState<TextAnnotation | null>(null);
  const [flagging, setFlagging] = useState<TextAnnotation | null>(null);
  const [flagReason, setFlagReason] = useState('');

  const text = useLiveQuery(() => textId ? db.texts.get(textId) : undefined, [textId]);
  const paragraphs = useLiveQuery(() => textId ? db.text_paragraphs.where('textId').equals(textId).sortBy('sortOrder') : [], [textId]);
  const classId = useLiveQuery(async () => {
    if (!textId || !user) return '';
    const assigned = await db.text_assignments.where('textId').equals(textId).toArray();
    if (isTeacher) return assigned[0]?.classId || '';
    const mine = await db.class_members.where('userId').equals(user.$id).toArray();
    return assigned.find(assignment => mine.some(member => member.classId === assignment.classId))?.classId || '';
  }, [textId, user?.$id, isTeacher]);

  useEffect(() => {
    if (!textId || !classId) return;
    const refresh = () => { if (document.visibilityState === 'visible') void runCachedSync(`text-content:${textId}:${classId}`, 5*60*1000, () => syncTextFromServer(textId, classId)); };
    refresh(); window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh);
  }, [textId, classId]);

  const annotations = useLiveQuery(async () => {
    if (!textId || !classId || !user) return [];
    const all = await db.text_annotations.where('[textId+classId]').equals([textId, classId]).toArray();
    const unlocked = isTeacher || isParent || await canSeePeerAnnotations(textId, classId, user.$id);
    return all.filter(annotation => {
      if ((annotation.visibility || 'class') === 'private') return annotation.authorId === user.$id;
      return (isTeacher || annotation.moderationStatus === 'visible') && (unlocked || annotation.authorId === user.$id);
    });
  }, [textId, classId, user?.$id, isTeacher, isParent]);

  const sharedMine = annotations?.filter(annotation => annotation.authorId === user?.$id && (annotation.visibility || 'class') === 'class' && (annotation.kind || 'annotation') === 'annotation').length || 0;
  const paragraphOrder = useMemo(() => new Map((paragraphs || []).map((paragraph, index) => [paragraph.$id, index])), [paragraphs]);
  const visible = useMemo(() => {
    const roots = (annotations || []).filter(annotation => !annotation.parentId);
    const needle = query.trim().toLowerCase();
    const filtered = roots.filter(annotation => {
      if (filter === 'mine' && annotation.authorId !== user?.$id) return false;
      if (filter === 'question' && annotation.type !== 'question') return false;
      if (filter === 'observation' && annotation.type !== 'observation') return false;
      if (filter === 'page_note' && annotation.kind !== 'page_note') return false;
      if (!needle) return true;
      return `${annotation.content} ${annotation.selectedText || ''} ${annotation.tagsJson || ''}`.toLowerCase().includes(needle);
    });
    return filtered.sort((a,b) => sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : (paragraphOrder.get(a.paragraphId) ?? -1) - (paragraphOrder.get(b.paragraphId) ?? -1) || a.createdAt.localeCompare(b.createdAt));
  }, [annotations, filter, paragraphOrder, query, sort, user?.$id]);

  if (!text || !user) return <div className="p-6 text-gray-400">Loading…</div>;
  const startComposer = (state: ComposerState) => { setComposer(state); setDraft(''); setTags(''); setType('observation'); setPrivateNote(false); };
  const post = async () => {
    if (!composer || !draft.trim() || !classId) return;
    await addAnnotation({ textId:text.$id,paragraphId:composer.paragraphId,classId,authorId:user.$id,type,content:draft,kind:composer.kind,selectedText:composer.selectedText,tags:parseTags(tags),parentId:composer.parentId,visibility:privateNote?'private':'class' });
    setComposer(null);
  };
  const makeHighlight = async (paragraphId: string, selectedText: string) => {
    if (!classId || !selectedText) return;
    await addAnnotation({ textId:text.$id,paragraphId,classId,authorId:user.$id,type:'observation',content:'Private highlight',kind:'highlight',selectedText,visibility:'private' });
  };

  return <div className="mx-auto max-w-6xl space-y-5 p-4">
    <header><Link to="/texts" className="text-sm text-blue-600">← Texts</Link><div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{text.title}</h1><p className="text-gray-500">{text.author}</p></div>{!isParent && text.contentMode !== 'link' && <Button size="sm" variant="secondary" onClick={() => startComposer({paragraphId:'page',selectedText:'',kind:'page_note'})}>+ Page note</Button>}</div>{text.contentMode !== 'link' && !isTeacher && !isParent && sharedMine < ANNOTATIONS_TO_UNLOCK && <p className="mt-2 rounded bg-blue-50 p-2 text-sm">Add {ANNOTATIONS_TO_UNLOCK-sharedMine} more shared observation{ANNOTATIONS_TO_UNLOCK-sharedMine===1?'':'s'} or question{ANNOTATIONS_TO_UNLOCK-sharedMine===1?'':'s'} to reveal classmates’ notes. Private highlights do not count.</p>}</header>
    {text.contentMode === 'link' && text.externalUrl && <Card className="space-y-3 text-center"><p className="text-gray-600">This reading is hosted on another website.</p><a href={text.externalUrl} target="_blank" rel="noreferrer"><Button>Open reading ↗</Button></a></Card>}
    {text.contentMode !== 'link' && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <main className="space-y-4">{paragraphs?.map((paragraph,index) => <ParagraphCard key={paragraph.$id} paragraph={paragraph} index={index} readOnly={Boolean(isParent)} onAnnotate={selection => startComposer({paragraphId:paragraph.$id,selectedText:selection,kind:'annotation'})} onHighlight={selection => void makeHighlight(paragraph.$id,selection)} />)}</main>
      <aside className="space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"><Card className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Annotations</h2><span className="text-xs text-gray-500">{visible.length} shown</span></div><input aria-label="Search annotations" className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Search notes or tags" value={query} onChange={event=>setQuery(event.target.value)} /><div className="grid grid-cols-2 gap-2"><select className="rounded-lg border px-2 py-2 text-sm" value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option value="all">All types</option><option value="question">Questions</option><option value="observation">Observations</option><option value="page_note">Page notes</option><option value="mine">Mine</option></select><select className="rounded-lg border px-2 py-2 text-sm" value={sort} onChange={event=>setSort(event.target.value as typeof sort)}><option value="location">Text order</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select></div></Card>
        {visible.map(annotation => <AnnotationCard key={annotation.$id} annotation={annotation} replies={(annotations || []).filter(reply=>reply.parentId===annotation.$id)} userId={user.$id} isTeacher={Boolean(isTeacher)} canWrite={!isParent} onReply={() => startComposer({paragraphId:annotation.paragraphId,selectedText:'',parentId:annotation.$id,kind:'reply'})} onEdit={setEditing} onFlag={item=>{setFlagging(item);setFlagReason('')}} />)}
        {!visible.length && <Card><p className="text-sm text-gray-500">No annotations match these filters.</p></Card>}
      </aside>
    </div>}
    <Link to="/discussions" className="inline-block font-medium text-blue-600">Continue in Discussions →</Link>
    {composer && <AnnotationComposer title={composer.kind==='reply'?'Reply':composer.kind==='page_note'?'Page note':'Annotate passage'} selectedText={composer.selectedText} draft={draft} setDraft={setDraft} type={type} setType={setType} tags={tags} setTags={setTags} privateNote={privateNote} setPrivateNote={setPrivateNote} onClose={()=>setComposer(null)} onPost={()=>void post()} />}
    {editing && <EditAnnotationModal annotation={editing} onClose={()=>setEditing(null)} onSave={async(content,nextTags)=>{await updateAnnotation(editing.$id,user.$id,content,nextTags);setEditing(null)}} />}
    {flagging && <Modal open onClose={()=>setFlagging(null)} title="Flag annotation"><div className="space-y-4"><p className="text-sm">Explain briefly why this note is inappropriate.</p><textarea autoFocus rows={3} className="w-full rounded-lg border px-3 py-2" value={flagReason} onChange={event=>setFlagReason(event.target.value)} /><Button variant="danger" className="w-full" disabled={flagReason.trim().length<3} onClick={()=>void flagAnnotation(flagging.$id,flagReason).then(()=>setFlagging(null))}>Send to teacher</Button></div></Modal>}
  </div>;
}

function ParagraphCard({ paragraph, index, readOnly, onAnnotate, onHighlight }: { paragraph:TextParagraph;index:number;readOnly:boolean;onAnnotate:(selection:string)=>void;onHighlight:(selection:string)=>void }) {
  const [selection,setSelection]=useState('');
  const capture=()=>setSelection(window.getSelection()?.toString().trim().slice(0,2000)||'');
  return <Card className="space-y-3"><p className="text-xs text-gray-400">Paragraph {index+1}</p><p className="whitespace-pre-wrap text-lg leading-8" onMouseUp={capture} onTouchEnd={capture}>{paragraph.content}</p>{!readOnly && <div className="flex flex-wrap items-center gap-2"><Button size="sm" onClick={()=>onAnnotate(selection)}>{selection?'Annotate selection':'+ Note'}</Button>{selection&&<Button size="sm" variant="secondary" onClick={()=>onHighlight(selection)}>Private highlight</Button>}{selection&&<button className="text-xs text-gray-500" onClick={()=>{window.getSelection()?.removeAllRanges();setSelection('')}}>Clear selection</button>}</div>}</Card>;
}

function AnnotationCard({ annotation,replies,userId,isTeacher,canWrite,onReply,onEdit,onFlag }:{annotation:TextAnnotation;replies:TextAnnotation[];userId:string;isTeacher:boolean;canWrite:boolean;onReply:()=>void;onEdit:(item:TextAnnotation)=>void;onFlag:(item:TextAnnotation)=>void}) {
  const mine=annotation.authorId===userId,tags=parseAnnotationTags(annotation),kind=annotation.kind||'annotation';
  return <Card className={`space-y-2 ${annotation.flagged?'border-red-300 bg-red-50':''}`}><div className="flex items-start justify-between gap-2"><div><strong className="text-sm">{mine?'You':annotation.anonymousLabel}</strong><span className="ml-2 text-xs text-gray-500">{kind==='page_note'?'Page note':kind==='highlight'?'Private highlight':annotation.type==='question'?'Question':'Observation'} · {new Date(annotation.createdAt).toLocaleDateString()}</span></div>{annotation.visibility==='private'&&<span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold">ONLY ME</span>}</div>{annotation.selectedText&&<blockquote className="border-l-4 border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-gray-700">{annotation.selectedText}</blockquote>}{kind!=='highlight'&&<Markdown content={annotation.content} className="text-sm" />}{tags.length>0&&<div className="flex flex-wrap gap-1">{tags.map(tag=><span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700">#{tag}</span>)}</div>}<div className="flex flex-wrap gap-3 text-xs">{canWrite&&<button className="text-blue-700" onClick={onReply}>Reply</button>}{mine&&<><button className="text-gray-600" onClick={()=>onEdit(annotation)}>Edit</button><button className="text-red-600" onClick={()=>window.confirm('Delete this annotation and its replies?')&&void deleteAnnotation(annotation.$id,userId)}>Delete</button></>}{canWrite&&!mine&&!isTeacher&&<button className="text-red-600" onClick={()=>onFlag(annotation)}>Flag</button>}{isTeacher&&<><button className="text-amber-700" onClick={()=>void moderateAnnotation(annotation.$id,annotation.moderationStatus==='visible'?'hide':'show')}>{annotation.moderationStatus==='visible'?'Hide':'Show'}</button><button className="text-red-700" onClick={()=>window.confirm('Permanently delete this annotation?')&&void moderateAnnotation(annotation.$id,'delete')}>Delete</button>{annotation.flagged&&<button className="font-semibold text-red-700" onClick={()=>void moderateAnnotation(annotation.$id,'dismissFlag')}>Dismiss flag</button>}</>}</div>{annotation.flagged&&isTeacher&&<p className="rounded bg-red-100 p-2 text-xs text-red-800">Flagged: {annotation.flagReason}</p>}{replies.map(reply=><div key={reply.$id} className="ml-4 border-l-2 pl-3"><div className="text-xs font-semibold">{reply.authorId===userId?'You':reply.anonymousLabel}</div><Markdown content={reply.content} className="text-sm" /></div>)}</Card>;
}

function AnnotationComposer({title,selectedText,draft,setDraft,type,setType,tags,setTags,privateNote,setPrivateNote,onClose,onPost}:{title:string;selectedText:string;draft:string;setDraft:(value:string)=>void;type:'observation'|'question';setType:(value:'observation'|'question')=>void;tags:string;setTags:(value:string)=>void;privateNote:boolean;setPrivateNote:(value:boolean)=>void;onClose:()=>void;onPost:()=>void}) {
  return <Modal open onClose={onClose} title={title}><div className="space-y-4">{selectedText&&<blockquote className="border-l-4 border-yellow-300 bg-yellow-50 p-3 text-sm">{selectedText}</blockquote>}<div className="flex gap-2"><select className="rounded-lg border px-3 py-2 text-sm" value={type} onChange={event=>setType(event.target.value as typeof type)}><option value="observation">Observation</option><option value="question">Question</option></select><button className="rounded border px-3 font-bold" onClick={()=>setDraft(`${draft}**bold**`)}>B</button><button className="rounded border px-3 italic" onClick={()=>setDraft(`${draft}*italics*`)}>I</button><button className="rounded border px-3 text-sm" onClick={()=>setDraft(`${draft}[link](https://)`)}>Link</button></div><textarea autoFocus rows={6} className="w-full rounded-lg border px-3 py-2" placeholder="Write your annotation… Markdown is supported." value={draft} onChange={event=>setDraft(event.target.value)} /><input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Tags, separated by commas" value={tags} onChange={event=>setTags(event.target.value)} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={privateNote} onChange={event=>setPrivateNote(event.target.checked)} />Only me</label><div className="rounded-lg bg-gray-50 p-3"><p className="mb-1 text-xs font-semibold text-gray-500">Preview</p><Markdown content={draft||'Nothing written yet.'} className="text-sm" /></div><Button className="w-full" disabled={!draft.trim()} onClick={onPost}>Post annotation</Button></div></Modal>;
}

function EditAnnotationModal({annotation,onClose,onSave}:{annotation:TextAnnotation;onClose:()=>void;onSave:(content:string,tags:string[])=>Promise<void>}) { const[content,setContent]=useState(annotation.content),[tags,setTags]=useState(parseAnnotationTags(annotation).join(', ')),[busy,setBusy]=useState(false);return <Modal open onClose={onClose} title="Edit annotation"><div className="space-y-3"><textarea autoFocus rows={6} className="w-full rounded-lg border px-3 py-2" value={content} onChange={event=>setContent(event.target.value)} /><input className="w-full rounded-lg border px-3 py-2" value={tags} onChange={event=>setTags(event.target.value)} placeholder="Tags" /><Button className="w-full" loading={busy} disabled={!content.trim()} onClick={()=>{setBusy(true);void onSave(content,parseTags(tags)).finally(()=>setBusy(false))}}>Save changes</Button></div></Modal>; }
function parseTags(value:string):string[]{return [...new Set(value.split(',').map(tag=>tag.trim().toLowerCase()).filter(Boolean))].slice(0,8)}
function parseAnnotationTags(annotation:TextAnnotation):string[]{try{const tags=JSON.parse(annotation.tagsJson||'[]');return Array.isArray(tags)?tags.filter(tag=>typeof tag==='string'):[]}catch{return[]}}
