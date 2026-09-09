import { TextViewControls, type TextViewMode } from '@/components/texts/TextViewControls';
import { ReadingTools } from '@/components/texts/ReadingTools';
import { OriginalPdf } from '@/components/texts/OriginalPdf';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Markdown } from '@/components/common/Markdown';
import { Modal } from '@/components/common/Modal';
import { addAnnotation, ANNOTATIONS_TO_UNLOCK, setAnnotationMode, tqeProgress, canSeePeerAnnotations, deleteAnnotation, flagAnnotation, generateSharedTextVersion, moderateAnnotation, syncTextFromServer, updateAnnotation } from '@/services/text.service';
import { runCachedSync } from '@/services/sync-policy';
import { TqeWorkspace } from '@/components/texts/TqeWorkspace';
import type { TextAnnotation, TextParagraph, TextSupportLevel } from '@/types';

type ComposerState = { paragraphId: string; selectedText: string; parentId?: string; kind: 'annotation'|'page_note'|'reply' };

export function TextReaderPage() {
  const { textId } = useParams();
  const { user, isTeacher, isParent } = useAuth();
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [draft, setDraft] = useState('');
  const [type, setType] = useState<'observation'|'question'|'thought'|'epiphany'>('thought');
  const [selectedClass, setSelectedClass] = useState('');
  const [annotationError, setAnnotationError] = useState('');
  const [posting, setPosting] = useState(false);
  const [tags, setTags] = useState('');
  const [privateNote, setPrivateNote] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all'|'question'|'observation'|'thought'|'epiphany'|'page_note'|'mine'>('all');
  const [sort, setSort] = useState<'location'|'newest'|'oldest'>('location');
  const [editing, setEditing] = useState<TextAnnotation | null>(null);
  const [flagging, setFlagging] = useState<TextAnnotation | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [readingVersion, setReadingVersion] = useState<'original'|TextSupportLevel>('original');
  const [viewMode, setViewMode] = useState<TextViewMode>('article');
  const [fontSize, setFontSize] = useState(22);
  const [compare, setCompare] = useState(false);
  const [generatingVersion, setGeneratingVersion] = useState<TextSupportLevel|null>(null);
  const [supportError, setSupportError] = useState('');

  const text = useLiveQuery(() => textId ? db.texts.get(textId) : undefined, [textId]);
  const paragraphs = useLiveQuery(() => textId ? db.text_paragraphs.where('textId').equals(textId).sortBy('sortOrder') : [], [textId]);
  const versions = useLiveQuery(() => textId ? db.text_versions.where('textId').equals(textId).toArray() : [], [textId]);
  const versionParagraphs = useLiveQuery(() => textId ? db.text_version_paragraphs.where('textId').equals(textId).toArray() : [], [textId]);
  const availableClasses = useLiveQuery(async () => {
    if (!textId || !user) return [];
    const assignments = await db.text_assignments.where('textId').equals(textId).toArray();
    const members = await db.class_members.where('userId').equals(user.$id).toArray();
    const classes = await db.classes.bulkGet(assignments.map(a => a.classId));
    return classes.filter(c => c && (c.teacherId === user.$id || members.some(m => m.classId === c.$id)));
  }, [textId, user?.$id]);
  const defaultClassId = useLiveQuery(async () => {
    if (!textId || !user) return '';
    const assigned = await db.text_assignments.where('textId').equals(textId).toArray();
    if (isTeacher) return assigned[0]?.classId || '';
    const mine = await db.class_members.where('userId').equals(user.$id).toArray();
    return assigned.find(assignment => mine.some(member => member.classId === assignment.classId))?.classId || '';
  }, [textId, user?.$id, isTeacher]);

  const classId = availableClasses?.some(c=>c?.$id===selectedClass) ? selectedClass : defaultClassId;
  const tqe = text?.annotationMode !== 'regular';
  const thoughtOnly = text?.tqeStage === 'thought';

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

  const progress = tqeProgress((annotations || []).filter(a => a.authorId === user?.$id));
  const sharedMine = annotations?.filter(annotation => annotation.authorId === user?.$id && (annotation.visibility || 'class') === 'class' && (annotation.kind || 'annotation') === 'annotation').length || 0;
  const paragraphOrder = useMemo(() => new Map((paragraphs || []).map((paragraph, index) => [paragraph.$id, index])), [paragraphs]);
  const visible = useMemo(() => {
    const roots = (annotations || []).filter(annotation => !annotation.parentId);
    const needle = query.trim().toLowerCase();
    const filtered = roots.filter(annotation => {
      if (filter === 'mine' && annotation.authorId !== user?.$id) return false;
      if (filter === 'question' && annotation.type !== 'question') return false;
      if ((filter === 'thought' || filter === 'epiphany') && annotation.tqeType !== filter) return false;
      if (filter === 'observation' && annotation.type !== 'observation') return false;
      if (filter === 'page_note' && annotation.kind !== 'page_note') return false;
      if (!needle) return true;
      return `${annotation.content} ${annotation.selectedText || ''} ${annotation.tagsJson || ''}`.toLowerCase().includes(needle);
    });
    return filtered.sort((a,b) => sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : (paragraphOrder.get(a.paragraphId) ?? -1) - (paragraphOrder.get(b.paragraphId) ?? -1) || a.createdAt.localeCompare(b.createdAt));
  }, [annotations, filter, paragraphOrder, query, sort, user?.$id]);

  if (!text || !user) return <div className="p-6 text-gray-400">Loading…</div>;
  const startComposer = (state: ComposerState) => { setComposer(state); setDraft(''); setTags(''); setType(tqe ? 'thought' : 'observation'); setPrivateNote(false); };
  const post = async () => {
    if (!composer || !draft.trim() || !classId) return;
    setPosting(true); setAnnotationError('');
    try {
      await addAnnotation({ textId:text.$id,paragraphId:composer.paragraphId,classId,authorId:user.$id,type:type==='question'?'question':'observation',tqeType:tqe && composer.kind==='annotation' ? (type==='observation'?'thought':type) : undefined,content:draft,kind:composer.kind,selectedText:composer.selectedText,tags:parseTags(tags),parentId:composer.parentId,visibility:privateNote?'private':'class' });
      setComposer(null);
    } catch(cause) { setAnnotationError(cause instanceof Error ? cause.message : 'Could not save annotation'); }
    finally { setPosting(false); }
  };
  const makeHighlight = async (paragraphId: string, selectedText: string) => {
    if (!classId || !selectedText) return;
    await addAnnotation({ textId:text.$id,paragraphId,classId,authorId:user.$id,type:'observation',content:'Private highlight',kind:'highlight',selectedText,visibility:'private' });
  };
  const activeVersion = readingVersion === 'original' ? undefined : versions?.find(version => version.level === readingVersion);
  const adaptedByOriginal = new Map((versionParagraphs || []).filter(row => row.versionId === activeVersion?.$id).map(row => [row.originalParagraphId, row]));
  const requestSupport = async (level: TextSupportLevel) => {
    if (!textId) return;
    setGeneratingVersion(level); setSupportError('');
    try { await generateSharedTextVersion(textId, level); }
    catch (cause) { setSupportError(cause instanceof Error ? cause.message : 'Could not create this reading-support version.'); }
    finally { setGeneratingVersion(null); }
  };

  return <div className="mx-auto max-w-6xl space-y-5 p-4">
    <header><Link to="/texts" className="text-sm text-blue-600">← Texts</Link><div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{text.title}</h1><p className="text-gray-500">{text.author}</p></div>{!isParent && text.contentMode !== 'link' && <Button size="sm" variant="secondary" onClick={() => startComposer({paragraphId:'page',selectedText:'',kind:'page_note'})}>+ Page note</Button>}</div>{text.contentMode !== 'link' && !isTeacher && !isParent && !tqe && sharedMine < ANNOTATIONS_TO_UNLOCK && <p className="mt-2 rounded bg-blue-50 p-2 text-sm">Add {ANNOTATIONS_TO_UNLOCK-sharedMine} more shared observation{ANNOTATIONS_TO_UNLOCK-sharedMine===1?'':'s'} or question{ANNOTATIONS_TO_UNLOCK-sharedMine===1?'':'s'} to reveal classmates’ notes. Private highlights do not count.</p>}</header>
    {availableClasses && availableClasses.length > 1 && <label className="block text-sm font-medium">Class section<select className="ml-3 rounded-lg border p-2" value={classId || ''} onChange={event => { setSelectedClass(event.target.value); setComposer(null); }}>{availableClasses.map(c => c && <option key={c.$id} value={c.$id}>{c.courseName} · {c.name}</option>)}</select></label>}
    {isTeacher && text.teacherId === user.$id && <label className="block text-sm font-medium">Annotation style<select className="ml-3 rounded-lg border p-2" value={tqe?(thoughtOnly?'thought':'tqe'):'regular'} onChange={event => void setAnnotationMode(text.$id,event.target.value==='regular'?'regular':'tqe',event.target.value==='thought'?'thought':'full').catch(cause => setAnnotationError(cause.message))}><option value="tqe">TQE · Thoughts, Questions, Epiphanies</option><option value="thought">TQE introduction · Thought only</option><option value="regular">Regular annotations</option></select></label>}
    {annotationError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{annotationError}</p>}
    {tqe && !isParent && text.contentMode !== 'link' && <div className="rounded-xl border bg-slate-50 p-4"><p className="font-semibold">Thought {progress.thought?'✓':'○'}{!thoughtOnly && <> · Question {progress.question?'✓':'○'} · Epiphany {progress.epiphany?'✓':'○'}</>}</p><p className="mt-1 text-sm text-slate-600">{thoughtOnly?'One shared Thought reveals classmates’ notes. Notice a word or choice in the writing, then explain what it does.':'One of each reveals classmates’ notes. Select a passage, add your note, then choose one to Bring it.'}</p><details className="mt-2 text-sm"><summary className="cursor-pointer font-medium">What makes a useful TQE?</summary><p className="mt-2">Thought: name something you noticed in the writing. Question: name something you cannot work out. Epiphany: explain a connection or how your reading changed.</p><p className="mt-2">Ask why the writer made that choice. For a translation, ask why the translator chose that word.</p></details></div>}
    {tqe && classId && !isParent && text.contentMode !== 'link' && <TqeWorkspace thoughtOnly={thoughtOnly} key={text.$id+classId} textId={text.$id} classId={classId} userId={user.$id} teacher={Boolean(isTeacher)} annotations={annotations || []} />}
    <TextViewControls mode={viewMode} onMode={setViewMode} size={fontSize} onSize={setFontSize} title={readingVersion === 'original' ? text.title : `${text.title} — ${supportLevelLabel(readingVersion)}`} paragraphs={text.contentMode === 'link' || (readingVersion !== 'original' && activeVersion?.status !== 'ready') ? [] : (paragraphs || []).map(p => readingVersion === 'original' ? p.content : (adaptedByOriginal.get(p.$id)?.content || p.content))}/>
    {text.originalPdfId && <OriginalPdf textId={text.$id}/>}
    <ReadingTools key={`${text.$id}:${readingVersion}`} title={text.title} paragraphs={text.contentMode === 'link' || (readingVersion !== 'original' && activeVersion?.status !== 'ready') ? [] : (paragraphs || []).map(paragraph => readingVersion === 'original' ? paragraph.content : (adaptedByOriginal.get(paragraph.$id)?.content || paragraph.content))} unavailable={text.contentMode === 'link' ? 'Open the linked reading to use its browser reading tools. The app cannot read text from another website directly.' : text.originalPdfId && !paragraphs?.length ? 'This PDF has no extracted text. Open the original PDF to use its viewer’s reading tools; scans need OCR before they can be read aloud.' : 'Choose Original or wait for the selected reading version to be ready.'}/>
    {text.contentMode === 'link' && text.externalUrl && <Card className="space-y-3 text-center"><p className="text-gray-600">This reading is hosted on another website.</p><a href={text.externalUrl} target="_blank" rel="noreferrer"><Button>Open reading ↗</Button></a></Card>}
    {text.contentMode !== 'link' && Boolean(paragraphs?.length) && <ReadingSupportToolbar readingVersion={readingVersion} setReadingVersion={setReadingVersion} compare={compare} setCompare={setCompare} versions={versions||[]} />}
    {text.contentMode !== 'link' && readingVersion !== 'original' && activeVersion?.status !== 'ready' && <Card className="space-y-3 border-blue-200 bg-blue-50"><h2 className="font-semibold text-blue-950">{supportLevelLabel(readingVersion)} version</h2><p className="text-sm text-blue-900">{activeVersion?.status==='generating'?'Someone has already requested this shared version. It is still being prepared.':activeVersion?.status==='failed'?'The previous attempt did not finish. You can try again.':'This shared reading-support version has not been created yet. The first request uses AI; afterward everyone assigned this text reuses the saved version.'}</p>{supportError&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{supportError}</p>}{!isParent&&activeVersion?.status!=='generating'&&<Button loading={generatingVersion===readingVersion} onClick={()=>void requestSupport(readingVersion)}>{activeVersion?.status==='failed'?'Try again':'Create shared version'}</Button>}{activeVersion?.status==='generating'&&<Button variant="secondary" onClick={()=>classId&&void syncTextFromServer(text.$id,classId)}>Check again</Button>}</Card>}
    {text.contentMode !== 'link' && (readingVersion === 'original' || activeVersion?.status === 'ready') && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <main aria-label="Reading text" style={{ fontSize }} className={viewMode === 'article' ? 'mx-auto w-full max-w-[70ch] space-y-6 rounded-2xl bg-[#faf9f6] p-5 text-slate-900 sm:p-8' : 'space-y-4'}>{paragraphs?.map((paragraph,index) => { const adapted=adaptedByOriginal.get(paragraph.$id); const annotate=(selection:string)=>startComposer({paragraphId:paragraph.$id,selectedText:selection,kind:'annotation'}); const highlight=(selection:string)=>void makeHighlight(paragraph.$id,selection); if(readingVersion!=='original'&&compare&&adapted)return <div key={paragraph.$id} className="grid gap-3 xl:grid-cols-2"><ParagraphCard article={viewMode === 'article'} paragraph={paragraph} index={index} label="Original" readOnly={Boolean(isParent)} onAnnotate={annotate} onHighlight={highlight} density={tqe ? (annotations || []).filter(a=>a.paragraphId===paragraph.$id && a.tqeType && (a.kind||'annotation')==='annotation' && a.visibility!=='private' && a.moderationStatus==='visible').length : undefined}/><ParagraphCard article={viewMode === 'article'} paragraph={{...paragraph,content:adapted.content}} index={index} label={supportLevelLabel(readingVersion)} readOnly={Boolean(isParent)} onAnnotate={annotate} onHighlight={highlight} density={tqe ? (annotations || []).filter(a=>a.paragraphId===paragraph.$id && a.tqeType && (a.kind||'annotation')==='annotation' && a.visibility!=='private' && a.moderationStatus==='visible').length : undefined}/></div>; const shown=readingVersion==='original'||!adapted?paragraph:{...paragraph,content:adapted.content}; return <ParagraphCard article={viewMode === 'article'} key={paragraph.$id} paragraph={shown} index={index} label={readingVersion==='original'?undefined:supportLevelLabel(readingVersion)} readOnly={Boolean(isParent)} onAnnotate={annotate} onHighlight={highlight} density={tqe ? (annotations || []).filter(a=>a.paragraphId===paragraph.$id && a.tqeType && (a.kind||'annotation')==='annotation' && a.visibility!=='private' && a.moderationStatus==='visible').length : undefined}/>})}</main>
      <aside className="space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"><Card className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Annotations</h2><span className="text-xs text-gray-500">{visible.length} shown</span></div><input aria-label="Search annotations" className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Search notes or tags" value={query} onChange={event=>setQuery(event.target.value)} /><div className="grid grid-cols-2 gap-2"><select className="rounded-lg border px-2 py-2 text-sm" value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option value="all">All types</option><option value="question">Questions</option>{tqe?<><option value="thought">Thoughts</option><option value="epiphany">Epiphanies</option></>:<option value="observation">Observations</option>}<option value="page_note">Page notes</option><option value="mine">Mine</option></select><select className="rounded-lg border px-2 py-2 text-sm" value={sort} onChange={event=>setSort(event.target.value as typeof sort)}><option value="location">Text order</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select></div></Card>
        {visible.map(annotation => <AnnotationCard key={annotation.$id} annotation={annotation} replies={(annotations || []).filter(reply=>reply.parentId===annotation.$id)} userId={user.$id} isTeacher={Boolean(isTeacher)} canWrite={!isParent} onReply={() => startComposer({paragraphId:annotation.paragraphId,selectedText:'',parentId:annotation.$id,kind:'reply'})} onEdit={setEditing} onFlag={item=>{setFlagging(item);setFlagReason('')}} />)}
        {!visible.length && <Card><p className="text-sm text-gray-500">No annotations match these filters.</p></Card>}
      </aside>
    </div>}
    <Link to="/discussions" className="inline-block font-medium text-blue-600">Continue in Discussions →</Link>
    {composer && <AnnotationComposer thoughtOnly={thoughtOnly} tqe={tqe && composer.kind==='annotation'} posting={posting} title={composer.kind==='reply'?'Reply':composer.kind==='page_note'?'Page note':'Annotate passage'} selectedText={composer.selectedText} draft={draft} setDraft={setDraft} type={type} setType={setType} tags={tags} setTags={setTags} privateNote={privateNote} setPrivateNote={setPrivateNote} onClose={()=>setComposer(null)} onPost={()=>void post()} />}
    {editing && <EditAnnotationModal annotation={editing} onClose={()=>setEditing(null)} tqe={tqe} onSave={async(content,nextTags,nextType)=>{await updateAnnotation(editing.$id,user.$id,content,nextTags,nextType);setEditing(null)}} />}
    {flagging && <Modal open onClose={()=>setFlagging(null)} title="Flag annotation"><div className="space-y-4"><p className="text-sm">Explain briefly why this note is inappropriate.</p><textarea autoFocus rows={3} className="w-full rounded-lg border px-3 py-2" value={flagReason} onChange={event=>setFlagReason(event.target.value)} /><Button variant="danger" className="w-full" disabled={flagReason.trim().length<3} onClick={()=>void flagAnnotation(flagging.$id,flagReason).then(()=>setFlagging(null))}>Send to teacher</Button></div></Modal>}
  </div>;
}

