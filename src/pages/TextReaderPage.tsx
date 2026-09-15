import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { ReaderToolbar, type ReaderPanel } from '@/components/texts/ReaderToolbar';
import { TextPurposeLabels } from '@/components/texts/TextPurpose';
import { TextSource } from '@/components/texts/TextSource';
import { CopyTextLinkButton } from '@/components/texts/CopyTextLinkButton';
import { TextViewControls } from '@/components/texts/TextViewControls';
import { ReadingTools } from '@/components/texts/ReadingTools';
import { OriginalPdf } from '@/components/texts/OriginalPdf';
import { Button } from '@/components/common/Button';
import { Markdown } from '@/components/common/Markdown';
import { Card } from '@/components/common/Card';
import { generateSharedTextVersion, syncTextFromServer } from '@/services/text.service';
import { textAssignmentAvailable } from '@/services/text-schedule';
import { runCachedSync } from '@/services/sync-policy';
import type { TextParagraph, TextSupportLevel } from '@/types';

export function TextReaderPage() {
  const { textId }=useParams(),[search,setSearch]=useSearchParams();
  const {user,isTeacher,isParent}=useAuth();
  const [mode,setMode]=useState<'article'|'original'>('article'),[panel,setPanel]=useState<ReaderPanel>(null),[fontSize,setFontSize]=useState(22);
  const [level,setLevel]=useState<'original'|TextSupportLevel>('original'),[compare,setCompare]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const text=useLiveQuery(()=>textId?db.texts.get(textId):undefined,[textId]);
  const paragraphs=useLiveQuery(()=>textId?db.text_paragraphs.where('textId').equals(textId).sortBy('sortOrder'):[],[textId]);
  const versions=useLiveQuery(()=>textId?db.text_versions.where('textId').equals(textId).toArray():[],[textId]);
  const versionParagraphs=useLiveQuery(()=>textId?db.text_version_paragraphs.where('textId').equals(textId).toArray():[],[textId]);
  const availableClasses=useLiveQuery(async()=>{
    if(!textId||!user)return [];
    const assignments=await db.text_assignments.where('textId').equals(textId).toArray();
    const members=await db.class_members.where('userId').equals(user.$id).toArray();
    const classes=await db.classes.bulkGet(assignments.map(a=>a.classId));
    return classes.filter(c=>c&&(c.teacherId===user.$id||members.some(m=>m.classId===c.$id)&&assignments.some(a=>a.classId===c.$id&&textAssignmentAvailable(a))));
  },[textId,user?.$id]);
  const requestedClass=search.get('classId');
  const classId=availableClasses?.find(c=>c?.$id===requestedClass)?.$id||availableClasses?.[0]?.$id;
  const readingAssignment=useLiveQuery(()=>textId&&classId?db.text_assignments.where('[textId+classId]').equals([textId,classId]).first():undefined,[textId,classId]);
  useEffect(()=>{
    if(!textId||!(classId||requestedClass))return;
    const refresh=()=>{if(document.visibilityState==='visible')void runCachedSync(`text-content:${textId}:${classId}`,5*60*1000,()=>syncTextFromServer(textId,classId||requestedClass!));};
    refresh();window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);
  },[textId,classId,requestedClass]);
  const targetParagraph=search.get('paragraph');
  useEffect(()=>{if(targetParagraph&&paragraphs?.length)document.getElementById(`paragraph-${Number(targetParagraph)}`)?.scrollIntoView?.({block:'center'});},[targetParagraph,paragraphs?.length]);
  if(!text||!user)return <div className="p-6">Loading…</div>;
  if(!isTeacher&&(!classId||text.status!=='published'))return <div className="p-6"><Link to="/texts">← Texts</Link><p>This reading is not available to your class yet.</p></div>;
  const version=versions?.find(v=>v.level===level),ready=level==='original'||version?.status==='ready';
  const adapted=new Map((versionParagraphs||[]).filter(p=>p.versionId===version?.$id).map(p=>[p.originalParagraphId,p.content]));
  const contents=(paragraphs||[]).map(p=>level==='original'?p.content:adapted.get(p.$id)||p.content);
  const label=(value:string)=>value==='original'?'Original':value==='supported'?'Supported':'Highly supported';
  return <div className="reader-shell mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
    <header className="space-y-3"><div className="flex flex-wrap items-center gap-3"><Link to={isTeacher?'/classes':'/dashboard'} className="inline-flex min-h-11 items-center rounded-xl border px-4">Home</Link><Link to="/texts" className="text-sm text-blue-700">← Texts</Link>{classId&&<Link to={`/discussions/texts/${textId}/${classId}`} className="ml-auto inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-4 font-semibold text-blue-800">Discuss text →</Link>}</div><h1 className="reader-title text-3xl font-semibold sm:text-4xl">{text.title}</h1><p className="text-slate-500">{text.author}</p>{readingAssignment&&<TextPurposeLabels value={readingAssignment}/>}<TextSource source={text.source} url={text.contentMode!=='link'?text.externalUrl:undefined}/>{isTeacher&&<CopyTextLinkButton textId={text.$id} title={text.title}/>}</header>
    <ReaderToolbar mode={mode} panel={panel} size={fontSize} onSize={setFontSize} onArticle={()=>{setMode('article');setPanel(null);setLevel('original');}} onOriginal={()=>{setMode('original');setPanel(null);}} onPanel={setPanel}>
      {panel==='support'&&<><div className="flex flex-wrap gap-2">{(['original','supported','highly_supported'] as const).map(value=><Button key={value} size="sm" variant={level===value?'primary':'secondary'} onClick={()=>{setLevel(value);setMode('article');}}>{label(value)}</Button>)}</div>{level!=='original'&&<label className="flex gap-2 text-sm"><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/>Compare with original</label>}<p className="text-xs text-slate-600">Supported versions are AI-generated. Check the original if the meaning seems different.</p><ReadingTools key={`${textId}:${level}`} title={text.title} paragraphs={ready&&text.contentMode!=='link'?contents:[]} unavailable="Open the original source or choose an available article version to read aloud."/></>}
      {panel==='more'&&<>{(availableClasses?.length||0)>1&&<label className="block text-sm">Class section<select className="ml-2 rounded border p-2" value={classId} onChange={e=>setSearch({classId:e.target.value})}>{availableClasses?.map(c=>c&&<option key={c.$id} value={c.$id}>{c.courseName} · {c.name}</option>)}</select></label>}<TextViewControls size={fontSize} onSize={setFontSize} title={text.title} paragraphs={ready?contents:[]}/>{classId&&<Link className="block text-sm text-slate-600 underline" to={`/texts/${textId}/legacy?classId=${classId}`}>Read-only legacy annotations & TQE archive</Link>}</>}
    </ReaderToolbar>
    {mode==='original'&&(text.originalPdfId?<OriginalPdf textId={text.$id} embedded/>:<Card><p>No original uploaded file was retained for this text. Article Mode shows the saved reading.</p>{text.externalUrl&&/^https?:\/\//i.test(text.externalUrl)&&<a className="text-blue-700 underline" href={text.externalUrl} target="_blank" rel="noreferrer">Open original source ↗</a>}</Card>)}
    {mode==='article'&&text.contentMode==='link'&&text.externalUrl&&<Card><a className="text-blue-700 underline" href={text.externalUrl} target="_blank" rel="noreferrer">Open reading ↗</a></Card>}
    {mode==='article'&&text.contentMode!=='link'&&!ready&&<Card><p>{version?.status==='generating'?'The shared reading version is being prepared.':'Create this reading-support version once; classmates can then reuse it.'}</p>{error&&<p role="alert">{error}</p>}{!isParent&&<Button loading={busy} disabled={version?.status==='generating'} onClick={()=>{setBusy(true);void generateSharedTextVersion(text.$id,level).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}>Create shared version</Button>}<Button variant="secondary" onClick={()=>classId&&void syncTextFromServer(text.$id,classId)}>Check again</Button></Card>}
    {mode==='article'&&text.contentMode!=='link'&&ready&&<main aria-label="Reading text" className="reader-paper mx-auto max-w-[76ch] space-y-8 rounded-2xl bg-white px-7 py-6 text-slate-900 sm:px-12 sm:py-8" style={{fontSize}}>{paragraphs?.map((paragraph,index)=><div id={`paragraph-${index+1}`} key={paragraph.$id} className="reader-prose scroll-mt-8">{level!=='original'&&compare&&<ParagraphCard paragraph={paragraph} index={index} label="Original"/>}<ParagraphCard paragraph={{...paragraph,content:contents[index]}} index={index} label={level==='original'?undefined:label(level)}/></div>)}</main>}
  </div>;
}

export function ParagraphCard({paragraph,index,label}:{paragraph:TextParagraph;index:number;label?:string;article?:boolean;readOnly?:boolean;onAnnotate?:(text:string)=>void;onHighlight?:(text:string)=>void;density?:number}) {
  const ref=useRef<HTMLDivElement>(null),[selection,setSelection]=useState(''),[message,setMessage]=useState('');
  useEffect(()=>{const capture=()=>{const selected=window.getSelection();setSelection(selected?.anchorNode&&selected.focusNode&&ref.current?.contains(selected.anchorNode)&&ref.current.contains(selected.focusNode)?selected.toString().trim().slice(0,3000):'');};document.addEventListener('selectionchange',capture);return()=>document.removeEventListener('selectionchange',capture);},[]);
  return <section aria-label={`Paragraph ${index+1}`} className="relative space-y-2"><span aria-hidden="true" className="absolute -left-5 top-1 font-sans text-xs text-slate-400 sm:-left-8">{index+1}</span>{label&&<p className="font-sans text-xs text-slate-500">{label}</p>}<div ref={ref}><Markdown content={paragraph.content}/></div>{selection&&<button className="min-h-11 rounded-lg border bg-slate-50 px-3 font-sans text-sm text-slate-700" onMouseDown={e=>e.preventDefault()} onClick={()=>{void navigator.clipboard.writeText(`“${selection}” — paragraph ${index+1}`).then(()=>setMessage('Quote copied')).catch(()=>setMessage('Could not copy. Please copy the selected words manually.'));}}>Copy quote + paragraph</button>}{message&&<p role="status" className="font-sans text-xs text-slate-500">{message}</p>}</section>;
}