function ParagraphCard({ article, paragraph, index, label, readOnly, onAnnotate, onHighlight, density }: { article:boolean; density?:number; paragraph:TextParagraph;index:number;label?:string;readOnly:boolean;onAnnotate:(selection:string)=>void;onHighlight:(selection:string)=>void }) {
  const [selection,setSelection]=useState('');
  const capture=()=>setSelection(window.getSelection()?.toString().trim().slice(0,2000)||'');
  const actions = <div className="flex flex-wrap items-center gap-2"><Button size="sm" onClick={()=>onAnnotate(selection)}>{selection?'Annotate selection':'+ Note'}</Button>{selection&&<Button size="sm" variant="secondary" onClick={()=>onHighlight(selection)}>Private highlight</Button>}{selection&&<button className="text-xs text-gray-500" onClick={()=>{window.getSelection()?.removeAllRanges();setSelection('')}}>Clear selection</button>}</div>;
  return <section aria-label={`Paragraph ${index+1}`} className={article ? 'space-y-2' : 'space-y-3 rounded-xl border bg-white p-4 text-slate-900'}>
    {(!article || label || density) && <p className="text-xs font-medium text-gray-500">{label? `${label} · `:''}Paragraph {index+1}{density !== undefined && <span className="ml-2 text-blue-700">· {density} TQE notes</span>}</p>}
    <div onMouseUp={capture} onTouchEnd={capture}><Markdown content={paragraph.content} className="leading-relaxed [&_table]:text-[1em] [&_code]:text-[.9em]"/></div>
    {!readOnly && (article ? <details open={selection ? true : undefined}><summary className="cursor-pointer text-xs text-slate-500">Annotate paragraph {index+1}</summary><div className="mt-2">{actions}</div></details> : actions)}
  </section>;
}

function ReadingSupportToolbar({readingVersion,setReadingVersion,compare,setCompare,versions}:{readingVersion:'original'|TextSupportLevel;setReadingVersion:(value:'original'|TextSupportLevel)=>void;compare:boolean;setCompare:(value:boolean)=>void;versions:Array<{level:TextSupportLevel;status:string}>}) {
  return <Card className="space-y-3"><div><h2 className="font-semibold">Reading support</h2><p className="text-sm text-gray-500">Choose the amount of language support you need. Everyone still annotates the same paragraphs.</p></div><div className="flex flex-wrap gap-2">{(['original','supported','highly_supported'] as const).map(value=><button key={value} type="button" onClick={()=>setReadingVersion(value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${readingVersion===value?'bg-gray-950 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{value==='original'?'Original':supportLevelLabel(value)}{value!=='original'&&versions.some(version=>version.level===value&&version.status==='ready')?' ✓':''}</button>)}</div>{readingVersion!=='original'&&<label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" className="h-4 w-4 rounded" checked={compare} onChange={event=>setCompare(event.target.checked)}/>Show original and supported text side by side</label>}<p className="text-xs text-gray-500">Supported versions are AI-generated. If meaning seems different, compare with the original and tell your teacher.</p></Card>;
}

function supportLevelLabel(level:TextSupportLevel):string{return level==='supported'?'Supported':'Highly supported'}

function AnnotationCard({ annotation,replies,userId,isTeacher,canWrite,onReply,onEdit,onFlag }:{annotation:TextAnnotation;replies:TextAnnotation[];userId:string;isTeacher:boolean;canWrite:boolean;onReply:()=>void;onEdit:(item:TextAnnotation)=>void;onFlag:(item:TextAnnotation)=>void}) {
  const mine=annotation.authorId===userId,tags=parseAnnotationTags(annotation),kind=annotation.kind||'annotation';
  return <Card className={`space-y-2 ${annotation.flagged?'border-red-300 bg-red-50':''}`}><div className="flex items-start justify-between gap-2"><div><strong className="text-sm">{mine?'You':annotation.anonymousLabel}</strong><span className="ml-2 text-xs text-gray-500">{kind==='page_note'?'Page note':kind==='highlight'?'Private highlight':annotation.tqeType==='thought'?'Thought':annotation.tqeType==='epiphany'?'Epiphany':annotation.type==='question'?'Question':'Observation'} · {new Date(annotation.createdAt).toLocaleDateString()}</span></div>{annotation.visibility==='private'&&<span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold">ONLY ME</span>}</div>{annotation.selectedText&&<blockquote className="border-l-4 border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-gray-700">{annotation.selectedText}</blockquote>}{kind!=='highlight'&&<Markdown content={annotation.content} className="text-sm" />}{tags.length>0&&<div className="flex flex-wrap gap-1">{tags.map(tag=><span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700">#{tag}</span>)}</div>}<div className="flex flex-wrap gap-3 text-xs">{canWrite&&<button className="text-blue-700" onClick={onReply}>Reply</button>}{mine&&<><button className="text-gray-600" onClick={()=>onEdit(annotation)}>Edit</button><button className="text-red-600" onClick={()=>window.confirm('Delete this annotation and its replies?')&&void deleteAnnotation(annotation.$id,userId)}>Delete</button></>}{canWrite&&!mine&&!isTeacher&&<button className="text-red-600" onClick={()=>onFlag(annotation)}>Flag</button>}{isTeacher&&<><button className="text-amber-700" onClick={()=>void moderateAnnotation(annotation.$id,annotation.moderationStatus==='visible'?'hide':'show')}>{annotation.moderationStatus==='visible'?'Hide':'Show'}</button><button className="text-red-700" onClick={()=>window.confirm('Permanently delete this annotation?')&&void moderateAnnotation(annotation.$id,'delete')}>Delete</button>{annotation.flagged&&<button className="font-semibold text-red-700" onClick={()=>void moderateAnnotation(annotation.$id,'dismissFlag')}>Dismiss flag</button>}</>}</div>{annotation.flagged&&isTeacher&&<p className="rounded bg-red-100 p-2 text-xs text-red-800">Flagged: {annotation.flagReason}</p>}{replies.map(reply=><div key={reply.$id} className="ml-4 border-l-2 pl-3"><div className="text-xs font-semibold">{reply.authorId===userId?'You':reply.anonymousLabel}</div><Markdown content={reply.content} className="text-sm" /></div>)}</Card>;
}

function AnnotationComposer({tqe,thoughtOnly,posting,title,selectedText,draft,setDraft,type,setType,tags,setTags,privateNote,setPrivateNote,onClose,onPost}:{tqe:boolean;thoughtOnly:boolean;posting:boolean;title:string;selectedText:string;draft:string;setDraft:(value:string)=>void;type:'observation'|'question'|'thought'|'epiphany';setType:(value:'observation'|'question'|'thought'|'epiphany')=>void;tags:string;setTags:(value:string)=>void;privateNote:boolean;setPrivateNote:(value:boolean)=>void;onClose:()=>void;onPost:()=>void}) {
  return <Modal open onClose={onClose} title={title}><div className="space-y-4">{selectedText&&<blockquote className="border-l-4 border-yellow-300 bg-yellow-50 p-3 text-sm">{selectedText}</blockquote>}<div className="flex gap-2">{tqe?<div className="flex flex-wrap gap-2">{(thoughtOnly ? ['thought'] as const : ['thought','question','epiphany'] as const).map(value=><button type="button" aria-pressed={type===value} key={value} onClick={()=>setType(value)} className={`rounded-lg border px-3 py-2 text-sm ${type===value?'bg-slate-900 text-white':'bg-white'}`}>{value==='thought'?'T · Thought':value==='question'?'Q · Question':'E · Epiphany'}</button>)}</div>:<select className="rounded-lg border px-3 py-2 text-sm" value={type} onChange={event=>setType(event.target.value as typeof type)}><option value="observation">Observation</option><option value="question">Question</option></select>}<button className="rounded border px-3 font-bold" onClick={()=>setDraft(`${draft}**bold**`)}>B</button><button className="rounded border px-3 italic" onClick={()=>setDraft(`${draft}*italics*`)}>I</button><button className="rounded border px-3 text-sm" onClick={()=>setDraft(`${draft}[link](https://)`)}>Link</button></div><textarea autoFocus rows={6} className="w-full rounded-lg border px-3 py-2" placeholder="Write your annotation… Markdown is supported." value={draft} onChange={event=>setDraft(event.target.value)} /><input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Tags, separated by commas" value={tags} onChange={event=>setTags(event.target.value)} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={privateNote} onChange={event=>setPrivateNote(event.target.checked)} />Only me</label><div className="rounded-lg bg-gray-50 p-3"><p className="mb-1 text-xs font-semibold text-gray-500">Preview</p><Markdown content={draft||'Nothing written yet.'} className="text-sm" /></div><Button className="w-full" loading={posting} disabled={!draft.trim()} onClick={onPost}>Post annotation</Button></div></Modal>;
}

function EditAnnotationModal({annotation,tqe,onClose,onSave}:{annotation:TextAnnotation;tqe:boolean;onClose:()=>void;onSave:(content:string,tags:string[],type?:TextAnnotation['tqeType'])=>Promise<void>}) {
  const [content,setContent]=useState(annotation.content),[tags,setTags]=useState(parseAnnotationTags(annotation).join(', ')),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [nextType,setNextType]=useState<TextAnnotation['tqeType']>(annotation.tqeType || (annotation.type==='question'?'question':'thought'));
  return <Modal open onClose={onClose} title="Edit annotation"><div className="space-y-3">
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {tqe&&(annotation.kind||'annotation')==='annotation'&&<label className="block text-sm">TQE type<select className="ml-2 rounded border p-2" value={nextType} onChange={e=>setNextType(e.target.value as TextAnnotation['tqeType'])}><option value="thought">Thought</option><option value="question">Question</option><option value="epiphany">Epiphany</option></select></label>}
    <textarea autoFocus rows={6} className="w-full rounded-lg border px-3 py-2" value={content} onChange={event=>setContent(event.target.value)} />
    <input className="w-full rounded-lg border px-3 py-2" value={tags} onChange={event=>setTags(event.target.value)} placeholder="Tags" />
    <Button className="w-full" loading={busy} disabled={!content.trim()} onClick={()=>{setBusy(true);void onSave(content,parseTags(tags),tqe&&(annotation.kind||'annotation')==='annotation'?nextType:undefined).catch(cause=>setError(cause.message)).finally(()=>setBusy(false));}}>Save changes</Button>
  </div></Modal>;
}
function parseTags(value:string):string[]{return [...new Set(value.split(',').map(tag=>tag.trim().toLowerCase()).filter(Boolean))].slice(0,8)}
function parseAnnotationTags(annotation:TextAnnotation):string[]{try{const tags=JSON.parse(annotation.tagsJson||'[]');return Array.isArray(tags)?tags.filter(tag=>typeof tag==='string'):[]}catch{return[]}}
